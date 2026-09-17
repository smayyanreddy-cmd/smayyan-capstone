import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import db, { Project } from "@/lib/db";

export async function GET() {
  const projects = db
    .prepare("SELECT * FROM projects ORDER BY created_at DESC")
    .all() as Project[];
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  const description = (body.description as string | undefined)?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project: Project = {
    id: randomUUID(),
    name,
    description,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    "INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)"
  ).run(project.id, project.name, project.description, project.created_at);

  return NextResponse.json({ project }, { status: 201 });
}
