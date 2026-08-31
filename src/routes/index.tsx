import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageSquare, Send, Bookmark } from "lucide-react";
import { useState } from "react";
import { AppScreen, Avatar, Poster } from "@/components/lowkey/shell";
import { useBandPosts, useLowkey } from "@/lib/lowkey/store";
import type { Post } from "@/lib/lowkey/types";

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
  const { state, me, toggleLike, addComment, toggleBookmark } = useLowkey();
  const author = state.profiles.find((p) => p.id === post.authorId);
  const likes = state.likes.filter((l) => l.postId === post.id);
  const liked = likes.some((l) => l.profileId === me?.id);
  const comments = state.comments.filter((c) => c.postId === post.id);
  const saved = state.bookmarks.includes(post.id);
  const [openComments, setOpenComments] = useState(false);

  if (!author) return null;

  const authorLink =
    author.id === me?.id
      ? { to: "/profile" as const }
      : { to: "/u/$handle" as const, params: { handle: author.handle } };

  return (
    <article className="border-b border-border px-4 py-4">
      <div className="flex items-center gap-2">
        <Link {...authorLink}>
          <Avatar hue={author.avatarHue} label={author.displayName} src={author.avatarUrl} size={36} />
        </Link>
        <div className="min-w-0">
          <Link {...authorLink} className="lowkey block truncate text-sm font-semibold">
            @{author.handle}
          </Link>
          <p className="lowkey text-xs text-muted-foreground">
            {post.taggedHandle ? `w/ @${post.taggedHandle} · ` : ""}
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            onClick={() => void toggleLike(post.id)}
            aria-label="like"
            className="flex flex-col items-center text-muted-foreground"
          >
            <Heart className={liked ? "size-6 fill-primary text-primary" : "size-6"} />
            <span className="text-[10px] font-semibold">{likes.length}</span>
          </button>
          <button
            onClick={() => setOpenComments(true)}
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
            onClick={() => void toggleBookmark(post.id)}
            aria-label={saved ? "remove bookmark" : "save post"}
            className="text-muted-foreground"
          >
            <Bookmark className={saved ? "size-6 fill-primary text-primary" : "size-6"} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
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
