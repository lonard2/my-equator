# Database & Data Persistence Agent Guidelines (`src/lib/db/`)

## 1. Domain Responsibility
This directory manages the Drizzle ORM schema, SQLite database connection, automated migrations, seed data, and offline JSON snapshot backup/restore pipelines.

## 2. Technology & Driver Stack
- **Database Engine:** SQLite (stored locally at `data/myequator.db`).
- **ORM:** Drizzle ORM with `@libsql/client` driver (resilient local file mode with zero native C++ V8 hook issues).
- **Migration Protocol:** Drizzle Kit (`drizzle-kit generate` & `drizzle-kit push / migrate`).

## 3. Schema Design Standards
- All tables must include:
  - `id`: Text / UUID primary key.
  - `created_at`: Integer (timestamp ms) or Text ISO-8601.
  - `updated_at`: Integer (timestamp ms) or Text ISO-8601.
- Foreign keys must enforce relational integrity:
  - `delivery_order_items.delivery_order_id` -> `delivery_orders.id` (CASCADE on delete).
  - `inventory_movements.material_id` -> `materials.id` (RESTRICT on delete).
- Size matrix data must be structured cleanly either as normalized rows or strongly-typed JSON blobs (`{ [size: string]: number }`) with helper accessors.

## 4. Atomic Transactions & Resiliency
- Stock movements (IN/OUT) and order status transitions (`DISPATCHED` -> inventory deduction) MUST execute within Drizzle `db.transaction()`.
- Provide a robust 1-click JSON snapshot utility:
  - `exportDatabaseSnapshot()`: Dumps all tables into a structured `.json` bundle with schema version metadata.
  - `importDatabaseSnapshot()`: Validates schema version, truncates tables safely in a single transaction, and re-populates all records.
