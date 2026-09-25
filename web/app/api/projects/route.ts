import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db, { Project, Voice } from "@/lib/db";

type ProjectWithStats = Project & {
  entry_count: number;
  last_entry_at: string | null;
  thumbnails: string[];
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const projects = db
    .prepare("SELECT * FROM projects WHERE owner_email = ? ORDER BY created_at DESC")
    .all(session.user.email) as Project[];

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
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

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
    owner_email: session.user.email,
    product_description: null,
  };

  db.prepare(
    "INSERT INTO projects (id, name, description, created_at, voice, owner_email) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    project.id,
    project.name,
    project.description,
    project.created_at,
    project.voice,
    project.owner_email
  );

  return NextResponse.json({ project }, { status: 201 });
}
