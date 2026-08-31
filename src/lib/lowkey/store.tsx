import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { parseInstagramExport } from "./instagram";
import { prepareImage } from "./image";
import {
  dayKey,
  emptyState,
  type AgeBand,
  type Audience,
  type ThemePref,
  type LowkeyState,
  type Notif,
  type PostKind,
  type Profile,
  type VerificationProvider,
  type VerificationStatus,
} from "./types";

type Result = { ok: boolean; error?: string; needsEmailConfirm?: boolean };

interface ProfileDraft {
  handle: string;
  displayName: string;
  bio?: string;
  avatarHue?: number;
  pronouns?: string | null;
  city?: string | null;
}

interface OnboardingPrefs {
  interests?: string[];
  vibe?: string | null;
  contentPace?: string;
  quietHours?: boolean;
  dailyLimitMinutes?: number;
  bio?: string;
  displayName?: string;
  handle?: string;
  avatarHue?: number;
  pronouns?: string | null;
  city?: string | null;
  isPrivate?: boolean;
  allowDms?: Audience;
  allowComments?: Audience;
  hideFromSearch?: boolean;
  theme?: ThemePref;
  reduceMotion?: boolean;
}

export interface ImportProgress {
  done: number;
  total: number;
}

interface LowkeyApi {
  state: LowkeyState;
  me: Profile | null;
  /** true until the first load after auth resolves */
  loading: boolean;
  /** signed in with the backend but has no profile row yet */
  needsProfile: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (email: string, password: string) => Promise<Result>;
  signInWithGoogle: () => Promise<Result>;
  signOut: () => Promise<void>;
  createProfile: (draft: ProfileDraft) => Promise<Result>;
  updateProfile: (prefs: OnboardingPrefs) => Promise<Result>;
  finishOnboarding: () => Promise<Result>;
  verifyAge: (band: AgeBand, provider: VerificationProvider) => Promise<Result>;
  recordConsent: (kind: string) => Promise<void>;
  createPost: (input: {
    kind: PostKind;
    caption: string;
    mediaUrl: string | null;
    topic?: string | null;
  }) => Promise<string | null>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, body: string) => Promise<void>;
  toggleFollow: (profileId: string) => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<Result>;
  uploadMedia: (file: File) => Promise<{ path: string; url: string } | null>;
  startChat: (profileId: string) => Promise<string | null>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  markRead: (conversationId: string) => Promise<void>;
  setDailyLimit: (minutes: number) => Promise<void>;
  addUsageMinute: () => Promise<void>;
  refresh: () => Promise<void>;
  exportMyData: () => Promise<unknown>;
  deleteMyAccount: () => Promise<Result>;
  toggleBlock: (profileId: string) => Promise<void>;
  changeEmail: (email: string) => Promise<Result>;
  changePassword: (password: string) => Promise<Result>;
  signOutEverywhere: () => Promise<Result>;
  importFromInstagram: (
    file: File,
    onProgress?: (p: ImportProgress) => void,
  ) => Promise<{ ok: boolean; imported?: number; error?: string }>;
}

const LowkeyContext = createContext<LowkeyApi | null>(null);

/* ---------- row mappers ---------- */

type Row = Record<string, unknown>;

const SIGNED_TTL = 60 * 60 * 24 * 7;

/** storage paths are stored in the db; buckets are private so we sign them for reading */
async function signPaths(bucket: string, paths: (string | null)[]) {
  const map = new Map<string, string>();
  const uniq = [
    ...new Set(
      paths.filter(
        (p): p is string => Boolean(p) && !p!.startsWith("http") && !p!.startsWith("blob"),
      ),
    ),
  ];
  if (uniq.length === 0) return map;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(uniq, SIGNED_TTL);
  for (const d of data ?? []) {
    if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  }
  return map;
}

function resolve(map: Map<string, string>, value: string | null) {
  if (!value) return null;
  return map.get(value) ?? value;
}

function toProfile(r: Row): Profile {
  return {
    id: r['id'] as string,
    handle: r['handle'] as string,
    displayName: r['display_name'] as string,
    bio: (r['bio'] as string) ?? "",
    avatarHue: (r['avatar_hue'] as number) ?? 60,
    avatarUrl: (r['avatar_url'] as string | null) ?? null,
    ageBand: (r['age_band'] as AgeBand | null) ?? null,
    verificationStatus: (r['verification_status'] as VerificationStatus) ?? "unverified",
    verifiedProvider: (r['verified_provider'] as VerificationProvider | null) ?? null,
    dailyLimitMinutes: (r['daily_limit_minutes'] as number) ?? 45,
    isDemo: Boolean(r['is_demo']),
    interests: (r['interests'] as string[] | null) ?? [],
    vibe: (r['vibe'] as string | null) ?? null,
    pronouns: (r['pronouns'] as string | null) ?? null,
    city: (r['city'] as string | null) ?? null,
    contentPace: (r['content_pace'] as string) ?? "balanced",
    quietHours: Boolean(r['quiet_hours']),
    onboardedAt: (r['onboarded_at'] as string | null) ?? null,
    isPrivate: Boolean(r['is_private']),
    allowDms: (r['allow_dms'] as Audience) ?? "everyone",
    allowComments: (r['allow_comments'] as Audience) ?? "everyone",
    hideFromSearch: Boolean(r['hide_from_search']),
    theme: (r['theme'] as ThemePref) ?? "system",
    reduceMotion: Boolean(r['reduce_motion']),
    textScale: (r['text_scale'] as TextScale) ?? "normal",
    highContrast: Boolean(r['high_contrast']),
    boldText: Boolean(r['bold_text']),
  };
}

export function LowkeyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LowkeyState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const meIdRef = useRef<string | null>(null);

  const me = useMemo(
    () => state.profiles.find((p) => p.id === state.currentUserId) ?? null,
    [state.profiles, state.currentUserId],
  );
  meIdRef.current = me?.id ?? null;

  /** pulls everything the signed-in account is allowed to see (rls does the age wall) */
  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    setAuthUserId(user?.id ?? null);
    if (!user) {
      setState(emptyState);
      setNeedsProfile(false);
      setLoading(false);
      return;
    }

    const { data: mineRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!mineRow) {
      setState(emptyState);
      setNeedsProfile(true);
      setLoading(false);
      return;
    }
    setNeedsProfile(false);
    const mine = toProfile(mineRow as Row);

    const [
      profilesRes,
      postsRes,
      commentsRes,
      likesRes,
      followsRes,
      convRes,
      memberRes,
      messagesRes,
      usageRes,
      bookmarksRes,
      notifsRes,
      blocksRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("post_comments").select("*"),
      supabase.from("post_likes").select("*"),
      supabase.from("follows").select("*"),
      supabase.from("conversations").select("*"),
      supabase.from("conversation_members").select("*"),
      supabase.from("messages").select("*").order("created_at", { ascending: true }),
      supabase.from("daily_usage").select("*"),
      supabase.from("bookmarks").select("*"),
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase.from("blocks").select("*"),
    ]);

    const members = (memberRes.data ?? []) as Row[];
    const myLastRead = new Map<string, string>();
    for (const m of members) {
      if (m['profile_id'] === mine.id) {
        myLastRead.set(m['conversation_id'] as string, m['last_read_at'] as string);
      }
    }

    const profileRows = (profilesRes.data ?? []) as Row[];
    const postRows = (postsRes.data ?? []) as Row[];
    const [avatarUrls, mediaUrls] = await Promise.all([
      signPaths(
        "avatars",
        profileRows.map((r) => (r['avatar_url'] as string | null) ?? null),
      ),
      signPaths(
        "media",
        postRows.map((r) => (r['media_url'] as string | null) ?? null),
      ),
    ]);

    const profiles = profileRows
      .map(toProfile)
      .map((p) => ({ ...p, avatarUrl: resolve(avatarUrls, p.avatarUrl) }));
    if (!profiles.some((p) => p.id === mine.id)) {
      profiles.push({ ...mine, avatarUrl: resolve(avatarUrls, mine.avatarUrl) });
    }

    setState({
      currentUserId: mine.id,
      profiles,
      blocks: ((blocksRes.data ?? []) as Row[]).map((r) => r['blocked_id'] as string),
      bookmarks: ((bookmarksRes.data ?? []) as Row[]).map((r) => r['post_id'] as string),
      notifications: ((notifsRes.data ?? []) as Row[]).map((r) => ({
        id: r['id'] as string,
        recipientId: r['recipient_id'] as string,
        actorId: r['actor_id'] as string,
        kind: r['kind'] as Notif["kind"],
        postId: (r['post_id'] as string | null) ?? null,
        readAt: (r['read_at'] as string | null) ?? null,
        createdAt: r['created_at'] as string,
      })),
      posts: postRows.map((r) => ({
        id: r['id'] as string,
        authorId: r['author_id'] as string,
        kind: (r['kind'] as PostKind) ?? "post",
        caption: (r['caption'] as string) ?? "",
        posterHue: (r['poster_hue'] as number) ?? 60,
        mediaUrl: resolve(mediaUrls, (r['media_url'] as string | null) ?? null),
        taggedHandle: (r['tagged_handle'] as string | null) ?? null,
        topic: (r['topic'] as string | null) ?? null,
        ageBand: r['age_band'] as AgeBand,
        createdAt: r['created_at'] as string,
      })),
      comments: ((commentsRes.data ?? []) as Row[]).map((r) => ({
        id: r['id'] as string,
        postId: r['post_id'] as string,
        authorId: r['author_id'] as string,
        body: r['body'] as string,
        createdAt: r['created_at'] as string,
      })),
      likes: ((likesRes.data ?? []) as Row[]).map((r) => ({
        postId: r['post_id'] as string,
        profileId: r['profile_id'] as string,
      })),
      follows: ((followsRes.data ?? []) as Row[]).map((r) => ({
        followerId: r['follower_id'] as string,
        followingId: r['following_id'] as string,
      })),
      conversations: ((convRes.data ?? []) as Row[]).map((r) => ({
        id: r['id'] as string,
        ageBand: r['age_band'] as AgeBand,
        memberIds: members
          .filter((m) => m['conversation_id'] === r['id'])
          .map((m) => m['profile_id'] as string),
      })),
      messages: ((messagesRes.data ?? []) as Row[]).map((r) => {
        const conversationId = r['conversation_id'] as string;
        const lastRead = myLastRead.get(conversationId);
        const createdAt = r['created_at'] as string;
        return {
          id: r['id'] as string,
          conversationId,
          authorId: r['sender_id'] as string,
          body: r['body'] as string,
          createdAt,
          readByMe:
            r['sender_id'] === mine.id || (lastRead ? createdAt <= lastRead : false),
        };
      }),
      streaks: ((convRes.data ?? []) as Row[]).map((r) => ({
        conversationId: r['id'] as string,
        count: (r['streak_count'] as number) ?? 0,
        lastActiveDay: (r['streak_last_day'] as string | null) ?? "",
      })),
      usageDays: ((usageRes.data ?? []) as Row[]).map((r) => ({
        profileId: r['profile_id'] as string,
        day: r['day'] as string,
        minutes: (r['minutes'] as number) ?? 0,
      })),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  /* ---------- auth ---------- */

  const signIn = useCallback(async (email: string, password: string): Promise<Result> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, error: error.message.toLowerCase() };
    await refresh();
    return { ok: true };
  }, [refresh]);

  const signUp = useCallback(async (email: string, password: string): Promise<Result> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) return { ok: false, error: error.message.toLowerCase() };
    // no session means email confirmation is on: sign in explicitly if we can
    if (!data.session) {
      const retry = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (retry.error) {
        return { ok: true, needsEmailConfirm: true };
      }
    }
    await refresh();
    return { ok: true };
  }, [refresh]);

  const signInWithGoogle = useCallback(async (): Promise<Result> => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return { ok: false, error: "google sign in failed" };
    if (result.redirected) return { ok: true };
    await refresh();
    return { ok: true };
  }, [refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState(emptyState);
    setNeedsProfile(false);
  }, []);

  /* ---------- profile + onboarding ---------- */

  const createProfile = useCallback(
    async (draft: ProfileDraft): Promise<Result> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { ok: false, error: "sign in first" };
      const handle = draft.handle.trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9._]{3,20}$/.test(handle)) {
        return { ok: false, error: "handle: 3-20 letters, numbers, . or _" };
      }
      const { error } = await supabase.from("profiles").insert({
        user_id: auth.user.id,
        handle,
        display_name: draft.displayName.trim().toLowerCase() || handle,
        bio: draft.bio ?? "",
        avatar_hue: draft.avatarHue ?? Math.floor(Math.random() * 360),
        pronouns: draft.pronouns ?? null,
        city: draft.city ?? null,
      });
      if (error) {
        return {
          ok: false,
          error: error.code === "23505" ? "handle already taken" : error.message.toLowerCase(),
        };
      }
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const updateProfile = useCallback(
    async (prefs: OnboardingPrefs): Promise<Result> => {
      const id = meIdRef.current;
      if (!id) return { ok: false, error: "no profile yet" };
      const patch = {
        ...(prefs.interests ? { interests: prefs.interests } : {}),
        ...(prefs.vibe !== undefined ? { vibe: prefs.vibe } : {}),
        ...(prefs.contentPace ? { content_pace: prefs.contentPace } : {}),
        ...(prefs.quietHours !== undefined ? { quiet_hours: prefs.quietHours } : {}),
        ...(prefs.dailyLimitMinutes ? { daily_limit_minutes: prefs.dailyLimitMinutes } : {}),
        ...(prefs.bio !== undefined ? { bio: prefs.bio } : {}),
        ...(prefs.displayName ? { display_name: prefs.displayName.toLowerCase() } : {}),
        ...(prefs.avatarHue !== undefined ? { avatar_hue: prefs.avatarHue } : {}),
        ...(prefs.pronouns !== undefined ? { pronouns: prefs.pronouns } : {}),
        ...(prefs.city !== undefined ? { city: prefs.city } : {}),
        ...(prefs.handle ? { handle: prefs.handle.trim().toLowerCase().replace(/^@/, "") } : {}),
        ...(prefs.isPrivate !== undefined ? { is_private: prefs.isPrivate } : {}),
        ...(prefs.allowDms ? { allow_dms: prefs.allowDms } : {}),
        ...(prefs.allowComments ? { allow_comments: prefs.allowComments } : {}),
        ...(prefs.hideFromSearch !== undefined ? { hide_from_search: prefs.hideFromSearch } : {}),
        ...(prefs.theme ? { theme: prefs.theme } : {}),
        ...(prefs.reduceMotion !== undefined ? { reduce_motion: prefs.reduceMotion } : {}),
        ...(prefs.textScale ? { text_scale: prefs.textScale } : {}),
        ...(prefs.highContrast !== undefined ? { high_contrast: prefs.highContrast } : {}),
        ...(prefs.boldText !== undefined ? { bold_text: prefs.boldText } : {}),
      };
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) return { ok: false, error: error.message.toLowerCase() };
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const finishOnboarding = useCallback(async (): Promise<Result> => {
    const id = meIdRef.current;
    if (!id) return { ok: false, error: "no profile yet" };
    const { error } = await supabase
      .from("profiles")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message.toLowerCase() };
    await refresh();
    return { ok: true };
  }, [refresh]);

  const recordConsent = useCallback(async (kind: string) => {
    const id = meIdRef.current;
    if (!id) return;
    await supabase.from("consents").insert({ profile_id: id, kind });
  }, []);

  const verifyAge = useCallback(
    async (band: AgeBand, provider: VerificationProvider): Promise<Result> => {
      const id = meIdRef.current;
      if (!id) return { ok: false, error: "no profile yet" };
      const current = state.profiles.find((p) => p.id === id);
      // once verified the band is immutable
      const patch =
        current?.verificationStatus === "verified"
          ? { verification_status: "verified" }
          : {
              age_band: band,
              verification_status: "verified",
              verified_provider: provider,
              daily_limit_minutes: band === "under_18" ? 45 : 90,
            };
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) return { ok: false, error: error.message.toLowerCase() };
      await refresh();
      return { ok: true };
    },
    [refresh, state.profiles],
  );

  /* ---------- content ---------- */

  const createPost = useCallback(
    async (input: {
      kind: PostKind;
      caption: string;
      mediaUrl: string | null;
      topic?: string | null;
    }) => {
      const author = me;
      if (!author?.ageBand || author.verificationStatus !== "verified") return null;
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: author.id,
          kind: input.kind,
          caption: input.caption.toLowerCase(),
          media_url: input.mediaUrl,
          poster_hue: Math.floor(Math.random() * 360),
          topic: input.topic ?? null,
          // band is stamped from the author, and rls checks it again
          age_band: author.ageBand,
        })
        .select("id")
        .maybeSingle();
      if (error || !data) return null;
      await refresh();
      return (data as Row)['id'] as string;
    },
    [me, refresh],
  );

  /** notify the other person, unless it's about my own content */
  const notify = useCallback(
    async (recipientId: string, kind: Notif["kind"], postId?: string | null) => {
      const id = meIdRef.current;
      if (!id || recipientId === id) return;
      await supabase.from("notifications").insert({
        recipient_id: recipientId,
        actor_id: id,
        kind,
        post_id: postId ?? null,
      });
    },
    [],
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const id = meIdRef.current;
      if (!id) return;
      const has = state.likes.some((l) => l.postId === postId && l.profileId === id);
      // optimistic so the heart flips instantly
      setState((s) => ({
        ...s,
        likes: has
          ? s.likes.filter((l) => !(l.postId === postId && l.profileId === id))
          : [...s.likes, { postId, profileId: id }],
      }));
      const { error } = has
        ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("profile_id", id)
        : await supabase.from("post_likes").insert({ post_id: postId, profile_id: id });
      if (error) {
        await refresh();
        return;
      }
      if (!has) {
        const author = state.posts.find((p) => p.id === postId)?.authorId;
        if (author) await notify(author, "like", postId);
      }
    },
    [refresh, notify, state.likes, state.posts],
  );

  const addComment = useCallback(
    async (postId: string, body: string) => {
      const id = meIdRef.current;
      if (!id || !body.trim()) return;
      const text = body.trim().toLowerCase();
      const { data, error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, author_id: id, body: text })
        .select("id, created_at")
        .maybeSingle();
      if (error || !data) return;
      const row = data as Row;
      setState((s) => ({
        ...s,
        comments: [
          ...s.comments,
          {
            id: row['id'] as string,
            postId,
            authorId: id,
            body: text,
            createdAt: row['created_at'] as string,
          },
        ],
      }));
      const author = state.posts.find((p) => p.id === postId)?.authorId;
      if (author) await notify(author, "comment", postId);
    },
    [notify, state.posts],
  );

  const toggleFollow = useCallback(
    async (profileId: string) => {
      const id = meIdRef.current;
      if (!id || id === profileId) return;
      const has = state.follows.some((f) => f.followerId === id && f.followingId === profileId);
      setState((s) => ({
        ...s,
        follows: has
          ? s.follows.filter((f) => !(f.followerId === id && f.followingId === profileId))
          : [...s.follows, { followerId: id, followingId: profileId }],
      }));
      const { error } = has
        ? await supabase
            .from("follows")
            .delete()
            .eq("follower_id", id)
            .eq("following_id", profileId)
        : await supabase.from("follows").insert({ follower_id: id, following_id: profileId });
      if (error) {
        await refresh();
        return;
      }
      if (!has) await notify(profileId, "follow");
    },
    [refresh, notify, state.follows],
  );

  const toggleBookmark = useCallback(
    async (postId: string) => {
      const id = meIdRef.current;
      if (!id) return;
      const has = state.bookmarks.includes(postId);
      setState((s) => ({
        ...s,
        bookmarks: has ? s.bookmarks.filter((b) => b !== postId) : [...s.bookmarks, postId],
      }));
      const { error } = has
        ? await supabase.from("bookmarks").delete().eq("post_id", postId).eq("profile_id", id)
        : await supabase.from("bookmarks").insert({ post_id: postId, profile_id: id });
      if (error) await refresh();
    },
    [refresh, state.bookmarks],
  );

  const markNotificationsRead = useCallback(async () => {
    const id = meIdRef.current;
    if (!id) return;
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, readAt: n.readAt ?? now })),
    }));
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("recipient_id", id)
      .is("read_at", null);
  }, []);

  /* ---------- uploads (private buckets, read through signed urls) ---------- */

  const uploadAvatar = useCallback(
    async (raw: File): Promise<Result> => {
      const id = meIdRef.current;
      const { data: auth } = await supabase.auth.getUser();
      if (!id || !auth.user) return { ok: false, error: "sign in first" };
      // phone photos are big and often heic, so re-encode to a small jpeg first
      const file = await prepareImage(raw);
      if (file.size > 15_000_000) return { ok: false, error: "that photo is too big" };
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${auth.user.id}/avatar-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) return { ok: false, error: up.error.message.toLowerCase() };
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", id);
      if (error) return { ok: false, error: error.message.toLowerCase() };
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const uploadMedia = useCallback(async (raw: File) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const file = raw.type.startsWith("video/") ? raw : await prepareImage(raw);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${auth.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const up = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (up.error) return null;
    const signed = await supabase.storage.from("media").createSignedUrl(path, SIGNED_TTL);
    return { path, url: signed.data?.signedUrl ?? "" };
  }, []);


  const startChat = useCallback(
    async (profileId: string) => {
      const mine = me;
      if (!mine?.ageBand || profileId === mine.id) return null;
      const existing = state.conversations.find(
        (c) => c.memberIds.includes(mine.id) && c.memberIds.includes(profileId),
      );
      if (existing) return existing.id;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ age_band: mine.ageBand })
        .select("id")
        .maybeSingle();
      if (error || !data) return null;
      const conversationId = (data as Row)['id'] as string;
      await supabase.from("conversation_members").insert([
        { conversation_id: conversationId, profile_id: mine.id },
        { conversation_id: conversationId, profile_id: profileId },
      ]);
      await refresh();
      return conversationId;
    },
    [me, refresh, state.conversations],
  );

  const sendMessage = useCallback(
    async (conversationId: string, body: string) => {
      const id = meIdRef.current;
      if (!id || !body.trim()) return;
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: id, body: body.trim() });
      if (error) return;
      // friend streak: +1 for a new day in a row, reset when a day was missed
      const today = dayKey();
      const yesterday = dayKey(new Date(Date.now() - 86_400_000));
      const streak = state.streaks.find((s) => s.conversationId === conversationId);
      if (!streak || streak.lastActiveDay !== today) {
        const next = streak && streak.lastActiveDay === yesterday ? streak.count + 1 : 1;
        await supabase
          .from("conversations")
          .update({ streak_count: next, streak_last_day: today })
          .eq("id", conversationId);
      }
      await supabase
        .from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("profile_id", id);
      await refresh();
    },
    [refresh, state.streaks],
  );

  const markRead = useCallback(
    async (conversationId: string) => {
      const id = meIdRef.current;
      if (!id) return;
      await supabase
        .from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("profile_id", id);
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.conversationId === conversationId ? { ...m, readByMe: true } : m,
        ),
      }));
    },
    [],
  );

  const setDailyLimit = useCallback(
    async (minutes: number) => {
      const id = meIdRef.current;
      if (!id) return;
      await supabase.from("profiles").update({ daily_limit_minutes: minutes }).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const addUsageMinute = useCallback(async () => {
    const id = meIdRef.current;
    if (!id) return;
    const day = dayKey();
    const current = state.usageDays.find((u) => u.profileId === id && u.day === day);
    const minutes = (current?.minutes ?? 0) + 1;
    await supabase
      .from("daily_usage")
      .upsert({ profile_id: id, day, minutes }, { onConflict: "profile_id,day" });
    setState((s) => ({
      ...s,
      usageDays: current
        ? s.usageDays.map((u) => (u.profileId === id && u.day === day ? { ...u, minutes } : u))
        : [...s.usageDays, { profileId: id, day, minutes }],
    }));
  }, [state.usageDays]);

  /* ---------- gdpr ---------- */

  const exportMyData = useCallback(async () => {
    const id = meIdRef.current;
    if (!id) return null;
    const [profile, posts, comments, likes, follows, messages, usage, consents] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("posts").select("*").eq("author_id", id),
        supabase.from("post_comments").select("*").eq("author_id", id),
        supabase.from("post_likes").select("*").eq("profile_id", id),
        supabase.from("follows").select("*").eq("follower_id", id),
        supabase.from("messages").select("*").eq("sender_id", id),
        supabase.from("daily_usage").select("*").eq("profile_id", id),
        supabase.from("consents").select("*").eq("profile_id", id),
      ]);
    return {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      posts: posts.data,
      comments: comments.data,
      likes: likes.data,
      follows: follows.data,
      messages: messages.data,
      usage: usage.data,
      consents: consents.data,
    };
  }, []);

  const deleteMyAccount = useCallback(async (): Promise<Result> => {
    const id = meIdRef.current;
    if (!id) return { ok: false, error: "nothing to delete" };
    // deleting the profile row cascades every post, message, like and consent
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return { ok: false, error: error.message.toLowerCase() };
    await supabase.auth.signOut();
    setState(emptyState);
    setNeedsProfile(false);
    return { ok: true };
  }, []);

  /* ---------- blocking + account ---------- */

  const toggleBlock = useCallback(
    async (profileId: string) => {
      const id = meIdRef.current;
      if (!id || profileId === id) return;
      const has = state.blocks.includes(profileId);
      setState((s) => ({
        ...s,
        blocks: has ? s.blocks.filter((b) => b !== profileId) : [...s.blocks, profileId],
      }));
      const { error } = has
        ? await supabase.from("blocks").delete().eq("blocker_id", id).eq("blocked_id", profileId)
        : await supabase.from("blocks").insert({ blocker_id: id, blocked_id: profileId });
      if (error) await refresh();
    },
    [refresh, state.blocks],
  );

  const changeEmail = useCallback(async (email: string): Promise<Result> => {
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) return { ok: false, error: error.message.toLowerCase() };
    return { ok: true };
  }, []);

  const changePassword = useCallback(async (password: string): Promise<Result> => {
    if (password.length < 6) return { ok: false, error: "at least 6 characters" };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message.toLowerCase() };
    return { ok: true };
  }, []);

  const signOutEverywhere = useCallback(async (): Promise<Result> => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) return { ok: false, error: error.message.toLowerCase() };
    setState(emptyState);
    return { ok: true };
  }, []);

  /* ---------- instagram data-export import (real posts, no meta app needed) ---------- */

  const importFromInstagram = useCallback(
    async (file: File, onProgress?: (p: ImportProgress) => void) => {
      const author = me;
      if (!author?.ageBand || author.verificationStatus !== "verified") {
        return { ok: false, error: "verify your age first" };
      }
      let items;
      try {
        items = await parseInstagramExport(file);
      } catch {
        return { ok: false, error: "couldn't read that export file" };
      }
      if (items.length === 0) {
        return { ok: false, error: "no posts found in that export" };
      }

      let imported = 0;
      for (const [index, item] of items.entries()) {
        onProgress?.({ done: index, total: items.length });
        let mediaPath: string | null = null;
        if (item.file) {
          const up = await uploadMedia(item.file);
          if (!up) continue;
          mediaPath = up.path;
        }
        const { error } = await supabase.from("posts").insert({
          author_id: author.id,
          kind: item.kind,
          caption: item.caption.toLowerCase().slice(0, 2000),
          media_url: mediaPath,
          poster_hue: Math.floor(Math.random() * 360),
          age_band: author.ageBand,
          created_at: item.createdAt,
          source: "instagram",
        });
        if (!error) imported += 1;
      }
      onProgress?.({ done: items.length, total: items.length });
      await refresh();
      return imported > 0
        ? { ok: true, imported }
        : { ok: false, error: "nothing could be imported" };
    },
    [me, refresh, uploadMedia],
  );

  /* ---------- appearance preferences ---------- */

  useEffect(() => {
    const root = document.documentElement;
    const pref = me?.theme ?? "system";
    const dark =
      pref === "dark" ||
      (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", dark);
    root.classList.toggle("reduce-motion", Boolean(me?.reduceMotion));

    // low-vision prefs. cached locally too, so they apply on the very next load
    // before the profile has finished fetching.
    const scale = me?.textScale ?? (localStorage.getItem("lowkey.textScale") as TextScale | null) ?? "normal";
    const contrast = me ? me.highContrast : localStorage.getItem("lowkey.highContrast") === "1";
    const bold = me ? me.boldText : localStorage.getItem("lowkey.boldText") === "1";
    for (const s of ["large", "larger", "largest"]) root.classList.toggle(`text-${s}`, scale === s);
    root.classList.toggle("high-contrast", contrast);
    root.classList.toggle("bold-text", bold);
    if (me) {
      localStorage.setItem("lowkey.textScale", me.textScale);
      localStorage.setItem("lowkey.highContrast", me.highContrast ? "1" : "0");
      localStorage.setItem("lowkey.boldText", me.boldText ? "1" : "0");
    }
  }, [me?.theme, me?.reduceMotion, me?.textScale, me?.highContrast, me?.boldText, me]);

  /* ---------- live notifications ---------- */

  useEffect(() => {
    const myId = me?.id;
    if (!myId) return;
    const channel = supabase
      .channel(`notifications:${myId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${myId}`,
        },
        (payload) => {
          const row = payload.new as Row;
          const notif: Notif = {
            id: row['id'] as string,
            recipientId: row['recipient_id'] as string,
            actorId: row['actor_id'] as string,
            kind: row['kind'] as Notif["kind"],
            postId: (row['post_id'] as string | null) ?? null,
            readAt: null,
            createdAt: row['created_at'] as string,
          };
          setState((s) => ({ ...s, notifications: [notif, ...s.notifications] }));
          const actor = state.profiles.find((p) => p.id === notif.actorId);
          const who = actor ? `@${actor.handle}` : "someone";
          if (notif.kind === "follow") {
            const alreadyBack = state.follows.some(
              (f) => f.followerId === myId && f.followingId === notif.actorId,
            );
            toast(`${who} followed you`, {
              description: alreadyBack ? "you follow them too" : "do you want to follow back?",
              ...(alreadyBack
                ? {}
                : {
                    action: {
                      label: "follow back",
                      onClick: () => void toggleFollow(notif.actorId),
                    },
                  }),
            });
          } else {
            toast(`${who} ${notif.kind === "like" ? "liked" : "commented on"} your post`);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [me?.id, state.profiles, state.follows, toggleFollow]);

  const value = useMemo<LowkeyApi>(
    () => ({
      state,
      me,
      loading,
      needsProfile: needsProfile && Boolean(authUserId),
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      createProfile,
      updateProfile,
      finishOnboarding,
      verifyAge,
      recordConsent,
      createPost,
      toggleLike,
      addComment,
      toggleFollow,
      toggleBookmark,
      markNotificationsRead,
      uploadAvatar,
      uploadMedia,
      startChat,
      sendMessage,
      markRead,
      setDailyLimit,
      addUsageMinute,
      refresh,
      exportMyData,
      deleteMyAccount,
      toggleBlock,
      changeEmail,
      changePassword,
      signOutEverywhere,
      importFromInstagram,
    }),
    [
      state,
      me,
      loading,
      needsProfile,
      authUserId,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      createProfile,
      updateProfile,
      finishOnboarding,
      verifyAge,
      recordConsent,
      createPost,
      toggleLike,
      addComment,
      toggleFollow,
      toggleBookmark,
      markNotificationsRead,
      uploadAvatar,
      uploadMedia,
      startChat,
      sendMessage,
      markRead,
      setDailyLimit,
      addUsageMinute,
      refresh,
      exportMyData,
      deleteMyAccount,
      toggleBlock,
      changeEmail,
      changePassword,
      signOutEverywhere,
      importFromInstagram,
    ],
  );

  return <LowkeyContext.Provider value={value}>{children}</LowkeyContext.Provider>;
}

export function useLowkey() {
  const ctx = useContext(LowkeyContext);
  if (!ctx) throw new Error("useLowkey must be used inside LowkeyProvider");
  return ctx;
}

/* ---------- derived selectors: the age wall is also enforced in the database ---------- */

export function useBandProfiles() {
  const { state, me } = useLowkey();
  return useMemo(
    () => (me?.ageBand ? state.profiles.filter((p) => p.ageBand === me.ageBand) : []),
    [state.profiles, me],
  );
}

export function useBandPosts(kind?: PostKind) {
  const { state, me } = useLowkey();
  return useMemo(() => {
    if (!me?.ageBand) return [];
    const interests = me.interests ?? [];
    return state.posts
      .filter((p) => p.ageBand === me.ageBand && (!kind || p.kind === kind))
      .sort((a, b) => {
        // your onboarding interests float to the top, then newest first
        const score = (p: typeof a) => (p.topic && interests.includes(p.topic) ? 1 : 0);
        const diff = score(b) - score(a);
        return diff !== 0 ? diff : b.createdAt.localeCompare(a.createdAt);
      });
  }, [state.posts, me, kind]);
}

export function useMyConversations() {
  const { state, me } = useLowkey();
  return useMemo(() => {
    if (!me?.ageBand) return [];
    return state.conversations
      .filter((c) => c.memberIds.includes(me.id) && c.ageBand === me.ageBand)
      .map((c) => {
        const otherId = c.memberIds.find((id) => id !== me.id) ?? me.id;
        const other = state.profiles.find((p) => p.id === otherId) ?? me;
        const msgs = state.messages
          .filter((m) => m.conversationId === c.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const streak = state.streaks.find((s) => s.conversationId === c.id);
        return {
          conversation: c,
          other,
          lastMessage: msgs[msgs.length - 1] ?? null,
          unread: msgs.some((m) => m.authorId !== me.id && !m.readByMe),
          streak: streak?.count ?? 0,
        };
      })
      .sort((a, b) =>
        (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? ""),
      );
  }, [state, me]);
}

export function useTodayUsage() {
  const { state, me } = useLowkey();
  return useMemo(() => {
    if (!me) return { minutes: 0, limit: 45, reached: false };
    const day = dayKey();
    const minutes =
      state.usageDays.find((u) => u.profileId === me.id && u.day === day)?.minutes ?? 0;
    return {
      minutes,
      limit: me.dailyLimitMinutes,
      reached: minutes >= me.dailyLimitMinutes,
    };
  }, [state.usageDays, me]);
}
