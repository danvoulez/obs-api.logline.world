import type { Config } from 'drizzle-kit';

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error('No database connection string found. Set SUPABASE_DB_URL (preferred) or DATABASE_URL.');
}

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  tablesFilter: ['!auth.*', '!storage.*', '!realtime.*', '!supabase_*', '!_*'],
} satisfies Config;
