import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canAccessActivity } from "@/lib/actions";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("로그인이 필요합니다", { status: 401 });
  const file = db.select().from(attachments).where(eq(attachments.id, id)).get();
  if (!file || !(await canAccessActivity(user.id, file.activityId)))
    return new NextResponse("파일을 찾을 수 없습니다", { status: 404 });
  const filePath = path.join(process.cwd(), "data", "uploads", file.storedName);
  if (!fs.existsSync(filePath)) return new NextResponse("파일이 없습니다", { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(filePath)), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
    },
  });
}
