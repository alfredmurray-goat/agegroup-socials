import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImagePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppScreen, Poster } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";
import type { PostKind } from "@/lib/lowkey/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "create — lowkey social" },
      {
        name: "description",
        content: "drop or upload an image or video, add a caption, post it to your age band.",
      },
      { property: "og:title", content: "create — lowkey social" },
      { property: "og:description", content: "drop or upload, caption it, post it." },
    ],
  }),
  component: CreatePage,
});

const filters = ["none", "warm", "cool", "faded", "punch"] as const;

function CreatePage() {
  const { createPost, uploadMedia } = useLowkey();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<PostKind>("post");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<(typeof filters)[number]>("none");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50_000_000) {
      toast.error("keep it under 50mb");
      return;
    }
    setKind(file.type.startsWith("video") ? "video" : "post");
    setBusy(true);
    const uploaded = await uploadMedia(file);
    setBusy(false);
    if (!uploaded) {
      toast.error("upload failed, try again");
      return;
    }
    setMediaPath(uploaded.path);
    setMediaUrl(uploaded.url);
  };

  const submit = async () => {
    if (!caption.trim() && !mediaPath) {
      toast.error("add a caption or some media");
      return;
    }
    setBusy(true);
    const id = await createPost({
      kind,
      caption: caption.trim() || "no caption",
      mediaUrl: mediaPath,
    });
    setBusy(false);
    if (!id) {
      toast.error("verify your age first");
      return;
    }
    toast.success("posted");
    void navigate({ to: kind === "video" ? "/videos" : "/" });
  };

  return (
    <AppScreen title="create">
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="lowkey text-xl font-bold">create</h1>
          <button
            onClick={() => setFilter(filters[(filters.indexOf(filter) + 1) % filters.length]!)}
            className="lowkey flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
          >
            <Sparkles className="size-3.5" /> filter: {filter}
          </button>
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card px-6 py-14"
        >
          {mediaUrl ? (
            kind === "video" ? (
              <video src={mediaUrl} className="max-h-64 rounded-2xl" muted playsInline />
            ) : (
              <img src={mediaUrl} alt="your upload" className="max-h-64 rounded-2xl" />
            )
          ) : (
            <>
              <ImagePlus className="size-8 text-muted-foreground" />
              <span className="lowkey text-sm font-semibold">drop or upload image/video</span>
              <span className="lowkey text-xs text-muted-foreground">
                {busy ? "uploading..." : "stored in the eu, only your band can see it"}
              </span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="text"
          className="lowkey w-full resize-none rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
        />

        <div className="flex gap-2">
          {(["post", "video"] as PostKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`lowkey flex-1 rounded-full py-2.5 text-sm font-semibold ${
                kind === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {!mediaUrl && caption.trim() && (
          <div>
            <p className="lowkey mb-2 text-xs font-semibold text-muted-foreground">preview</p>
            <Poster hue={92} caption={caption.toLowerCase()} />
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={busy}
          className="lowkey rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "working..." : "post it"}
        </button>
      </div>
    </AppScreen>
  );
}
