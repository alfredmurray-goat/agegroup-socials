import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Flame, MapPin, MessageCircle, ScanFace, ShieldCheck, Timer } from "lucide-react";
import { BetaTag, LowkeyMark, SiteFooter } from "@/components/lowkey/shell";

const SITE = "https://lowkeysocial.alfredmurray.com";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "lowkey_social — find people your age near you" },
      {
        name: "description",
        content:
          "lowkey_social is a chill social app for finding people your age in your area. under 18 only sees under 18, 18+ only sees 18+. birthday plus on-device face check.",
      },
      { property: "og:title", content: "lowkey_social — find people your age near you" },
      {
        property: "og:description",
        content: "meet people your age in your city. age-checked, split feeds, no caps, no pressure.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE }],
  }),
  component: Landing,
});

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

const features = [
  { icon: MapPin, title: "people your age, near you", body: "see who's in your city and your age band. city only, never your exact spot." },
  { icon: ShieldCheck, title: "a hard age split", body: "under 18 only ever sees under 18. 18+ only sees 18+. enforced in the database, not just the app." },
  { icon: ScanFace, title: "birthday + face check", body: "type your birthday, then a face model on your own phone checks it matches. nothing uploaded." },
  { icon: Flame, title: "friend streaks", body: "chat every day, keep the flame going. 1:1 or in group chats." },
  { icon: Timer, title: "a daily limit", body: "45 minutes a day for under 18s by default. resets at your local midnight." },
  { icon: MessageCircle, title: "no caps, no pressure", body: "no grammar police, no follower counts shoved in your face. just chill." },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <LowkeyMark size={34} />
          <span className="lowkey text-lg font-extrabold tracking-tight">lowkey_social</span>
          <BetaTag />
        </div>
        <Link
          to="/auth"
          className="lowkey min-h-11 content-center rounded-full border border-border bg-card px-5 text-sm font-bold transition-colors hover:bg-muted"
        >
          sign in
        </Link>
      </header>

      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pt-12 pb-20 text-center md:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 left-1/2 -z-0 size-[28rem] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl motion-safe:animate-[lk-pulse_6s_ease-in-out_infinite]"
        />
        <div className="relative motion-safe:animate-[lk-drop_0.9s_cubic-bezier(.2,1.4,.4,1)_both]">
          <LowkeyMark size={96} />
        </div>
        <h1 className="lowkey relative mt-6 max-w-3xl text-5xl leading-[1.02] font-extrabold tracking-tight md:text-7xl motion-safe:animate-[lk-up_0.8s_0.15s_ease-out_both]">
          find people your age,{" "}
          <span className="relative inline-block">
            <span className="relative z-10">near you</span>
            <span className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded-full bg-primary md:h-6 motion-safe:animate-[lk-grow_0.7s_0.7s_ease-out_both] origin-left" />
          </span>
          .
        </h1>
        <p className="lowkey relative mt-5 max-w-xl text-lg text-muted-foreground motion-safe:animate-[lk-up_0.8s_0.3s_ease-out_both]">
          a chill social app where under 18s and adults never mix. check your age once, then meet
          people in your city and your age band.
        </p>
        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row motion-safe:animate-[lk-up_0.8s_0.45s_ease-out_both]">
          <Link
            to="/auth"
            className="lowkey min-h-13 content-center rounded-full bg-primary px-8 py-4 text-base font-extrabold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
          >
            join the beta, it&apos;s free
          </Link>
          <a
            href="#how"
            className="lowkey min-h-13 content-center rounded-full px-6 py-4 text-base font-bold text-muted-foreground hover:text-foreground"
          >
            how it works ↓
          </a>
        </div>

        <div className="relative mt-16 grid w-full max-w-3xl grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ animationDelay: `${600 + i * 140}ms` }}
              className="motion-safe:animate-[lk-up_0.8s_ease-out_both]"
            >
              <div
                style={{ animationDelay: `${i * 0.8}s` }}
                className="aspect-[3/4] rounded-3xl border border-border bg-card p-3 shadow-md motion-safe:animate-[lk-float_5s_ease-in-out_infinite]"
              >
                <div
                  className="h-2/3 w-full rounded-2xl"
                  style={{
                    background: `linear-gradient(150deg, oklch(0.92 0.1 ${60 + i * 70}), oklch(0.8 0.13 ${100 + i * 70}))`,
                  }}
                />
                <div className="mt-3 h-2.5 w-3/4 rounded-full bg-muted" />
                <div className="mt-2 h-2.5 w-1/2 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-5xl px-5 py-16">
        <Reveal>
          <h2 className="lowkey text-center text-3xl font-extrabold md:text-4xl">two worlds, zero overlap</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            { band: "under 18", note: "only sees under 18 posts, profiles and chats" },
            { band: "18+", note: "only sees 18+ posts, profiles and chats" },
          ].map((b, i) => (
            <Reveal key={b.band} delay={i * 150}>
              <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
                <p className="text-6xl font-extrabold">{b.band}</p>
                <p className="lowkey mt-3 text-muted-foreground">{b.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 120}>
              <div className="h-full rounded-3xl bg-card p-6 shadow-sm transition-transform hover:-translate-y-1">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft">
                  <f.icon className="size-5" />
                </span>
                <h3 className="lowkey mt-4 text-lg font-bold">{f.title}</h3>
                <p className="lowkey mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <Reveal>
          <div className="rounded-[2.5rem] bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="lowkey text-3xl font-extrabold md:text-5xl">ready to be lowkey?</h2>
            <p className="lowkey mt-3 opacity-80">takes about two minutes. free, eu hosted, no ad trackers.</p>
            <Link
              to="/auth"
              className="lowkey mt-7 inline-flex min-h-13 items-center rounded-full bg-foreground px-8 py-4 font-extrabold text-background transition-transform hover:scale-105"
            >
              make my account
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
