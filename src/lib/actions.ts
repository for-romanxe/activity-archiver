"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityInvites,
  attachments,
  friendships,
  participants,
  scraps,
  users,
  CATEGORIES,
} from "@/db/schema";
import { createSession, destroySession, requireUser } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function now() {
  return new Date().toISOString();
}

/** 외부 URL로의 open redirect 차단 */
function safeNext(raw: FormDataEntryValue | null) {
  const next = String(raw ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/archive";
}

// ---------- 인증 ----------

export async function signup(_prev: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!name || !email || password.length < 8)
    return "이름, 이메일을 채우고 비밀번호는 8자 이상으로 해주세요.";
  if (db.select().from(users).where(eq(users.email, email)).get())
    return "이미 등록된 이메일입니다.";
  const id = nanoid(12);
  db.insert(users)
    .values({ id, email, name, passwordHash: bcrypt.hashSync(password, 10), createdAt: now() })
    .run();
  await createSession(id);
  redirect(next);
}

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !bcrypt.compareSync(password, user.passwordHash))
    return "이메일 또는 비밀번호가 맞지 않습니다.";
  await createSession(user.id);
  redirect(next);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- 활동 ----------

function readActivityForm(formData: FormData) {
  const category = String(formData.get("category") ?? "기타");
  return {
    title: String(formData.get("title") ?? "").trim(),
    org: String(formData.get("org") ?? "").trim(),
    category: (CATEGORIES as readonly string[]).includes(category) ? category : "기타",
    role: String(formData.get("role") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
    result: String(formData.get("result") ?? "").trim(),
    peers: String(formData.get("peers") ?? "").trim(),
  };
}

export async function createActivity(_prev: string | null, formData: FormData): Promise<string | null> {
  const user = await requireUser();
  const data = readActivityForm(formData);
  if (!data.title || !data.startDate) return "활동명과 시작일은 필수입니다.";
  const id = nanoid(12);
  db.insert(activities)
    .values({ id, ownerId: user.id, inviteToken: nanoid(20), createdAt: now(), ...data })
    .run();
  redirect(`/archive/${id}`);
}

export async function updateActivity(_prev: string | null, formData: FormData): Promise<string | null> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const data = readActivityForm(formData);
  if (!data.title || !data.startDate) return "활동명과 시작일은 필수입니다.";
  const res = db
    .update(activities)
    .set(data)
    .where(and(eq(activities.id, id), eq(activities.ownerId, user.id)))
    .run();
  if (res.changes === 0) return "수정 권한이 없습니다.";
  redirect(`/archive/${id}`);
}

export async function deleteActivity(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const activity = db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.ownerId, user.id)))
    .get();
  if (!activity) return;
  const files = db.select().from(attachments).where(eq(attachments.activityId, id)).all();
  for (const f of files) {
    fs.rmSync(path.join(UPLOAD_DIR, f.storedName), { force: true });
  }
  db.delete(attachments).where(eq(attachments.activityId, id)).run();
  db.delete(participants).where(eq(participants.activityId, id)).run();
  db.delete(activityInvites).where(eq(activityInvites.activityId, id)).run();
  db.delete(activities).where(eq(activities.id, id)).run();
  redirect("/archive");
}

export async function canAccessActivity(userId: string, activityId: string) {
  const activity = db.select().from(activities).where(eq(activities.id, activityId)).get();
  if (!activity) return null;
  if (activity.ownerId === userId) return activity;
  const member = db
    .select()
    .from(participants)
    .where(and(eq(participants.activityId, activityId), eq(participants.userId, userId)))
    .get();
  return member ? activity : null;
}

export async function joinActivity(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");
  const activity = db.select().from(activities).where(eq(activities.inviteToken, token)).get();
  if (!activity) redirect("/archive");
  if (activity.ownerId !== user.id) {
    const existing = db
      .select()
      .from(participants)
      .where(and(eq(participants.activityId, activity.id), eq(participants.userId, user.id)))
      .get();
    if (!existing) {
      db.insert(participants)
        .values({ id: nanoid(12), activityId: activity.id, userId: user.id, joinedAt: now() })
        .run();
    }
  }
  redirect(`/archive/${activity.id}`);
}

// ---------- 증빙 파일 ----------

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function uploadAttachment(formData: FormData) {
  const user = await requireUser();
  const activityId = String(formData.get("activityId") ?? "");
  if (!(await canAccessActivity(user.id, activityId))) return;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE) return;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const storedName = `${nanoid(16)}${path.extname(file.name).slice(0, 10)}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, storedName), Buffer.from(await file.arrayBuffer()));
  db.insert(attachments)
    .values({
      id: nanoid(12),
      activityId,
      uploaderId: user.id,
      filename: file.name,
      storedName,
      mime: file.type || "application/octet-stream",
      size: file.size,
      createdAt: now(),
    })
    .run();
  revalidatePath(`/archive/${activityId}`);
}

export async function deleteAttachment(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const file = db.select().from(attachments).where(eq(attachments.id, id)).get();
  if (!file) return;
  const activity = db.select().from(activities).where(eq(activities.id, file.activityId)).get();
  if (file.uploaderId !== user.id && activity?.ownerId !== user.id) return;
  fs.rmSync(path.join(UPLOAD_DIR, file.storedName), { force: true });
  db.delete(attachments).where(eq(attachments.id, id)).run();
  revalidatePath(`/archive/${file.activityId}`);
}

// ---------- 친구 ----------

function findFriendship(a: string, b: string) {
  return db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
        and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
      ),
    )
    .get();
}

export async function sendFriendRequest(_prev: string | null, formData: FormData): Promise<string | null> {
  const user = await requireUser();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return "이메일을 입력해주세요.";
  if (email === user.email) return "본인 이메일입니다.";
  const target = db.select().from(users).where(eq(users.email, email)).get();
  if (!target) return "그 이메일로 가입한 사람이 없습니다.";
  const existing = findFriendship(user.id, target.id);
  if (existing)
    return existing.status === "accepted" ? "이미 친구입니다." : "이미 요청이 오가는 중입니다.";
  db.insert(friendships)
    .values({ id: nanoid(12), requesterId: user.id, addresseeId: target.id, createdAt: now() })
    .run();
  revalidatePath("/friends");
  return null;
}

export async function acceptFriendRequest(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  db.update(friendships)
    .set({ status: "accepted" })
    .where(and(eq(friendships.id, id), eq(friendships.addresseeId, user.id)))
    .run();
  revalidatePath("/friends");
}

/** 거절·요청 취소·친구 삭제 전부: 내가 얽힌 friendship 행 삭제 */
export async function removeFriendship(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  db.delete(friendships)
    .where(
      and(
        eq(friendships.id, id),
        or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id)),
      ),
    )
    .run();
  revalidatePath("/friends");
}

// ---------- 활동 태그 (친구를 활동에 초대) ----------

export async function tagFriend(formData: FormData) {
  const user = await requireUser();
  const activityId = String(formData.get("activityId") ?? "");
  const friendId = String(formData.get("userId") ?? "");
  const activity = db
    .select()
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.ownerId, user.id)))
    .get();
  if (!activity) return;
  const friendship = findFriendship(user.id, friendId);
  if (!friendship || friendship.status !== "accepted") return;
  const already =
    db
      .select()
      .from(participants)
      .where(and(eq(participants.activityId, activityId), eq(participants.userId, friendId)))
      .get() ||
    db
      .select()
      .from(activityInvites)
      .where(and(eq(activityInvites.activityId, activityId), eq(activityInvites.userId, friendId)))
      .get();
  if (already) return;
  db.insert(activityInvites)
    .values({ id: nanoid(12), activityId, userId: friendId, invitedBy: user.id, createdAt: now() })
    .run();
  revalidatePath(`/archive/${activityId}`);
}

export async function cancelActivityInvite(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const invite = db.select().from(activityInvites).where(eq(activityInvites.id, id)).get();
  if (!invite || invite.invitedBy !== user.id) return;
  db.delete(activityInvites).where(eq(activityInvites.id, id)).run();
  revalidatePath(`/archive/${invite.activityId}`);
}

export async function respondActivityInvite(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const accept = String(formData.get("response") ?? "") === "accept";
  const invite = db
    .select()
    .from(activityInvites)
    .where(and(eq(activityInvites.id, id), eq(activityInvites.userId, user.id)))
    .get();
  if (!invite) return;
  if (accept) {
    db.insert(participants)
      .values({ id: nanoid(12), activityId: invite.activityId, userId: user.id, joinedAt: now() })
      .run();
  }
  db.delete(activityInvites).where(eq(activityInvites.id, id)).run();
  revalidatePath("/friends");
  revalidatePath("/archive");
}

// ---------- 공고 스크랩 ----------

export async function createScrap(_prev: string | null, formData: FormData): Promise<string | null> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return "공고 제목을 입력해주세요.";
  db.insert(scraps)
    .values({
      id: nanoid(12),
      userId: user.id,
      title,
      url: String(formData.get("url") ?? "").trim(),
      deadline: String(formData.get("deadline") ?? ""),
      memo: String(formData.get("memo") ?? "").trim(),
      createdAt: now(),
    })
    .run();
  revalidatePath("/scraps");
  return null;
}

export async function updateScrapStatus(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "지원예정");
  db.update(scraps)
    .set({ status })
    .where(and(eq(scraps.id, id), eq(scraps.userId, user.id)))
    .run();
  revalidatePath("/scraps");
}

export async function deleteScrap(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  db.delete(scraps).where(and(eq(scraps.id, id), eq(scraps.userId, user.id))).run();
  revalidatePath("/scraps");
}
