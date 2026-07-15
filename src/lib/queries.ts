import { desc, eq, or, and } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityInvites,
  attachments,
  friendships,
  participants,
  scraps,
  users,
  type Activity,
  type User,
} from "@/db/schema";

export type ActivityWithMeta = Activity & {
  ownerName: string;
  isOwner: boolean;
  participantNames: string[];
  /** 초대로 들어온 참여자 + peers 메모 이름을 합친 목록 */
  companionNames: string[];
};

/** 내가 만든 활동 + 초대받아 참여한 활동을 시작일 내림차순으로 */
export function listMyActivities(userId: string): ActivityWithMeta[] {
  const owned = db.select().from(activities).where(eq(activities.ownerId, userId)).all();
  const joined = db
    .select({ activity: activities })
    .from(participants)
    .innerJoin(activities, eq(participants.activityId, activities.id))
    .where(eq(participants.userId, userId))
    .all()
    .map((r) => r.activity);
  const all = [...owned, ...joined].sort((a, b) => b.startDate.localeCompare(a.startDate));
  return all.map((a) => withMeta(a, userId));
}

export function getActivityMeta(activity: Activity, userId: string): ActivityWithMeta {
  return withMeta(activity, userId);
}

function withMeta(activity: Activity, userId: string): ActivityWithMeta {
  const owner = db.select().from(users).where(eq(users.id, activity.ownerId)).get();
  const members = db
    .select({ name: users.name })
    .from(participants)
    .innerJoin(users, eq(participants.userId, users.id))
    .where(eq(participants.activityId, activity.id))
    .all();
  const participantNames = members.map((m) => m.name);
  const peerNames = activity.peers
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    ...activity,
    ownerName: owner?.name ?? "?",
    isOwner: activity.ownerId === userId,
    participantNames,
    companionNames: [...participantNames, ...peerNames],
  };
}

export function listAttachments(activityId: string) {
  return db
    .select({ attachment: attachments, uploaderName: users.name })
    .from(attachments)
    .innerJoin(users, eq(attachments.uploaderId, users.id))
    .where(eq(attachments.activityId, activityId))
    .orderBy(desc(attachments.createdAt))
    .all();
}

export function listScraps(userId: string) {
  return db.select().from(scraps).where(eq(scraps.userId, userId)).all();
}

/** 콘솔 상태줄용: 소장 기록 수 · 추적 중(마감 전) 스크랩 수 · 가장 가까운 마감 */
export function consoleStatus(userId: string) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcoming = listScraps(userId)
    .filter((s) => s.deadline && s.deadline >= todayStr)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  return {
    archived: listMyActivities(userId).length,
    tracked: upcoming.length,
    next: upcoming[0] ?? null,
  };
}

// ---------- 친구 ----------

/** 수락된 친구 목록: 방향 무관하게 상대방 유저를 돌려준다 */
export function listFriends(userId: string): { friendshipId: string; friend: User }[] {
  const rows = db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      ),
    )
    .all();
  return rows.map((f) => {
    const otherId = f.requesterId === userId ? f.addresseeId : f.requesterId;
    const friend = db.select().from(users).where(eq(users.id, otherId)).get()!;
    return { friendshipId: f.id, friend };
  });
}

export function listReceivedRequests(userId: string) {
  return db
    .select({ id: friendships.id, requester: users })
    .from(friendships)
    .innerJoin(users, eq(friendships.requesterId, users.id))
    .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")))
    .all();
}

export function listSentRequests(userId: string) {
  return db
    .select({ id: friendships.id, addressee: users })
    .from(friendships)
    .innerJoin(users, eq(friendships.addresseeId, users.id))
    .where(and(eq(friendships.requesterId, userId), eq(friendships.status, "pending")))
    .all();
}

/** 나를 태그한 활동 초대 목록 (활동·초대한 사람 포함) */
export function listActivityInvites(userId: string) {
  return db
    .select({ invite: activityInvites, activity: activities, inviterName: users.name })
    .from(activityInvites)
    .innerJoin(activities, eq(activityInvites.activityId, activities.id))
    .innerJoin(users, eq(activityInvites.invitedBy, users.id))
    .where(eq(activityInvites.userId, userId))
    .all();
}

/** 내비 배지용: 받은 친구 요청 + 받은 활동 초대 수 */
export function pendingCount(userId: string) {
  return listReceivedRequests(userId).length + listActivityInvites(userId).length;
}

export type FriendActivityStatus = "participant" | "invited" | "none";

/** 활동 상세의 태그 UI용: 각 친구의 이 활동에 대한 상태 */
export function friendsWithActivityStatus(ownerId: string, activityId: string) {
  return listFriends(ownerId).map(({ friend }) => {
    const isParticipant = db
      .select()
      .from(participants)
      .where(and(eq(participants.activityId, activityId), eq(participants.userId, friend.id)))
      .get();
    const invite = db
      .select()
      .from(activityInvites)
      .where(and(eq(activityInvites.activityId, activityId), eq(activityInvites.userId, friend.id)))
      .get();
    const status: FriendActivityStatus = isParticipant ? "participant" : invite ? "invited" : "none";
    return { friend, status, inviteId: invite?.id };
  });
}
