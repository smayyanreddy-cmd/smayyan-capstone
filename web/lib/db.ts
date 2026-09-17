import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "app.db"));

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

export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  documentation: string | null;
  documentation_generated_at: string | null;
};

export type Item = {
  id: string;
  project_id: string;
  image_path: string;
  phrase: string | null;
  description: string | null;
  embedding: string;
  created_at: string;
};

export default db;
