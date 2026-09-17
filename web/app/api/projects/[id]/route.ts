import { NextResponse } from "next/server";
import db, { Item, Project } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | Project
    | undefined;
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const items = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY created_at ASC")
    .all(id) as Item[];

  return NextResponse.json({ project, items });
}
