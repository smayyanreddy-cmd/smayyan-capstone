import type { Item, Project } from "@/lib/db";

export type SlideItem = Pick<
  Item,
  "id" | "image_path" | "cropped_image_path" | "phrase" | "description" | "created_at"
>;

export type NarrativeVariant = "overview" | "section" | "closing";

export type Slide =
  | { type: "title"; name: string; description: string | null }
  | { type: "narrative"; variant: NarrativeVariant; heading: string; body: string; note?: string }
  | { type: "entry"; item: SlideItem; index: number; total: number };

export type Density = "full" | "highlights";

const HIGHLIGHT_COUNT = 6;

function parseSections(documentation: string): {
  intro: string;
  middles: { heading: string; body: string }[];
  closing: { heading: string; body: string } | null;
} {
  const sections = documentation
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const headingOf = (s: string, fallback: string) => s.match(/^##\s*(.+)/)?.[1]?.trim() || fallback;
  const stripHeadings = (s: string) => s.replace(/^#+\s.*\n?/gm, "").trim();

  if (sections.length === 0) {
    return { intro: documentation.trim(), middles: [], closing: null };
  }

  let rest = sections.slice();
  let intro = stripHeadings(rest[0]);
  rest = rest.slice(1);

  // The doc's first "#" line can be a bare title with no body of its own
  // (the real opening paragraph then lives under its own "## Overview"
  // heading) — in that case, that next section is the actual intro.
  if (!intro && rest.length > 0) {
    intro = stripHeadings(rest[0]);
    rest = rest.slice(1);
  }

  if (rest.length === 0) {
    return { intro, middles: [], closing: null };
  }

  const last = rest[rest.length - 1];
  const closing = { heading: headingOf(last, "Reflection"), body: stripHeadings(last) };
  const middles = rest.slice(0, -1).map((s, i) => ({
    heading: headingOf(s, `Turning Point ${i + 1}`),
    body: stripHeadings(s),
  }));

  return { intro, middles, closing };
}

/** Downsamples to evenly-spaced entries (always including the first and
 * last) so a long-running project doesn't force a bloated one-slide-per-item
 * deck; "full" keeps every entry. */
function selectEntries(items: SlideItem[], density: Density): SlideItem[] {
  if (density !== "highlights" || items.length <= HIGHLIGHT_COUNT) return items;

  const picked = new Map<string, SlideItem>();
  for (let i = 0; i < HIGHLIGHT_COUNT; i++) {
    const idx = Math.round((i * (items.length - 1)) / (HIGHLIGHT_COUNT - 1));
    picked.set(items[idx].id, items[idx]);
  }
  return items.filter((item) => picked.has(item.id));
}

export function buildSlidePlan(
  project: Pick<Project, "name" | "description">,
  items: SlideItem[],
  documentation: string,
  density: Density = "full"
): Slide[] {
  const { intro, middles, closing } = parseSections(documentation);
  const entries = selectEntries(items, density);

  const slides: Slide[] = [
    { type: "title", name: project.name, description: project.description },
  ];

  if (intro) {
    const note =
      entries.length < items.length
        ? `Showing ${entries.length} highlighted entries out of ${items.length} total.`
        : undefined;
    slides.push({ type: "narrative", variant: "overview", heading: "Overview", body: intro, note });
  }

  for (const section of middles) {
    slides.push({ type: "narrative", variant: "section", heading: section.heading, body: section.body });
  }

  entries.forEach((item, i) =>
    slides.push({ type: "entry", item, index: i + 1, total: entries.length })
  );

  if (closing) {
    slides.push({ type: "narrative", variant: "closing", heading: closing.heading, body: closing.body });
  }

  return slides;
}
