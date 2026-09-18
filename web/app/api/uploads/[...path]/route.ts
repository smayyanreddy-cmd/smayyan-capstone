import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Resolve and verify the path stays inside UPLOADS_DIR before touching disk.
  const resolved = path.resolve(UPLOADS_DIR, ...segments);
  if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()] || "application/octet-stream";
  const data = fs.readFileSync(resolved);

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
