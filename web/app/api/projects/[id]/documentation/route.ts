import { NextResponse } from "next/server";
import db, { Item, Project } from "@/lib/db";
import { generateDocumentation } from "@/lib/documentation";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | Project
    | undefined;
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  const items = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY created_at ASC")
    .all(id) as Item[];

  let documentation: string;
  try {
    documentation = await generateDocumentation(project, items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to generate documentation";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const generatedAt = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET documentation = ?, documentation_generated_at = ? WHERE id = ?"
  ).run(documentation, generatedAt, id);

  return NextResponse.json({ documentation, generated_at: generatedAt });
}
