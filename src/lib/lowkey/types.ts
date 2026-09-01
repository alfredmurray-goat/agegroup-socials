export type AgeBand = "under_18" | "adult";

export type VerificationStatus = "unverified" | "pending" | "verified";

export type VerificationProvider =
  | "face_scan"
  | "simulated_eid"
  | "mitid"
  | "altid"
  | "eudi_wallet";

/** mirrors the `profiles` table */
export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarHue: number;
  avatarUrl: string | null;
  ageBand: AgeBand | null;
  verificationStatus: VerificationStatus;
  verifiedProvider: VerificationProvider | null;
  dailyLimitMinutes: number;
  isDemo: boolean;
  interests: string[];
  vibe: string | null;
  pronouns: string | null;
  city: string | null;
  contentPace: string;
  quietHours: boolean;
  onboardedAt: string | null;
  isPrivate: boolean;
  allowDms: Audience;
  allowComments: Audience;
  hideFromSearch: boolean;
  theme: ThemePref;
  reduceMotion: boolean;
textScale: TextScale;
  highContrast: boolean;
  boldText: boolean;
  /** "what are you doing right now" — shown on profile pages */
  status: string | null;
  emailFollows: boolean;
  emailLikes: boolean;
  emailComments: boolean;
  emailDms: boolean;
}

export type Audience = "everyone" | "followers" | "nobody";
export type ThemePref = "system" | "light" | "dark";

/** low-vision text sizing, applied to the root font size */
export type TextScale = "normal" | "large" | "larger" | "largest";

export type PostKind = "post" | "video" | "repost";

/** mirrors the `posts` table; ageBand is stamped from the author */
export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  title: string | null;
  caption: string;
  posterHue: number;
  mediaUrl: string | null;
  /** if this is a repost, the original post id */
  sourcePostId?: string | null;
  taggedHandle: string | null;
  topic: string | null;
  ageBand: AgeBand;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  memberIds: string[];
  ageBand: AgeBand;
}

export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  /** resolved signed url when the message carries a photo */
  mediaUrl: string | null;
  createdAt: string;
  readByMe: boolean;
}

/** streak lives on the conversation row */
export interface Streak {
  conversationId: string;
  count: number;
  lastActiveDay: string;
}

export type NotificationKind = "follow" | "like" | "comment";

export interface Notif {
  id: string;
  recipientId: string;
  actorId: string;
  kind: NotificationKind;
  postId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface LowkeyState {
  /** profile ids i have blocked */
  blocks: string[];
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  likes: { postId: string; profileId: string }[];
  follows: { followerId: string; followingId: string }[];
  bookmarks: string[];
  notifications: Notif[];
  conversations: Conversation[];
  messages: Message[];
  streaks: Streak[];
  usageDays: { profileId: string; day: string; minutes: number }[];
  currentUserId: string | null;
}

export const emptyState: LowkeyState = {
  blocks: [],
  profiles: [],
  posts: [],
  comments: [],
  likes: [],
  follows: [],
  bookmarks: [],
  notifications: [],
  conversations: [],
  messages: [],
  streaks: [],
  usageDays: [],
  currentUserId: null,
};

/**
 * the calendar day in the *user's* local timezone — the daily limit and the
 * streak must reset at local midnight, not utc midnight.
 */
export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const INTERESTS = [
  "football",
  "skating",
  "gaming",
  "music",
  "art",
  "fits",
  "food",
  "memes",
  "gym",
  "photos",
  "school stuff",
  "coding",
  "films",
  "pets",
  "travel",
  "books",
] as const;

export const VIBES = ["chill", "chaotic", "creative", "sporty", "quiet"] as const;
