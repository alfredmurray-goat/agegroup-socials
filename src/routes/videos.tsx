import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Heart, MessageSquare, Send } from "lucide-react";
import { BadgeCheck } from "lucide-react";
import { AppScreen, Poster } from "@/components/lowkey/shell";
import { useBandPosts, useLowkey } from "@/lib/lowkey/store";

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

function VideosPage() {
  const videos = useBandPosts("video");
  const { state, me, toggleLike, toggleFollow, toggleBookmark } = useLowkey();

  return (
    <AppScreen>
      <h1 className="sr-only">lowkey videos</h1>
      <div className="snap-y snap-mandatory">
        {videos.length === 0 && (
          <p className="lowkey p-8 text-center text-sm text-muted-foreground">
            no videos in your band yet. record one.
          </p>
        )}
        {videos.map((v) => {
          const author = state.profiles.find((p) => p.id === v.authorId)!;
          const likes = state.likes.filter((l) => l.postId === v.id);
          const liked = likes.some((l) => l.profileId === me?.id);
          const comments = state.comments.filter((c) => c.postId === v.id).length;
          const following = state.follows.some(
            (f) => f.followerId === me?.id && f.followingId === author.id,
          );
          return (
            <section key={v.id} className="relative snap-start px-3 py-3">
              {v.mediaUrl ? (
                <video
                  src={v.mediaUrl}
                  className="aspect-[9/16] w-full rounded-2xl object-cover"
                  controls
                  playsInline
                />
              ) : (
                <Poster hue={v.posterHue} caption={v.caption} aspect="tall" />
              )}

              <div className="absolute top-8 right-6 flex flex-col items-center gap-5">
                <button
                  onClick={() => void toggleLike(v.id)}
                  aria-label="like"
                  className="flex flex-col items-center text-foreground/70"
                >
                  <Heart className={liked ? "size-7 fill-primary text-primary" : "size-7"} />
                  <span className="text-[10px] font-bold">{likes.length}</span>
                </button>
                <span className="flex flex-col items-center text-foreground/70">
                  <MessageSquare className="size-7" />
                  <span className="text-[10px] font-bold">{comments}</span>
                </span>
                <span className="text-foreground/70">
                  <Send className="size-7" />
                </span>
                <button
                  onClick={() => void toggleBookmark(v.id)}
                  aria-label="save video"
                  className="text-foreground/70"
                >
                  <Bookmark
                    className={
                      state.bookmarks.includes(v.id)
                        ? "size-7 fill-primary text-primary"
                        : "size-7"
                    }
                  />
                </button>
              </div>

              <div className="absolute bottom-7 left-6 right-6">
                <div className="flex items-center gap-2">
                  <Link
                    {...(author.id === me?.id
                      ? { to: "/profile" as const }
                      : { to: "/u/$handle" as const, params: { handle: author.handle } })}
                    className="lowkey flex items-center gap-1 text-sm font-bold"
                  >
                    @{author.handle}
                    <BadgeCheck className="size-4 text-primary" />
                  </Link>
                  {author.id !== me?.id && (
                    <button
                      onClick={() => void toggleFollow(author.id)}
                      className={`lowkey rounded-full px-3 py-1 text-[11px] font-bold ${
                        following
                          ? "bg-card text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {following ? "following" : "follow"}
                    </button>
                  )}
                </div>
                <p className="lowkey mt-1 text-xs text-foreground/70">{v.caption}</p>
              </div>
            </section>
          );
        })}
      </div>
    </AppScreen>
  );
}
