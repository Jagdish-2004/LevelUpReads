import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  role: text("role").$type<"admin" | "reader" | "curator">().default("reader"), // Added Role
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// 1. Books Table (Curators add these)
export const book = pgTable("book", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genre: text("genre"),
  coverUrl: text("coverUrl"),
  description: text("description"),
  xpValue: integer("xpValue").default(10), // XP given for reading this
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// 2. User Books (Readers tracking progress)
export const userBook = pgTable("user_book", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  bookId: text("bookId").notNull().references(() => book.id),
  status: text("status").notNull().default("reading"), // 'reading', 'completed'
  progress: integer("progress").default(0), // e.g., page number
  completedAt: timestamp("completedAt"),
});

// 3. Challenges (Optional: Curators create, Readers join)
export const challenge = pgTable("challenge", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  goal: integer("goal").notNull(), // e.g., "Read 5 books"
  rewardXp: integer("rewardXp").notNull(),
});