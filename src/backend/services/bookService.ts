import connectToDatabase from "../lib/db";
import { Book, IBook } from "../models/Book";
import { cacheManager } from "../lib/cache";
import axios from "axios";
import axiosRetry from "axios-retry";

// Configure axios to retry requests on failure
axiosRetry(axios, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ETIMEDOUT';
  }
});

import { bookQueue } from "../lib/queue";

export class BookService {
  /**
   * Fetch books from Google API and store them in DB
   */
  static async fetchAndStoreFromExternal(query: string, maxResults: number = 10) {
    try {
      // Trigger background ingestion for an additional 50 items to populate DB ahead of time
      bookQueue.add("ingest-books-by-query", { type: "FETCH_BY_QUERY", query, limit: 50 }, { removeOnComplete: true });
      const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}`);
      const items = response.data.docs || [];
      const newBooks = [];

      for (const item of items) {
        if (!item.key || !item.title) continue;

        const bookData = {
          title: item.title,
          authors: item.author_name || ["Unknown Author"],
          description: item.first_sentence ? (typeof item.first_sentence === 'string' ? item.first_sentence : item.first_sentence[0]) : "",
          genres: item.subject ? item.subject.slice(0, 5) : [],
          averageRating: item.ratings_average || 0,
          ratingsCount: item.ratings_count || 0,
          coverImage: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null,
          source: "openlibrary",
          sourceId: item.key.replace('/works/', ''),
          xpValue: 10 + Math.floor(Math.random() * 40) // Random XP between 10 and 50
        };

        const updatedBook = await Book.findOneAndUpdate(
          { sourceId: bookData.sourceId },
          { $set: bookData },
          { upsert: true, returnDocument: 'after', lean: true }
        );
        newBooks.push(updatedBook);
      }
      return newBooks;
    } catch (error) {
      console.error("External API fetch error:", error);
      return [];
    }
  }

  /**
   * Search books using MongoDB full-text search. Fallback to Google API.
   */
  static async searchBooks(query: string, page: number = 1, limit: number = 10) {
    await connectToDatabase();
    
    if (!query) {
       return this.getTrendingBooks();
    }

    const cacheKey = `search:books:${query}:page:${page}:limit:${limit}`;
    const cachedResult = await cacheManager.get<IBook[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const skip = (page - 1) * limit;
    const filter = { $text: { $search: query } };
    const sort = { score: { $meta: "textScore" } };

    let books = await Book.find(filter)
      .sort(sort as any)
      .skip(skip)
      .limit(limit)
      .lean();

    // If we didn't find enough books in our DB, fetch from Open Library API
    if (books.length < limit && page === 1) {
       console.log(`Fetching more books for query: ${query} from Open Library API...`);
       const externalBooks = await this.fetchAndStoreFromExternal(query, limit);
       
       // Re-query to get sorted text-search results again, or just merge
       if (externalBooks.length > 0) {
         books = await Book.find(filter)
           .sort(sort as any)
           .skip(skip)
           .limit(limit)
           .lean();
       }
    }

    await cacheManager.set(cacheKey, books, 300); // 5 mins cache
    return books;
  }

  /**
   * Get trending books (based on rating / random selection if new)
   */
  static async getTrendingBooks(limit: number = 10) {
     await connectToDatabase();
     const cacheKey = `trending:books:limit:${limit}`;
     
     const cachedResult = await cacheManager.get<IBook[]>(cacheKey);
     if (cachedResult) {
        return cachedResult;
     }

     const trending = await Book.find({})
       .sort({ averageRating: -1, ratingsCount: -1 })
       .limit(limit)
       .lean();

     // If database is empty, fetch some default trending books
     if (trending.length === 0) {
       await this.fetchAndStoreFromExternal("bestsellers", limit);
       const updatedTrending = await Book.find({}).sort({ averageRating: -1 }).limit(limit).lean();
       await cacheManager.set(cacheKey, updatedTrending, 300);
       return updatedTrending;
     }

     await cacheManager.set(cacheKey, trending, 300);
     return trending;
  }

  static async getBookDetails(id: string) {
    await connectToDatabase();
    const cacheKey = `book:${id}`;
    const cachedBook = await cacheManager.get<IBook>(cacheKey);
    if (cachedBook) return cachedBook;

    const book = await Book.findById(id).lean();
    if (book) {
      await cacheManager.set(cacheKey, book, 300);
      return book;
    }

    const bookBySourceId = await Book.findOne({ sourceId: id }).lean();
    if (bookBySourceId) {
       await cacheManager.set(cacheKey, bookBySourceId, 300);
       return bookBySourceId;
    }

    // Fallback: Fetch from Open Library API directly if not found in DB
    try {
      const response = await axios.get(`https://openlibrary.org/works/${id}.json`);
      const item = response.data;
      if (item) {
        const bookData = {
          title: item.title,
          authors: item.authors ? item.authors.map((a: any) => a.author?.key || "Unknown") : ["Unknown"],
          description: item.description ? (typeof item.description === 'string' ? item.description : item.description.value) : "",
          genres: item.subjects ? item.subjects.slice(0, 5) : [],
          averageRating: 0,
          ratingsCount: 0,
          coverImage: item.covers && item.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${item.covers[0]}-L.jpg` : null,
          source: "openlibrary",
          sourceId: id,
          xpValue: 10 + Math.floor(Math.random() * 40)
        };

        const updatedBook = await Book.findOneAndUpdate(
          { sourceId: id },
          { $set: bookData },
          { upsert: true, returnDocument: 'after', lean: true }
        );
        await cacheManager.set(cacheKey, updatedBook, 300);
        return updatedBook;
      }
    } catch (err) {
      console.error("Failed to fetch book details from external API:", err);
    }
    
    return null;
  }
}
