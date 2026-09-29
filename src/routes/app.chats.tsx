import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppScreen, Avatar, StreakPill } from "@/components/lowkey/shell";
import { useLowkey, useMyConversations } from "@/lib/lowkey/store";

export const Route = createFileRoute("/app/chats")({
  head: () => ({
    meta: [
      { title: "chats — lowkey_social" },
      {
        name: "description",
        content: "chat 1:1 or in groups with people your age and keep your daily streaks alive.",
      },
      { property: "og:title", content: "chats — lowkey_social" },
      { property: "og:description", content: "chat with friends and keep your streaks alive." },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  const chats = useMyConversations();
  const [open, setOpen] = useState(false);

  return (
    <AppScreen>
      <div className="flex items-center justify-between px-4 pt-5">
        <h1 className="lowkey text-2xl font-extrabold tracking-tight">chats</h1>
        <button
          onClick={() => setOpen(true)}
          className="lowkey flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm active:scale-95"
        >
          <Users className="size-4" /> new group
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-1 px-2">
        {chats.length === 0 && (
          <li className="lowkey mx-2 rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground">
            no chats yet. follow someone and say hi, or start a group.
          </li>
        )}
        {chats.map(({ conversation, other, members, lastMessage, unread, streak }) => (
          <li key={conversation.id}>
            <Link
              to="/app/chat/$id"
              params={{ id: conversation.id }}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted"
            >
              {conversation.isGroup ? (
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                  <Users className="size-5" />
                </span>
              ) : (
                <Avatar
                  hue={other.avatarHue}
                  label={other.displayName}
                  src={other.avatarUrl}
                  ring={unread}
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="lowkey truncate text-sm font-semibold">
                    {conversation.isGroup
                      ? (conversation.title ?? "group")
                      : `@${other.handle}`}
                  </span>
                  {!conversation.isGroup && <StreakPill count={streak} />}
                </span>
                <span
                  className={`lowkey block truncate text-xs ${
                    unread ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {lastMessage?.body ||
                    (lastMessage?.mediaUrl ? "sent a photo" : null) ||
                    (conversation.isGroup
                      ? members.map((m) => m.handle).join(", ")
                      : "say something")}
                </span>
              </span>
              {unread && <span className="size-2.5 rounded-full bg-primary" />}
            </Link>
          </li>
        ))}
      </ul>
      {open && <NewGroupSheet onClose={() => setOpen(false)} />}
    </AppScreen>
  );
}

function NewGroupSheet({ onClose }: { onClose: () => void }) {
  const { state, me, startGroup } = useLowkey();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const people = useMemo(() => {
    if (!me) return [];
    const following = new Set(
      state.follows.filter((f) => f.followerId === me.id).map((f) => f.followingId),
    );
    return state.profiles.filter(
      (p) => following.has(p.id) && p.ageBand === me.ageBand && !state.blocks.includes(p.id),
    );
  }, [state, me]);

  const toggle = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const create = async () => {
    setBusy(true);
    const id = await startGroup(title, picked);
    setBusy(false);
    if (id) void navigate({ to: "/app/chat/$id", params: { id } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-t-3xl bg-background p-5 shadow-xl animate-fade-in sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="lowkey text-lg font-bold">new group</h2>
          <button onClick={onClose} aria-label="close" className="rounded-full p-2 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="group name"
          className="lowkey rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none"
        />
        <p className="lowkey text-xs text-muted-foreground">
          pick at least 2 people you follow ({picked.length} picked)
        </p>
        <ul className="-mx-2 flex-1 overflow-y-auto">
          {people.length === 0 && (
            <li className="lowkey p-6 text-center text-sm text-muted-foreground">
              follow some people first
            </li>
          )}
          {people.map((p) => {
            const on = picked.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  onClick={() => toggle(p.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-muted"
                >
                  <Avatar hue={p.avatarHue} label={p.displayName} src={p.avatarUrl} size={36} />
                  <span className="lowkey flex-1 truncate text-sm font-semibold">@{p.handle}</span>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border-2 ${
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    }`}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          disabled={busy || picked.length < 2 || !title.trim()}
          onClick={() => void create()}
          className="lowkey min-h-12 rounded-full bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "making it..." : "start group"}
        </button>
      </div>
    </div>
  );
}
