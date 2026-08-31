import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLowkey } from "@/lib/lowkey/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "sign in — lowkey social" },
      {
        name: "description",
        content: "sign in or make a lowkey social account, then verify your age band to start.",
      },
      { property: "og:title", content: "sign in — lowkey social" },
      { property: "og:description", content: "sign in or make a lowkey social account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { me, signIn, signUp, state } = useLowkey();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!me) return;
    void navigate({
      to: me.verificationStatus === "verified" && me.ageBand ? "/" : "/verify",
      replace: true,
    });
  }, [me, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = mode === "in" ? signIn(handle) : signUp(handle, displayName);
    if (!res.ok) toast.error(res.error ?? "that didn't work");
  };

  const demos = state.profiles.filter((p) => p.isDemo);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-8 px-6 py-12">
      <div>
        <h1 className="lowkey text-4xl leading-none font-extrabold tracking-tight">
          lowkey
          <br />
          social
        </h1>
        <p className="lowkey mt-3 text-sm text-muted-foreground">
          no caps. chill. no grammar. just because it&apos;s for kids doesn&apos;t mean it&apos;s not
          fun.
        </p>
      </div>

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
        <label className="lowkey text-xs font-semibold text-muted-foreground" htmlFor="handle">
          handle
        </label>
        <div className="flex items-center rounded-2xl border border-input bg-card px-4">
          <span className="text-muted-foreground">@</span>
          <input
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={20}
            autoComplete="username"
            placeholder="alfie"
            className="lowkey w-full bg-transparent py-3 pl-1 outline-none"
          />
        </div>

        {mode === "up" && (
          <>
            <label className="lowkey text-xs font-semibold text-muted-foreground" htmlFor="name">
              display name
            </label>
            <input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="what people call you"
              className="lowkey rounded-2xl border border-input bg-card px-4 py-3 outline-none"
            />
          </>
        )}

        <button
          type="submit"
          className="lowkey mt-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground"
        >
          {mode === "up" ? "make my account" : "let me in"}
        </button>
      </form>

      <div>
        <p className="lowkey text-xs font-semibold text-muted-foreground">
          or hop in as a demo account
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {demos.map((p) => (
            <button
              key={p.id}
              onClick={() => signIn(p.handle)}
              className="lowkey rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
            >
              @{p.handle} · {p.ageBand === "under_18" ? "under 18" : "18+"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
