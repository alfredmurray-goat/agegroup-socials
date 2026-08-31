import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, LogOut, Download, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { AppScreen, bandLabel, BetaTag, FeedbackLink } from "@/components/lowkey/shell";
import { useLowkey, useTodayUsage } from "@/lib/lowkey/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "settings — lowkey social" },
      {
        name: "description",
        content:
          "set your daily limit, check your verified age band, export or delete all your data, or sign out of lowkey social.",
      },
      { property: "og:title", content: "settings — lowkey social" },
      {
        property: "og:description",
        content: "daily limit, age band, gdpr export and delete, account settings.",
      },
    ],
  }),
  component: SettingsPage,
});

const limits = [15, 30, 45, 60, 90, 120];

function SettingsPage() {
  const { me, setDailyLimit, signOut, exportMyData, deleteMyAccount } = useLowkey();
  const usage = useTodayUsage();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!me) return <AppScreen>{null}</AppScreen>;

  const doExport = async () => {
    setBusy(true);
    const data = await exportMyData();
    setBusy(false);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lowkey-social-${me.handle}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("downloaded your data");
  };

  const doDelete = async () => {
    setBusy(true);
    const res = await deleteMyAccount();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "couldn't delete that");
      return;
    }
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <AppScreen title="settings">
      <div className="flex flex-col gap-6 px-4 py-5">
        <div className="flex items-center gap-2">
          <h1 className="lowkey text-xl font-bold">settings</h1>
          <BetaTag />
        </div>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="lowkey flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 text-primary" /> age band
          </p>
          <p className="lowkey mt-1 text-sm text-muted-foreground">
            verified {me.ageBand ? bandLabel(me.ageBand) : "not yet"}
            {me.verifiedProvider ? ` via ${me.verifiedProvider.replace("_", " ")}` : ""}. bands
            can&apos;t be changed — you only ever see profiles, posts and chats in your own band, and
            that split is enforced in the database.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="lowkey text-sm font-bold">daily limit</p>
          <p className="lowkey mt-1 text-xs text-muted-foreground">
            {usage.minutes} of {usage.limit} minutes used today
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {limits.map((l) => (
              <button
                key={l}
                onClick={() => void setDailyLimit(l)}
                className={`lowkey rounded-full px-3 py-1.5 text-xs font-semibold ${
                  me.dailyLimitMinutes === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {l} min
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="lowkey flex items-center gap-2 text-sm font-bold">
            <Lock className="size-4 text-primary" /> your data
          </p>
          <p className="lowkey mt-1 text-sm text-muted-foreground">
            stored in the eu. the face age check runs on your device and uploads nothing. full
            details in the{" "}
            <Link to="/privacy" className="font-semibold underline underline-offset-2">
              privacy notice
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => void doExport()}
              disabled={busy}
              className="lowkey flex items-center justify-center gap-2 rounded-2xl border border-input py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Download className="size-4" /> export my data (json)
            </button>
            {confirmDelete ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3">
                <p className="lowkey text-xs text-muted-foreground">
                  this erases your profile, posts, likes, comments, follows, chats, messages and
                  usage. can&apos;t be undone.
                </p>
                <button
                  onClick={() => void doDelete()}
                  disabled={busy}
                  className="lowkey rounded-2xl bg-destructive py-3 text-sm font-bold text-destructive-foreground disabled:opacity-60"
                >
                  yes, delete everything
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="lowkey py-1 text-xs font-semibold text-muted-foreground"
                >
                  keep my account
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="lowkey flex items-center justify-center gap-2 rounded-2xl border border-input py-3 text-sm font-semibold text-destructive"
              >
                <Trash2 className="size-4" /> delete my account
              </button>
            )}
          </div>
        </section>

        <button
          onClick={() => {
            void signOut();
            void navigate({ to: "/auth", replace: true });
          }}
          className="lowkey flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold"
        >
          <LogOut className="size-4" /> sign out
        </button>

        <p className="lowkey text-center text-xs text-muted-foreground">
          lowkey social beta — feedback: <FeedbackLink />
        </p>
      </div>
    </AppScreen>
  );
}
