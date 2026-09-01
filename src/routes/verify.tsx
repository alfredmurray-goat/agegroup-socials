import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ScanFace, CameraOff, RefreshCcw, Camera } from "lucide-react";
import { BetaTag, FeedbackLink, LowkeyMark } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";
import {
  ADULT_MIN,
  UNDER_18_MAX,
  estimateAgeFromVideo,
  listCameras,
  openCamera,
  preloadAgeModel,
  type CameraOption,
  type ScanOutcome,
} from "@/lib/lowkey/agescan";
import type { AgeBand } from "@/lib/lowkey/types";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "verify your age — lowkey social" },
      {
        name: "description",
        content:
          "free on-device face age check with any camera: phone, laptop webcam or usb webcam. under 18 sees under 18, 18+ sees 18+.",
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

function VerifyPage() {
  const { me, verifyAge, recordConsent } = useLowkey();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"idle" | "starting" | "ready" | "scanning" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cameras, setCameras] = useState<CameraOption[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!me) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (me.verificationStatus === "verified" && me.ageBand) {
      void navigate({ to: "/", replace: true });
    }
  }, [me, navigate]);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(
    async (id?: string) => {
      setPhase("starting");
      setError(null);
      setOutcome(null);
      stop();
      try {
        const stream = await openCamera(id ?? undefined);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameras(await listCameras());
      } catch {
        setPhase("error");
        setError(
          "no camera access. allow the camera in your browser, or plug in / pick another webcam below.",
        );
        return;
      }
      try {
        await preloadAgeModel();
        setPhase("ready");
      } catch {
        setPhase("error");
        setError(
          "the age model couldn't load. check your connection (or turn off any content blocker) and try again.",
        );
      }
    },
    [stop],
  );

  const scan = async () => {
    if (!videoRef.current) return;
    setPhase("scanning");
    try {
      const result = await estimateAgeFromVideo(videoRef.current);
      setOutcome(result);
      setAttempts((a) => a + 1);
      setPhase("done");
    } catch {
      setPhase("error");
      setError("the scan failed. try again in better light.");
    }
  };

  const finish = async (band: AgeBand) => {
    setSaving(true);
    await recordConsent("on_device_face_scan");
    await verifyAge(band, "face_scan");
    stop();
    setSaving(false);
    void navigate({ to: "/", replace: true });
  };

  const decided = outcome?.kind === "under_18" || outcome?.kind === "adult";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <LowkeyMark size={48} />
        <BetaTag />
      </div>

      <div>
        <h1 className="lowkey text-3xl leading-tight font-extrabold">get your age checked</h1>
        <p className="lowkey mt-3 text-sm text-muted-foreground">
          nobody gets in on trust — no typing a birthday. a face model runs on your own device and
          decides your band. under 18 can only see under 18, 18+ can only see 18+, and you
          can&apos;t change your band later.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="relative bg-muted">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-[4/3] w-full scale-x-[-1] object-cover"
          />
          {phase === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <ScanFace className="size-9 text-muted-foreground" />
              <p className="lowkey px-8 text-xs text-muted-foreground">
                works with a phone camera, a laptop webcam or a usb webcam — no face id needed
              </p>
            </div>
          )}
          {(phase === "starting" || phase === "scanning") && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
              <Loader2 className="size-7 animate-spin text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 p-5">
          {phase === "idle" && (
            <button
              onClick={() => void start()}
              className="lowkey rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
            >
              turn on my camera
            </button>
          )}

          {phase === "starting" && (
            <p className="lowkey text-sm text-muted-foreground">
              loading the model on your device...
            </p>
          )}

          {phase === "ready" && (
            <>
              <p className="lowkey text-sm text-muted-foreground">
                face the camera in decent light, no sunglasses or hats. nothing is uploaded — no
                photo, no frame, no estimate leaves this device.
              </p>
              <button
                onClick={() => void scan()}
                className="lowkey rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
              >
                scan my face
              </button>
            </>
          )}

          {phase === "scanning" && (
            <p className="lowkey text-sm text-muted-foreground">checking, hold still</p>
          )}

          {phase === "done" && outcome && (
            <>
              {outcome.kind === "no_face" && (
                <p className="lowkey text-sm text-muted-foreground">
                  couldn&apos;t see a face. get closer, add light, try again.
                </p>
              )}
              {outcome.kind === "inconclusive" && (
                <p className="lowkey text-sm text-muted-foreground">
                  too close to call (looked about {Math.round(outcome.age)}). lowkey won&apos;t guess
                  on borderline ages — scan again, ideally in brighter light.
                </p>
              )}
              {decided && (
                <>
                  <p className="lowkey text-sm">
                    the model put you at about {Math.round(outcome.age)} →{" "}
                    <span className="font-bold">
                      {outcome.kind === "under_18" ? "under 18" : "18+"}
                    </span>
                  </p>
                  <button
                    onClick={() => void finish(outcome.kind === "under_18" ? "under_18" : "adult")}
                    disabled={saving}
                    className="lowkey rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
                  >
                    {saving
                      ? "saving..."
                      : `put me in ${outcome.kind === "under_18" ? "under 18" : "18+"}`}
                  </button>
                </>
              )}
              <button
                onClick={() => void scan()}
                className="lowkey flex items-center justify-center gap-2 rounded-2xl border border-input py-3 text-sm font-bold"
              >
                <RefreshCcw className="size-4" /> scan again
              </button>
              {!decided && attempts >= 3 && (
                <button
                  onClick={() => void finish("under_18")}
                  disabled={saving}
                  className="lowkey rounded-2xl bg-muted py-3 text-xs font-bold text-muted-foreground disabled:opacity-60"
                >
                  keep failing? put me in the safest band (under 18)
                </button>
              )}
            </>
          )}

          {phase === "error" && (
            <>
              <p className="lowkey flex items-center gap-2 text-sm text-muted-foreground">
                <CameraOff className="size-4" /> {error}
              </p>
              <button
                onClick={() => void start(deviceId ?? undefined)}
                className="lowkey rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                try again
              </button>
            </>
          )}

          {cameras.length > 1 && (
            <label className="lowkey flex items-center gap-2 text-xs text-muted-foreground">
              <Camera className="size-4" />
              <select
                value={deviceId ?? cameras[0]?.deviceId ?? ""}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  void start(e.target.value);
                }}
                className="lowkey flex-1 rounded-xl border border-input bg-background px-2 py-1.5"
              >
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <p className="lowkey text-xs leading-relaxed text-muted-foreground">
        the check uses a free open-source model in your browser. it only accepts a clear result (
        {UNDER_18_MAX} or under, or {ADULT_MIN} or over) — anything borderline has to be rescanned.
        no biometric data is stored or sent anywhere. lowkey social is in beta, so wrong calls
        happen: tell me at <FeedbackLink />.
      </p>
    </div>
  );
}
