"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) return setError(error.message);

    router.push("/library");
    router.refresh();
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-gutter">
      <div className="relative w-full max-w-[460px] flex flex-col items-center">
        <div className="absolute -top-12 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-12 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full bg-surface-container-lowest rounded-xl shadow-xl px-margin sm:px-margin-desktop py-space-2xl flex flex-col items-center">
          <div className="mb-space-lg w-[52px] h-[52px] rounded-xl bg-surface-container-low border border-[#E7E5E4] flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[28px]">
              auto_stories
            </span>
          </div>

          <div className="text-center mb-space-2xl">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              write it. <span className="italic font-normal">publish it.</span>{" "}
              post it.
            </h1>
            <p className="mt-space-sm font-ui-body text-ui-body text-on-surface-variant leading-relaxed max-w-[340px] mx-auto">
              the calm studio for modern authors, bookmakers, and storytellers.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-space-md"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider"
              >
                Author Email
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="penname@inscribo.press"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-space-md bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-outline font-ui-body text-ui-body rounded-lg shadow-sm transition-colors duration-150 outline-none focus:shadow-md"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="at least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-space-md bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-outline font-ui-body text-ui-body rounded-lg shadow-sm transition-colors duration-150 outline-none focus:shadow-md"
                />
              </div>
            </div>

            {error && (
              <p className="font-ui-small text-ui-small text-error">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-space-sm bg-primary-container hover:bg-primary text-on-primary font-ui-medium text-ui-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] group disabled:opacity-50"
            >
              <span>
                {loading
                  ? "one moment..."
                  : mode === "signin"
                    ? "enter studio"
                    : "create account"}
              </span>
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                arrow_forward
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-ui-small text-ui-small text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {mode === "signin"
                ? "new here? create an account"
                : "have an account? sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
