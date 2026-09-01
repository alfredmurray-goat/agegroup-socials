import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Camera, Bookmark, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { AppScreen, Avatar, Poster, bandLabel } from "@/components/lowkey/shell";
import { toast } from "sonner";
import { useLowkey, useTodayUsage } from "@/lib/lowkey/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "profile — lowkey social" },
      {
        name: "description",
        content: "your lowkey profile: posts, videos, followers and your verified age band.",
      },
      { property: "og:title", content: "profile — lowkey social" },
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

  return (
    <AppScreen>
      <div className="flex justify-end gap-2 px-4 pt-3">
        <Link
          to="/saved"
          className="lowkey flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          <Bookmark className="size-3.5" /> saved
        </Link>
        <Link
          to="/settings"
          aria-label="settings"
          className="lowkey flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          <Settings className="size-3.5" /> settings
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 px-4 pt-2 pb-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative rounded-full"
          aria-label="change profile picture"
        >
          <Avatar hue={me.avatarHue} label={me.displayName} src={me.avatarUrl} size={80} />
          <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Camera className="size-4" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => void pickAvatar(e.target.files?.[0])}
        />
        {uploading && (
          <p className="lowkey text-xs text-muted-foreground">uploading your picture...</p>
        )}
<h1 className="lowkey flex items-center gap-2 text-lg font-bold">
          {me.displayName}
          {me.verificationStatus === "verified" && (
            <span className="lowkey rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
              age verified
            </span>
          )}
        </h1>
        <p className="lowkey text-xs text-muted-foreground">@{me.handle}</p>
        {editingStatus ? (
          <div className="flex w-full max-w-xs items-center gap-2">
            <input
              autoFocus
              value={statusDraft}
              maxLength={60}
              onChange={(e) => setStatusDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void updateProfile({ status: statusDraft.trim() || null });
                  setEditingStatus(false);
                }
              }}
              placeholder="what are you doing right now?"
              className="lowkey min-h-11 flex-1 rounded-full border border-input bg-background px-3 text-sm outline-none"
            />
            <button
              onClick={() => {
                void updateProfile({ status: statusDraft.trim() || null });
                setEditingStatus(false);
              }}
              className="lowkey rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              save
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setStatusDraft(me.status ?? "");
              setEditingStatus(true);
            }}
            className="lowkey flex min-h-11 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground"
          >
            <Pencil className="size-3" />
            {me.status || "set a status"}
          </button>
        )}
        {me.bio && <p className="lowkey text-center text-sm text-muted-foreground">{me.bio}</p>}
        <p className="lowkey text-sm">
          <span className="font-bold">{followers}</span> followers{" "}
          <span className="ml-2 font-bold">{following}</span> following
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <span className="lowkey rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold">
            band: {me.ageBand ? bandLabel(me.ageBand) : "unverified"}
          </span>
          <span className="lowkey rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {usage.minutes}/{usage.limit} min today
          </span>
        </div>
      </div>

      <div className="flex border-y border-border">
        {(["post", "video"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`lowkey flex-1 py-3 text-sm font-semibold ${
              tab === t ? "border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            {t === "post" ? "posts" : "videos"}
          </button>
        ))}
      </div>

      {mine.length === 0 ? (
        <p className="lowkey p-8 text-center text-sm text-muted-foreground">
          nothing here yet. hit create.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1">
          {mine.map((p) => (
            <Poster key={p.id} hue={p.posterHue} caption="" mediaUrl={p.mediaUrl} />
          ))}
        </div>
      )}
    </AppScreen>
  );
}
