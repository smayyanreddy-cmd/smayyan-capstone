import path from "path";

/** Single root for everything this app persists (SQLite DB + uploaded/cropped
 * images), so a deployment only needs one mounted volume. Override with the
 * DATA_DIR env var when hosting; defaults to a local "data" folder for dev. */
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const CROPPED_DIR = path.join(UPLOADS_DIR, "cropped");

export function uploadUrl(filename: string): string {
  return `/api/uploads/${filename}`;
}

export function croppedUrl(filename: string): string {
  return `/api/uploads/cropped/${filename}`;
}

/** Resolves a stored image_path/cropped_image_path (an /api/uploads/... URL)
 * back to an absolute file path on disk, for server-side reads (pptx, crop). */
export function absolutePathForUrl(urlPath: string): string {
  const rest = urlPath.replace(/^\/api\/uploads\//, "");
  return path.join(UPLOADS_DIR, rest);
}
