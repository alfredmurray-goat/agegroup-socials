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
}

export type Audience = "everyone" | "followers" | "nobody";
export type ThemePref = "system" | "light" | "dark";

export type PostKind = "post" | "video";

/** mirrors the `posts` table; ageBand is stamped from the author */
export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  caption: string;
  posterHue: number;
  mediaUrl: string | null;
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

export const dayKey = (d: Date = new Date()) => d.toISOString().slice(0, 10);

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
