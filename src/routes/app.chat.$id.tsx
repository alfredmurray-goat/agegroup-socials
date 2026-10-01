import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ImagePlus, LogOut, Send, Settings2, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
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
  const [groupOpen, setGroupOpen] = useState(false);
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
      <header className="sticky top-0 z-20 grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/app/chats" aria-label="back" className="p-1 text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        {isGroup ? (
          <span className="flex size-[34px] items-center justify-center rounded-full bg-primary-soft text-base">
            {conversation.emoji ?? <Users className="size-4" />}
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
        {isGroup ? (
          <button onClick={() => setGroupOpen(true)} aria-label="group settings" className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary">
            <Settings2 className="size-5" />
          </button>
        ) : <span />}
      </header>
      {isGroup && groupOpen && <GroupSheet conversationId={id} onClose={() => setGroupOpen(false)} />}

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

const EMOJIS = ["🌻", "🎮", "⚽", "🎨", "🎧", "📚", "🍕", "✨", "🛹", "🌙"];

function GroupSheet({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const { state, me, addGroupMembers, updateGroup, removeGroupMember } = useLowkey();
  const navigate = useNavigate();
  const conversation = state.conversations.find((c) => c.id === conversationId);
  const [title, setTitle] = useState(conversation?.title ?? "");
  const [emoji, setEmoji] = useState<string | null>(conversation?.emoji ?? null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  if (!conversation || !me) return null;
  const isOwner = conversation.createdBy === me.id;
  const members = conversation.memberIds.map((pid) => state.profiles.find((p) => p.id === pid)).filter((p): p is NonNullable<typeof p> => !!p);
  const candidates = state.follows
    .filter((f) => f.followerId === me.id)
    .map((f) => state.profiles.find((p) => p.id === f.followingId))
    .filter((p): p is NonNullable<typeof p> => !!p && p.ageBand === conversation.ageBand && !conversation.memberIds.includes(p.id));
  const run = async (fn: () => Promise<boolean>, ok: string) => { setBusy(true); const done = await fn(); setBusy(false); if (done) toast.success(ok); return done; };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40" onClick={onClose}>
      <div role="dialog" aria-label="group settings" onClick={(e) => e.stopPropagation()} className="lowkey max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 className="font-display text-xl font-bold">group settings</h2>

        <section className="mt-5 space-y-3">
          <p className="text-xs font-bold text-muted-foreground">name + vibe</p>
          <input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none" />
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(emoji === e ? null : e)} className={`flex size-11 items-center justify-center rounded-full text-lg ${emoji === e ? "bg-primary" : "bg-secondary"}`}>{e}</button>
            ))}
          </div>
          <button disabled={busy || !title.trim()} onClick={() => void run(() => updateGroup(conversationId, title, emoji), "group updated")} className="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-50">save</button>
        </section>

        <section className="mt-6">
          <p className="mb-2 text-xs font-bold text-muted-foreground">{members.length} people</p>
          {members.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-border py-2">
              <Avatar hue={p.avatarHue} label={p.displayName} size={36} src={p.avatarUrl} />
              <Link to="/app/u/$handle" params={{ handle: p.handle }} className="min-w-0 flex-1 truncate text-sm font-semibold">@{p.handle}{p.id === conversation.createdBy && <span className="ml-2 text-xs text-muted-foreground">creator</span>}</Link>
              {isOwner && p.id !== me.id && (
                <button aria-label={`remove @${p.handle}`} disabled={busy} onClick={() => void run(() => removeGroupMember(conversationId, p.id), "removed")} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"><UserMinus className="size-4" /></button>
              )}
            </div>
          ))}
        </section>

        <section className="mt-6">
          <p className="mb-2 text-xs font-bold text-muted-foreground">add people you follow</p>
          {candidates.length === 0 ? <p className="text-sm text-muted-foreground">no one else to add rn</p> : (
            <>
              <div className="flex flex-wrap gap-2">
                {candidates.map((p) => {
                  const on = picked.includes(p.id);
                  return <button key={p.id} onClick={() => setPicked(on ? picked.filter((x) => x !== p.id) : [...picked, p.id])} className={`flex min-h-11 items-center gap-2 rounded-full px-3 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{on && <Check className="size-4" />}@{p.handle}</button>;
                })}
              </div>
              <button disabled={busy || !picked.length} onClick={() => void run(() => addGroupMembers(conversationId, picked), "added to the group").then((ok) => ok && setPicked([]))} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-secondary font-semibold disabled:opacity-50"><UserPlus className="size-4" />add {picked.length || ""}</button>
            </>
          )}
        </section>

        <button disabled={busy} onClick={() => void run(() => removeGroupMember(conversationId, me.id), "you left the group").then((ok) => { if (ok) void navigate({ to: "/app/chats" }); })} className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-destructive text-destructive"><LogOut className="size-4" />leave group</button>
      </div>
    </div>
  );
}
