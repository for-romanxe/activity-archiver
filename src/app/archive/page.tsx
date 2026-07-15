import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listMyActivities } from "@/lib/queries";
import { Masthead } from "@/components/masthead";
import { categoryColor, period } from "@/components/bits";
import { CATEGORIES } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const user = await requireUser();
  const all = listMyActivities(user.id);
  const numbered = all.map((a, i) => ({ ...a, no: all.length - i }));

  const active = (CATEGORIES as readonly string[]).includes(category ?? "")
    ? category
    : undefined;
  const items = active ? numbered.filter((a) => a.category === active) : numbered;
  const shownCategories = CATEGORIES.filter((c) => all.some((a) => a.category === c));

  return (
    <>
      <Masthead user={user} active="/archive" />
      <main className="mx-auto w-full max-w-5xl px-6 py-6 flex-1">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          {all.length > 0 ? (
            <nav className="flex flex-wrap gap-1.5">
              <Link
                href="/archive"
                className="label-mono !text-[0.7rem] px-2.5 py-1 border border-paper-line rounded-full"
                style={!active ? { background: "var(--ink)", color: "var(--paper)" } : undefined}
              >
                전체 {all.length}
              </Link>
              {shownCategories.map((c) => {
                const color = categoryColor(c);
                const count = all.filter((a) => a.category === c).length;
                const isActive = active === c;
                return (
                  <Link
                    key={c}
                    href={`/archive?category=${encodeURIComponent(c)}`}
                    className="label-mono !text-[0.7rem] px-2.5 py-1 border rounded-full"
                    style={
                      isActive
                        ? { background: color, borderColor: color, color: "var(--paper)" }
                        : {
                            color,
                            borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                            background: `color-mix(in srgb, ${color} 10%, transparent)`,
                          }
                    }
                  >
                    {c} {count}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <span />
          )}
          <Link href="/archive/new" className="btn-ink inline-block shrink-0">
            + 신규 기록 등록
          </Link>
        </div>

        {all.length === 0 ? (
          <div className="dossier p-12 text-center">
            <p className="text-lg font-semibold">서고가 비어 있습니다</p>
            <p className="mt-2 text-ink-soft">
              첫 대외활동을 등록하면 이곳에 기록이 쌓입니다.
              <br />
              공모전, 해커톤, 동아리, 봉사, 인턴 — 무엇이든 기록해두세요.
            </p>
          </div>
        ) : (
          <div className="dossier">
            <div className="box-header justify-between">
              <span>
                소장 기록 <span className="text-ink-soft font-normal">{items.length}건</span>
                {active && (
                  <span className="text-ink-soft font-normal"> · {active}</span>
                )}
              </span>
              <span className="label-mono !text-[0.6rem]">
                sorted by <b>start-date desc</b>
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold">이 분류의 기록이 없습니다</p>
                <p className="mt-1.5 text-sm text-ink-soft">
                  위의 <b>전체</b>를 누르면 모든 기록이 다시 보입니다.
                </p>
              </div>
            ) : (
              items.map((a) => (
                <Link
                  key={a.id}
                  href={`/archive/${a.id}`}
                  className="box-row row-hover"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="title-link text-[1.05rem]">{a.title}</span>
                    {a.result && (
                      <span className="stamp-badge !text-[0.68rem] !text-seal">🏆 {a.result}</span>
                    )}
                    {!a.isOwner && (
                      <span className="stamp-badge !text-[0.68rem] !text-ink-soft">
                        {a.ownerName}의 기록
                      </span>
                    )}
                  </div>
                  {(a.org || a.description) && (
                    <p className="text-sm text-ink-soft mt-1 line-clamp-1">
                      {a.org}
                      {a.org && a.description && " — "}
                      {a.description}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-4 text-xs text-ink-soft font-mono">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ background: categoryColor(a.category) }}
                      />
                      {a.category}
                    </span>
                    <span>{period(a.startDate, a.endDate)}</span>
                    <span>
                      {a.isOwner
                        ? a.companionNames.length > 0
                          ? `함께 ${a.companionNames.slice(0, 2).join(", ")}${
                              a.companionNames.length > 2
                                ? ` 외 ${a.companionNames.length - 2}명`
                                : ""
                            }`
                          : "단독 기록"
                        : "참여 기록"}
                    </span>
                    <span className="ml-auto hidden sm:inline">
                      NO.{String(a.no).padStart(3, "0")}
                    </span>
                  </p>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}
