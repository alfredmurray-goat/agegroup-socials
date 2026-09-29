import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppScreen, Avatar, Poster } from "@/components/lowkey/shell";
import { Button } from "@/components/ui/button";
import { useLowkey } from "@/lib/lowkey/store";
import type { PostKind } from "@/lib/lowkey/types";
import { INTERESTS } from "@/lib/lowkey/types";

export const Route = createFileRoute("/app/create")({
  head: () => ({
    meta: [
      { title: "create — lowkey_social" },
      {
        name: "description",
        content: "post a photo, a video or just text to your own age band on lowkey_social.",
      },
      { property: "og:title", content: "create — lowkey_social" },
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
    void navigate({ to: kind === "video" ? "/app/videos" : "/app" });
  };

  return (
    <AppScreen title="create">
      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <header className="border-b border-border pb-5">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Sparkles className="size-4" />
            <span className="lowkey text-xs font-bold">new post</span>
          </div>
          <h1 className="lowkey mt-2 font-display text-3xl font-bold">share something</h1>
          <p className="lowkey mt-1 text-sm text-muted-foreground">
            only people in your {me?.ageBand === "under_18" ? "under 18" : "18+"} space can see it
          </p>
        </header>

        {/* media */}
        {mediaUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {mediaKind === "video" ? (
              <video src={mediaUrl} className="max-h-80 w-full object-contain" controls playsInline />
            ) : (
              <img src={mediaUrl} alt="your upload" className="max-h-80 w-full object-contain" />
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={clearMedia}
              aria-label="remove media"
              className="absolute top-3 right-3 rounded-full"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="group h-auto w-full flex-col gap-3 rounded-2xl border-dashed bg-card px-6 py-10 shadow-none"
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
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-foreground transition-transform group-active:scale-95">
                  <ImagePlus className="size-6" />
                </div>
                <span className="lowkey font-display text-base font-bold">add a photo or video</span>
                <span className="lowkey text-xs text-muted-foreground">
                  tap to choose from your device
                </span>
              </>
            )}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,.heic,.heif"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <label htmlFor="post-title" className="lowkey text-xs font-bold text-muted-foreground">title · optional</label>
          <input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder="give it a little title"
            className="lowkey mt-2 w-full border-b border-border bg-transparent pb-3 font-display text-lg font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />
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
              className="lowkey mt-3 min-w-0 flex-1 resize-none bg-transparent text-base leading-relaxed outline-none"
            />
          </div>
          <p className="lowkey mt-2 text-right text-xs text-muted-foreground">
            {caption.length}/280
          </p>
        </div>

        {/* topic */}
        <div>
          <p className="lowkey mb-2 text-xs font-bold text-muted-foreground">
            topic {topic && <span className="text-foreground">· {topic}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.slice(0, 12).map((t) => (
              <Button
                type="button"
                variant={topic === t ? "default" : "secondary"}
                size="sm"
                key={t}
                onClick={() => setTopic(topic === t ? null : t)}
                className="lowkey rounded-full shadow-none"
              >
                {t}
              </Button>
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

        <Button
          onClick={() => void submit()}
          disabled={posting || uploading}
          className="lowkey h-12 w-full rounded-full font-display text-base font-bold shadow-none active:scale-[0.99]"
        >
          {posting ? "posting..." : kind === "video" ? "post video" : "post it"}
        </Button>
      </div>
    </AppScreen>
  );
}
