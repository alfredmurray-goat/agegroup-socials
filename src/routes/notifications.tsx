import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppScreen, Avatar } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "notifications — lowkey social" },
      {
        name: "description",
        content:
          "see who followed you, liked your posts or commented, and follow people back in one tap.",
      },
      { property: "og:title", content: "notifications — lowkey social" },
      { property: "og:description", content: "follows, likes and comments on your stuff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

function ago(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

function NotificationsPage() {
  const { state, me, toggleFollow, markNotificationsRead } = useLowkey();

  useEffect(() => {
    if (state.notifications.some((n) => !n.readAt)) void markNotificationsRead();
  }, [state.notifications, markNotificationsRead]);

  const items = state.notifications.filter((n) => n.recipientId === me?.id);

  return (
    <AppScreen title="notifications">
      <h1 className="lowkey px-4 pt-4 text-xl font-bold">notifications</h1>
      {items.length === 0 ? (
        <p className="lowkey p-8 text-center text-sm text-muted-foreground">
          nothing yet. post something and see who shows up.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {items.map((n) => {
            const actor = state.profiles.find((p) => p.id === n.actorId);
            if (!actor) return null;
            const followsBack = state.follows.some(
              (f) => f.followerId === me?.id && f.followingId === actor.id,
            );
            const text =
              n.kind === "follow"
                ? "followed you"
                : n.kind === "like"
                  ? "liked your post"
                  : "commented on your post";
            return (
              <li key={n.id} className="flex items-center gap-3 px-4 py-3">
                <Link to="/u/$handle" params={{ handle: actor.handle }}>
                  <Avatar
                    hue={actor.avatarHue}
                    label={actor.displayName}
                    src={actor.avatarUrl}
                    size={40}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="lowkey truncate text-sm">
                    <Link
                      to="/u/$handle"
                      params={{ handle: actor.handle }}
                      className="font-semibold"
                    >
                      @{actor.handle}
                    </Link>{" "}
                    {text}
                  </p>
                  <p className="lowkey text-xs text-muted-foreground">{ago(n.createdAt)} ago</p>
                </div>
                {n.kind === "follow" && (
                  <button
                    onClick={() => void toggleFollow(actor.id)}
                    className={`lowkey rounded-full px-3 py-1.5 text-xs font-bold ${
                      followsBack
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {followsBack ? "following" : "follow back"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppScreen>
  );
}
