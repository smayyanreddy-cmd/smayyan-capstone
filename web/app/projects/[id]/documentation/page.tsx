"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

type Project = {
  id: string;
  name: string;
  documentation: string | null;
  documentation_generated_at: string | null;
};

export default function DocumentationPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data.project);
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

  if (!project) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href={`/projects/${id}`} className="text-sm text-zinc-500 hover:underline">
          &larr; Back to {project.name}
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Documentation
          </h1>
          <div className="flex gap-2">
            {project.documentation && (
              <a
                href={`/api/projects/${id}/documentation/pptx`}
                className="rounded border border-zinc-300 px-4 py-2 text-sm text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                Download as PPTX
              </a>
            )}
            <button
              onClick={generate}
              disabled={generating}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {generating
                ? "Generating..."
                : project.documentation
                  ? "Regenerate"
                  : "Generate documentation"}
            </button>
          </div>
        </div>

        {project.documentation_generated_at && (
          <p className="mt-1 text-xs text-zinc-500">
            Last generated {new Date(project.documentation_generated_at).toLocaleString()}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {project.documentation ? (
          <article className="prose-content mt-8">
            <ReactMarkdown
              components={{
                h1: (props) => (
                  <h1 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50" {...props} />
                ),
                h2: (props) => (
                  <h2 className="mb-2 mt-8 text-lg font-medium text-black dark:text-zinc-50" {...props} />
                ),
                p: (props) => (
                  <p className="mb-4 leading-7 text-zinc-700 dark:text-zinc-300" {...props} />
                ),
                ul: (props) => <ul className="mb-4 list-disc pl-5" {...props} />,
                li: (props) => <li className="mb-1 text-zinc-700 dark:text-zinc-300" {...props} />,
              }}
            >
              {project.documentation}
            </ReactMarkdown>
          </article>
        ) : (
          !generating && (
            <p className="mt-8 text-sm text-zinc-500">
              No documentation yet — click &ldquo;Generate documentation&rdquo; once you&apos;ve
              added the entries you want it to cover.
            </p>
          )
        )}
      </main>
    </div>
  );
}
