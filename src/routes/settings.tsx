import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ShieldCheck,
  LogOut,
  Download,
  Trash2,
  Lock,
  Instagram,
  User,
  Bell,
  Palette,
  KeyRound,
  Ban,
  Loader2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { AppScreen, bandLabel, BetaTag, FeedbackLink } from "@/components/lowkey/shell";
import { useLowkey, useTodayUsage } from "@/lib/lowkey/store";
import {
  INTERESTS,
  VIBES,
  type Audience,
  type ThemePref,
  type TextScale,
} from "@/lib/lowkey/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "settings — lowkey social" },
      {
        name: "description",
        content:
          "profile, privacy, notifications, security and instagram import. set your daily limit, export or delete all your data.",
      },
      { property: "og:title", content: "settings — lowkey social" },
      {
        property: "og:description",
        content: "profile, privacy, notifications, instagram import, gdpr export and delete.",
      },
    ],
  }),
  component: SettingsPage,
});

const limits = [15, 30, 45, 60, 90, 120];
const audiences: Audience[] = ["everyone", "followers", "nobody"];
const themes: ThemePref[] = ["system", "light", "dark"];
const textScales: TextScale[] = ["normal", "large", "larger", "largest"];
const paces = ["slow", "balanced", "fast"];

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <p className="lowkey flex items-center gap-2 text-sm font-bold">
        {icon} {title}
      </p>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="lowkey text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "lowkey rounded-2xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="lowkey block text-sm font-semibold">{label}</span>
        {hint && <span className="lowkey block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          value ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function Chips<T extends string>({
  options,
  value,
  onPick,
}: {
  options: readonly T[];
  value: T | null;
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={`lowkey rounded-full px-3 py-1.5 text-xs font-semibold ${
            value === o ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SettingsPage() {
  const {
    state,
    me,
    setDailyLimit,
    signOut,
    exportMyData,
    deleteMyAccount,
    updateProfile,
    toggleBlock,
    changeEmail,
    changePassword,
    signOutEverywhere,
    importFromInstagram,
  } = useLowkey();
  const usage = useTodayUsage();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState(me?.displayName ?? "");
  const [handle, setHandle] = useState(me?.handle ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [pronouns, setPronouns] = useState(me?.pronouns ?? "");
  const [city, setCity] = useState(me?.city ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const igRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState<{ done: number; total: number } | null>(null);

  if (!me) return <AppScreen>{null}</AppScreen>;

  const save = async (patch: Parameters<typeof updateProfile>[0], msg = "saved") => {
    const res = await updateProfile(patch);
    toast[res.ok ? "success" : "error"](res.ok ? msg : (res.error ?? "couldn't save that"));
  };

  const toggleInterest = (tag: string) => {
    const next = me.interests.includes(tag)
      ? me.interests.filter((i) => i !== tag)
      : [...me.interests, tag];
    void save({ interests: next }, "interests updated");
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting({ done: 0, total: 0 });
    const res = await importFromInstagram(file, (p) => setImporting(p));
    setImporting(null);
    toast[res.ok ? "success" : "error"](
      res.ok ? `imported ${res.imported} posts from instagram` : (res.error ?? "import failed"),
    );
  };

  const doExport = async () => {
    setBusy(true);
    const data = await exportMyData();
    setBusy(false);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lowkey-social-${me.handle}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("downloaded your data");
  };

  const doDelete = async () => {
    setBusy(true);
    const res = await deleteMyAccount();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "couldn't delete that");
      return;
    }
    void navigate({ to: "/auth", replace: true });
  };

  const blocked = state.blocks
    .map((id) => state.profiles.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <AppScreen title="settings">
      <div className="flex flex-col gap-5 px-4 py-5">
        <div className="flex items-center gap-2">
          <h1 className="lowkey text-xl font-bold">settings</h1>
          <BetaTag />
        </div>

        {/* profile */}
        <Section icon={<User className="size-4 text-primary" />} title="profile">
          <Field label="display name">
            <input
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
          <Field label="handle">
            <input
              className={inputCls}
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
            />
          </Field>
          <Field label="bio">
            <textarea
              className={inputCls}
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="pronouns">
              <input
                className={inputCls}
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
              />
            </Field>
            <Field label="city">
              <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
          </div>
          <button
            onClick={() =>
              void save(
                {
                  displayName: displayName.trim() || me.displayName,
                  handle: handle.trim() || me.handle,
                  bio: bio.trim(),
                  pronouns: pronouns.trim() || null,
                  city: city.trim() || null,
                },
                "profile saved",
              )
            }
            className="lowkey rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            save profile
          </button>
          <div>
            <p className="lowkey text-xs font-semibold text-muted-foreground">interests</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`lowkey rounded-full px-3 py-1.5 text-xs font-semibold ${
                    me.interests.includes(tag)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">vibe</p>
            <Chips
              options={VIBES}
              value={(me.vibe as (typeof VIBES)[number] | null) ?? null}
              onPick={(v) => void save({ vibe: v }, "vibe updated")}
            />
          </div>
        </Section>

        {/* appearance */}
        <Section icon={<Palette className="size-4 text-primary" />} title="appearance">
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">theme</p>
            <Chips
              options={themes}
              value={me.theme}
              onPick={(t) => void save({ theme: t }, "theme updated")}
            />
          </div>
          <Toggle
            label="reduce motion"
            hint="turns off animations and smooth scrolling"
            value={me.reduceMotion}
            onChange={(v) => void save({ reduceMotion: v }, "motion updated")}
          />
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">avatar colour</p>
            <input
              type="range"
              min={0}
              max={359}
              defaultValue={me.avatarHue}
              onMouseUp={(e) =>
                void save({ avatarHue: Number((e.target as HTMLInputElement).value) }, "colour set")
              }
              onTouchEnd={(e) =>
                void save({ avatarHue: Number((e.target as HTMLInputElement).value) }, "colour set")
              }
              className="w-full"
            />
          </div>
        </Section>

        {/* accessibility — low vision */}
        <Section icon={<Eye className="size-4 text-primary" />} title="accessibility">
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">text size</p>
            <Chips
              options={textScales}
              value={me.textScale}
              onPick={(t) => void save({ textScale: t }, "text size updated")}
            />
            <p className="lowkey mt-2 text-xs text-muted-foreground">
              scales every bit of text, buttons and spacing in the app. your phone or browser text
              size works too.
            </p>
          </div>
          <Toggle
            label="high contrast"
            hint="stronger black-on-white text, visible borders, underlined links"
            value={me.highContrast}
            onChange={(v) => void save({ highContrast: v }, "contrast updated")}
          />
          <Toggle
            label="bolder text"
            hint="thicker letters, easier to pick out"
            value={me.boldText}
            onChange={(v) => void save({ boldText: v }, "text weight updated")}
          />
          <p className="lowkey text-xs text-muted-foreground">
            lowkey also follows your device's reduce-motion setting, works with screen readers and
            can be zoomed to 200% without breaking. missing something you need?{" "}
            <FeedbackLink />
          </p>
        </Section>

        {/* instagram import */}
        <Section icon={<Instagram className="size-4 text-primary" />} title="import from instagram">
          <p className="lowkey text-sm text-muted-foreground">
            request your data in the instagram app (settings → accounts centre → your information →
            download your information, format json), then upload the zip here. your real posts,
            captions and media get imported into your lowkey profile. nothing is sent to meta.
          </p>
          <input
            ref={igRef}
            type="file"
            accept=".zip,.json,application/zip,application/json"
            className="hidden"
            onChange={(e) => void doImport(e.target.files?.[0])}
          />
          <button
            onClick={() => igRef.current?.click()}
            disabled={Boolean(importing)}
            className="lowkey flex items-center justify-center gap-2 rounded-2xl border border-input py-3 text-sm font-semibold disabled:opacity-60"
          >
            {importing ? (
              <>
                <Loader2 className="size-4 animate-spin" /> importing {importing.done}/
                {importing.total || "?"}
              </>
            ) : (
              <>
                <Instagram className="size-4" /> upload instagram export
              </>
            )}
          </button>
        </Section>

        {/* privacy & safety */}
        <Section icon={<Lock className="size-4 text-primary" />} title="privacy & safety">
          <Toggle
            label="private account"
            hint="only people you approve see your posts in future updates"
            value={me.isPrivate}
            onChange={(v) => void save({ isPrivate: v }, "privacy updated")}
          />
          <Toggle
            label="hide me from search"
            hint="your handle won't show up in the search tab"
            value={me.hideFromSearch}
            onChange={(v) => void save({ hideFromSearch: v }, "search visibility updated")}
          />
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">
              who can message me
            </p>
            <Chips
              options={audiences}
              value={me.allowDms}
              onPick={(v) => void save({ allowDms: v }, "dm setting updated")}
            />
          </div>
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">
              who can comment
            </p>
            <Chips
              options={audiences}
              value={me.allowComments}
              onPick={(v) => void save({ allowComments: v }, "comment setting updated")}
            />
          </div>
          <div>
            <p className="lowkey mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Ban className="size-3.5" /> blocked ({blocked.length})
            </p>
            {blocked.length === 0 ? (
              <p className="lowkey text-xs text-muted-foreground">nobody blocked.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {blocked.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="lowkey text-sm">@{p.handle}</span>
                    <button
                      onClick={() => void toggleBlock(p.id)}
                      className="lowkey rounded-full bg-muted px-3 py-1 text-xs font-semibold"
                    >
                      unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* wellbeing */}
        <Section icon={<Bell className="size-4 text-primary" />} title="notifications & wellbeing">
          <Toggle
            label="quiet hours"
            hint="mutes notification toasts late at night"
            value={me.quietHours}
            onChange={(v) => void save({ quietHours: v }, "quiet hours updated")}
          />
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">content pace</p>
            <Chips
              options={paces}
              value={me.contentPace}
              onPick={(v) => void save({ contentPace: v }, "pace updated")}
            />
          </div>
          <div>
            <p className="lowkey text-xs font-semibold text-muted-foreground">
              daily limit — {usage.minutes} of {usage.limit} minutes used today
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {limits.map((l) => (
                <button
                  key={l}
                  onClick={() => void setDailyLimit(l)}
                  className={`lowkey rounded-full px-3 py-1.5 text-xs font-semibold ${
                    me.dailyLimitMinutes === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {l} min
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* age band */}
        <Section icon={<ShieldCheck className="size-4 text-primary" />} title="age band">
          <p className="lowkey text-sm text-muted-foreground">
            verified {me.ageBand ? bandLabel(me.ageBand) : "not yet"}
            {me.verifiedProvider ? ` via ${me.verifiedProvider.replace("_", " ")}` : ""}. bands
            can&apos;t be changed — you only ever see profiles, posts and chats in your own band, and
            that split is enforced in the database.
          </p>
        </Section>

        {/* account & security */}
        <Section icon={<KeyRound className="size-4 text-primary" />} title="account & security">
          <Field label="new email">
            <input
              className={inputCls}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <button
            onClick={async () => {
              if (!email.trim()) return;
              const res = await changeEmail(email);
              toast[res.ok ? "success" : "error"](
                res.ok ? "check your new inbox to confirm" : (res.error ?? "couldn't change email"),
              );
              if (res.ok) setEmail("");
            }}
            className="lowkey rounded-2xl border border-input py-3 text-sm font-semibold"
          >
            change email
          </button>
          <Field label="new password">
            <input
              className={inputCls}
              type="password"
              placeholder="at least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button
            onClick={async () => {
              const res = await changePassword(password);
              toast[res.ok ? "success" : "error"](
                res.ok ? "password changed" : (res.error ?? "couldn't change password"),
              );
              if (res.ok) setPassword("");
            }}
            className="lowkey rounded-2xl border border-input py-3 text-sm font-semibold"
          >
            change password
          </button>
          <button
            onClick={async () => {
              const res = await signOutEverywhere();
              if (res.ok) void navigate({ to: "/auth", replace: true });
              else toast.error(res.error ?? "couldn't sign out everywhere");
            }}
            className="lowkey rounded-2xl border border-input py-3 text-sm font-semibold"
          >
            sign out of all devices
          </button>
        </Section>

        {/* data */}
        <Section icon={<Lock className="size-4 text-primary" />} title="your data">
          <p className="lowkey text-sm text-muted-foreground">
            stored in the eu. the face age check runs on your device and uploads nothing. full
            details in the{" "}
            <Link to="/privacy" className="font-semibold underline underline-offset-2">
              privacy notice
            </Link>
            .
          </p>
          <button
            onClick={() => void doExport()}
            disabled={busy}
            className="lowkey flex items-center justify-center gap-2 rounded-2xl border border-input py-3 text-sm font-semibold disabled:opacity-60"
          >
            <Download className="size-4" /> export my data (json)
          </button>
          {confirmDelete ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3">
              <p className="lowkey text-xs text-muted-foreground">
                this erases your profile, posts, likes, comments, follows, chats, messages and
                usage. can&apos;t be undone.
              </p>
              <button
                onClick={() => void doDelete()}
                disabled={busy}
                className="lowkey rounded-2xl bg-destructive py-3 text-sm font-bold text-destructive-foreground disabled:opacity-60"
              >
                yes, delete everything
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="lowkey py-1 text-xs font-semibold text-muted-foreground"
              >
                keep my account
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="lowkey flex items-center justify-center gap-2 rounded-2xl border border-input py-3 text-sm font-semibold text-destructive"
            >
              <Trash2 className="size-4" /> delete my account
            </button>
          )}
        </Section>

        <button
          onClick={() => {
            void signOut();
            void navigate({ to: "/auth", replace: true });
          }}
          className="lowkey flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold"
        >
          <LogOut className="size-4" /> sign out
        </button>

        <p className="lowkey text-center text-xs text-muted-foreground">
          lowkey social beta — feedback: <FeedbackLink />
        </p>
      </div>
    </AppScreen>
  );
}
