import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus, Send, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppScreen, Avatar, StreakPill } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";

export const Route = createFileRoute("/app/chat/$id")({
  head: () => ({
    meta: [
      { title: "chat — lowkey_social" },
      { name: "description", content: "a lowkey chat thread with a friend in your age band." },
      { property: "og:title", content: "chat — lowkey_social" },
      { property: "og:description", content: "a lowkey chat thread with a friend." },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
const { state, me, sendMessage, sendPhoto, deleteMessage, markRead } = useLowkey();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      toast.error("photos only");
      return;
    }
    if (file.size > 20_000_000) {
      toast.error("keep it under 20mb");
      return;
    }
    await sendPhoto(id, file);
  };

  const conversation = state.conversations.find((c) => c.id === id);
  // membership is the rule: mutual-follow chats work even if a band differs
  const allowed = !!conversation && !!me && conversation.memberIds.includes(me.id);

  useEffect(() => {
    if (me && !allowed) void navigate({ to: "/app/chats", replace: true });
  }, [me, allowed, navigate]);

  useEffect(() => {
    if (allowed) markRead(id);
  }, [allowed, id, markRead]);

  const messages = state.messages
    .filter((m) => m.conversationId === id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!allowed || !conversation || !me) {
    return <AppScreen chrome={false}>{null}</AppScreen>;
  }

  const otherId = conversation.memberIds.find((m) => m !== me.id) ?? me.id;
  const other = state.profiles.find((p) => p.id === otherId) ?? me;
  const isGroup = conversation.isGroup;
  const byId = (pid: string) => state.profiles.find((p) => p.id === pid);
  const streak = state.streaks.find((s) => s.conversationId === id)?.count ?? 0;

  return (
    <AppScreen chrome={false}>
      <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/app/chats" aria-label="back" className="p-1 text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        {isGroup ? (
          <span className="flex size-[34px] items-center justify-center rounded-full bg-primary-soft">
            <Users className="size-4" />
          </span>
        ) : (
          <Avatar hue={other.avatarHue} label={other.displayName} size={34} src={other.avatarUrl} />
        )}
        <div className="min-w-0 flex-1">
          <p className="lowkey truncate text-sm font-semibold">
            {isGroup ? conversation.title ?? "group" : `@${other.handle}`}
          </p>
          {isGroup ? (
            <p className="lowkey text-xs text-muted-foreground">
              {conversation.memberIds.length} people
            </p>
          ) : (
            <StreakPill count={streak} />
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))]">
{messages.map((m) => {
          const mine = m.authorId === me.id;
          return (
            <div key={m.id} className={`lowkey max-w-[75%] ${mine ? "self-end" : "self-start"}`}>
              {isGroup && !mine && (
                <p className="mb-0.5 px-3 text-[11px] font-semibold text-muted-foreground">
                  @{byId(m.authorId)?.handle ?? "someone"}
                </p>
              )}
              <div
                className={`relative flex flex-col gap-1.5 rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border bg-card text-foreground"
                }`}
              >
                {m.mediaUrl && (
                  <img
                    src={m.mediaUrl}
                    alt="photo in chat"
                    className="max-h-72 w-full max-w-56 rounded-2xl object-cover"
                  />
                )}
                {m.body && <p>{m.body}</p>}
                {mine && (
                  <button
                    onClick={() => void deleteMessage(m.id)}
                    aria-label="delete message"
                    className="absolute -top-2.5 -right-2.5 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          sendMessage(id, draft);
          setDraft("");
        }}
        className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto grid w-full max-w-lg grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-t border-border bg-background px-4 py-3"
      >
<button
          type="button"
          aria-label="send a photo"
          onClick={() => fileRef.current?.click()}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
        >
          <ImagePlus className="size-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="hello"
          className="lowkey min-w-0 rounded-full border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring"
        />
        <button
          aria-label="send"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95"
        >
          <Send className="size-4" />
        </button>
      </form>
    </AppScreen>
  );
}
