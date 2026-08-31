import { createFileRoute, Link } from "@tanstack/react-router";
import { BetaTag, FeedbackLink, LegalLinks, LowkeyMark } from "@/components/lowkey/shell";

const SITE = "https://lowkeysocial.alfredmurray.com";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "cookie and storage notice — lowkey social" },
      {
        name: "description",
        content:
          "exactly what lowkey social stores in your browser: sign-in tokens, your consent choice and onboarding progress. no ad trackers, no third-party analytics.",
      },
      { property: "og:title", content: "cookie and storage notice — lowkey social" },
      {
        property: "og:description",
        content: "every cookie and storage key lowkey uses, and why. no ad trackers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/cookies` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/cookies` }],
  }),
  component: CookiesPage,
});

const rows: { name: string; purpose: string; kind: string; life: string }[] = [
  {
    name: "sign-in token (local storage)",
    purpose: "keeps you logged in between visits and authenticates your database requests",
    kind: "strictly necessary",
    life: "until you sign out or it expires",
  },
  {
    name: "lowkey.cookies",
    purpose: "remembers the choice you made in the storage notice, so it stops asking",
    kind: "strictly necessary",
    life: "until you clear browser data",
  },
  {
    name: "onboarding step (session storage)",
    purpose: "keeps your place in the sign-up steps if the page reloads",
    kind: "strictly necessary",
    life: "until the tab closes",
  },
  {
    name: "face model cache (browser cache)",
    purpose:
      "caches the open-source age-estimation model file so the check does not download it twice",
    kind: "functional",
    life: "normal browser cache lifetime",
  },
];

const sections: { h: string; p: string }[] = [
  {
    h: "the short version",
    p: "lowkey only uses storage it needs to work. there are no advertising cookies, no third-party analytics, no fingerprinting and no cross-site tracking, so there is nothing here to sell or share.",
  },
  {
    h: "why we can use these without consent",
    p: "under the eu eprivacy rules, storage that is strictly necessary to deliver a service you asked for does not need consent. the notice you see on first visit is there for transparency and to record that you saw it — not to unlock tracking.",
  },
  {
    h: "the age check",
    p: "the face age check downloads a model into your browser and runs it there. camera frames are processed in memory only: no image, no video and no biometric template is stored on your device or sent to a server.",
  },
  {
    h: "how to clear it",
    p: "sign out to drop the session token, or clear site data in your browser to remove everything above. clearing storage signs you out but does not delete your account — use delete my account in settings for that.",
  },
];

function CookiesPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <LowkeyMark size={36} />
        <BetaTag />
      </div>

      <header>
        <h1 className="lowkey text-2xl font-extrabold">cookie and storage notice</h1>
        <p className="lowkey mt-2 text-sm text-muted-foreground">
          every key lowkey keeps in your browser, listed. last updated august 2026.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.name} className="rounded-2xl border border-border bg-card p-4">
            <p className="lowkey text-sm font-bold">{r.name}</p>
            <p className="lowkey mt-1 text-sm text-muted-foreground">{r.purpose}</p>
            <p className="lowkey mt-2 text-xs text-muted-foreground">
              {r.kind} · kept {r.life}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="lowkey text-sm font-bold">{s.h}</h2>
            <p className="lowkey mt-1 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>

      <p className="lowkey text-sm text-muted-foreground">
        questions: <FeedbackLink />
      </p>

      <LegalLinks />

      <Link
        to="/settings"
        className="lowkey rounded-full border border-border bg-card py-3 text-center text-sm font-semibold"
      >
        back to settings
      </Link>
    </div>
  );
}
