import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
            C
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Creative Continuity Agent
          </span>
        </Link>
      </div>
    </header>
  );
}
