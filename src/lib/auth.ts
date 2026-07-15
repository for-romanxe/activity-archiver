import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

const SESSION_COOKIE = "archive_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30일

export async function createSession(userId: string) {
  const token = nanoid(32);
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.insert(sessions).values({ token, userId, expiresAt }).run();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.delete(sessions).where(eq(sessions.token, token)).run();
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .get();
  if (!row || row.expiresAt < Date.now()) return null;
  return row.user;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return user!;
}
