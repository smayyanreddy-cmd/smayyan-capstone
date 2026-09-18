import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import db, { Item, Project } from "@/lib/db";
import { cosineSimilarity, embedImage } from "@/lib/embeddings";
import { describeItem } from "@/lib/describe";
import { UPLOADS_DIR, uploadUrl } from "@/lib/storage";

const RELATED_COUNT = 3;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as
    | Project
    | undefined;
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("image");
  const phrase = (form.get("phrase") as string | null)?.trim() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const itemId = randomUUID();
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${itemId}${ext}`;
  const absolutePath = path.join(UPLOADS_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(absolutePath, buffer);

  const imagePath = uploadUrl(filename);
  const embedding = await embedImage(absolutePath);
  const description = await describeItem(absolutePath, phrase);
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO items (id, project_id, image_path, phrase, description, embedding, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(itemId, projectId, imagePath, phrase, description, JSON.stringify(embedding), createdAt);

  const item: Item = {
    id: itemId,
    project_id: projectId,
    image_path: imagePath,
    cropped_image_path: null,
    phrase,
    description,
    embedding: JSON.stringify(embedding),
    created_at: createdAt,
  };

  const related = findRelatedItems(itemId, embedding);

  return NextResponse.json({ item, related }, { status: 201 });
}

function findRelatedItems(excludeItemId: string, embedding: number[]) {
  const allOthers = db
    .prepare(
      `SELECT items.*, projects.name AS project_name
       FROM items JOIN projects ON items.project_id = projects.id
       WHERE items.id != ?`
    )
    .all(excludeItemId) as (Item & { project_name: string })[];

  return allOthers
    .map((other) => ({
      ...other,
      similarity: cosineSimilarity(embedding, JSON.parse(other.embedding)),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, RELATED_COUNT);
}
