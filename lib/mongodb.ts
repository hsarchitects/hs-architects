import "server-only";
import { MongoClient, type Db } from "mongodb";

/**
 * A single MongoClient shared across the app.
 *
 * The client is created lazily on first use, never at module scope: Next
 * evaluates modules at build time, and connecting (or throwing on a missing
 * MONGODB_URI) during the build would break `next build` on a machine that
 * has no database credentials.
 *
 * The promise is cached on `globalThis` so Hot Module Reload doesn't open a
 * new connection pool on every edit. A failed connection is dropped from the
 * cache, so the next request retries instead of failing until a restart.
 */

const DEFAULT_DB_NAME = "hs_architects";

declare global {
  var __hsMongoClient: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set — add it to .env.local (see README)."
    );
  }
  // The driver's default waits 30s for a server; a page shouldn't hang that
  // long before showing the error screen.
  return new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
}

export function getMongoClient(): Promise<MongoClient> {
  global.__hsMongoClient ??= connect().catch((error) => {
    global.__hsMongoClient = undefined;
    throw error;
  });
  return global.__hsMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || DEFAULT_DB_NAME);
}
