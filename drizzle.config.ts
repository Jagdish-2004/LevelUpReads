import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Explicitly load the .env.local file
config({ path: '.env.local' });

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});