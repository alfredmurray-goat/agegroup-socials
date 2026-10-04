import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Camera, Bookmark, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { AppScreen, Avatar, Poster, bandLabel } from "@/components/lowkey/shell";
import { toast } from "sonner";
import { useLowkey, useTodayUsage } from "@/lib/lowkey/store";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "profile — lowkey_social" },
      {
        name: "description",
        content: "your lowkey profile: posts, videos, followers and your verified age band.",
      },
      { property: "og:title", content: "profile — lowkey_social" },
      { property: "og:description", content: "your posts, videos and verified age band." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
const { state, me, uploadAvatar, updateProfile } = useLowkey();
  const usage = useTodayUsage();
  const [tab, setTab] = useState<"post" | "video">("post");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50_000_000) {
      toast.error("keep it under 50mb");
      return;
    }
    setUploading(true);
    const res = await uploadAvatar(file);
    setUploading(false);
    toast[res.ok ? "success" : "error"](res.ok ? "new profile pic" : (res.error ?? "upload failed"));
  };

  if (!me) return <AppScreen>{null}</AppScreen>;

  const mine = state.posts.filter((p) => p.authorId === me.id && p.kind === tab);
  const followers = state.follows.filter((f) => f.followingId === me.id).length;
  const following = state.follows.filter((f) => f.followerId === me.id).length;

  const saveStatus = async () => {
    const res = await updateProfile({ status: statusDraft.trim() || null });
    setEditingStatus(false);
    toast[res.ok ? "success" : "error"](res.ok ? "status saved" : res.error ?? "save failed");
  };
  const postCount = state.posts.filter((p) => p.authorId === me.id).length;
  const pct = Math.min(100, Math.round((usage.minutes / Math.max(1, usage.limit)) * 100));

  return (
    <AppScreen>
      <div className="relative">
        <div className="h-28 bg-gradient-to-br from-primary/60 via-primary-soft to-background" />
        <div className="absolute top-3 right-4 flex gap-2">
          <Link to="/app/saved" aria-label="saved" className="flex size-10 items-center justify-center rounded-full bg-background/85 backdrop-blur">
            <Bookmark className="size-4" />
          </Link>
          <Link to="/app/settings" aria-label="settings" className="flex size-10 items-center justify-center rounded-full bg-background/85 backdrop-blur">
            <Settings className="size-4" />
          </Link>
        </div>
      </div>

      <div className="-mt-12 px-4">
        <div className="flex items-end justify-between">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative rounded-full ring-4 ring-background"
            aria-label="change profile picture"
          >
            <Avatar hue={me.avatarHue} label={me.displayName} src={me.avatarUrl} size={96} />
            <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
              <Camera className="size-4" />
            </span>
          </button>
          <Link to="/app/settings" className="lowkey mb-1 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold">
            edit profile
          </Link>
        </div>
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => void pickAvatar(e.target.files?.[0])} />
        {uploading && <p className="lowkey mt-2 text-xs text-muted-foreground">uploading your picture...</p>}

        <h1 className="lowkey mt-3 font-display text-2xl font-bold">{me.displayName}</h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="lowkey">@{me.handle}</span>
          {me.pronouns && <span className="lowkey">· {me.pronouns}</span>}
          {me.city && <span className="lowkey">· {me.city}</span>}
        </div>
        {me.bio && <p className="lowkey mt-2 text-sm">{me.bio}</p>}

        {editingStatus ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              autoFocus
              value={statusDraft}
              maxLength={60}
              onChange={(e) => setStatusDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void saveStatus(); }}
              placeholder="what are you doing right now?"
              className="lowkey min-h-11 flex-1 rounded-full border border-input bg-background px-4 text-base outline-none"
            />
            <button onClick={() => void saveStatus()} className="lowkey rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">save</button>
          </div>
        ) : (
          <button
            onClick={() => { setStatusDraft(me.status ?? ""); setEditingStatus(true); }}
            className="lowkey mt-3 flex min-h-11 w-full items-center gap-2 rounded-2xl border border-dashed border-border px-4 text-left text-sm text-muted-foreground"
          >
            <Pencil className="size-3.5 shrink-0" />
            <span className="truncate">{me.status || "set a status — what are you up to?"}</span>
          </button>
        )}

        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card py-3 text-center">
          {[["posts", postCount], ["followers", followers], ["following", following]].map(([l, n]) => (
            <div key={l as string}>
              <p className="font-display text-lg font-bold">{n}</p>
              <p className="lowkey text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-2xl bg-primary-soft p-3">
            <p className="lowkey text-[11px] text-muted-foreground">your band</p>
            <p className="lowkey text-sm font-bold">{me.ageBand ? bandLabel(me.ageBand) : "unverified"}{me.verificationStatus === "verified" ? " ✓" : ""}</p>
          </div>
          <div className="flex-1 rounded-2xl bg-muted p-3">
            <p className="lowkey text-[11px] text-muted-foreground">today</p>
            <p className="lowkey text-sm font-bold">{usage.minutes}/{usage.limit} min</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        {me.interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {me.interests.map((i) => (
              <span key={i} className="lowkey rounded-full border border-border px-2.5 py-1 text-xs">{i}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mx-4 mt-5 flex rounded-full bg-muted p-1">
        {(["post", "video"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`lowkey flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === t ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "post" ? "posts" : "videos"}
          </button>
        ))}
      </div>

      {mine.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="lowkey text-sm text-muted-foreground">nothing here yet.</p>
          <Link to="/app/create" className="lowkey rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">make something</Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-3">
          {mine.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl">
              <Poster hue={p.posterHue} caption="" mediaUrl={p.mediaUrl} />
            </div>
          ))}
        </div>
      )}
    </AppScreen>
  );
}
