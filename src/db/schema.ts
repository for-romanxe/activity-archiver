import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  org: text("org").notNull().default(""),
  category: text("category").notNull(),
  role: text("role").notNull().default(""),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull().default(""),
  description: text("description").notNull().default(""),
  result: text("result").notNull().default(""),
  /** 가입 없이 이름만 적어두는 동행자 메모 (쉼표 구분) — 초대로 들어온 participants와 별개 */
  peers: text("peers").notNull().default(""),
  inviteToken: text("invite_token").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => activities.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  joinedAt: text("joined_at").notNull(),
});

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => activities.id),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => users.id),
  filename: text("filename").notNull(),
  storedName: text("stored_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull(),
});

export const friendships = sqliteTable("friendships", {
  id: text("id").primaryKey(),
  requesterId: text("requester_id")
    .notNull()
    .references(() => users.id),
  addresseeId: text("addressee_id")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("pending"), // pending | accepted
  createdAt: text("created_at").notNull(),
});

/** 활동에 친구를 태그하면 생기는 초대 — 상대가 수락하면 participants로 옮겨진다 */
export const activityInvites = sqliteTable("activity_invites", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => activities.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const scraps = sqliteTable("scraps", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  url: text("url").notNull().default(""),
  deadline: text("deadline").notNull().default(""),
  memo: text("memo").notNull().default(""),
  status: text("status").notNull().default("지원예정"),
  createdAt: text("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Scrap = typeof scraps.$inferSelect;

export const CATEGORIES = [
  "공모전",
  "해커톤",
  "동아리",
  "봉사",
  "인턴",
  "서포터즈",
  "교육/부트캠프",
  "개인 프로젝트",
  "기타",
] as const;

export const SCRAP_STATUSES = ["지원예정", "지원완료", "합격", "불합격", "포기"] as const;
