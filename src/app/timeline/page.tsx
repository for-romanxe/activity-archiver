import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { listMyActivities } from "@/lib/queries";
import { Masthead } from "@/components/masthead";
import { CategoryTag, categoryColor, period } from "@/components/bits";
import { CATEGORIES } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const user = await requireUser();
  const items = listMyActivities(user.id);

  const attachmentCount =
    items.length === 0
      ? 0
      : db
          .select({ id: attachments.id })
          .from(attachments)
          .where(inArray(attachments.activityId, items.map((a) => a.id)))
          .all().length;

  const peers = new Set<string>();
  for (const a of items) {
    if (!a.isOwner) peers.add(a.ownerName);
    for (const n of a.companionNames) if (n !== user.name) peers.add(n);
  }

  // 연도별 집계 (시작일 기준)
  const byYear = new Map<string, typeof items>();
  for (const a of items) {
    const y = a.startDate.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), a]);
  }
  const years = [...byYear.keys()].sort();
  const yearMax = Math.max(1, ...years.map((y) => byYear.get(y)!.length));

  // 분야별 집계
  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    count: items.filter((a) => a.category === c).length,
  })).filter((c) => c.count > 0);
  const catMax = Math.max(1, ...byCategory.map((c) => c.count));

  const stats = [
    { label: "소장 기록", value: items.length, unit: "건" },
    { label: "활동 분야", value: byCategory.length, unit: "개" },
    { label: "함께한 사람", value: peers.size, unit: "명" },
    { label: "보관 증빙", value: attachmentCount, unit: "건" },
  ];

  return (
    <>
      <Masthead user={user} active="/timeline" />
      <main className="mx-auto w-full max-w-5xl px-6 py-8 flex-1 space-y-8">
        {/* 요약 스탯 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="dossier p-4">
              <p className="label-mono">{s.label}</p>
              <p className="text-2xl font-semibold mt-1">
                {s.value}
                <span className="text-sm font-normal text-ink-soft ml-1">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="dossier p-10 text-center">
            <p className="text-lg font-semibold">아직 통계를 낼 기록이 없습니다</p>
            <p className="mt-2 text-sm text-ink-soft">
              <Link href="/archive/new" className="underline text-stamp">첫 기록</Link>을
              등록하면 연대기가 그려집니다.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* 연도별 활동 수 — 단일 색 세로 막대 */}
              <div className="dossier">
                <div className="box-header">연도별 활동 수</div>
                <div className="p-4">
                <svg viewBox={`0 0 ${Math.max(years.length * 64, 200)} 180`} className="w-full" role="img" aria-label="연도별 활동 수 막대 차트">
                  {years.map((y, i) => {
                    const n = byYear.get(y)!.length;
                    const h = Math.max(6, (n / yearMax) * 120);
                    const x = i * 64 + 14;
                    return (
                      <g key={y}>
                        <title>{`${y}년 · ${n}건`}</title>
                        <rect
                          x={x} y={150 - h} width={36} height={h}
                          rx={4} fill="var(--accent)"
                        />
                        {/* 밑단은 각지게: 베이스라인 덮개 */}
                        <rect x={x} y={146} width={36} height={4} fill="var(--accent)" />
                        <text x={x + 18} y={150 - h - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
                          {n}
                        </text>
                        <text x={x + 18} y={168} textAnchor="middle" fontSize="11" fill="var(--ink-soft)" fontFamily="var(--font-mono)">
                          {y}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="0" y1="150.5" x2="100%" y2="150.5" stroke="var(--paper-line)" strokeWidth="1.5" />
                </svg>
                </div>
              </div>

              {/* 분야별 분포 — 카테고리 색 가로 막대 + 텍스트 라벨 */}
              <div className="dossier">
                <div className="box-header">분야별 분포</div>
                <ul className="space-y-3 p-4">
                  {byCategory
                    .sort((a, b) => b.count - a.count)
                    .map((c) => (
                      <li key={c.category} className="grid grid-cols-[110px_1fr_2rem] items-center gap-2 text-sm">
                        <span className="label-mono !text-[0.7rem] truncate">{c.category}</span>
                        <div className="h-4 bg-paper-deep rounded relative" title={`${c.category} ${c.count}건`}>
                          <div
                            className="h-4 absolute left-0 top-0"
                            style={{
                              width: `${(c.count / catMax) * 100}%`,
                              background: categoryColor(c.category),
                              borderRadius: "0 4px 4px 0",
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs text-right">{c.count}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* 연대기 */}
            <div className="dossier">
              <div className="box-header">연대기</div>
              <div className="space-y-8 p-5">
                {[...years].reverse().map((y) => (
                  <div key={y} className="grid grid-cols-[60px_1fr] gap-4">
                    <p className="font-mono text-lg font-semibold text-ink-soft">{y}</p>
                    <ul className="space-y-3 border-l-2 border-paper-line pl-5">
                      {byYear
                        .get(y)!
                        .sort((a, b) => b.startDate.localeCompare(a.startDate))
                        .map((a) => (
                          <li key={a.id} className="relative">
                            <span
                              className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-paper"
                              style={{ background: categoryColor(a.category) }}
                            />
                            <Link href={`/archive/${a.id}`} className="group flex items-baseline gap-3 flex-wrap">
                              <span className="font-mono text-xs text-ink-soft">{period(a.startDate, a.endDate)}</span>
                              <span className="title-link group-hover:underline">{a.title}</span>
                              <CategoryTag category={a.category} />
                              {a.result && <span className="text-xs text-seal font-bold">🏆 {a.result}</span>}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
