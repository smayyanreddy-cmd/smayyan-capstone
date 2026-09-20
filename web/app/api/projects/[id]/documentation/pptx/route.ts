import { NextResponse } from "next/server";
import db, { Item, Project } from "@/lib/db";
import { buildDocumentationPptx } from "@/lib/pptx";
import { ensureCroppedImages } from "@/lib/subject-crop";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("template");
  const paletteId = searchParams.get("palette");

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | Project
    | undefined;
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }
  if (!project.documentation) {
    return NextResponse.json(
      { error: "generate the documentation first" },
      { status: 400 }
    );
  }

  const rawItems = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY created_at ASC")
    .all(id) as Item[];
  const items = await ensureCroppedImages(rawItems);

  const buffer = await buildDocumentationPptx(project, items, project.documentation, {
    templateId,
    paletteId,
  });

  const filename = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
