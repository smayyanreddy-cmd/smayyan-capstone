"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SlidesPreview from "@/components/SlidesPreview";
import { buildSlidePlan } from "@/lib/slides";
import { PALETTES, TEMPLATES, PaletteId, TemplateId } from "@/lib/pptx-themes";

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
};

export default function CustomizeDocumentationPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("editorial");
  const [paletteId, setPaletteId] = useState<PaletteId>("neo-tactile");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data.project);
    setItems(data.items);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    ? buildSlidePlan(project, items, project.documentation)
    : null;

  const downloadHref = `/api/projects/${id}/documentation/pptx?template=${templateId}&palette=${paletteId}`;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${id}/documentation`}
          className="flex items-center gap-1 font-mono text-xs font-bold text-page-foreground/60 hover:text-page-foreground"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </Link>
        <span className="rounded-full border-2 border-border bg-surface px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground shadow-brutal-sm">
          {project.name}
        </span>
      </div>

      <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-page-foreground">
        Customize Documentation
      </h1>
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
        </div>
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
          <SlidesPreview slides={slides} templateId={templateId} paletteId={paletteId} />
        ) : (
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
        )}
      </section>

      {slides && (
        <a
          href={downloadHref}
          className="press-brutal mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-[2.5px] border-border bg-accent font-extrabold text-accent-foreground shadow-brutal"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          Create Presentation
        </a>
      )}
    </main>
  );
}
