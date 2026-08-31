import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, Loader2, ScanFace, CameraOff } from "lucide-react";
import { BetaTag, FeedbackLink, LowkeyMark } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";
import {
  ADULT_MIN,
  UNDER_18_MAX,
  estimateAgeFromVideo,
  preloadAgeModel,
  type ScanOutcome,
} from "@/lib/lowkey/agescan";
import type { AgeBand, VerificationProvider } from "@/lib/lowkey/types";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "verify your age — lowkey social" },
      {
        name: "description",
        content:
          "free on-device face age check, or mitid / altid / eu wallet. under 18 sees under 18, 18+ sees 18+.",
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

const eidProviders: { id: VerificationProvider; label: string; note: string }[] = [
  { id: "mitid", label: "mitid", note: "denmark" },
  { id: "altid", label: "altid", note: "denmark, no nemid needed" },
  { id: "eudi_wallet", label: "eu identity wallet", note: "all of the eu, eidas 2.0" },
  { id: "simulated_eid", label: "other eu eid", note: "bankid, itsme, ftn, idin" },
];

/* ---------------------------------------------------------------- face scan */

function FaceScanSheet({
  onDone,
  onCancel,
}: {
  onDone: (band: AgeBand) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"starting" | "ready" | "scanning" | "done" | "error">(
    "starting",
  );
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        await preloadAgeModel();
        if (!cancelled) setPhase("ready");
      } catch {
        if (!cancelled) {
          setPhase("error");
          setError("no camera access. allow the camera or use an eid instead.");
        }
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [stop]);

  const scan = async () => {
    if (!videoRef.current) return;
    setPhase("scanning");
    try {
      const result = await estimateAgeFromVideo(videoRef.current);
      setOutcome(result);
      setPhase("done");
      if (result.kind === "under_18" || result.kind === "adult") stop();
    } catch {
      setPhase("error");
      setError("the scan failed. try again or use an eid.");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-foreground/40 p-4">
      <div className="w-full rounded-3xl bg-card p-6">
        <div className="flex items-center gap-2">
          <ScanFace className="size-5 text-primary" />
          <p className="lowkey text-sm font-bold">face age check</p>
          <BetaTag className="ml-auto" />
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl bg-muted">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-square w-full scale-x-[-1] object-cover"
          />
        </div>

        {phase === "starting" && (
          <p className="lowkey mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> loading the model on your device
          </p>
        )}

        {phase === "ready" && (
          <>
            <p className="lowkey mt-4 text-sm text-muted-foreground">
              look straight at the camera in decent light. everything happens on your phone — no
              photo, video or estimate is uploaded anywhere.
            </p>
            <button
              onClick={() => void scan()}
              className="lowkey mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              scan my face
            </button>
          </>
        )}

        {phase === "scanning" && (
          <p className="lowkey mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> checking, hold still
          </p>
        )}

        {phase === "done" && outcome && (
          <div className="mt-4 flex flex-col gap-3">
            {outcome.kind === "no_face" && (
              <p className="lowkey text-sm text-muted-foreground">
                couldn&apos;t see a face. more light, phone a bit closer, try again.
              </p>
            )}
            {outcome.kind === "inconclusive" && (
              <p className="lowkey text-sm text-muted-foreground">
                too close to call (looked around {Math.round(outcome.age)}). lowkey won&apos;t guess
                on borderline ages — use an eid below instead.
              </p>
            )}
            {(outcome.kind === "under_18" || outcome.kind === "adult") && (
              <>
                <p className="lowkey text-sm">
                  the model put you at about {Math.round(outcome.age)} →{" "}
                  <span className="font-bold">
                    {outcome.kind === "under_18" ? "under 18" : "18+"}
                  </span>
                </p>
                <button
                  onClick={() => onDone(outcome.kind === "under_18" ? "under_18" : "adult")}
                  className="lowkey rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
                >
                  put me in {outcome.kind === "under_18" ? "under 18" : "18+"}
                </button>
              </>
            )}
            {outcome.kind !== "under_18" && outcome.kind !== "adult" && (
              <button
                onClick={() => void scan()}
                className="lowkey rounded-2xl border border-input py-3 text-sm font-bold"
              >
                scan again
              </button>
            )}
          </div>
        )}

        {phase === "error" && (
          <p className="lowkey mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CameraOff className="size-4" /> {error}
          </p>
        )}

        <button
          onClick={() => {
            stop();
            onCancel();
          }}
          className="lowkey mt-3 w-full py-2 text-xs font-semibold text-muted-foreground"
        >
          cancel
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- eid sheet */

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
  const label = eidProviders.find((p) => p.id === provider)?.label ?? "eid";

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
              {label} only sends lowkey your age band — never your name, address or id number. this
              beta runs a simulated handshake, so pick the band you&apos;d be verified into.
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

/* -------------------------------------------------------------------- page */

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

  const finish = (band: AgeBand, provider: VerificationProvider) => {
    verifyAge(band, provider);
    setOpen(null);
    void navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-7 px-6 py-12">
      <div className="flex items-center gap-3">
        <LowkeyMark size={52} />
        <BetaTag />
      </div>
      <div>
        <h1 className="lowkey text-3xl leading-tight font-extrabold">get your age checked</h1>
        <p className="lowkey mt-3 text-sm text-muted-foreground">
          nobody gets in on trust — no typing a birthday. under 18 can only see under 18, 18+ can
          only see 18+, and you can&apos;t change your band later.
        </p>
      </div>

      <button
        onClick={() => setOpen("face_scan")}
        className="lowkey flex items-center gap-3 rounded-3xl bg-primary px-4 py-4 text-left text-primary-foreground"
      >
        <ScanFace className="size-6" />
        <span>
          <span className="block text-sm font-bold">face age check — free, no id</span>
          <span className="block text-xs opacity-80">
            runs on your device, nothing uploaded, takes ~5 seconds
          </span>
        </span>
      </button>

      <div>
        <p className="lowkey text-xs font-semibold text-muted-foreground">
          or use a government eid (needed if the scan is borderline)
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {eidProviders.map((p) => (
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
      </div>

      <p className="lowkey text-xs leading-relaxed text-muted-foreground">
        the face check uses a free open-source model that runs in your browser: it estimates an age
        and only accepts a clear result ({UNDER_18_MAX} or under, or {ADULT_MIN} or over) — anything
        borderline is sent to an eid instead. lowkey social is in beta, so bugs and wrong calls
        happen: tell me at <FeedbackLink />. eid handshakes are simulated until the broker contract
        is live.
      </p>

      {open === "face_scan" && (
        <FaceScanSheet onCancel={() => setOpen(null)} onDone={(band) => finish(band, "face_scan")} />
      )}
      {open && open !== "face_scan" && (
        <ProviderSheet
          provider={open}
          onCancel={() => setOpen(null)}
          onDone={(band) => finish(band, open)}
        />
      )}
    </div>
  );
}
