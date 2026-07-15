import { requireUser } from "@/lib/auth";
import { listScraps } from "@/lib/queries";
import { deleteScrap } from "@/lib/actions";
import { Masthead } from "@/components/masthead";
import { dday } from "@/components/bits";
import { ScrapForm, StatusSelect } from "@/components/scrap-widgets";

export const dynamic = "force-dynamic";

export default async function ScrapsPage() {
  const user = await requireUser();
  const scraps = listScraps(user.id);

  // 마감 임박 순 정렬: 마감일 있는 것(미래) → 마감일 없는 것 → 지난 것
  const sorted = [...scraps].sort((a, b) => {
    const rank = (s: typeof a) => {
      if (!s.deadline) return 1;
      return dday(s.deadline).past ? 2 : 0;
    };
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <>
      <Masthead user={user} active="/scraps" />
      <main className="mx-auto w-full max-w-5xl px-6 py-8 flex-1 space-y-8">
        <ScrapForm />

        <div className="dossier">
          <div className="box-header justify-between">
            <span>
              스크랩 <span className="text-ink-soft font-normal">{sorted.length}건</span>
            </span>
            <span className="label-mono !text-[0.6rem]">sorted by <b>deadline</b></span>
          </div>
          {sorted.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold">스크랩한 공고가 없습니다</p>
              <p className="mt-1.5 text-sm text-ink-soft">
                눈여겨본 공고를 스크랩해두면 마감일 순으로 정리해드립니다.
              </p>
            </div>
          ) : (
            sorted.map((s) => {
              const d = s.deadline ? dday(s.deadline) : null;
              return (
                <div
                  key={s.id}
                  id={`scrap-${s.id}`}
                  className={`box-row scroll-mt-4 flex items-center gap-4 flex-wrap ${d?.past ? "opacity-55" : ""}`}
                >
                  {d ? (
                    <span
                      className={`stamp-badge !text-xs shrink-0 w-16 text-center ${
                        d.urgent ? "pulse-warn !text-seal" : !d.past ? "!text-ink-soft" : ""
                      }`}
                    >
                      {d.label}
                    </span>
                  ) : (
                    <span className="stamp-badge !text-xs shrink-0 w-16 text-center !text-accent">상시</span>
                  )}
                  <div className="min-w-0 flex-1">
                    {s.url ? (
                      <a href={s.url} target="_blank" className="title-link">
                        {s.title}
                      </a>
                    ) : (
                      <span className="font-semibold">{s.title}</span>
                    )}
                    {s.deadline && (
                      <span className="font-mono text-xs text-ink-soft ml-3">~{s.deadline}</span>
                    )}
                    {s.memo && <p className="text-sm text-ink-soft mt-0.5">{s.memo}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusSelect id={s.id} status={s.status} />
                    <form action={deleteScrap}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-stamp text-xs underline">삭제</button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
