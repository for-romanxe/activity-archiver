"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createActivity, updateActivity } from "@/lib/actions";
import { CATEGORIES, type Activity } from "@/db/schema";

export function ActivityForm({ activity }: { activity?: Activity }) {
  const [error, formAction, pending] = useActionState(
    activity ? updateActivity : createActivity,
    null,
  );

  return (
    <form action={formAction} className="dossier p-8 space-y-6">
      {activity && <input type="hidden" name="id" value={activity.id} />}
      <div className="grid gap-6 sm:grid-cols-[1fr_180px]">
        <div>
          <label className="label-mono">활동명 *</label>
          <input name="title" className="field" defaultValue={activity?.title} placeholder="2026 데이터 분석 공모전" required />
        </div>
        <div>
          <label className="label-mono">분류 *</label>
          <select name="category" className="field" defaultValue={activity?.category ?? "공모전"}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="label-mono">주최 / 소속</label>
          <input name="org" className="field" defaultValue={activity?.org} placeholder="한국데이터산업진흥원" />
        </div>
        <div>
          <label className="label-mono">역할</label>
          <input name="role" className="field" defaultValue={activity?.role} placeholder="팀장, 발표 담당" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="label-mono">시작일 *</label>
          <input name="startDate" type="date" className="field" defaultValue={activity?.startDate} required />
        </div>
        <div>
          <label className="label-mono">종료일</label>
          <input name="endDate" type="date" className="field" defaultValue={activity?.endDate} />
        </div>
      </div>
      <div>
        <label className="label-mono">함께한 사람 (쉼표로 구분)</label>
        <input name="peers" className="field" defaultValue={activity?.peers} placeholder="김철수, 이영희" />
        <p className="text-xs text-ink-soft mt-1.5">
          이름만 적어두는 메모예요. 초대 링크로 들어온 친구는 자동으로 따로 표시됩니다.
        </p>
      </div>
      <div>
        <label className="label-mono">활동 내용</label>
        <textarea name="description" className="field mt-1" rows={5} defaultValue={activity?.description} placeholder="무엇을 했고, 무엇을 배웠는지 기록해두세요. 나중에 자소서 쓸 때 이 칸이 당신을 구합니다." />
      </div>
      <div>
        <label className="label-mono">성과 / 입상 (수상·수료 등)</label>
        <input
          name="result"
          className="field"
          defaultValue={activity?.result}
          placeholder="클릭하면 대상·우수상·장려상 등을 고를 수 있고, 직접 입력도 됩니다"
          list="award-options"
        />
        <datalist id="award-options">
          <option value="대상" />
          <option value="최우수상" />
          <option value="우수상" />
          <option value="장려상" />
          <option value="입선" />
          <option value="특별상" />
          <option value="본선 진출" />
          <option value="수료" />
          <option value="참가" />
        </datalist>
        <p className="text-xs text-ink-soft mt-1.5">
          입력하면 서고 카드와 상세 페이지에 도장으로 찍힙니다.
        </p>
      </div>
      {error && <p className="stamp-badge text-xs">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button className="btn-ink" disabled={pending}>
          {pending ? "기록 중…" : activity ? "수정 완료" : "서고에 등록"}
        </button>
        <Link href={activity ? `/archive/${activity.id}` : "/archive"} className="btn-ghost inline-block">
          취소
        </Link>
      </div>
    </form>
  );
}
