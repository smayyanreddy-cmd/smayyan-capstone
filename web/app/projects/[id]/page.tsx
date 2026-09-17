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

  if (!project) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          &larr; All projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{project.description}</p>
        )}

        <form onSubmit={upload} className="mt-8 flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-600 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900">
            <span className="rounded bg-zinc-200 px-3 py-1.5 font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
              Choose image
            </span>
            <span className="truncate">
              {file ? file.name : "No file selected"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          <input
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            placeholder="Optional note (e.g. 'darker palette, felt too clean before')"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
          <button
            type="submit"
            disabled={!file || uploading}
            className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {uploading ? "Adding..." : "Add entry"}
          </button>
        </form>

        {related && related.length > 0 && (
          <div className="mt-6 rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Related past pieces
            </div>
            <ul className="mt-2 flex flex-col gap-2">
              {related.map((r) => (
                <li key={r.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">
                    {r.project_id === id ? "This project" : r.project_name}
                  </span>{" "}
                  &mdash; {r.description ?? r.phrase ?? r.image_path} (
                  {(r.similarity * 100).toFixed(0)}% similar)
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="mt-10 text-lg font-medium text-black dark:text-zinc-50">
          Evolution
        </h2>
        <ol className="mt-4 flex flex-col gap-6">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_path}
                alt=""
                className="h-24 w-24 rounded object-cover"
              />
              <div>
                <div className="text-xs text-zinc-500">
                  {new Date(item.created_at).toLocaleString()}
                </div>
                {item.description && (
                  <div className="text-sm text-black dark:text-zinc-50">
                    {item.description}
                  </div>
                )}
                {item.phrase && (
                  <div className="text-sm italic text-zinc-500">&ldquo;{item.phrase}&rdquo;</div>
                )}
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-zinc-500">No entries yet — add one above.</li>
          )}
        </ol>
      </main>
    </div>
  );
}
