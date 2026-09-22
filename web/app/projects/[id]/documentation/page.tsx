"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import SlidesPreview from "@/components/SlidesPreview";
import { buildSlidePlan, Density } from "@/lib/slides";
import { CUSTOM_PALETTE_ID, PALETTES, Palette, TEMPLATES, PaletteId, TemplateId } from "@/lib/pptx-themes";

type Item = {
  id: string;
  project_id: string;
  image_path: string;
  cropped_image_path: string | null;
  phrase: string | null;
  description: string | null;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  documentation: string | null;
  documentation_generated_at: string | null;
  custom_theme: string | null;
};

export default function DocumentationPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("editorial");
  const [paletteId, setPaletteId] = useState<PaletteId | typeof CUSTOM_PALETTE_ID>("neo-tactile");
  const [density, setDensity] = useState<Density>("full");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customPalette, setCustomPalette] = useState<Palette | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#ffe600");
  const [secondaryColor, setSecondaryColor] = useState("#703fca");
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data.project);
    setItems(data.items);
    if (data.project?.custom_theme) {
      try {
        setCustomPalette(JSON.parse(data.project.custom_theme));
      } catch {
        setCustomPalette(null);
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / id change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function generateMoodPalette() {
    if (!heroFile) {
      setThemeError("Add a product photo first.");
      return;
    }
    setGeneratingTheme(true);
    setThemeError(null);
    const form = new FormData();
    form.append("image", heroFile);
    form.append("colors", JSON.stringify([primaryColor, secondaryColor]));
    const res = await fetch(`/api/projects/${id}/documentation/theme`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setGeneratingTheme(false);
    if (!res.ok) {
      setThemeError(data.error ?? "Couldn't read the mood of that photo, try again.");
      return;
    }
    setCustomPalette(data.theme);
    setPaletteId(CUSTOM_PALETTE_ID);
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/projects/${id}/documentation`, { method: "POST" });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    load();
  }

  if (!project) {
    return <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 text-page-foreground/70">Loading…</main>;
  }

  const slides = project.documentation
    ? buildSlidePlan(project, items, project.documentation, density)
    : null;

  const downloadHref = `/api/projects/${id}/documentation/pptx?template=${templateId}&palette=${paletteId}&density=${density}`;
  const activePalette =
    paletteId === CUSTOM_PALETTE_ID && customPalette ? customPalette : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link
        href={`/projects/${id}`}
        className="flex items-center gap-1 font-mono text-xs font-bold text-page-foreground/60 hover:text-page-foreground"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to {project.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-tight text-page-foreground">
          Documentation
        </h1>
        <button
          onClick={generate}
          disabled={generating}
          className="press-brutal flex items-center gap-1.5 rounded-xl border-2 border-border bg-accent px-4 py-2 font-mono text-xs font-bold text-accent-foreground shadow-brutal-sm disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
          {generating
            ? "Generating…"
            : project.documentation
              ? "Regenerate"
              : "Generate documentation"}
        </button>
      </div>

      {generating && <div className="pixel-progress mt-3 w-48" />}

      {project.documentation_generated_at && (
        <p className="mt-2 font-mono text-[11px] font-bold text-page-foreground/50">
          Last generated {new Date(project.documentation_generated_at).toLocaleString()}
        </p>
      )}
      <p className="mt-1 text-sm text-page-foreground/70">
        Pick a layout and a palette — the preview below updates with your real entries.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border-2 border-border bg-accent-pink/10 px-4 py-3 text-sm font-medium text-accent-pink shadow-brutal-sm">
          {error}
        </p>
      )}

      {/* Template picker */}
      <section className="mt-6">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-page-foreground">dashboard_customize</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-page-foreground">
            Layout
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {Object.values(TEMPLATES).map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`press-brutal flex w-44 shrink-0 flex-col gap-1 rounded-2xl border-[2.5px] border-border bg-surface p-3 text-left shadow-brutal-sm ${
                templateId === t.id ? "ring-2 ring-accent" : "opacity-80 hover:opacity-100"
              }`}
            >
              <span className="text-[15px] font-extrabold text-foreground">{t.label}</span>
              <span className="text-[11px] text-muted">{t.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Palette picker */}
      <section className="mt-5">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-page-foreground">palette</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-page-foreground">
            Palette
          </h3>
        </div>
        <div className="flex gap-4">
          {Object.values(PALETTES).map((p) => (
            <button
              key={p.id}
              onClick={() => setPaletteId(p.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`h-12 w-12 overflow-hidden rounded-full border-2 shadow-brutal-sm ${
                  paletteId === p.id ? "ring-2 ring-offset-2 ring-border" : "opacity-80"
                }`}
                style={{ borderColor: p.border }}
              >
                <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                  <div style={{ background: p.accent }} />
                  <div style={{ background: p.accentSecondary }} />
                  <div style={{ background: p.surface }} />
                  <div style={{ background: p.text }} />
                </div>
              </div>
              <span className="text-center text-[10px] font-bold leading-tight text-foreground">
                {p.label}
              </span>
            </button>
          ))}

          <button
            onClick={() => customPalette && setPaletteId(CUSTOM_PALETTE_ID)}
            disabled={!customPalette}
            className="flex flex-col items-center gap-1.5 disabled:opacity-40"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 shadow-brutal-sm ${
                paletteId === CUSTOM_PALETTE_ID ? "ring-2 ring-offset-2 ring-border" : "opacity-80"
              }`}
              style={{
                borderColor: customPalette?.border ?? "#000000",
                background: customPalette
                  ? undefined
                  : "repeating-linear-gradient(45deg, #ddd, #ddd 3px, #fff 3px, #fff 6px)",
              }}
            >
              {customPalette ? (
                <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                  <div style={{ background: customPalette.accent }} />
                  <div style={{ background: customPalette.accentSecondary }} />
                  <div style={{ background: customPalette.surface }} />
                  <div style={{ background: customPalette.text }} />
                </div>
              ) : (
                <span className="material-symbols-outlined text-[18px] text-foreground/50">
                  auto_awesome
                </span>
              )}
            </div>
            <span className="text-center text-[10px] font-bold leading-tight text-foreground">
              {customPalette?.label ?? "Custom"}
            </span>
          </button>
        </div>
      </section>

      {/* Density picker */}
      {items.length > 6 && (
        <section className="mt-5">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-page-foreground">density_medium</span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-page-foreground">
              Density
            </h3>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDensity("full")}
              className={`press-brutal flex-1 rounded-2xl border-[2.5px] border-border bg-surface p-3 text-left shadow-brutal-sm ${
                density === "full" ? "ring-2 ring-accent" : "opacity-80 hover:opacity-100"
              }`}
            >
              <span className="text-[15px] font-extrabold text-foreground">All entries</span>
              <span className="block text-[11px] text-muted">
                One slide per entry ({items.length} entry slides)
              </span>
            </button>
            <button
              onClick={() => setDensity("highlights")}
              className={`press-brutal flex-1 rounded-2xl border-[2.5px] border-border bg-surface p-3 text-left shadow-brutal-sm ${
                density === "highlights" ? "ring-2 ring-accent" : "opacity-80 hover:opacity-100"
              }`}
            >
              <span className="text-[15px] font-extrabold text-foreground">Highlights only</span>
              <span className="block text-[11px] text-muted">
                Evenly-sampled key entries, shorter deck
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Mood palette generator */}
      <section className="mt-5 rounded-2xl border-[2.5px] border-border bg-surface p-4 shadow-brutal-sm">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-page-foreground">auto_awesome</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-page-foreground">
            Generate a mood palette
          </h3>
        </div>
        <p className="mb-3 text-[11px] text-muted">
          Upload a photo of the product and pick your brand colors — Gemini reads the photo&apos;s
          mood and builds a matching palette.
        </p>

        {themeError && (
          <p className="mb-3 rounded-lg border-2 border-border bg-accent-pink/10 px-3 py-2 text-xs font-medium text-accent-pink">
            {themeError}
          </p>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">
              Product photo
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
              className="text-xs text-foreground file:mr-2 file:rounded-lg file:border-2 file:border-border file:bg-surface-inset file:px-2 file:py-1 file:text-xs file:font-bold"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">
              Primary color
            </span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-14 rounded-lg border-2 border-border"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted">
              Secondary color
            </span>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-9 w-14 rounded-lg border-2 border-border"
            />
          </label>

          <button
            onClick={generateMoodPalette}
            disabled={generatingTheme}
            className="press-brutal flex items-center gap-1.5 rounded-xl border-2 border-border bg-accent px-4 py-2 font-mono text-xs font-bold text-accent-foreground shadow-brutal-sm disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            {generatingTheme ? "Reading mood…" : "Generate mood palette"}
          </button>
          {generatingTheme && <div className="pixel-progress w-40" />}
        </div>

        {customPalette && (
          <p className="mt-3 text-[11px] font-bold text-muted">
            Mood detected: <span className="text-foreground">{customPalette.description}</span>
          </p>
        )}
      </section>

      {/* Live preview */}
      <section className="relative mt-8">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-page-foreground">slideshow</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-page-foreground">
            Live Preview
          </h3>
        </div>
        {slides ? (
          <SlidesPreview
            slides={slides}
            templateId={templateId}
            paletteId={paletteId}
            customPalette={activePalette}
          />
        ) : (
          !generating && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-5 py-10 text-center shadow-brutal-sm">
              <p className="text-sm text-muted">
                No documentation yet — generate it first to preview and customize it.
              </p>
              <button
                onClick={generate}
                disabled={generating}
                className="press-brutal flex items-center gap-1.5 rounded-xl border-2 border-border bg-accent px-4 py-2 font-mono text-xs font-bold text-accent-foreground shadow-brutal-sm disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                {generating ? "Generating…" : "Generate documentation"}
              </button>
            </div>
          )
        )}
      </section>

      {slides && (
        <>
          <a
            href={downloadHref}
            className="press-brutal mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-[2.5px] border-border bg-accent font-extrabold text-accent-foreground shadow-brutal"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            Create Presentation
          </a>

          <details className="mt-8 rounded-2xl border-[2.5px] border-border bg-surface shadow-brutal">
            <summary className="cursor-pointer px-6 py-4 font-mono text-xs font-bold uppercase tracking-wide text-foreground">
              View as text
            </summary>
            <article className="border-t-2 border-border px-8 py-6">
              <ReactMarkdown
                components={{
                  h1: (props) => (
                    <h1 className="mb-4 text-2xl font-semibold text-foreground" {...props} />
                  ),
                  h2: (props) => (
                    <h2
                      className="mb-2 mt-8 text-lg font-semibold text-accent-purple-deep first:mt-0"
                      {...props}
                    />
                  ),
                  p: (props) => <p className="mb-4 leading-7 text-foreground/90" {...props} />,
                  ul: (props) => <ul className="mb-4 list-disc pl-5" {...props} />,
                  li: (props) => <li className="mb-1 text-foreground/90" {...props} />,
                }}
              >
                {project.documentation}
              </ReactMarkdown>
            </article>
          </details>
        </>
      )}
    </main>
  );
}
