import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useLowkey } from "@/lib/lowkey/store";
import type { AgeBand, VerificationProvider } from "@/lib/lowkey/types";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "verify your age — lowkey social" },
      {
        name: "description",
        content:
          "verify your age band with mitid, altid or the eu digital identity wallet. under 18 sees under 18, 18+ sees 18+.",
      },
      { property: "og:title", content: "verify your age — lowkey social" },
      {
        property: "og:description",
        content: "age-verified feeds: under 18 sees under 18, 18+ sees 18+.",
      },
    ],
  }),
  component: VerifyPage,
});

const providers: { id: VerificationProvider; label: string; note: string }[] = [
  { id: "mitid", label: "mitid", note: "denmark" },
  { id: "altid", label: "altid", note: "denmark, no nemid needed" },
  { id: "eudi_wallet", label: "eu identity wallet", note: "all of the eu, eidas 2.0" },
  { id: "simulated_eid", label: "other eu eid", note: "bankid, itsme, ftn, idin" },
];

function ProviderSheet({
  provider,
  onDone,
  onCancel,
}: {
  provider: VerificationProvider;
  onDone: (band: AgeBand) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState<AgeBand | null>(null);
  const label = providers.find((p) => p.id === provider)?.label ?? "eid";

  const run = (band: AgeBand) => {
    setBusy(band);
    window.setTimeout(() => onDone(band), 1400);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-foreground/40 p-4">
      <div className="w-full rounded-3xl bg-card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <p className="lowkey text-sm font-bold">{label}</p>
        </div>
        {busy ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="lowkey text-sm text-muted-foreground">
              talking to {label}, keep this open
            </p>
          </div>
        ) : (
          <>
            <p className="lowkey mt-3 text-sm text-muted-foreground">
              {label} only sends lowkey your age band — never your name, address or id number. pick
              the band you&apos;d be verified into for this preview.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => run("under_18")}
                className="lowkey rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                verified: under 18
              </button>
              <button
                onClick={() => run("adult")}
                className="lowkey rounded-2xl border border-input bg-background py-3 text-sm font-bold"
              >
                verified: 18 or over
              </button>
              <button
                onClick={onCancel}
                className="lowkey py-2 text-xs font-semibold text-muted-foreground"
              >
                cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VerifyPage() {
  const { me, verifyAge } = useLowkey();
  const navigate = useNavigate();
  const [open, setOpen] = useState<VerificationProvider | null>(null);

  useEffect(() => {
    if (!me) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (me.verificationStatus === "verified" && me.ageBand) {
      void navigate({ to: "/", replace: true });
    }
  }, [me, navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-7 px-6 py-12">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft">
        <ShieldCheck className="size-7 text-primary" />
      </div>
      <div>
        <h1 className="lowkey text-3xl leading-tight font-extrabold">get your age checked</h1>
        <p className="lowkey mt-3 text-sm text-muted-foreground">
          when you make an account you have to get your age checked. under 18 can only see under 18,
          and 18+ can only see 18+. you can&apos;t change your band later.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {providers.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setOpen(p.id)}
              className="lowkey flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 text-left"
            >
              <span>
                <span className="block text-sm font-bold">{p.label}</span>
                <span className="block text-xs text-muted-foreground">{p.note}</span>
              </span>
              <span className="lowkey text-xs font-semibold text-muted-foreground">verify →</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="lowkey text-xs leading-relaxed text-muted-foreground">
        this preview runs a simulated eid handshake. plug in real mitid / altid / eu wallet
        credentials through an eid broker and the same flow goes live — lowkey never trusts an age
        typed in by hand.
      </p>

      {open && (
        <ProviderSheet
          provider={open}
          onCancel={() => setOpen(null)}
          onDone={(band) => {
            verifyAge(band, open);
            setOpen(null);
            void navigate({ to: "/", replace: true });
          }}
        />
      )}
    </div>
  );
}
