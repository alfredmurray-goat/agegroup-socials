import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag, Heart, MessageSquare, MoreHorizontal, Pencil, Send, Bookmark, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppScreen, Avatar, Poster } from "@/components/lowkey/shell";
import { CommentsSheet } from "@/components/lowkey/comments";
import { useBandPosts, useLowkey } from "@/lib/lowkey/store";
import type { Post } from "@/lib/lowkey/types";

const REPORT_REASONS = ["spam", "harassment", "nsfw", "underage", "hateful", "other"];

const SITE = "https://lowkeysocial.alfredmurray.com";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "lowkey social — age-verified feed, no caps, no pressure" },
      {
        name: "description",
        content:
          "lowkey social is a chill social app with a hard age split: under 18 only sees under 18, 18+ only sees 18+. free on-device age check, friend streaks and a daily time limit.",
      },
      { property: "og:title", content: "lowkey social — age-verified feed, no caps, no pressure" },
      {
        property: "og:description",
        content:
          "under 18 sees under 18, 18+ sees 18+. free on-device age check, friend streaks, daily limits.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE },
      { property: "og:image", content: `${SITE}/favicon.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE}/favicon.png` },
    ],
    links: [{ rel: "canonical", href: SITE }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "lowkey social",
              url: SITE,
              applicationCategory: "SocialNetworkingApplication",
              operatingSystem: "web",
              description:
                "a chill social app with an age-verified split feed: under 18 only sees under 18, adults only see adults.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
              featureList: [
                "age-verified split feed",
                "free on-device age estimate",
                "friend streaks",
                "daily time limit",
                "gdpr data export and deletion",
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "how does lowkey social split under 18 and adults?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "every account gets a verified age band. database security rules mean under-18 accounts can only read under-18 profiles, posts and chats, and 18+ accounts can only read 18+ ones.",
                  },
                },
                {
                  "@type": "Question",
                  name: "how is age verified, and is it free?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "yes, free. a face age estimate runs entirely on your own device and uploads nothing. borderline results fall back to an eid check such as mitid, altid or the eu identity wallet.",
                  },
                },
                {
                  "@type": "Question",
                  name: "is lowkey social gdpr compliant?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "data is stored in the eu, no ad trackers run, consent is logged, and you can export all your data as json or delete your account and everything in it from settings.",
                  },
                },
              ],
            },
          ],
        }),
      },
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
  const { state, me, toggleLike, addComment, toggleBookmark, deletePost, editPost, report } =
    useLowkey();
  const author = state.profiles.find((p) => p.id === post.authorId);
  const likes = state.likes.filter((l) => l.postId === post.id);
  const liked = likes.some((l) => l.profileId === me?.id);
  const comments = state.comments.filter((c) => c.postId === post.id);
  const saved = state.bookmarks.includes(post.id);
  const [openComments, setOpenComments] = useState(false);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title ?? "");
  const [editCaption, setEditCaption] = useState(post.caption);

  if (!author) return null;

  const mine = author.id === me?.id;

  const authorLink = mine
    ? { to: "/profile" as const }
    : { to: "/u/$handle" as const, params: { handle: author.handle } };

  return (
    <article className="border-b border-border px-4 py-4">
      <div className="flex items-center gap-2">
        <Link {...authorLink}>
          <Avatar hue={author.avatarHue} label={author.displayName} src={author.avatarUrl} size={36} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link {...authorLink} className="lowkey block truncate text-sm font-semibold">
            @{author.handle}
          </Link>
          <p className="lowkey text-xs text-muted-foreground">
            {post.taggedHandle ? `w/ @${post.taggedHandle} · ` : ""}
            {timeAgo(post.createdAt)}
          </p>
        </div>

        {/* overflow: edit / delete (own posts), report (anyone) */}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="post menu"
            className="flex min-h-11 min-w-11 items-center justify-center text-muted-foreground"
          >
            <MoreHorizontal className="size-5" />
          </button>
          {menu && (
            <>
              <button
                aria-label="close menu"
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setMenu(false)}
              />
              <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                {mine ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing(true);
                        setMenu(false);
                      }}
                      className="lowkey flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-muted"
                    >
                      <Pencil className="size-4" /> edit
                    </button>
                    <button
                      onClick={() => {
                        setMenu(false);
                        void deletePost(post.id);
                      }}
                      className="lowkey flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-destructive hover:bg-muted"
                    >
                      <Trash2 className="size-4" /> delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setReporting(true);
                      setMenu(false);
                    }}
                    className="lowkey flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-destructive hover:bg-muted"
                  >
                    <Flag className="size-4" /> report
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={60}
            placeholder="title"
            aria-label="edit title"
            className="lowkey rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold outline-none"
          />
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="caption"
            aria-label="edit caption"
            className="lowkey resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                void editPost(post.id, { title: editTitle, caption: editCaption });
                setEditing(false);
              }}
              className="lowkey flex-1 rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground"
            >
              save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="lowkey rounded-full border border-input px-4 py-2 text-xs font-semibold"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-3">
          <div className="flex flex-col items-center gap-3 pt-1">
            <button
              onClick={() => void toggleLike(post.id)}
              aria-label="like"
              className="flex min-h-11 min-w-11 flex-col items-center justify-center text-muted-foreground"
            >
              <Heart className={liked ? "size-6 fill-primary text-primary" : "size-6"} />
              <span className="text-xs font-semibold">{likes.length}</span>
            </button>
            <button
              onClick={() => setOpenComments(true)}
              aria-label="comments"
              className="flex min-h-11 min-w-11 flex-col items-center justify-center text-muted-foreground"
            >
              <MessageSquare className="size-6" />
              <span className="text-xs font-semibold">{comments.length}</span>
            </button>
            <Link
              to="/chats"
              aria-label="share"
              className="flex min-h-11 min-w-11 items-center justify-center text-muted-foreground"
            >
              <Send className="size-6" />
            </Link>
            <button
              onClick={() => void toggleBookmark(post.id)}
              aria-label={saved ? "remove bookmark" : "save post"}
              className="flex min-h-11 min-w-11 items-center justify-center text-muted-foreground"
            >
              <Bookmark className={saved ? "size-6 fill-primary text-primary" : "size-6"} />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            {post.title && (
              <h2 className="lowkey mb-1.5 text-base leading-snug font-extrabold break-words">
                {post.title}
              </h2>
            )}
            {post.mediaUrl ? (
              <>
                <Poster hue={post.posterHue} caption={post.caption} mediaUrl={post.mediaUrl} />
                {/* text + image: the caption belongs under the picture, not swallowed by it */}
                {post.caption && post.caption !== "no caption" && (
                  <p className="lowkey mt-2 text-sm leading-snug break-words">{post.caption}</p>
                )}
              </>
            ) : (
              <Poster hue={post.posterHue} caption={post.caption} />
            )}
            <button
              onClick={() => setOpenComments(true)}
              className="lowkey mt-2 text-xs font-semibold text-muted-foreground"
            >
              {comments.length > 0
                ? `view ${comments.length} comment${comments.length > 1 ? "s" : ""}`
                : "add a comment"}
            </button>
          </div>
        </div>
      )}

      {reporting && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3">
          <p className="lowkey w-full text-xs font-semibold text-muted-foreground">
            why are you reporting this post?
          </p>
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => {
                void report("post", post.id, reason);
                setReporting(false);
              }}
              className="lowkey rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
            >
              {reason}
            </button>
          ))}
        </div>
      )}

      {openComments && <CommentsSheet postId={post.id} onClose={() => setOpenComments(false)} />}
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
