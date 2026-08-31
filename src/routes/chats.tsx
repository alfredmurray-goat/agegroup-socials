import { createFileRoute, Link } from "@tanstack/react-router";
import { AppScreen, Avatar, StreakPill } from "@/components/lowkey/shell";
import { useMyConversations } from "@/lib/lowkey/store";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "chats — lowkey social" },
      {
        name: "description",
        content: "chat with friends in your age band and keep your daily streaks alive.",
      },
      { property: "og:title", content: "chats — lowkey social" },
      { property: "og:description", content: "chat with friends and keep your streaks alive." },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  const chats = useMyConversations();

  return (
    <AppScreen>
      <h1 className="lowkey px-4 pt-4 text-xl font-bold">chats</h1>
      <ul className="mt-2 divide-y divide-border">
        {chats.length === 0 && (
          <li className="lowkey p-8 text-center text-sm text-muted-foreground">
            no chats yet. follow someone in the videos tab and say hi.
          </li>
        )}
        {chats.map(({ conversation, other, lastMessage, unread, streak }) => (
          <li key={conversation.id}>
            <Link
              to="/chat/$id"
              params={{ id: conversation.id }}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              <Avatar hue={other.avatarHue} label={other.displayName} ring={unread} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="lowkey truncate text-sm font-semibold">@{other.handle}</span>
                  <StreakPill count={streak} />
                </span>
                <span
                  className={`lowkey block truncate text-xs ${
                    unread ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {lastMessage?.body ?? "say something"}
                </span>
              </span>
              {unread && <span className="size-2 rounded-full bg-primary" />}
            </Link>
          </li>
        ))}
      </ul>
    </AppScreen>
  );
}
