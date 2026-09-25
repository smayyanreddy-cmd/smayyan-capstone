import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b-[2.5px] border-border bg-accent-blue shadow-brutal-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-white">home</span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
            DOCUMATE.EXE
          </span>
        </Link>
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="flex items-center gap-2"
          >
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-6 w-6 rounded-full border-[1.5px] border-border"
              />
            )}
            <span className="hidden font-mono text-[10px] font-bold text-white sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <button
              type="submit"
              className="press-brutal rounded-lg border-[1.5px] border-border bg-surface px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Sign out
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="block h-[11px] w-[11px] border-[1.5px] border-border bg-surface" />
            <span className="block h-[11px] w-[11px] border-[1.5px] border-border bg-surface" />
            <span className="block h-[11px] w-[11px] border-[1.5px] border-border bg-accent-pink" />
          </div>
        )}
      </div>
    </header>
  );
}
