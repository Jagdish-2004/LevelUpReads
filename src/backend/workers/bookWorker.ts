import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import connectToDatabase from "../lib/db";
import { Book } from "../models/Book";
import axios from "axios";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const bookWorker = new Worker(
  "book-ingestion",
  async (job: Job) => {
    await connectToDatabase();
    console.log(`Processing book job ${job.id} for query: ${job.data.query || job.data.bookId}`);

    if (job.data.type === "FETCH_BY_ID") {
      const { bookId } = job.data;
      const response = await axios.get(`https://openlibrary.org/works/${bookId}.json`);
      const item = response.data;
      
      const bookData = {
        title: item.title,
        authors: item.authors ? item.authors.map((a: any) => a.author?.key || "Unknown") : ["Unknown"],
        description: item.description ? (typeof item.description === 'string' ? item.description : item.description.value) : "",
        genres: item.subjects ? item.subjects.slice(0, 5) : [],
        averageRating: 0, // Works API doesn't provide rating
        ratingsCount: 0,
        coverImage: item.covers && item.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${item.covers[0]}-L.jpg` : null,
        source: "openlibrary",
        sourceId: bookId,
      };

      await Book.findOneAndUpdate(
        { sourceId: bookId },
        { $set: bookData },
        { upsert: true, returnDocument: 'after' }
      );
      return { success: true, bookId };
    }

    if (job.data.type === "FETCH_BY_QUERY") {
      const { query, limit = 50 } = job.data;
      const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
      const items = response.data.docs || [];
      let count = 0;

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
          sourceId: item.key.replace("/works/", ""),
          xpValue: 10 + Math.floor(Math.random() * 40)
        };

        await Book.findOneAndUpdate(
          { sourceId: bookData.sourceId },
          { $set: bookData },
          { upsert: true, returnDocument: 'after' }
        );
        count++;
      }
      return { success: true, query, count };
    }
  },
  { connection }
);

bookWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

bookWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
