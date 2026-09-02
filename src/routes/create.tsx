import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2, Trash2, Type, X } from "lucide-react";
import { toast } from "sonner";
import { AppScreen, Avatar, Poster } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";
import type { PostKind } from "@/lib/lowkey/types";
import { INTERESTS } from "@/lib/lowkey/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "create — lowkey social" },
      {
        name: "description",
        content: "post a photo, a video or just text to your own age band on lowkey social.",
      },
      { property: "og:title", content: "create — lowkey social" },
      { property: "og:description", content: "photo, video or plain text — post it to your band." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { createPost, uploadMedia, me } = useLowkey();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<PostKind | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [posting, setPosting] = useState(false);

  const kind: PostKind = mediaKind ?? "post";

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video") || /\.(mp4|mov|m4v|webm)$/i.test(file.name);
    // some phones hand over an empty mime type for heic photos, so trust the name too
    const isImage =
      file.type.startsWith("image") ||
      /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name) ||
      (!isVideo && file.type === "");
    if (!isVideo && !isImage) {
      toast.error("images and videos only");
      return;
    }
    if (file.size > 200_000_000) {
      toast.error("keep it under 200mb");
      return;
    }
    setUploading(true);
    setProgress(0);
    const uploaded = await uploadMedia(file, setProgress);
    setUploading(false);
    if (!uploaded) {
      toast.error("upload failed, try again");
      return;
    }
    // the type comes from the file itself — never from a toggle, so a photo can
    // never end up saved as a broken "video"
    setMediaKind(isVideo ? "video" : "post");
    setMediaPath(uploaded.path);
    setMediaUrl(uploaded.url);
  };

  const clearMedia = () => {
    setMediaKind(null);
    setMediaPath(null);
    setMediaUrl(null);
  };

  const submit = async () => {
    if (!caption.trim() && !mediaPath) {
      toast.error("add a caption or some media");
      return;
    }
    setPosting(true);
const id = await createPost({
      kind,
      title: title.trim() || null,
      caption: caption.trim() || "no caption",
      mediaUrl: mediaPath,
      topic,
    });
    setPosting(false);
    if (!id) {
      toast.error("couldn't post — verify your age first");
      return;
    }
    toast.success("posted");
    void navigate({ to: kind === "video" ? "/videos" : "/" });
  };

  return (
    <AppScreen title="create">
      <div className="flex flex-col gap-5 px-4 py-5">
        <header>
          <h1 className="lowkey text-2xl font-extrabold">create</h1>
          <p className="lowkey mt-1 text-xs text-muted-foreground">
            goes out to your band only ({me?.ageBand === "under_18" ? "under 18" : "18+"})
          </p>
        </header>

        {/* what you're posting, decided by what you attach */}
        <div className="flex items-center gap-2">
          {[
            { k: "text", label: "text", icon: Type, active: !mediaKind },
            { k: "photo", label: "photo", icon: ImagePlus, active: mediaKind === "post" },
            { k: "video", label: "video", icon: Film, active: mediaKind === "video" },
          ].map(({ k, label, icon: Icon, active }) => (
            <span
              key={k}
              className={`lowkey flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {label}
            </span>
          ))}
        </div>

        {/* media */}
        {mediaUrl ? (
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            {mediaKind === "video" ? (
              <video src={mediaUrl} className="max-h-80 w-full object-contain" controls playsInline />
            ) : (
              <img src={mediaUrl} alt="your upload" className="max-h-80 w-full object-contain" />
            )}
            <button
              onClick={clearMedia}
              aria-label="remove media"
              className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card px-6 py-12"
          >
            {uploading ? (
              <>
                <Loader2 className="size-7 animate-spin text-muted-foreground" />
                <span className="lowkey text-sm font-semibold">uploading {progress}%</span>
                <span className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(progress, 4)}%` }}
                  />
                </span>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <ImagePlus className="size-7 text-muted-foreground" />
                  <Film className="size-7 text-muted-foreground" />
                </div>
                <span className="lowkey text-sm font-semibold">add a photo or video</span>
                <span className="lowkey text-xs text-muted-foreground">
                  optional · stored privately in the eu, only your band can see it
                </span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,.heic,.heif"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />

{/* title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="a little title (optional)"
          className="lowkey rounded-3xl border border-border bg-card px-4 py-3.5 text-sm font-bold outline-none placeholder:font-normal"
        />

        {/* caption */}
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex gap-3">
            <Avatar
              hue={me?.avatarHue ?? 60}
              label={me?.displayName ?? "me"}
              src={me?.avatarUrl ?? null}
              size={34}
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="say it lowkey. no caps, no grammar, no pressure"
              className="lowkey min-w-0 flex-1 resize-none bg-transparent text-sm outline-none"
            />
          </div>
          <p className="lowkey mt-2 text-right text-[11px] text-muted-foreground">
            {caption.length}/280
          </p>
        </div>

        {/* topic */}
        <div>
          <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">
            topic {topic && <span className="text-foreground">· {topic}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.slice(0, 12).map((t) => (
              <button
                key={t}
                onClick={() => setTopic(topic === t ? null : t)}
                className={`lowkey rounded-full px-3 py-1.5 text-xs font-semibold ${
                  topic === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
            {topic && (
              <button
                onClick={() => setTopic(null)}
                aria-label="clear topic"
                className="lowkey flex items-center gap-1 rounded-full border border-input px-3 py-1.5 text-xs font-semibold"
              >
                <X className="size-3" /> clear
              </button>
            )}
          </div>
        </div>

        {/* text-only preview */}
        {!mediaUrl && caption.trim() && (
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">preview</p>
            <Poster hue={92} caption={caption.toLowerCase()} />
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={posting || uploading}
          className="lowkey rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {posting ? "posting..." : kind === "video" ? "post video" : "post it"}
        </button>
      </div>
    </AppScreen>
  );
}
