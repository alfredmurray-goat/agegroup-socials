import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageSquare, Send, Bookmark } from "lucide-react";
import { useState } from "react";
import { AppScreen, Avatar, Poster } from "@/components/lowkey/shell";
import { useBandPosts, useLowkey } from "@/lib/lowkey/store";
import type { Post } from "@/lib/lowkey/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "fyp — lowkey social" },
      {
        name: "description",
        content:
          "your lowkey feed: posts from people in your own age band only. no caps, no grammar, chill.",
      },
      { property: "og:title", content: "fyp — lowkey social" },
      { property: "og:description", content: "posts from people in your own age band only." },
    ],
  }),
  component: FeedPage,
});

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

function FeedCard({ post }: { post: Post }) {
  const { state, me, toggleLike, addComment } = useLowkey();
  const author = state.profiles.find((p) => p.id === post.authorId);
  const likes = state.likes.filter((l) => l.postId === post.id);
  const liked = likes.some((l) => l.profileId === me?.id);
  const comments = state.comments.filter((c) => c.postId === post.id);
  const [openComments, setOpenComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  if (!author) return null;

  return (
    <article className="border-b border-border px-4 py-4">
      <div className="flex items-center gap-2">
        <Avatar hue={author.avatarHue} label={author.displayName} size={36} />
        <div className="min-w-0">
          <p className="lowkey truncate text-sm font-semibold">@{author.handle}</p>
          <p className="lowkey text-xs text-muted-foreground">
            {post.caption}
            {post.taggedHandle ? ` @${post.taggedHandle}` : ""} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            onClick={() => toggleLike(post.id)}
            aria-label="like"
            className="flex flex-col items-center text-muted-foreground"
          >
            <Heart className={liked ? "size-6 fill-primary text-primary" : "size-6"} />
            <span className="text-[10px] font-semibold">{likes.length}</span>
          </button>
          <button
            onClick={() => setOpenComments((v) => !v)}
            aria-label="comments"
            className="flex flex-col items-center text-muted-foreground"
          >
            <MessageSquare className="size-6" />
            <span className="text-[10px] font-semibold">{comments.length}</span>
          </button>
          <Link to="/chats" aria-label="share" className="text-muted-foreground">
            <Send className="size-6" />
          </Link>
          <button
            onClick={() => setSaved((v) => !v)}
            aria-label="save"
            className="text-muted-foreground"
          >
            <Bookmark className={saved ? "size-6 fill-primary text-primary" : "size-6"} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <Poster hue={post.posterHue} caption={post.caption} mediaUrl={post.mediaUrl} />
        </div>
      </div>

      {openComments && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-muted p-3">
          {comments.length === 0 && (
            <p className="lowkey text-xs text-muted-foreground">no comments yet, go first</p>
          )}
          {comments.map((c) => {
            const ca = state.profiles.find((p) => p.id === c.authorId);
            return (
              <p key={c.id} className="lowkey text-xs">
                <span className="font-semibold">@{ca?.handle}</span> {c.body}
              </p>
            );
          })}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addComment(post.id, draft);
              setDraft("");
            }}
            className="flex gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={200}
              placeholder="say something"
              className="lowkey flex-1 rounded-full bg-background px-3 py-2 text-xs outline-none"
            />
            <button className="lowkey rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
              send
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function FeedPage() {
  const posts = useBandPosts();

  return (
    <AppScreen>
      <h1 className="sr-only">lowkey social feed</h1>
      {posts.length === 0 ? (
        <p className="lowkey p-8 text-center text-sm text-muted-foreground">
          nothing in your feed yet. make the first post.
        </p>
      ) : (
        posts.map((p) => <FeedCard key={p.id} post={p} />)
      )}
    </AppScreen>
  );
}
