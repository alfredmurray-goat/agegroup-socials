import { createFileRoute, Link } from "@tanstack/react-router";
import { BetaTag, FeedbackLink, LegalLinks, LowkeyMark } from "@/components/lowkey/shell";

const SITE = "https://lowkeysocial.alfredmurray.com";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "terms of use — lowkey social" },
      {
        name: "description",
        content:
          "the rules for using lowkey social: age bands, what you may post, moderation, eu consumer rights and how to close your account.",
      },
      { property: "og:title", content: "terms of use — lowkey social" },
      {
        property: "og:description",
        content: "age bands, posting rules, moderation and your eu rights on lowkey social.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/terms` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/terms` }],
  }),
  component: TermsPage,
});

const sections: { h: string; p: string }[] = [
  {
    h: "who runs lowkey",
    p: "lowkey social is an independent beta project run by alfred murray as the service provider and data controller. contact for anything legal, privacy or safety related is the email at the bottom of this page.",
  },
  {
    h: "the deal",
    p: "by making an account you agree to these terms and to the privacy notice. lowkey is free, has no ads inside the beta and gives you no guarantees of uptime, data retention or feature stability.",
  },
  {
    h: "who can join",
    p: "you need a working camera for the on-device age check. every account is placed in one of two bands: under 18 or 18+. you may not try to get into the wrong band, share an account, or use someone else's face for the check. lowkey is not for children under 13.",
  },
  {
    h: "the age split",
    p: "database rules keep the bands apart: under-18 accounts can only see under-18 profiles, posts and chats, and 18+ accounts only see 18+ ones. the band is set once by the age check and cannot be edited by you. if it is clearly wrong, email me and it gets corrected manually.",
  },
  {
    h: "what you may post",
    p: "your own content, nothing illegal. no sexual content involving minors, no nudity in the under-18 band, no harassment, threats, hate speech, self-harm encouragement, doxxing, spam, scams, malware or content you do not have the rights to. you keep ownership of what you post and give lowkey a limited licence to store and show it to your band.",
  },
  {
    h: "moderation and enforcement",
    p: "content or accounts that break these rules can be removed or suspended, with or without warning if there is a safety risk. you can ask for a decision to be reviewed by replying to the notice email. serious illegal content is reported to the competent authorities.",
  },
  {
    h: "your rights as an eu consumer",
    p: "nothing here limits your statutory rights under eu or danish consumer law. lowkey is a free service, so liability is limited to what the law allows and excludes indirect losses. mandatory local-law protections always apply.",
  },
  {
    h: "ending it",
    p: "you can delete your account and all of its content at any time from settings — the wipe is immediate and cascades to posts, comments, likes, messages and consents. i may end the beta or your access if the project shuts down or the rules are broken.",
  },
  {
    h: "changes and law",
    p: "these terms can change while the beta develops; material changes are shown in the app. danish law applies and the courts of denmark have jurisdiction, without removing your right to bring a case where you live.",
  },
];

function TermsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <LowkeyMark size={36} />
        <BetaTag />
      </div>

      <header>
        <h1 className="lowkey text-2xl font-extrabold">terms of use</h1>
        <p className="lowkey mt-2 text-sm text-muted-foreground">
          short, readable, eu shaped. last updated august 2026.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="lowkey text-sm font-bold">{s.h}</h2>
            <p className="lowkey mt-1 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>

      <p className="lowkey text-sm text-muted-foreground">
        questions or reports: <FeedbackLink />
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
