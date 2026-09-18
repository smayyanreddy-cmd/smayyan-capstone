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
    return <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 text-muted">Loading…</main>;
  }

  const slides = project.documentation
    ? buildSlidePlan(project, items, project.documentation)
    : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <Link href={`/projects/${id}`} className="text-sm text-muted hover:text-accent">
        &larr; Back to {project.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Documentation
        </h1>
        <div className="flex gap-2">
          {project.documentation && (
            <a
              href={`/api/projects/${id}/documentation/pptx`}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              Download as PPTX
            </a>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            {generating
              ? "Generating…"
              : project.documentation
                ? "Regenerate"
                : "Generate documentation"}
          </button>
        </div>
      </div>

      {project.documentation_generated_at && (
        <p className="mt-1 text-xs text-muted">
          Last generated {new Date(project.documentation_generated_at).toLocaleString()}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {slides ? (
        <>
          <div className="mt-8">
            <SlidesPreview slides={slides} />
          </div>

          <details className="mt-8 rounded-2xl border border-border bg-surface">
            <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-foreground">
              View as text
            </summary>
            <article className="border-t border-border px-8 py-6">
              <ReactMarkdown
                components={{
                  h1: (props) => (
                    <h1 className="mb-4 text-2xl font-semibold text-foreground" {...props} />
                  ),
                  h2: (props) => (
                    <h2
                      className="mb-2 mt-8 text-lg font-semibold text-accent first:mt-0"
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
          <p className="mt-8 rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted">
            No documentation yet — click &ldquo;Generate documentation&rdquo; once you&apos;ve
            added the entries you want it to cover.
          </p>
        )
      )}
    </main>
  );
}
