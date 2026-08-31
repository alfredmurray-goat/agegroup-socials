import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { AppScreen, Avatar, Poster, bandLabel } from "@/components/lowkey/shell";
import { useLowkey, useTodayUsage } from "@/lib/lowkey/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "profile — lowkey social" },
      {
        name: "description",
        content: "your lowkey profile: posts, videos, followers and your verified age band.",
      },
      { property: "og:title", content: "profile — lowkey social" },
      { property: "og:description", content: "your posts, videos and verified age band." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { state, me } = useLowkey();
  const usage = useTodayUsage();
  const [tab, setTab] = useState<"post" | "video">("post");

  if (!me) return <AppScreen>{null}</AppScreen>;

  const mine = state.posts.filter((p) => p.authorId === me.id && p.kind === tab);
  const followers = state.follows.filter((f) => f.followingId === me.id).length;
  const following = state.follows.filter((f) => f.followerId === me.id).length;

  return (
    <AppScreen>
      <div className="flex justify-end px-4 pt-3">
        <Link
          to="/settings"
          aria-label="settings"
          className="lowkey flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          <Settings className="size-3.5" /> settings
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 px-4 pt-2 pb-4">
        <Avatar hue={me.avatarHue} label={me.displayName} size={80} />
        <h1 className="lowkey flex items-center gap-1 text-lg font-bold">
          {me.displayName}
          {me.verificationStatus === "verified" && <BadgeCheck className="size-4 text-primary" />}
        </h1>
        <p className="lowkey text-xs text-muted-foreground">@{me.handle}</p>
        {me.bio && <p className="lowkey text-center text-sm text-muted-foreground">{me.bio}</p>}
        <p className="lowkey text-sm">
          <span className="font-bold">{followers}</span> followers{" "}
          <span className="ml-2 font-bold">{following}</span> following
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <span className="lowkey rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold">
            band: {me.ageBand ? bandLabel(me.ageBand) : "unverified"}
          </span>
          <span className="lowkey rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {usage.minutes}/{usage.limit} min today
          </span>
        </div>
      </div>

      <div className="flex border-y border-border">
        {(["post", "video"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`lowkey flex-1 py-3 text-sm font-semibold ${
              tab === t ? "border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            {t === "post" ? "posts" : "videos"}
          </button>
        ))}
      </div>

      {mine.length === 0 ? (
        <p className="lowkey p-8 text-center text-sm text-muted-foreground">
          nothing here yet. hit create.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1">
          {mine.map((p) => (
            <Poster key={p.id} hue={p.posterHue} caption="" mediaUrl={p.mediaUrl} />
          ))}
        </div>
      )}
    </AppScreen>
  );
}
