import { signIn } from "@/lib/auth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border-[2.5px] border-border bg-surface p-8 text-center shadow-brutal">
        <span className="material-symbols-outlined text-[32px] text-foreground">home</span>
        <h1 className="mt-3 font-mono text-sm font-bold uppercase tracking-wider text-foreground">
          DOCUMATE.EXE
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to track how your project evolves over time.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="press-brutal flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface-inset px-4 py-3 font-mono text-xs font-bold text-foreground shadow-brutal-sm"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
