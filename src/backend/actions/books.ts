'use server'
import connectToDatabase from "../lib/db";
import { Book } from "../models/Book";
// import { auth } from "@/lib/auth"; // Need to update auth eventually
// import { headers } from "next/headers";
import { nanoid } from "nanoid";

// Action for CURATORS to add a book
export async function addBook(formData: FormData) {
    // 1. Check Auth & Role (Commented out until better-auth is migrated)
    // const session = await auth.api.getSession({ headers: await headers() });
    // if (!session || session.user.role !== 'curator') {
    //     throw new Error("Unauthorized: Only curators can add books.");
    // }

    await connectToDatabase();

    // 2. Insert into DB
    const newBook = await Book.create({
        title: formData.get("title") as string,
        authors: [formData.get("author") as string],
        genres: [formData.get("genre") as string],
        coverImage: "/default-book.png", 
        xpValue: 50,
        source: "curator",
        sourceId: nanoid(),
    });

    return { success: true, book: JSON.parse(JSON.stringify(newBook)) };
}
