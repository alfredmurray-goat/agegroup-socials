import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BetaTag, FeedbackLink, LowkeyMark } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";
import { INTERESTS, VIBES } from "@/lib/lowkey/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "set up your profile — lowkey social" },
      {
        name: "description",
        content:
          "pick your handle, interests, vibe and daily limit, then get your age band checked before you see any content.",
      },
      { property: "og:title", content: "set up your profile — lowkey social" },
      {
        property: "og:description",
        content: "handle, interests, vibe, daily limit and your age check.",
      },
    ],
  }),
  component: OnboardingPage,
});

const paces = [
  { id: "slow", label: "slow", note: "fewer posts, calmer feed" },
  { id: "balanced", label: "balanced", note: "the normal amount" },
  { id: "busy", label: "busy", note: "show me everything" },
];

const hues = [48, 60, 96, 160, 200, 250, 290, 330];
const limitOptions = [15, 30, 45, 60, 90];

function OnboardingPage() {
  const {
    me,
    needsProfile,
    loading,
    createProfile,
    updateProfile,
    finishOnboarding,
    recordConsent,
  } = useLowkey();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  useEffect(() => {
    const w = window as unknown as { __obDbg?: string[] };
    w.__obDbg = w.__obDbg ?? [];
    w.__obDbg.push("mount");
  }, []);
  const [busy, setBusy] = useState(false);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatarHue, setAvatarHue] = useState(60);
  const [interests, setInterests] = useState<string[]>([]);
  const [vibe, setVibe] = useState<string>("chill");
  const [contentPace, setContentPace] = useState("balanced");
  const [quietHours, setQuietHours] = useState(true);
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(45);
  const [terms, setTerms] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!me && !needsProfile) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (me && me.onboardedAt && me.verificationStatus === "verified" && me.ageBand) {
      void navigate({ to: "/", replace: true });
    }
  }, [me, needsProfile, loading, navigate]);

  useEffect(() => {
    if (me && step === 0) {
      setHandle((h) => h || me.handle);
      setDisplayName((d) => d || me.displayName);
      setInterests((i) => (i.length ? i : me.interests));
      setAvatarHue(me.avatarHue);
    }
  }, [me, step]);

  const toggleInterest = (i: string) =>
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= 6 ? prev : [...prev, i],
    );

  const saveIdentity = async () => {
    (window as unknown as { __obDbg: string[] }).__obDbg.push(`save start me=${!!me}`);
    const cleanHandle = handle.trim().toLowerCase().replace(/^@/, "");
    if (cleanHandle.length < 3) {
      toast.error("handle needs 3+ characters");
      return;
    }
    if (!displayName.trim()) {
      toast.error("give yourself a name");
      return;
    }
    setBusy(true);
    const draft = {
      handle: cleanHandle,
      displayName: displayName.trim().toLowerCase(),
      bio: bio.trim().toLowerCase(),
      avatarHue,
      pronouns: pronouns.trim() || null,
      city: city.trim().toLowerCase() || null,
    };
    const res = me ? await updateProfile(draft) : await createProfile(draft);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "couldn't save that");
      return;
    }
    (window as unknown as { __obDbg: string[] }).__obDbg.push("saved ok");
    setStep(1);
  };

  const savePrefs = async () => {
    setBusy(true);
    const res = await updateProfile({
      interests,
      vibe,
      contentPace,
      quietHours,
      dailyLimitMinutes,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "couldn't save that");
      return;
    }
    setStep(3);
  };

  const goVerify = async () => {
    if (!terms) {
      toast.error("tick the box first");
      return;
    }
    setBusy(true);
    await recordConsent("terms_and_privacy");
    const res = await finishOnboarding();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "couldn't save that");
      return;
    }
    void navigate({ to: "/verify" });
  };

  const steps = ["you", "what you're into", "how it feels", "age check"];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <LowkeyMark size={36} />
        <BetaTag />
        <span className="lowkey ml-auto text-xs text-muted-foreground">
          step {step + 1} of {steps.length}
        </span>
      </div>

      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <h1 className="lowkey text-2xl font-extrabold">{steps[step]}</h1>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Field label="handle">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="lowkey_alfred"
              className="lowkey w-full rounded-2xl border border-input bg-card px-4 py-3 outline-none"
            />
          </Field>
          <Field label="name people see">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="alfred"
              className="lowkey w-full rounded-2xl border border-input bg-card px-4 py-3 outline-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="pronouns (optional)">
              <input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="he/him"
                className="lowkey w-full rounded-2xl border border-input bg-card px-4 py-3 outline-none"
              />
            </Field>
            <Field label="city (optional)">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="copenhagen"
                className="lowkey w-full rounded-2xl border border-input bg-card px-4 py-3 outline-none"
              />
            </Field>
          </div>
          <Field label="bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="keeping it lowkey"
              className="lowkey w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 outline-none"
            />
          </Field>
          <Field label="avatar colour">
            <div className="flex flex-wrap gap-2">
              {hues.map((h) => (
                <button
                  key={h}
                  onClick={() => setAvatarHue(h)}
                  aria-label={`avatar colour ${h}`}
                  style={{ background: `hsl(${h} 80% 60%)` }}
                  className={`size-9 rounded-full ${
                    avatarHue === h ? "ring-2 ring-foreground ring-offset-2" : ""
                  }`}
                />
              ))}
            </div>
          </Field>
          <Nav onNext={() => void saveIdentity()} busy={busy} />
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <p className="lowkey text-sm text-muted-foreground">
            pick up to 6 — this shapes your feed. nothing here is public unless you want it to be.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={`lowkey rounded-full px-3.5 py-2 text-sm font-semibold ${
                  interests.includes(i)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <Field label="your vibe">
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className={`lowkey rounded-full px-3.5 py-2 text-sm font-semibold ${
                    vibe === v
                      ? "bg-foreground text-background"
                      : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>
          <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} busy={busy} />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <Field label="feed pace">
            <div className="flex flex-col gap-2">
              {paces.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setContentPace(p.id)}
                  className={`lowkey rounded-2xl border px-4 py-3 text-left ${
                    contentPace === p.id ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <span className="block text-sm font-bold">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.note}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="daily limit">
            <div className="flex flex-wrap gap-2">
              {limitOptions.map((l) => (
                <button
                  key={l}
                  onClick={() => setDailyLimitMinutes(l)}
                  className={`lowkey rounded-full px-3 py-1.5 text-xs font-semibold ${
                    dailyLimitMinutes === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {l} min
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={() => setQuietHours((q) => !q)}
            className="lowkey flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-bold">quiet hours</span>
              <span className="block text-xs text-muted-foreground">
                no nudges between 22:00 and 07:00
              </span>
            </span>
            <span
              className={`lowkey rounded-full px-3 py-1 text-xs font-bold ${
                quietHours ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {quietHours ? "on" : "off"}
            </span>
          </button>

          <Nav onBack={() => setStep(1)} onNext={() => void savePrefs()} busy={busy} />
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-border bg-card p-4">
            <p className="lowkey flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="size-4 text-primary" /> last bit: your age band
            </p>
            <p className="lowkey mt-2 text-sm text-muted-foreground">
              lowkey is split hard: under 18 only ever see under 18, adults only ever see adults. no
              typing a birthday — you either do the free on-device face check or an eu eid. the age
              check runs in your browser and uploads nothing.
            </p>
          </div>

          <label className="lowkey flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 size-4"
            />
            <span>
              i&apos;m ok with the privacy notice: data stored in the eu, exportable and deletable
              any time, no biometric data leaves my device.
            </span>
          </label>

          <Nav
            onBack={() => setStep(2)}
            onNext={() => void goVerify()}
            busy={busy}
            nextLabel="go to age check"
          />
          <p className="lowkey text-xs text-muted-foreground">
            beta — tell me what breaks: <FeedbackLink />
          </p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="lowkey text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  busy,
  nextLabel = "next",
}: {
  onBack?: () => void;
  onNext: () => void;
  busy: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="lowkey flex items-center gap-1 rounded-full border border-border px-4 py-3 text-sm font-semibold"
        >
          <ArrowLeft className="size-4" /> back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={busy}
        className="lowkey flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "saving…" : nextLabel} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
