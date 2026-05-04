import connectToDatabase from "../lib/db";
import { Book, IBook } from "../models/Book";
import { cacheManager } from "../lib/cache";
import { createContextLogger } from "../lib/logger";
import { createCircuitBreaker, withFallback } from "../lib/circuitBreaker";
import axios from "axios";
import axiosRetry from "axios-retry";
import { bookQueue } from "../lib/queue";

// ── Axios retry ──────────────────────────────────────────────────────────────
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === "ETIMEDOUT",
});

const log = createContextLogger("bookService");

// ── Circuit Breakers ──────────────────────────────────────────────────────────
// Protects calls to the Open Library REST API
async function _fetchFromOpenLibrary(url: string) {
  const response = await axios.get(url, { timeout: 5000 });
  return response.data;
}

const openLibraryBreaker = withFallback(
  _fetchFromOpenLibrary,
  { docs: [], numFound: 0 }, // fallback value when circuit is OPEN
  {
    name: "openLibrary",
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30_000,
  }
);

// Protects individual Open Library book detail fetches
const bookDetailBreaker = withFallback(
  _fetchFromOpenLibrary,
  null,
  { name: "openLibraryDetail", timeout: 5000, resetTimeout: 30_000 }
);

export class BookService {
  /**
   * Fetch books from Open Library and upsert them into MongoDB.
   * The external call is wrapped in a circuit breaker — if Open Library
   * is down, the breaker opens and returns [] without hammering the API.
   */
  static async fetchAndStoreFromExternal(
    query: string,
    maxResults: number = 10,
    requestId?: string
  ) {
    const log2 = createContextLogger("bookService:fetchExternal", requestId);
    try {
      // Dispatch background ingestion job for a larger batch
      bookQueue.add(
        "ingest-books-by-query",
        { type: "FETCH_BY_QUERY", query, limit: 50 },
        { removeOnComplete: true }
      );

      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}`;
      log2.info({ query, maxResults, url }, "Fetching from Open Library");

      const data = await openLibraryBreaker.fire(url) as any;
      const items = data?.docs ?? [];

      const newBooks: any[] = [];
      for (const item of items) {
        if (!item.key || !item.title) continue;

        const bookData = {
          title: item.title,
          authors: item.author_name || ["Unknown Author"],
          description: item.first_sentence
            ? typeof item.first_sentence === "string"
              ? item.first_sentence
              : item.first_sentence[0]
            : "",
          genres: item.subject ? item.subject.slice(0, 5) : [],
          averageRating: item.ratings_average || 0,
          ratingsCount: item.ratings_count || 0,
          coverImage: item.cover_i
            ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
            : null,
          source: "openlibrary",
          sourceId: item.key.replace("/works/", ""),
          xpValue: 10 + Math.floor(Math.random() * 40),
        };

        const updated = await Book.findOneAndUpdate(
          { sourceId: bookData.sourceId },
          { $set: bookData },
          { upsert: true, returnDocument: "after", lean: true }
        );
        newBooks.push(updated);
      }

      log2.info({ inserted: newBooks.length }, "Books upserted from Open Library");
      return newBooks;
    } catch (error: any) {
      log2.error({ err: error.message }, "fetchAndStoreFromExternal failed");
      return [];
    }
  }

  /**
   * Search books — MongoDB full-text first, fallback to Open Library.
   */
  static async searchBooks(
    query: string,
    page: number = 1,
    limit: number = 10,
    requestId?: string
  ) {
    const log2 = createContextLogger("bookService:search", requestId);
    await connectToDatabase();

    if (!query) return this.getTrendingBooks(10, requestId);

    const cacheKey = `search:books:${query}:page:${page}:limit:${limit}`;
    const cached = await cacheManager.get<IBook[]>(cacheKey);
    if (cached) {
      log2.info({ query, cacheKey }, "Search cache hit");
      return cached;
    }

    const skip = (page - 1) * limit;
    const filter = { $text: { $search: query } };
    const sort = { score: { $meta: "textScore" } };

    let books = await Book.find(filter).sort(sort as any).skip(skip).limit(limit).lean();
    log2.info({ query, page, found: books.length }, "MongoDB text search");

    if (books.length < limit && page === 1) {
      log2.info({ query }, "Insufficient DB results — fetching from Open Library");
      const external = await this.fetchAndStoreFromExternal(query, limit, requestId);
      if (external.length > 0) {
        books = await Book.find(filter).sort(sort as any).skip(skip).limit(limit).lean();
      }
    }

    await cacheManager.set(cacheKey, books, 300);
    return books;
  }

  /**
   * Trending books — uses read replica for offloaded reads.
   */
  static async getTrendingBooks(limit: number = 10, requestId?: string) {
    const log2 = createContextLogger("bookService:trending", requestId);
    await connectToDatabase();

    const cacheKey = `trending:books:limit:${limit}`;
    const cached = await cacheManager.get<IBook[]>(cacheKey);
    if (cached) {
      log2.info({ cacheKey }, "Trending cache hit");
      return cached;
    }

    const trending = await Book.find({})
      .sort({ averageRating: -1, ratingsCount: -1 })
      .limit(limit)
      .lean();

    if (trending.length === 0) {
      log2.warn("No trending books in DB — seeding from Open Library");
      await this.fetchAndStoreFromExternal("bestsellers", limit, requestId);
      const seeded = await Book.find({}).sort({ averageRating: -1 }).limit(limit).lean();
      await cacheManager.set(cacheKey, seeded, 300);
      return seeded;
    }

    await cacheManager.set(cacheKey, trending, 300);
    return trending;
  }

  /**
   * Get book by ID — circuit breaker wraps the Open Library detail fetch.
   */
  static async getBookDetails(id: string, requestId?: string) {
    const log2 = createContextLogger("bookService:details", requestId);
    await connectToDatabase();

    const cacheKey = `book:${id}`;
    const cached = await cacheManager.get<IBook>(cacheKey);
    if (cached) return cached;

    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const book = isObjectId
      ? ((await Book.findById(id).lean()) ?? (await Book.findOne({ sourceId: id }).lean()))
      : (await Book.findOne({ sourceId: id }).lean());
    if (book) {
      await cacheManager.set(cacheKey, book, 300);
      return book;
    }

    log2.info({ id }, "Book not in DB — fetching from Open Library");
    try {
      const url = `https://openlibrary.org/works/${id}.json`;
      const item = await bookDetailBreaker.fire(url) as any;

      if (item) {
        const bookData = {
          title: item.title,
          authors: item.authors
            ? item.authors.map((a: any) => a.author?.key || "Unknown")
            : ["Unknown"],
          description: item.description
            ? typeof item.description === "string"
              ? item.description
              : item.description.value
            : "",
          genres: item.subjects ? item.subjects.slice(0, 5) : [],
          averageRating: 0,
          ratingsCount: 0,
          coverImage:
            item.covers?.length > 0
              ? `https://covers.openlibrary.org/b/id/${item.covers[0]}-L.jpg`
              : null,
          source: "openlibrary",
          sourceId: id,
          xpValue: 10 + Math.floor(Math.random() * 40),
        };

        const updated = await Book.findOneAndUpdate(
          { sourceId: id },
          { $set: bookData },
          { upsert: true, returnDocument: "after", lean: true }
        );
        await cacheManager.set(cacheKey, updated, 300);
        return updated;
      }
    } catch (err: any) {
      log2.error({ err: err.message, id }, "Book detail fetch failed");
    }

    return null;
  }
}
