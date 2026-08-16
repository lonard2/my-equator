import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "myequator.db");

// Maintain singleton on globalThis to prevent multiple connection overhead during Next.js dev reloads
declare global {
  // eslint-disable-next-line no-var
  var _libsqlClient: ReturnType<typeof createClient> | undefined;
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const client =
  globalThis._libsqlClient ||
  createClient({
    url: `file:${dbPath}`,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._libsqlClient = client;
}

// Bootstrap all schema tables automatically on startup
async function initializeTables(cli: ReturnType<typeof createClient>) {
  try {
    await cli.executeMultiple(`
      CREATE TABLE IF NOT EXISTS delivery_orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        recipient_name TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        po_number TEXT,
        vehicle_number TEXT,
        driver_name TEXT,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        delivery_date TEXT NOT NULL,
        notes TEXT,
        total_quantity INTEGER NOT NULL DEFAULT 0,
        total_amount INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS delivery_order_items (
        id TEXT PRIMARY KEY,
        delivery_order_id TEXT NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
        article_code TEXT NOT NULL,
        article_name TEXT NOT NULL,
        colorway TEXT,
        size_breakdown TEXT NOT NULL,
        total_pairs INTEGER NOT NULL DEFAULT 0,
        unit_price INTEGER DEFAULT 0,
        total_price INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        safety_threshold INTEGER NOT NULL DEFAULT 10,
        unit_cost INTEGER NOT NULL DEFAULT 0,
        location TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inventory_movements (
        id TEXT PRIMARY KEY,
        material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reference_number TEXT,
        operator_name TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS insole_blueprints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        shoe_size INTEGER NOT NULL,
        base_length_mm REAL NOT NULL,
        ball_width_mm REAL NOT NULL,
        heel_width_mm REAL NOT NULL,
        waist_width_mm REAL NOT NULL,
        arch_profile TEXT NOT NULL,
        arch_offset_factor REAL NOT NULL DEFAULT 1.0,
        thickness_forefoot_mm REAL NOT NULL DEFAULT 3.0,
        thickness_heel_mm REAL NOT NULL DEFAULT 5.0,
        material_type TEXT NOT NULL DEFAULT 'EVA High Density',
        svg_path TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL DEFAULT 'SALES_OPERATOR',
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'SALES_OPERATOR',
        avatar_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Safe column migrations for existing SQLite database files
    try {
      await cli.execute("ALTER TABLE audit_logs ADD COLUMN user_role TEXT NOT NULL DEFAULT 'SALES_OPERATOR'");
    } catch {
      // Column already exists
    }
  } catch (e) {
    // Non-fatal if tables already initialized
  }
}

initializeTables(client);

export const db = globalThis._db || drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis._db = db;
}
