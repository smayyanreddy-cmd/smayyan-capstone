import { NextResponse } from "next/server";
import db, { Item } from "@/lib/db";
import { generateDocumentation } from "@/lib/documentation";
import { ensureCroppedImages } from "@/lib/subject-crop";
import { requireOwnedProject } from "@/lib/authz";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await requireOwnedProject(id);
  if ("error" in result) return result.error;
  const { project } = result;

  const items = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY sort_order ASC")
    .all(id) as Item[];

  let documentation: string;
  try {
    [documentation] = await Promise.all([
      generateDocumentation(project, items),
      ensureCroppedImages(items),
    ]);
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
