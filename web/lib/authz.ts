import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db, { Project } from "@/lib/db";

type Authorized = { project: Project; email: string };
type Unauthorized = { error: NextResponse };

/** Loads a project and confirms the signed-in user owns it, for use at the
 * top of any /api/projects/[id]/... route. Returns 401 if signed out, 404
 * (not 403) if the project doesn't exist or belongs to someone else — so a
 * project's existence is never leaked to accounts that don't own it. */
export async function requireOwnedProject(
  projectId: string
): Promise<Authorized | Unauthorized> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return { error: NextResponse.json({ error: "not signed in" }, { status: 401 }) };
  }

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as
    | Project
    | undefined;
  if (!project || project.owner_email !== email) {
    return { error: NextResponse.json({ error: "not found" }, { status: 404 }) };
  }

  return { project, email };
}
