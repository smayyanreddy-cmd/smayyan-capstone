"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Item = {
  id: string;
  project_id: string;
  image_path: string;
  phrase: string | null;
  description: string | null;
  created_at: string;
};

type RelatedItem = Item & { project_name: string; similarity: number };

type Project = {
  id: string;
  name: string;
  description: string | null;
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [phrase, setPhrase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [related, setRelated] = useState<RelatedItem[] | null>(null);
  const [expanded, setExpanded] = useState<Item | null>(null);

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

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setRelated(null);

    const form = new FormData();
    form.append("image", file);
    if (phrase.trim()) form.append("phrase", phrase.trim());

    const res = await fetch(`/api/projects/${id}/items`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    setPhrase("");
    setFile(null);
    setUploading(false);
    setRelated(data.related);
    load();
  }

  if (!project) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 text-muted">Loading…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          &larr; All projects
        </Link>
        <Link
          href={`/projects/${id}/documentation`}
          className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          Documentation &rarr;
        </Link>
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {project.name}
      </h1>
      {project.description && <p className="mt-1 text-muted">{project.description}</p>}

      <form
        onSubmit={upload}
        className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
      >
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted transition hover:border-accent hover:bg-accent/5">
          <span className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-accent-foreground">
            Choose image
          </span>
          <span className="truncate">{file ? file.name : "No file selected"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        <input
          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted focus:outline-2 focus:outline-accent"
          placeholder="Optional note (e.g. 'darker palette, felt too clean before')"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
        />
        <button
          type="submit"
          disabled={!file || uploading}
          className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-40"
        >
          {uploading ? "Adding…" : "Add entry"}
        </button>
      </form>

      {related && related.length > 0 && (
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <div className="text-sm font-semibold text-foreground">Related past pieces</div>
          <ul className="mt-3 flex flex-col gap-2">
            {related.map((r) => (
              <li key={r.id} className="text-sm text-muted">
                <span className="font-medium text-foreground">
                  {r.project_id === id ? "This project" : r.project_name}
                </span>{" "}
                &mdash; {r.description ?? r.phrase ?? r.image_path}{" "}
                <span className="text-accent">{(r.similarity * 100).toFixed(0)}% similar</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-12 text-lg font-semibold text-foreground">Evolution</h2>
      <ol className="mt-5 flex flex-col gap-0">
        {items.map((item, i) => (
          <li key={item.id} className="relative flex gap-4 pb-8 pl-2 last:pb-0">
            {i < items.length - 1 && (
              <span className="absolute left-[47px] top-20 bottom-0 w-px bg-border" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_path}
              alt=""
              onClick={() => setExpanded(item)}
              className="h-20 w-20 shrink-0 cursor-pointer rounded-xl border border-border object-cover transition hover:opacity-80"
            />
            <div className="pt-0.5">
              <div className="text-xs font-medium text-muted">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
              {item.description && (
                <div className="mt-1 text-sm text-foreground">{item.description}</div>
              )}
              {item.phrase && (
                <div className="mt-1 text-sm italic text-muted">&ldquo;{item.phrase}&rdquo;</div>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted">
            No entries yet — add one above.
          </li>
        )}
      </ol>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setExpanded(null)}
        >
          <div className="flex max-h-full max-w-3xl flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expanded.image_path}
              alt=""
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center text-sm text-zinc-200">
              {expanded.description && <p>{expanded.description}</p>}
              {expanded.phrase && (
                <p className="italic text-zinc-400">&ldquo;{expanded.phrase}&rdquo;</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
