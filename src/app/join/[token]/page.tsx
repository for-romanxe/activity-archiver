import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { joinActivity } from "@/lib/actions";
import { CategoryTag, period } from "@/components/bits";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);

  const activity = db.select().from(activities).where(eq(activities.inviteToken, token)).get();
  if (!activity) notFound();
  const owner = db.select().from(users).where(eq(users.id, activity.ownerId)).get();

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="dossier w-full max-w-md p-8 text-center">
        <p className="label-mono text-accent">INVITATION</p>
        <h1 className="text-lg font-semibold mt-2">
          {owner?.name}님이 활동 기록에 초대했습니다
        </h1>
        <div className="rule-dashed my-5" />
        <CategoryTag category={activity.category} />
        <p className="text-lg font-semibold mt-2 text-accent">{activity.title}</p>
        {activity.org && <p className="text-sm text-ink-soft">{activity.org}</p>}
        <p className="font-mono text-xs text-ink-soft mt-1">
          {period(activity.startDate, activity.endDate)}
        </p>
        <div className="rule-dashed my-5" />
        <p className="text-sm text-ink-soft mb-5">
          참여하면 이 기록이 내 서고에도 나타나고,
          <br />
          증빙 서류를 함께 보관할 수 있습니다.
        </p>
        <form action={joinActivity}>
          <input type="hidden" name="token" value={token} />
          <button className="btn-ink w-full">참여자로 서명</button>
        </form>
      </div>
    </main>
  );
}
