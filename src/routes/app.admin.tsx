import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppScreen, Avatar, Poster, bandLabel } from "@/components/lowkey/shell";
import { supabase } from "@/integrations/supabase/client";
import { useLowkey } from "@/lib/lowkey/store";
import { adminDeleteAccount } from "@/lib/lowkey/admin.functions";
import type { AgeBand } from "@/lib/lowkey/types";

export const Route = createFileRoute("/app/admin")({
  head: () => ({
    meta: [
      { title: "admin — lowkey_social" },
      { name: "description", content: "moderation dashboard for lowkey_social." },
      { property: "og:title", content: "admin — lowkey_social" },
      { property: "og:description", content: "moderation dashboard for lowkey_social." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "reports" | "users" | "feeds";
interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  resolved_at: string | null;
  created_at: string;
}

function AdminPage() {
  const { isAdmin, loading, state, refresh, deletePost, deleteComment } = useLowkey();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [reports, setReports] = useState<Report[]>([]);
  const [q, setQ] = useState("");
  const [band, setBand] = useState<AgeBand>("under_18");
  const del = useServerFn(adminDeleteAccount);

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/app", replace: true });
  }, [loading, isAdmin, navigate]);

  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setReports((data ?? []) as Report[]);
  }, []);

  useEffect(() => {
    if (isAdmin) void loadReports();
  }, [isAdmin, loadReports]);

  const byId = (id: string) => state.profiles.find((p) => p.id === id);
  const open = reports.filter((r) => !r.resolved_at);
  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(
    () => ({
      under: state.profiles.filter((p) => p.ageBand === "under_18").length,
      adult: state.profiles.filter((p) => p.ageBand === "adult").length,
      unverified: state.profiles.filter((p) => p.verificationStatus !== "verified").length,
      postsToday: state.posts.filter((p) => p.createdAt.startsWith(today)).length,
      posts: state.posts.length,
    }),
    [state, today],
  );

  const resolve = async (id: string) => {
    await supabase.from("reports").update({ resolved_at: new Date().toISOString() }).eq("id", id);
    await loadReports();
  };

  const removeTarget = async (r: Report) => {
    if (r.target_type === "post") await deletePost(r.target_id);
    else if (r.target_type === "comment") await deleteComment(r.target_id);
    else if (r.target_type === "profile") return ban(r.target_id, true);
    await resolve(r.id);
    toast.success("removed");
  };

  const ban = async (profileId: string, on: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ banned_at: on ? new Date().toISOString() : null })
      .eq("id", profileId);
    if (error) toast.error(error.message.toLowerCase());
    else toast.success(on ? "banned" : "unbanned");
    await refresh();
  };

  const wipe = async (profileId: string) => {
    if (!confirm("delete this account and everything they posted? can't be undone")) return;
    try {
      await del({ data: { profileId } });
      toast.success("account deleted");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message ?? "couldn't delete");
    }
  };

  if (!isAdmin) return <AppScreen overLimit>{null}</AppScreen>;

  const users = state.profiles.filter(
    (p) =>
      !q ||
      p.handle.toLowerCase().includes(q.toLowerCase()) ||
      p.displayName.toLowerCase().includes(q.toLowerCase()),
  );
  const feed = state.posts.filter((p) => p.ageBand === band).slice(0, 60);

  return (
    <AppScreen overLimit title="admin">
      <div className="px-4 pt-5">
        <h1 className="lowkey text-2xl font-extrabold">admin</h1>
        <div className="mt-3 flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
          {(["overview", "reports", "users", "feeds"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`lowkey min-h-10 flex-1 rounded-full px-3 text-sm font-semibold ${
                tab === t ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t}
              {t === "reports" && open.length > 0 ? ` (${open.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            ["under 18 users", stats.under],
            ["18+ users", stats.adult],
            ["not verified", stats.unverified],
            ["open reports", open.length],
            ["posts today", stats.postsToday],
            ["all posts", stats.posts],
          ].map(([l, v]) => (
            <div key={l} className="rounded-3xl border border-border bg-card p-4">
              <p className="text-3xl font-extrabold">{v}</p>
              <p className="lowkey text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <ul className="flex flex-col gap-3 p-4">
          {reports.length === 0 && (
            <li className="lowkey p-8 text-center text-sm text-muted-foreground">no reports 🎉</li>
          )}
          {reports.map((r) => {
            const post = r.target_type === "post" ? state.posts.find((p) => p.id === r.target_id) : null;
            const comment =
              r.target_type === "comment" ? state.comments.find((c) => c.id === r.target_id) : null;
            const prof = r.target_type === "profile" ? byId(r.target_id) : null;
            return (
              <li
                key={r.id}
                className={`rounded-3xl border border-border bg-card p-4 ${r.resolved_at ? "opacity-50" : ""}`}
              >
                <p className="lowkey text-xs text-muted-foreground">
                  {r.target_type} · {r.reason} · by @{byId(r.reporter_id)?.handle ?? "?"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
                <p className="lowkey mt-2 text-sm break-words">
                  {post
                    ? `@${byId(post.authorId)?.handle}: ${post.title ?? ""} ${post.caption}`
                    : comment
                      ? `@${byId(comment.authorId)?.handle}: ${comment.body}`
                      : prof
                        ? `@${prof.handle} — ${prof.bio}`
                        : "already gone"}
                </p>
                {!r.resolved_at && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => void removeTarget(r)}
                      className="lowkey min-h-10 flex-1 rounded-full bg-destructive text-xs font-bold text-destructive-foreground"
                    >
                      {r.target_type === "profile" ? "ban user" : "delete it"}
                    </button>
                    <button
                      onClick={() => void resolve(r.id)}
                      className="lowkey min-h-10 flex-1 rounded-full border border-input text-xs font-bold"
                    >
                      it&apos;s fine
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === "users" && (
        <div className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search users"
            className="lowkey w-full rounded-2xl border border-input bg-card px-4 py-3 text-base"
          />
          <ul className="mt-3 flex flex-col gap-2">
            {users.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                <Avatar hue={p.avatarHue} label={p.displayName} src={p.avatarUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="lowkey truncate text-sm font-semibold">@{p.handle}</p>
                  <p className="lowkey text-xs text-muted-foreground">
                    {p.ageBand ? bandLabel(p.ageBand) : "no band"} · {p.verificationStatus}
                    {p.bannedAt ? " · banned" : ""}
                  </p>
                </div>
                <button
                  onClick={() => void ban(p.id, !p.bannedAt)}
                  className="lowkey min-h-9 rounded-full border border-input px-3 text-xs font-bold"
                >
                  {p.bannedAt ? "unban" : "ban"}
                </button>
                <button
                  onClick={() => void wipe(p.id)}
                  className="lowkey min-h-9 rounded-full bg-destructive px-3 text-xs font-bold text-destructive-foreground"
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "feeds" && (
        <div className="p-4">
          <div className="flex gap-2">
            {(["under_18", "adult"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBand(b)}
                className={`lowkey min-h-10 flex-1 rounded-full text-sm font-bold ${
                  band === b ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {bandLabel(b)} feed
              </button>
            ))}
          </div>
          <ul className="mt-4 flex flex-col gap-4">
            {feed.length === 0 && (
              <li className="lowkey p-8 text-center text-sm text-muted-foreground">nothing here yet</li>
            )}
            {feed.map((p) => (
              <li key={p.id} className="rounded-3xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="lowkey text-sm font-semibold">@{byId(p.authorId)?.handle ?? "?"}</p>
                  <button
                    onClick={() => void deletePost(p.id)}
                    className="lowkey rounded-full px-3 py-1 text-xs font-bold text-destructive"
                  >
                    delete
                  </button>
                </div>
                {p.title && <p className="lowkey mt-1 font-bold">{p.title}</p>}
                <p className="lowkey mt-1 text-sm">{p.caption}</p>
                {p.mediaUrl && p.kind !== "video" && (
                  <div className="mt-2">
                    <Poster hue={p.posterHue} caption={p.caption} mediaUrl={p.mediaUrl} />
                  </div>
                )}
                {p.mediaUrl && p.kind === "video" && (
                  <video src={p.mediaUrl} controls className="mt-2 w-full rounded-2xl" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppScreen>
  );
}
