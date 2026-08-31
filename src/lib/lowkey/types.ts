export type AgeBand = "under_18" | "adult";

export type VerificationStatus = "unverified" | "pending" | "verified";

export type VerificationProvider = "simulated_eid" | "mitid" | "altid" | "eudi_wallet";

/** mirrors the planned `profiles` table */
export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarHue: number;
  ageBand: AgeBand | null;
  verificationStatus: VerificationStatus;
  verifiedProvider: VerificationProvider | null;
  dailyLimitMinutes: number;
  isDemo: boolean;
}

export type PostKind = "post" | "video";

/** mirrors the planned `posts` table; ageBand is stamped from the author */
export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  caption: string;
  posterHue: number;
  mediaUrl: string | null;
  taggedHandle: string | null;
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

/** mirrors the planned `streaks` table */
export interface Streak {
  conversationId: string;
  count: number;
  lastActiveDay: string;
}

export interface LowkeyState {
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  likes: { postId: string; profileId: string }[];
  follows: { followerId: string; followingId: string }[];
  conversations: Conversation[];
  messages: Message[];
  streaks: Streak[];
  usageDays: { profileId: string; day: string; minutes: number }[];
  currentUserId: string | null;
}

export const dayKey = (d: Date = new Date()) => d.toISOString().slice(0, 10);
