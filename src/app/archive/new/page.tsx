import { requireUser } from "@/lib/auth";
import { Masthead } from "@/components/masthead";
import { ActivityForm } from "@/components/activity-form";

export default async function NewActivityPage() {
  const user = await requireUser();
  return (
    <>
      <Masthead user={user} active="/archive" />
      <main className="mx-auto w-full max-w-3xl px-6 py-8 flex-1">
        <h2 className="text-xl font-semibold mb-5">신규 기록 등록</h2>
        <ActivityForm />
      </main>
    </>
  );
}
