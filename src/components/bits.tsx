// dataviz 검증 통과 다크 팔레트 (CVD ΔE 13.5, 대비 3:1↑, 어두운 surface 기준 — 검증 당시 #161b22)
const CATEGORY_COLORS: Record<string, string> = {
  공모전: "#f85149",
  해커톤: "#a371f7",
  동아리: "#2ea043",
  봉사: "#bb8009",
  인턴: "#4184e4",
  서포터즈: "#db61a2",
  "교육/부트캠프": "#26a5b8",
  "개인 프로젝트": "#a0aec0", // 무채색 계열 — 색각이상에서도 기존 8색과 안 겹침
  기타: "#db6d28",
};

export function CategoryTag({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["기타"];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] text-ink-soft whitespace-nowrap">
      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: color }} />
      {category}
    </span>
  );
}

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS["기타"];
}

/** 2026-03-01 → 26.03.01 */
export function ym(date: string) {
  if (!date) return "";
  return `${date.slice(2, 4)}.${date.slice(5, 7)}.${date.slice(8, 10)}`;
}

export function period(start: string, end: string) {
  if (!end || end === start) return ym(start);
  return `${ym(start)} – ${ym(end)}`;
}

export function dday(deadline: string): { label: string; urgent: boolean; past: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline + "T00:00:00");
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: "마감", past: true, urgent: false };
  if (diff === 0) return { label: "D-DAY", past: false, urgent: true };
  return { label: `D-${diff}`, past: false, urgent: diff <= 7 };
}
