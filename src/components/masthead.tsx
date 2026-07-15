import Link from "next/link";
import { logout } from "@/lib/actions";
import { consoleStatus, pendingCount } from "@/lib/queries";
import { dday } from "@/components/bits";
import type { User } from "@/db/schema";

const TABS = [
  { href: "/archive", label: "서고 · 활동" },
  { href: "/scraps", label: "스크랩 · 공고" },
  { href: "/timeline", label: "연대기 · 통계" },
  { href: "/friends", label: "동료 · 친구" },
] as const;

export function Masthead({ user, active }: { user: User; active: string }) {
  const pending = pendingCount(user.id);
  const status = consoleStatus(user.id);
  const next = status.next
    ? { ...dday(status.next.deadline), title: status.next.title, id: status.next.id }
    : null;

  return (
    <header className="console-head w-full">
      <div className="mx-auto w-full max-w-5xl px-6 pt-4 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/archive" className="flex items-baseline gap-2.5 min-w-0">
          <span className="font-display text-xl font-bold tracking-[0.22em] text-accent leading-none">
            ARCHIVE
          </span>
          <span className="text-sm text-ink-soft truncate">대외활동 기록보관소</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink-soft">
            OP. <b className="text-ink font-semibold">{user.name}</b>
          </span>
          <form action={logout}>
            <button className="btn-ghost !py-1 !px-3 text-xs">로그아웃</button>
          </form>
        </div>
      </div>

      {/* 상태 판독줄 */}
      <div className="mx-auto w-full max-w-5xl px-6 mt-2 readout flex items-center gap-5 flex-wrap">
        <span>
          소장 <b>{String(status.archived).padStart(2, "0")}</b>
        </span>
        <span>
          추적 <b>{String(status.tracked).padStart(2, "0")}</b>
        </span>
        {next && (
          <Link
            href={`/scraps#scrap-${next.id}`}
            className={`hover:underline ${next.urgent ? "pulse-warn text-seal" : ""}`}
          >
            다음 마감 <b className={next.urgent ? "!text-seal" : undefined}>{next.label}</b>
            <span className="hidden sm:inline"> · {next.title}</span>
          </Link>
        )}
      </div>

      <nav className="mx-auto w-full max-w-5xl px-6 mt-1.5 flex gap-1 -mb-px">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="folder-tab" data-active={active === t.href}>
            {t.label}
            {t.href === "/friends" && pending > 0 && (
              <span className="ml-1.5 inline-block bg-stamp text-paper text-[0.65rem] font-bold px-1.5 leading-4 rounded-sm align-middle">
                {pending}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
