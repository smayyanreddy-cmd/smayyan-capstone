import type { Item, Project } from "@/lib/db";

export type SlideItem = Pick<
  Item,
  "id" | "image_path" | "phrase" | "description" | "created_at"
>;

export type Slide =
  | { type: "title"; name: string; description: string | null }
  | { type: "overview"; body: string }
  | { type: "entry"; item: SlideItem; index: number; total: number }
  | { type: "closing"; body: string };

function splitDocumentation(documentation: string): { intro: string; closing: string } {
  const sections = documentation
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const stripHeadings = (s: string) => s.replace(/^#+\s.*\n?/gm, "").trim();

  const intro = sections.length > 0 ? stripHeadings(sections[0]) : documentation.trim();
  const closing = sections.length > 1 ? stripHeadings(sections[sections.length - 1]) : "";

  return { intro, closing };
}

export function buildSlidePlan(
  project: Pick<Project, "name" | "description">,
  items: SlideItem[],
  documentation: string
): Slide[] {
  const { intro, closing } = splitDocumentation(documentation);
  const slides: Slide[] = [
    { type: "title", name: project.name, description: project.description },
  ];
  if (intro) slides.push({ type: "overview", body: intro });
  items.forEach((item, i) =>
    slides.push({ type: "entry", item, index: i + 1, total: items.length })
  );
  if (closing) slides.push({ type: "closing", body: closing });
  return slides;
}
