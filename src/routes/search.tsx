import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppScreen, Avatar } from "@/components/lowkey/shell";
import { useBandPosts, useBandProfiles, useLowkey } from "@/lib/lowkey/store";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "search — lowkey social" },
      {
        name: "description",
        content: "search people and posts inside your own age band on lowkey social.",
      },
      { property: "og:title", content: "search — lowkey social" },
      { property: "og:description", content: "search people and posts in your age band." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const profiles = useBandProfiles();
  const posts = useBandPosts();
  const { me, toggleFollow, state } = useLowkey();
  const term = q.trim().toLowerCase();

  const people = term
    ? profiles.filter(
        (p) => p.id !== me?.id && (p.handle.includes(term) || p.displayName.includes(term)),
      )
    : profiles.filter((p) => p.id !== me?.id);
  const hits = term ? posts.filter((p) => p.caption.includes(term)) : [];

  return (
    <AppScreen title="search">
      <div className="px-4 py-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search people or posts"
          className="lowkey w-full rounded-full border border-border bg-card px-4 py-3 text-sm outline-none"
        />

        <h1 className="lowkey mt-5 text-sm font-bold">people in your band</h1>
        <ul className="mt-2 flex flex-col gap-2">
          {people.length === 0 && (
            <li className="lowkey text-xs text-muted-foreground">nobody matches that</li>
          )}
          {people.map((p) => {
            const following = state.follows.some(
              (f) => f.followerId === me?.id && f.followingId === p.id,
            );
            return (
              <li key={p.id} className="flex items-center gap-3">
                <Avatar hue={p.avatarHue} label={p.displayName} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="lowkey block truncate text-sm font-semibold">@{p.handle}</span>
                  <span className="lowkey block truncate text-xs text-muted-foreground">
                    {p.bio || "no bio"}
                  </span>
                </span>
                <button
                  onClick={() => toggleFollow(p.id)}
                  className={`lowkey rounded-full px-3 py-1.5 text-xs font-bold ${
                    following ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {following ? "following" : "follow"}
                </button>
              </li>
            );
          })}
        </ul>

        {term && (
          <>
            <h2 className="lowkey mt-6 text-sm font-bold">posts</h2>
            <ul className="mt-2 flex flex-col gap-1">
              {hits.length === 0 && (
                <li className="lowkey text-xs text-muted-foreground">no posts match that</li>
              )}
              {hits.map((p) => (
                <li key={p.id} className="lowkey text-xs text-muted-foreground">
                  {p.caption}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppScreen>
  );
}
