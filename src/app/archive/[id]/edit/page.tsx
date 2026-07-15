import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { Masthead } from "@/components/masthead";
import { ActivityForm } from "@/components/activity-form";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const activity = db.select().from(activities).where(eq(activities.id, id)).get();
  if (!activity || activity.ownerId !== user.id) notFound();

  return (
    <>
      <Masthead user={user} active="/archive" />
      <main className="mx-auto w-full max-w-3xl px-6 py-8 flex-1">
        <h2 className="text-xl font-semibold mb-5">기록 수정</h2>
        <ActivityForm activity={activity} />
      </main>
    </>
  );
}
