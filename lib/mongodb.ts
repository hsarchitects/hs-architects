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
 * In development the promise is cached on `globalThis` so Hot Module Reload
 * doesn't open a new connection pool on every edit.
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
  return new MongoClient(uri).connect();
}

export function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    global.__hsMongoClient ??= connect();
    return global.__hsMongoClient;
  }
  // In production the module is evaluated once, so a module-level cache is
  // enough — and each serverless instance keeps its own warm pool.
  productionClient ??= connect();
  return productionClient;
}

let productionClient: Promise<MongoClient> | undefined;

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || DEFAULT_DB_NAME);
}
