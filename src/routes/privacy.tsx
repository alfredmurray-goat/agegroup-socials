import { createFileRoute, Link } from "@tanstack/react-router";
import { BetaTag, FeedbackLink, LowkeyMark } from "@/components/lowkey/shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "privacy notice — lowkey social" },
      {
        name: "description",
        content:
          "how lowkey social handles your data: eu hosting, on-device age checks, export and delete any time, gdpr rights explained.",
      },
      { property: "og:title", content: "privacy notice — lowkey social" },
      {
        property: "og:description",
        content: "eu hosting, on-device age checks, export and delete any time.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections: { h: string; p: string }[] = [
  {
    h: "who's behind it",
    p: "lowkey social is an independent beta project run by alfred murray. i'm the data controller. questions, complaints or requests go straight to me.",
  },
  {
    h: "what gets stored",
    p: "your email and password hash (handled by the auth service), your profile (handle, name, bio, avatar colour, pronouns and city if you add them), your interests, vibe, feed pace and daily limit, your posts, likes, comments, follows, chats and messages, your daily minutes used, and your age band with the method used to verify it.",
  },
  {
    h: "the age check never leaves your device",
    p: "the free face age check downloads a small open-source model into your browser and estimates an age locally. no photo, video, frame or face template is uploaded or stored, ever. we only save the result: 'under 18' or '18+', plus which method produced it. eu eid options (mitid, altid, eu identity wallet) return an age band only — never your name, address or id number. eid handshakes are simulated in this beta.",
  },
  {
    h: "legal bases (gdpr art. 6)",
    p: "contract: running your account, feed, chats and streaks. legal obligation and protection of minors: verifying your age band and keeping under-18s and adults apart. consent: using your camera for the face age check, which you give before the camera opens and can refuse by using an eid instead. legitimate interest: keeping the beta secure and abuse-free.",
  },
  {
    h: "the age split",
    p: "your age band is enforced in the database itself, not just in the app. under-18 accounts cannot read adult profiles, posts, comments or messages, and adults cannot read under-18 content. bands are immutable once verified — ask me if a verification went wrong.",
  },
  {
    h: "where it lives and who sees it",
    p: "data is stored in the eu on managed postgres infrastructure. no data is sold, no ad networks are wired in, and no third-party trackers or analytics run in the app. only i can access the database, for support and moderation.",
  },
  {
    h: "how long it's kept",
    p: "until you delete it. deleting your account wipes your profile, posts, likes, comments, follows, memberships, messages, usage rows and consent records immediately. as this is a beta, i may reset all demo data between presentations.",
  },
  {
    h: "your rights",
    p: "access, rectification, erasure, restriction, portability and objection. 'export my data' in settings gives you a machine-readable json copy instantly, and 'delete my account' erases everything. you can also complain to your national data protection authority (in denmark, datatilsynet).",
  },
  {
    h: "children",
    p: "under-18 accounts are supported on purpose and are separated from adult accounts by design. we ask for no more data from minors than from adults, and there's no profiling for advertising.",
  },
  {
    h: "beta caveat",
    p: "lowkey social is an early beta shown at demos. features, wording and data handling can change, and age estimates can be wrong. tell me anything that looks off.",
  },
];

function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <LowkeyMark size={36} />
        <BetaTag />
      </div>

      <header>
        <h1 className="lowkey text-2xl font-extrabold">privacy notice</h1>
        <p className="lowkey mt-2 text-sm text-muted-foreground">
          plain english, no dark patterns. eu hosted, gdpr shaped.
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
        contact and beta feedback: <FeedbackLink />
      </p>

      <section>
        <h2 className="lowkey text-sm font-bold">the other legal pages</h2>
        <div className="mt-2 flex flex-col gap-2">
          <Link
            to="/terms"
            className="lowkey rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold"
          >
            terms of use →
          </Link>
          <Link
            to="/cookies"
            className="lowkey rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold"
          >
            cookie and storage notice →
          </Link>
        </div>
      </section>

      <Link
        to="/settings"
        className="lowkey rounded-full border border-border bg-card py-3 text-center text-sm font-semibold"
      >
        back to settings
      </Link>
    </div>
  );
}
