"use client";

import { useActionState } from "react";
import { createScrap, updateScrapStatus } from "@/lib/actions";
import { SCRAP_STATUSES } from "@/db/schema";

export function ScrapForm() {
  // React 19가 액션 성공 시 비제어 폼을 자동 리셋해준다
  const [error, formAction, pending] = useActionState(createScrap, null);

  return (
    <form action={formAction} className="dossier">
      <div className="box-header">공고 스크랩</div>
      <div className="p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className="label-mono">제목 *</label>
          <input name="title" className="field" placeholder="○○ 서포터즈 3기 모집" required />
        </div>
        <div>
          <label className="label-mono">지원 마감일</label>
          <input name="deadline" type="date" className="field" />
        </div>
      </div>
      <div>
        <label className="label-mono">공고 링크</label>
        <input name="url" type="url" className="field" placeholder="https://…" />
      </div>
      <div>
        <label className="label-mono">메모</label>
        <input name="memo" className="field" placeholder="자소서 2문항, 포트폴리오 필수 …" />
      </div>
      {error && <p className="stamp-badge text-xs">{error}</p>}
      <button className="btn-ink" disabled={pending}>
        {pending ? "스크랩 중…" : "스크랩"}
      </button>
      </div>
    </form>
  );
}

export function StatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateScrapStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        className="field !text-xs !py-1 !px-2 font-mono"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {SCRAP_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </form>
  );
}
