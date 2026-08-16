import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "myequator.db");

// Maintain singleton on globalThis to prevent V8 GC / CleanupHook crash during Next.js dev reloads and concurrent API requests
declare global {
  // eslint-disable-next-line no-var
  var _sqlite: InstanceType<typeof Database> | undefined;
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const sqlite =
  globalThis._sqlite ??
  (() => {
    const client = new Database(dbPath);
    client.pragma("journal_mode = WAL");
    client.pragma("foreign_keys = ON");
    client.pragma("busy_timeout = 5000");
    return client;
  })();

if (process.env.NODE_ENV !== "production") {
  globalThis._sqlite = sqlite;
}

export const db =
  globalThis._db ??
  (() => {
    const instance = drizzle(sqlite, { schema });
    if (process.env.NODE_ENV !== "production") {
      globalThis._db = instance;
    }
    return instance;
  })();

export { sqlite };
