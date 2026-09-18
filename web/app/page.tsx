"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  async function loadProjects() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects);
    setLoaded(true);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadProjects();
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setName("");
    setDescription("");
    setLoading(false);
    setFormOpen(false);
    loadProjects();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Your projects
          </h1>
          <p className="mt-1 text-muted">
            Track how an ongoing creative project evolves over time.
          </p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90"
        >
          {formOpen ? "Cancel" : "+ Start a project"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={createProject}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <input
            autoFocus
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted focus:outline-2 focus:outline-accent"
            placeholder="Project name (e.g. Emotion Spiral)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted focus:outline-2 focus:outline-accent"
            placeholder="One-line description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            {loading ? "Starting..." : "Start project"}
          </button>
        </form>
      )}

      <ul className="mt-8 flex flex-col gap-3">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              className="group flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm transition hover:border-accent"
            >
              <div>
                <div className="font-medium text-foreground">{project.name}</div>
                {project.description && (
                  <div className="mt-0.5 text-sm text-muted">{project.description}</div>
                )}
              </div>
              <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent">
                &rarr;
              </span>
            </Link>
          </li>
        ))}
        {loaded && projects.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted">
            No projects yet — start one above to begin capturing how it evolves.
          </li>
        )}
      </ul>
    </main>
  );
}
