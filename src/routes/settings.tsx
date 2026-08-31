import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, LogOut, RotateCcw } from "lucide-react";
import { AppScreen, bandLabel } from "@/components/lowkey/shell";
import { useLowkey, useTodayUsage } from "@/lib/lowkey/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "settings — lowkey social" },
      {
        name: "description",
        content: "set your daily limit, check your verified age band, or sign out of lowkey social.",
      },
      { property: "og:title", content: "settings — lowkey social" },
      { property: "og:description", content: "daily limit, age band and account settings." },
    ],
  }),
  component: SettingsPage,
});

const limits = [15, 30, 45, 60, 90, 120];

function SettingsPage() {
  const { me, setDailyLimit, signOut, reset } = useLowkey();
  const usage = useTodayUsage();
  const navigate = useNavigate();

  if (!me) return <AppScreen>{null}</AppScreen>;

  return (
    <AppScreen title="settings">
      <div className="flex flex-col gap-6 px-4 py-5">
        <h1 className="lowkey text-xl font-bold">settings</h1>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="lowkey flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 text-primary" /> age band
          </p>
          <p className="lowkey mt-1 text-sm text-muted-foreground">
            verified {me.ageBand ? bandLabel(me.ageBand) : "not yet"}
            {me.verifiedProvider ? ` via ${me.verifiedProvider.replace("_", " ")}` : ""}. bands
            can&apos;t be changed — you only ever see profiles, posts and chats in your own band.
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
                onClick={() => setDailyLimit(l)}
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

        <button
          onClick={() => {
            signOut();
            void navigate({ to: "/auth", replace: true });
          }}
          className="lowkey flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold"
        >
          <LogOut className="size-4" /> sign out
        </button>

        <button
          onClick={() => {
            reset();
            void navigate({ to: "/auth", replace: true });
          }}
          className="lowkey flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground"
        >
          <RotateCcw className="size-3.5" /> reset demo data
        </button>
      </div>
    </AppScreen>
  );
}
