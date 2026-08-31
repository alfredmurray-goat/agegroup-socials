import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { useState } from "react";
import { AppScreen, Avatar, Poster, bandLabel } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.handle} — lowkey social` },
      {
        name: "description",
        content: `@${params.handle} on lowkey social. see their posts and videos, follow them, or start a chat — same age band only.`,
      },
      { property: "og:title", content: `@${params.handle} — lowkey social` },
      { property: "og:description", content: `posts and videos from @${params.handle}.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { handle } = useParams({ from: "/u/$handle" });
  const { state, me, toggleFollow, startChat } = useLowkey();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"post" | "video">("post");

  const person = state.profiles.find((p) => p.handle === handle);

  if (!person) {
    return (
      <AppScreen title="profile">
        <p className="lowkey p-8 text-center text-sm text-muted-foreground">
          no account with that handle in your band.
        </p>
      </AppScreen>
    );
  }

  if (person.id === me?.id) {
    void navigate({ to: "/profile", replace: true });
  }

  const posts = state.posts.filter((p) => p.authorId === person.id && p.kind === tab);
  const followers = state.follows.filter((f) => f.followingId === person.id).length;
  const following = state.follows.filter((f) => f.followerId === person.id).length;
  const iFollow = state.follows.some(
    (f) => f.followerId === me?.id && f.followingId === person.id,
  );
  const theyFollowMe = state.follows.some(
    (f) => f.followerId === person.id && f.followingId === me?.id,
  );

  return (
    <AppScreen title={`@${person.handle}`}>
      <div className="flex flex-col items-center gap-2 px-4 pt-5 pb-4">
        <Avatar
          hue={person.avatarHue}
          label={person.displayName}
          src={person.avatarUrl}
          size={80}
        />
        <h1 className="lowkey flex items-center gap-1 text-lg font-bold">
          {person.displayName}
          {person.verificationStatus === "verified" && (
            <BadgeCheck className="size-4 text-primary" />
          )}
        </h1>
        <p className="lowkey text-xs text-muted-foreground">@{person.handle}</p>
        {person.bio && <p className="lowkey text-center text-sm text-muted-foreground">{person.bio}</p>}
        <p className="lowkey text-sm">
          <span className="font-bold">{followers}</span> followers{" "}
          <span className="ml-2 font-bold">{following}</span> following
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <span className="lowkey rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold">
            band: {person.ageBand ? bandLabel(person.ageBand) : "unverified"}
          </span>
          {theyFollowMe && (
            <span className="lowkey rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              follows you
            </span>
          )}
        </div>

        <div className="mt-3 flex w-full max-w-xs gap-2">
          <button
            onClick={() => void toggleFollow(person.id)}
            className={`lowkey flex-1 rounded-full py-2.5 text-sm font-bold ${
              iFollow ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {iFollow ? "following" : theyFollowMe ? "follow back" : "follow"}
          </button>
          <button
            onClick={() => {
              void startChat(person.id).then((id) => {
                if (id) void navigate({ to: "/chat/$id", params: { id } });
              });
            }}
            className="lowkey flex items-center justify-center gap-1 rounded-full border border-input px-4 py-2.5 text-sm font-bold"
          >
            <MessageCircle className="size-4" /> chat
          </button>
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

      {posts.length === 0 ? (
        <p className="lowkey p-8 text-center text-sm text-muted-foreground">nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1">
          {posts.map((p) => (
            <Poster key={p.id} hue={p.posterHue} caption="" mediaUrl={p.mediaUrl} />
          ))}
        </div>
      )}
    </AppScreen>
  );
}
