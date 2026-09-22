import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import db, { Project, Voice } from "@/lib/db";

type ProjectWithStats = Project & {
  entry_count: number;
  last_entry_at: string | null;
  thumbnails: string[];
};

export async function GET() {
  const projects = db
    .prepare("SELECT * FROM projects ORDER BY created_at DESC")
    .all() as Project[];

  const statsStmt = db.prepare(
    "SELECT COUNT(*) as count, MAX(created_at) as latest FROM items WHERE project_id = ?"
  );
  const thumbsStmt = db.prepare(
    "SELECT image_path, cropped_image_path FROM items WHERE project_id = ? ORDER BY created_at DESC LIMIT 3"
  );

  const withStats: ProjectWithStats[] = projects.map((project) => {
    const stats = statsStmt.get(project.id) as { count: number; latest: string | null };
    const thumbs = thumbsStmt.all(project.id) as {
      image_path: string;
      cropped_image_path: string | null;
    }[];
    return {
      ...project,
      entry_count: stats.count,
      last_entry_at: stats.latest,
      thumbnails: thumbs.map((t) => t.cropped_image_path ?? t.image_path),
    };
  });

  return NextResponse.json({ projects: withStats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  const description = (body.description as string | undefined)?.trim() || null;
  const voice: Voice = body.voice === "group" ? "group" : "personal";

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project: Project = {
    id: randomUUID(),
    name,
    description,
    created_at: new Date().toISOString(),
    documentation: null,
    documentation_generated_at: null,
    custom_theme: null,
    voice,
  };

  db.prepare(
    "INSERT INTO projects (id, name, description, created_at, voice) VALUES (?, ?, ?, ?, ?)"
  ).run(project.id, project.name, project.description, project.created_at, project.voice);

  return NextResponse.json({ project }, { status: 201 });
}
