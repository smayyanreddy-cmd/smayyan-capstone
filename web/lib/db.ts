import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/storage";

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    documentation TEXT,
    documentation_generated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    image_path TEXT NOT NULL,
    phrase TEXT,
    description TEXT,
    embedding TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const itemColumns = (db.prepare("PRAGMA table_info(items)").all() as { name: string }[]).map(
  (c) => c.name
);
if (!itemColumns.includes("cropped_image_path")) {
  db.exec("ALTER TABLE items ADD COLUMN cropped_image_path TEXT");
}
if (!itemColumns.includes("sort_order")) {
  db.exec("ALTER TABLE items ADD COLUMN sort_order INTEGER");
  // Backfill existing rows with their chronological rank per project, so
  // manual reordering has a starting point that matches current behavior.
  db.exec(`
    UPDATE items
    SET sort_order = (
      SELECT COUNT(*) FROM items AS earlier
      WHERE earlier.project_id = items.project_id
        AND (earlier.created_at < items.created_at
             OR (earlier.created_at = items.created_at AND earlier.id <= items.id))
    )
  `);
}

const projectColumns = (
  db.prepare("PRAGMA table_info(projects)").all() as { name: string }[]
).map((c) => c.name);
if (!projectColumns.includes("custom_theme")) {
  db.exec("ALTER TABLE projects ADD COLUMN custom_theme TEXT");
}
if (!projectColumns.includes("voice")) {
  db.exec("ALTER TABLE projects ADD COLUMN voice TEXT NOT NULL DEFAULT 'personal'");
}
if (!projectColumns.includes("product_description")) {
  db.exec("ALTER TABLE projects ADD COLUMN product_description TEXT");
}
if (!projectColumns.includes("owner_email")) {
  db.exec("ALTER TABLE projects ADD COLUMN owner_email TEXT");
  // Projects created before accounts existed had no owner recorded — assign
  // them to the account the user identified as their original creator.
  db.exec(
    `UPDATE projects SET owner_email = 'smayyan.reddy@flame.edu.in' WHERE owner_email IS NULL`
  );
}

export type Voice = "personal" | "group";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  documentation: string | null;
  documentation_generated_at: string | null;
  custom_theme: string | null;
  voice: Voice;
  owner_email: string | null;
  product_description: string | null;
};

export type Item = {
  id: string;
  project_id: string;
  image_path: string;
  cropped_image_path: string | null;
  phrase: string | null;
  description: string | null;
  embedding: string;
  created_at: string;
  sort_order: number;
};

export default db;
