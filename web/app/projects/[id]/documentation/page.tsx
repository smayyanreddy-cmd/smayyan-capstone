"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import SlidesPreview from "@/components/SlidesPreview";
import { buildSlidePlan } from "@/lib/slides";

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
};

export default function DocumentationPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data.project);
    setItems(data.items);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / id change
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
    return <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 text-page-foreground/70">Loading…</main>;
  }

  const slides = project.documentation
    ? buildSlidePlan(project, items, project.documentation)
    : null;

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
        <div className="flex gap-2">
          {project.documentation && (
            <Link
              href={`/projects/${id}/documentation/new`}
              className="press-brutal flex items-center gap-1.5 rounded-xl border-2 border-border bg-surface px-4 py-2 font-mono text-xs font-bold text-foreground shadow-brutal-sm"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
              Customize & Export
            </Link>
          )}
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
      </div>

      {project.documentation_generated_at && (
        <p className="mt-2 font-mono text-[11px] font-bold text-page-foreground/50">
          Last generated {new Date(project.documentation_generated_at).toLocaleString()}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border-2 border-border bg-accent-pink/10 px-4 py-3 text-sm font-medium text-accent-pink shadow-brutal-sm">
          {error}
        </p>
      )}

      {slides ? (
        <>
          <div className="mt-8">
            <SlidesPreview slides={slides} />
          </div>

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
      ) : (
        !generating && (
          <p className="mt-8 rounded-2xl border-2 border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-muted shadow-brutal-sm">
            No documentation yet — click &ldquo;Generate documentation&rdquo; once you&apos;ve
            added the entries you want it to cover.
          </p>
        )
      )}
    </main>
  );
}
