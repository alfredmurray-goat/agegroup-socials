import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Heart, MessageSquare, Play, Send, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppScreen, Poster } from "@/components/lowkey/shell";
import { CommentsSheet } from "@/components/lowkey/comments";
import { useBandPosts, useLowkey } from "@/lib/lowkey/store";
import type { Post } from "@/lib/lowkey/types";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "videos — lowkey social" },
      {
        name: "description",
        content: "full-screen lowkey videos from creators in your own age band.",
      },
      { property: "og:title", content: "videos — lowkey social" },
      { property: "og:description", content: "full-screen videos from your age band." },
    ],
  }),
  component: VideosPage,
});

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|heic|heif)(\?|$)/i;

/** a "video" post whose file is actually an image can never play — treat it as a poster */
function playableVideo(post: Post) {
  return Boolean(post.mediaUrl && !IMAGE_EXT.test(post.mediaUrl));
}

function VideoCard({
  post,
  muted,
  onToggleMute,
  onComments,
}: {
  post: Post;
  muted: boolean;
  onToggleMute: () => void;
  onComments: () => void;
}) {
  const { state, me, toggleLike, toggleFollow, toggleBookmark } = useLowkey();
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const author = state.profiles.find((p) => p.id === post.authorId);
  const likes = state.likes.filter((l) => l.postId === post.id);
  const liked = likes.some((l) => l.profileId === me?.id);
  const comments = state.comments.filter((c) => c.postId === post.id).length;
  const following = state.follows.some(
    (f) => f.followerId === me?.id && f.followingId === author?.id,
  );
  const canPlay = playableVideo(post);

  // autoplay whatever is on screen, pause everything else
  useEffect(() => {
    const el = ref.current;
    if (!el || !canPlay) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canPlay]);

  if (!author) return null;

  const authorLink =
    author.id === me?.id
      ? { to: "/profile" as const }
      : { to: "/u/$handle" as const, params: { handle: author.handle } };

  return (
    <section className="relative h-[calc(100vh-9rem)] snap-start px-3 py-2">
      <div className="relative h-full overflow-hidden rounded-3xl bg-muted">
        {canPlay ? (
          <>
            <video
              ref={ref}
              src={post.mediaUrl ?? undefined}
              className="h-full w-full object-cover"
              playsInline
              loop
              muted={muted}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <button
              aria-label={playing ? "pause video" : "play video"}
              onClick={() => {
                const el = ref.current;
                if (!el) return;
                if (el.paused) void el.play().catch(() => undefined);
                else el.pause();
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {!playing && (
                <span className="flex size-16 items-center justify-center rounded-full bg-background/80">
                  <Play className="size-7" />
                </span>
              )}
            </button>
            <button
              onClick={onToggleMute}
              aria-label={muted ? "unmute" : "mute"}
              className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-background/80"
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          </>
        ) : (
          <Poster hue={post.posterHue} caption={post.caption} aspect="tall" />
        )}

        <div className="absolute top-4 right-4 flex flex-col items-center gap-5">
          <button
            onClick={() => void toggleLike(post.id)}
            aria-label="like"
            className="flex flex-col items-center text-foreground/80"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-background/70">
              <Heart className={liked ? "size-5 fill-primary text-primary" : "size-5"} />
            </span>
            <span className="text-xs font-bold">{likes.length}</span>
          </button>
          <button
            onClick={onComments}
            aria-label="comments"
            className="flex flex-col items-center text-foreground/80"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-background/70">
              <MessageSquare className="size-5" />
            </span>
            <span className="text-xs font-bold">{comments}</span>
          </button>
          <Link to="/chats" aria-label="share" className="text-foreground/80">
            <span className="flex size-11 items-center justify-center rounded-full bg-background/70">
              <Send className="size-5" />
            </span>
          </Link>
          <button
            onClick={() => void toggleBookmark(post.id)}
            aria-label="save video"
            className="text-foreground/80"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-background/70">
              <Bookmark
                className={
                  state.bookmarks.includes(post.id)
                    ? "size-5 fill-primary text-primary"
                    : "size-5"
                }
              />
            </span>
          </button>
        </div>

        <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-background/70 p-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Link {...authorLink} className="lowkey flex items-center gap-1 text-sm font-bold">
              @{author.handle}
              <BadgeCheck className="size-4 text-primary" />
            </Link>
            {author.id !== me?.id && (
              <button
                onClick={() => void toggleFollow(author.id)}
                className={`lowkey rounded-full px-3 py-1 text-[11px] font-bold ${
                  following ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                {following ? "following" : "follow"}
              </button>
            )}
          </div>
          {post.caption && <p className="lowkey mt-1 text-xs">{post.caption}</p>}
        </div>
      </div>
    </section>
  );
}

function VideosPage() {
  const videos = useBandPosts("video");
  const [muted, setMuted] = useState(true);
  const [openComments, setOpenComments] = useState<string | null>(null);

  return (
    <AppScreen>
      <h1 className="sr-only">lowkey videos</h1>
      <div className="h-[calc(100vh-9rem)] snap-y snap-mandatory overflow-y-auto">
        {videos.length === 0 && (
          <p className="lowkey p-8 text-center text-sm text-muted-foreground">
            no videos in your band yet. record one.
          </p>
        )}
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            post={v}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            onComments={() => setOpenComments(v.id)}
          />
        ))}
      </div>
      {openComments && (
        <CommentsSheet postId={openComments} onClose={() => setOpenComments(null)} />
      )}
    </AppScreen>
  );
}
