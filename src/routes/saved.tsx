import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { AppScreen, Avatar, Poster } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "saved — lowkey social" },
      {
        name: "description",
        content: "everything you bookmarked on lowkey social, kept in one place just for you.",
      },
      { property: "og:title", content: "saved — lowkey social" },
      { property: "og:description", content: "the posts and videos you bookmarked." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { state, toggleBookmark } = useLowkey();
  const saved = state.posts.filter((p) => state.bookmarks.includes(p.id));

  return (
    <AppScreen title="saved">
      <h1 className="lowkey px-4 pt-4 text-xl font-bold">saved</h1>
      {saved.length === 0 ? (
        <p className="lowkey p-8 text-center text-sm text-muted-foreground">
          nothing saved yet. tap the bookmark on any post.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-border">
          {saved.map((p) => {
            const author = state.profiles.find((a) => a.id === p.authorId);
            return (
              <li key={p.id} className="flex gap-3 px-4 py-3">
                <div className="w-24 shrink-0">
                  <Poster hue={p.posterHue} caption="" mediaUrl={p.mediaUrl} />
                </div>
                <div className="min-w-0 flex-1">
                  {author && (
                    <Link
                      to="/u/$handle"
                      params={{ handle: author.handle }}
                      className="flex items-center gap-2"
                    >
                      <Avatar
                        hue={author.avatarHue}
                        label={author.displayName}
                        src={author.avatarUrl}
                        size={24}
                      />
                      <span className="lowkey truncate text-xs font-semibold">
                        @{author.handle}
                      </span>
                    </Link>
                  )}
                  <p className="lowkey mt-1 text-sm">{p.caption}</p>
                </div>
                <button
                  onClick={() => void toggleBookmark(p.id)}
                  aria-label="remove bookmark"
                  className="text-primary"
                >
                  <Bookmark className="size-5 fill-primary" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppScreen>
  );
}
