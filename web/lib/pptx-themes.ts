export type TemplateId = "editorial" | "minimal";
export type PaletteId = "neo-tactile" | "warm-atelier" | "cyber-studio";
export const CUSTOM_PALETTE_ID = "custom" as const;

export type Palette = {
  id: PaletteId | typeof CUSTOM_PALETTE_ID;
  label: string;
  description: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentForeground: string;
  accentSecondary: string;
  /** AI-paraphrased version of the product description the user wrote
   * before generating a mood palette — only set for custom mood palettes,
   * used as the title slide's subtitle in place of the project description. */
  tagline?: string;
};

export type Template = {
  id: TemplateId;
  label: string;
  description: string;
};

export const PALETTES: Record<PaletteId, Palette> = {
  "neo-tactile": {
    id: "neo-tactile",
    label: "Neo Tactile",
    description: "Yellow & black, high contrast",
    bg: "#faf9fd",
    surface: "#ffffff",
    border: "#000000",
    text: "#1b1b1f",
    muted: "#57534e",
    accent: "#ffe600",
    accentForeground: "#000000",
    accentSecondary: "#703fca",
  },
  "warm-atelier": {
    id: "warm-atelier",
    label: "Warm Atelier",
    description: "Terracotta & cream, editorial",
    bg: "#fbf3ea",
    surface: "#fffaf3",
    border: "#2b1c12",
    text: "#2b1c12",
    muted: "#7a6a5c",
    accent: "#d9642c",
    accentForeground: "#fffaf3",
    accentSecondary: "#8a6d3b",
  },
  "cyber-studio": {
    id: "cyber-studio",
    label: "Cyber Studio",
    description: "Ice blue & violet, technical",
    bg: "#f2f2fb",
    surface: "#ffffff",
    border: "#151233",
    text: "#151233",
    muted: "#5b587d",
    accent: "#38bdf8",
    accentForeground: "#0b0f2b",
    accentSecondary: "#a274ff",
  },
};

export const TEMPLATES: Record<TemplateId, Template> = {
  editorial: {
    id: "editorial",
    label: "Editorial",
    description: "Framed photo beside notes, monograph-style",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    description: "Full-bleed photo, caption below",
  },
};

export function resolvePalette(id: string | null | undefined): Palette {
  return PALETTES[(id as PaletteId) ?? "neo-tactile"] ?? PALETTES["neo-tactile"];
}

export function resolveTemplate(id: string | null | undefined): Template {
  return TEMPLATES[(id as TemplateId) ?? "editorial"] ?? TEMPLATES["editorial"];
}
