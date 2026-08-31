import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLowkey } from "@/lib/lowkey/store";
import { BetaTag, FeedbackLink, LowkeyMark } from "@/components/lowkey/shell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "sign in — lowkey social" },
      {
        name: "description",
        content:
          "sign in or make a lowkey social account, then set up your profile and verify your age band.",
      },
      { property: "og:title", content: "sign in — lowkey social" },
      { property: "og:description", content: "sign in or make a lowkey social account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { me, needsProfile, signIn, signUp, signInWithGoogle, loading } = useLowkey();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (needsProfile) {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }
    if (!me) return;
    if (!me.onboardedAt || me.verificationStatus !== "verified" || !me.ageBand) {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }
    void navigate({ to: "/", replace: true });
  }, [me, needsProfile, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "that didn't work");
      return;
    }
    if (mode === "up") toast.success("account made. let's set you up");
  };

  const google = async () => {
    const res = await signInWithGoogle();
    if (!res.ok) toast.error(res.error ?? "google sign in failed");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-7 px-6 py-12">
      <div className="flex items-center gap-3">
        <LowkeyMark size={44} />
        <div>
          <h1 className="lowkey text-3xl leading-none font-extrabold tracking-tight">
            lowkey social
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <BetaTag />
            <span className="lowkey text-xs text-muted-foreground">early beta, be nice</span>
          </div>
        </div>
      </div>

      <p className="lowkey text-sm text-muted-foreground">
        no caps. chill. no grammar. under 18s and adults get completely separate feeds and chats.
      </p>

      <div className="flex gap-1 rounded-full bg-muted p-1">
        {(["up", "in"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`lowkey flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {m === "up" ? "new here" : "sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="lowkey text-xs font-semibold text-muted-foreground" htmlFor="email">
          email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@email.com"
          className="lowkey rounded-2xl border border-input bg-card px-4 py-3 outline-none"
        />
        <label className="lowkey text-xs font-semibold text-muted-foreground" htmlFor="password">
          password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          placeholder="at least 6 characters"
          className="lowkey rounded-2xl border border-input bg-card px-4 py-3 outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="lowkey mt-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "one sec…" : mode === "up" ? "make my account" : "let me in"}
        </button>
      </form>

      <button
        onClick={google}
        className="lowkey rounded-full border border-border bg-card py-3 text-sm font-semibold"
      >
        continue with google
      </button>

      <div className="lowkey space-y-1 text-xs text-muted-foreground">
        <p>
          by continuing you agree to our{" "}
          <Link to="/privacy" className="font-semibold underline underline-offset-2">
            privacy notice
          </Link>
          . data lives in the eu, you can export or delete everything any time.
        </p>
        <p>
          beta feedback: <FeedbackLink />
        </p>
      </div>
    </div>
  );
}
