import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { makeSeed } from "./seed";
import {
  dayKey,
  type AgeBand,
  type LowkeyState,
  type PostKind,
  type Profile,
  type VerificationProvider,
} from "./types";

const STORAGE_KEY = "lowkey-social-state-v1";

/** swap point: when Lovable Cloud is enabled these become server functions. */
interface LowkeyApi {
  state: LowkeyState;
  me: Profile | null;
  signIn: (handle: string) => { ok: boolean; error?: string };
  signUp: (handle: string, displayName: string) => { ok: boolean; error?: string };
  signOut: () => void;
  verifyAge: (band: AgeBand, provider: VerificationProvider) => void;
  createPost: (input: { kind: PostKind; caption: string; mediaUrl: string | null }) => string | null;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, body: string) => void;
  toggleFollow: (profileId: string) => void;
  sendMessage: (conversationId: string, body: string) => void;
  markRead: (conversationId: string) => void;
  setDailyLimit: (minutes: number) => void;
  addUsageMinute: () => void;
  reset: () => void;
}

const LowkeyContext = createContext<LowkeyApi | null>(null);

const rid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

function load(): LowkeyState {
  if (typeof window === "undefined") return makeSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeSeed();
    const parsed = JSON.parse(raw) as LowkeyState;
    if (!parsed || !Array.isArray(parsed.profiles)) return makeSeed();
    return parsed;
  } catch {
    return makeSeed();
  }
}

export function LowkeyProvider({ children }: { children: ReactNode }) {
  // seed is built lazily; never at module scope
  const [state, setState] = useState<LowkeyState>(() => makeSeed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — session stays in memory */
    }
  }, [state, hydrated]);

  const me = useMemo(
    () => state.profiles.find((p) => p.id === state.currentUserId) ?? null,
    [state.profiles, state.currentUserId],
  );

  const signIn = useCallback((handle: string) => {
    const clean = handle.trim().toLowerCase().replace(/^@/, "");
    let result: { ok: boolean; error?: string } = { ok: true };
    setState((s) => {
      const found = s.profiles.find((p) => p.handle === clean);
      if (!found) {
        result = { ok: false, error: "no account with that handle" };
        return s;
      }
      return { ...s, currentUserId: found.id };
    });
    return result;
  }, []);

  const signUp = useCallback((handle: string, displayName: string) => {
    const clean = handle.trim().toLowerCase().replace(/^@/, "");
    let result: { ok: boolean; error?: string } = { ok: true };
    if (!/^[a-z0-9._]{3,20}$/.test(clean)) {
      return { ok: false, error: "handle: 3-20 letters, numbers, . or _" };
    }
    setState((s) => {
      if (s.profiles.some((p) => p.handle === clean)) {
        result = { ok: false, error: "handle already taken" };
        return s;
      }
      const profile: Profile = {
        id: rid("u"),
        handle: clean,
        displayName: displayName.trim().toLowerCase() || clean,
        bio: "",
        avatarHue: Math.floor(Math.random() * 360),
        ageBand: null,
        verificationStatus: "unverified",
        verifiedProvider: null,
        dailyLimitMinutes: 45,
        isDemo: false,
      };
      return { ...s, profiles: [...s.profiles, profile], currentUserId: profile.id };
    });
    return result;
  }, []);

  const signOut = useCallback(() => setState((s) => ({ ...s, currentUserId: null })), []);

  const verifyAge = useCallback((band: AgeBand, provider: VerificationProvider) => {
    setState((s) => {
      if (!s.currentUserId) return s;
      const profiles = s.profiles.map((p) =>
        p.id === s.currentUserId
          ? {
              ...p,
              // once verified the band is immutable
              ageBand: p.verificationStatus === "verified" ? p.ageBand : band,
              verificationStatus: "verified" as const,
              verifiedProvider: p.verifiedProvider ?? provider,
            }
          : p,
      );
      const meNow = profiles.find((p) => p.id === s.currentUserId)!;
      // auto-open a chat with a same-band demo friend so chats aren't empty
      const friend = profiles.find(
        (p) => p.isDemo && p.ageBand === meNow.ageBand && p.id !== meNow.id,
      );
      const alreadyHasChat = s.conversations.some((c) => c.memberIds.includes(meNow.id));
      if (!friend || alreadyHasChat || !meNow.ageBand) return { ...s, profiles };
      const conversation = {
        id: rid("cv"),
        memberIds: [meNow.id, friend.id],
        ageBand: meNow.ageBand,
      };
      return {
        ...s,
        profiles,
        conversations: [...s.conversations, conversation],
        messages: [
          ...s.messages,
          {
            id: rid("m"),
            conversationId: conversation.id,
            authorId: friend.id,
            body: "yo welcome to lowkey",
            createdAt: new Date().toISOString(),
            readByMe: false,
          },
        ],
        streaks: [...s.streaks, { conversationId: conversation.id, count: 1, lastActiveDay: dayKey() }],
      };
    });
  }, []);

  const createPost = useCallback(
    (input: { kind: PostKind; caption: string; mediaUrl: string | null }) => {
      let newId: string | null = null;
      setState((s) => {
        const author = s.profiles.find((p) => p.id === s.currentUserId);
        if (!author?.ageBand || author.verificationStatus !== "verified") return s;
        newId = rid("p");
        return {
          ...s,
          posts: [
            {
              id: newId,
              authorId: author.id,
              kind: input.kind,
              caption: input.caption.toLowerCase(),
              posterHue: Math.floor(Math.random() * 360),
              mediaUrl: input.mediaUrl,
              taggedHandle: null,
              // band is stamped from the author, never from the client form
              ageBand: author.ageBand,
              createdAt: new Date().toISOString(),
            },
            ...s.posts,
          ],
        };
      });
      return newId;
    },
    [],
  );

  const toggleLike = useCallback((postId: string) => {
    setState((s) => {
      if (!s.currentUserId) return s;
      const has = s.likes.some((l) => l.postId === postId && l.profileId === s.currentUserId);
      return {
        ...s,
        likes: has
          ? s.likes.filter((l) => !(l.postId === postId && l.profileId === s.currentUserId))
          : [...s.likes, { postId, profileId: s.currentUserId }],
      };
    });
  }, []);

  const addComment = useCallback((postId: string, body: string) => {
    setState((s) => {
      if (!s.currentUserId || !body.trim()) return s;
      return {
        ...s,
        comments: [
          ...s.comments,
          {
            id: rid("c"),
            postId,
            authorId: s.currentUserId,
            body: body.trim().toLowerCase(),
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  }, []);

  const toggleFollow = useCallback((profileId: string) => {
    setState((s) => {
      if (!s.currentUserId || s.currentUserId === profileId) return s;
      const has = s.follows.some(
        (f) => f.followerId === s.currentUserId && f.followingId === profileId,
      );
      return {
        ...s,
        follows: has
          ? s.follows.filter(
              (f) => !(f.followerId === s.currentUserId && f.followingId === profileId),
            )
          : [...s.follows, { followerId: s.currentUserId, followingId: profileId }],
      };
    });
  }, []);

  const sendMessage = useCallback((conversationId: string, body: string) => {
    setState((s) => {
      if (!s.currentUserId || !body.trim()) return s;
      const today = dayKey();
      const yesterday = dayKey(new Date(Date.now() - 86_400_000));
      const streaks = (() => {
        const existing = s.streaks.find((st) => st.conversationId === conversationId);
        if (!existing) {
          return [...s.streaks, { conversationId, count: 1, lastActiveDay: today }];
        }
        if (existing.lastActiveDay === today) return s.streaks;
        const next =
          existing.lastActiveDay === yesterday ? existing.count + 1 : 1; // missed a day -> reset
        return s.streaks.map((st) =>
          st.conversationId === conversationId ? { ...st, count: next, lastActiveDay: today } : st,
        );
      })();
      return {
        ...s,
        streaks,
        messages: [
          ...s.messages,
          {
            id: rid("m"),
            conversationId,
            authorId: s.currentUserId,
            body: body.trim(),
            createdAt: new Date().toISOString(),
            readByMe: true,
          },
        ],
      };
    });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.conversationId === conversationId ? { ...m, readByMe: true } : m,
      ),
    }));
  }, []);

  const setDailyLimit = useCallback((minutes: number) => {
    setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) =>
        p.id === s.currentUserId ? { ...p, dailyLimitMinutes: minutes } : p,
      ),
    }));
  }, []);

  const addUsageMinute = useCallback(() => {
    setState((s) => {
      if (!s.currentUserId) return s;
      const day = dayKey();
      const existing = s.usageDays.find((u) => u.profileId === s.currentUserId && u.day === day);
      return {
        ...s,
        usageDays: existing
          ? s.usageDays.map((u) =>
              u.profileId === s.currentUserId && u.day === day
                ? { ...u, minutes: u.minutes + 1 }
                : u,
            )
          : [...s.usageDays, { profileId: s.currentUserId, day, minutes: 1 }],
      };
    });
  }, []);

  const reset = useCallback(() => setState(makeSeed()), []);

  const value = useMemo<LowkeyApi>(
    () => ({
      state,
      me,
      signIn,
      signUp,
      signOut,
      verifyAge,
      createPost,
      toggleLike,
      addComment,
      toggleFollow,
      sendMessage,
      markRead,
      setDailyLimit,
      addUsageMinute,
      reset,
    }),
    [
      state,
      me,
      signIn,
      signUp,
      signOut,
      verifyAge,
      createPost,
      toggleLike,
      addComment,
      toggleFollow,
      sendMessage,
      markRead,
      setDailyLimit,
      addUsageMinute,
      reset,
    ],
  );

  return <LowkeyContext.Provider value={value}>{children}</LowkeyContext.Provider>;
}

export function useLowkey() {
  const ctx = useContext(LowkeyContext);
  if (!ctx) throw new Error("useLowkey must be used inside LowkeyProvider");
  return ctx;
}

/* ---------- derived selectors: the age wall lives here ---------- */

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
    return state.posts
      .filter((p) => p.ageBand === me.ageBand && (!kind || p.kind === kind))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
