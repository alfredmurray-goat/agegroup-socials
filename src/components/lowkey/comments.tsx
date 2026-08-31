import { Link } from "@tanstack/react-router";
import { X, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/lowkey/shell";
import { useLowkey } from "@/lib/lowkey/store";

function ago(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

/** one shared comment sheet for the feed and for videos */
export function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { state, me, addComment } = useLowkey();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const comments = state.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setDraft("");
    await addComment(postId, text);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <button aria-label="close comments" className="absolute inset-0" onClick={onClose} />
      <div className="relative flex max-h-[75vh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="lowkey text-sm font-bold">
            comments {comments.length > 0 && <span className="text-muted-foreground">{comments.length}</span>}
          </p>
          <button
            onClick={onClose}
            aria-label="close"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-3">
          {comments.length === 0 && (
            <p className="lowkey py-8 text-center text-sm text-muted-foreground">
              no comments yet — go first
            </p>
          )}
          {comments.map((c) => {
            const author = state.profiles.find((p) => p.id === c.authorId);
            return (
              <div key={c.id} className="flex gap-3">
                <Avatar
                  hue={author?.avatarHue ?? 60}
                  label={author?.displayName ?? "someone"}
                  src={author?.avatarUrl ?? null}
                  size={30}
                />
                <div className="min-w-0 flex-1">
                  <p className="lowkey flex items-center gap-2 text-xs font-semibold">
                    {author ? (
                      <Link
                        {...(author.id === me?.id
                          ? { to: "/profile" as const }
                          : { to: "/u/$handle" as const, params: { handle: author.handle } })}
                      >
                        @{author.handle}
                      </Link>
                    ) : (
                      <span>someone</span>
                    )}
                    <span className="font-normal text-muted-foreground">{ago(c.createdAt)}</span>
                  </p>
                  <p className="lowkey mt-0.5 text-sm break-words">{c.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-center gap-2 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <Avatar hue={me?.avatarHue ?? 60} label={me?.displayName ?? "me"} src={me?.avatarUrl ?? null} size={30} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={200}
            autoFocus
            placeholder="say something"
            className="lowkey min-w-0 flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="send comment"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
