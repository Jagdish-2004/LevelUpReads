'use server'
import { db } from "@/db";
import { book } from "@/db/schema";
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";
import { nanoid } from "nanoid"; // you might need to install this: npm i nanoid

// Action for CURATORS to add a book
export async function addBook(formData: FormData) {
    // 1. Check Auth & Role
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== 'curator') {
        throw new Error("Unauthorized: Only curators can add books.");
    }

    // 2. Insert into DB
    await db.insert(book).values({
        id: nanoid(),
        title: formData.get("title") as string,
        author: formData.get("author") as string,
        genre: formData.get("genre") as string,
        // In a real app, you'd handle image upload here and get a URL
        coverUrl: "/default-book.png", 
        xpValue: 50,
        createdAt: new Date()
    });

    return { success: true };
}
