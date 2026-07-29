import { Pool } from 'pg';

// Setup PgBouncer connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // max connections for connection pooling
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Execute a query against the PostgreSQL database.
 * If DATABASE_URL is not set, it returns a mock fallback to prevent local build failures.
 */
export async function queryDB<T>(queryText: string, params: any[] = []): Promise<T[]> {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set. Returning mock empty array.');
    return [];
  }

  const client = await pool.connect();
  try {
    const res = await client.query(queryText, params);
    return res.rows as T[];
  } catch (error) {
    console.error('PostgreSQL Query Error:', error);
    throw error;
  } finally {
    client.release();
  }
}
