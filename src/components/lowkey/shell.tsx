import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Flame, House, MessageCircle, Plus, Play, User, Search } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLowkey, useTodayUsage } from "@/lib/lowkey/store";
import logoAsset from "@/assets/lowkey-logo.png.asset.json";

export function Avatar({
  hue,
  label,
  size = 40,
  ring,
}: {
  hue: number;
  label: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-foreground/80",
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: `oklch(0.86 0.09 ${hue})`,
      }}
    >
      {label.slice(0, 1)}
    </span>
  );
}

export function Poster({
  hue,
  caption,
  aspect = "square",
  mediaUrl,
}: {
  hue: number;
  caption: string;
  aspect?: "square" | "tall";
  mediaUrl?: string | null;
}) {
  if (mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt={caption}
        loading="lazy"
        className={cn(
          "w-full rounded-2xl object-cover",
          aspect === "square" ? "aspect-square" : "aspect-[9/16]",
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex w-full items-end rounded-2xl p-4",
        aspect === "square" ? "aspect-square" : "aspect-[9/16]",
      )}
      style={{
        background: `linear-gradient(150deg, oklch(0.9 0.11 ${hue}), oklch(0.78 0.13 ${hue + 40}))`,
      }}
    >
      <p className="lowkey text-lg leading-tight font-medium text-foreground/70">{caption}</p>
    </div>
  );
}

export function StreakPill({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-streak">
      <Flame className="size-3.5" /> {count}
    </span>
  );
}

export function LowkeyMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src={logoAsset.url}
      alt="lowkey social logo"
      width={size}
      height={size}
      className="rounded-xl"
      style={{ width: size, height: size }}
    />
  );
}

export function BetaTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "lowkey rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground",
        className,
      )}
    >
      beta
    </span>
  );
}

export const FEEDBACK_EMAIL = "alfredcasper1010@gmail.com";

export function FeedbackLink({ className }: { className?: string }) {
  return (
    <a
      href={`mailto:${FEEDBACK_EMAIL}?subject=lowkey social beta feedback`}
      className={cn("lowkey font-semibold underline underline-offset-2", className)}
    >
      {FEEDBACK_EMAIL}
    </a>
  );
}

export function TopBar({ title = "lowkey social" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <LowkeyMark size={28} />
        <span className="lowkey text-lg leading-5 font-bold tracking-tight">{title}</span>
        <BetaTag />
      </Link>
      <Link
        to="/search"
        aria-label="search"
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-5" />
      </Link>
    </header>
  );
}

const tabs = [
  { to: "/", label: "home", icon: House },
  { to: "/chats", label: "chats", icon: MessageCircle },
  { to: "/create", label: "create", icon: Plus },
  { to: "/videos", label: "videos", icon: Play },
  { to: "/profile", label: "profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    active && "bg-primary text-primary-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="lowkey text-[10px]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DailyLimitReached() {
  const { me } = useLowkey();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary-soft text-3xl">
        🌙
      </div>
      <h1 className="lowkey text-2xl font-bold">that&apos;s enough for today</h1>
      <p className="lowkey text-sm text-muted-foreground">
        you hit your {me?.dailyLimitMinutes} minute daily limit. lowkey is still here tomorrow.
      </p>
      <Link
        to="/settings"
        className="lowkey rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        change my limit
      </Link>
    </div>
  );
}

/**
 * account + age-verification gate, plus the daily usage clock.
 * client-side only for now; becomes a route guard once Cloud auth is on.
 */
export function AppScreen({
  children,
  chrome = true,
  title,
}: {
  children: ReactNode;
  chrome?: boolean;
  title?: string;
}) {
  const { me, addUsageMinute } = useLowkey();
  const usage = useTodayUsage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!me) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (me.verificationStatus !== "verified" || !me.ageBand) {
      void navigate({ to: "/verify", replace: true });
    }
  }, [me, navigate]);

  useEffect(() => {
    if (!me) return;
    const id = window.setInterval(() => addUsageMinute(), 60_000);
    return () => window.clearInterval(id);
  }, [me, addUsageMinute]);

  if (!me || me.verificationStatus !== "verified" || !me.ageBand) {
    return <div className="min-h-screen bg-background" />;
  }

  if (usage.reached) return <DailyLimitReached />;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      {chrome && <TopBar {...(title ? { title } : {})} />}
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

export function bandLabel(band: "under_18" | "adult") {
  return band === "under_18" ? "under 18" : "18+";
}
