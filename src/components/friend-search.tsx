"use client";

import { useActionState } from "react";
import { sendFriendRequest } from "@/lib/actions";

export function FriendSearch() {
  const [error, formAction, pending] = useActionState(sendFriendRequest, null);

  return (
    <form action={formAction} className="dossier">
      <div className="box-header">동료 찾기</div>
      <div className="p-4">
        <p className="text-sm text-ink-soft">
          친구가 가입한 이메일을 정확히 입력하면 친구 요청을 보냅니다.
        </p>
        <div className="mt-3 flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-56">
            <label className="label-mono">이메일</label>
            <input name="email" type="email" className="field" placeholder="friend@example.com" required />
          </div>
          <button className="btn-ink !py-[0.42rem]" disabled={pending}>
            {pending ? "확인 중…" : "친구 요청"}
          </button>
        </div>
        {error && <p className="stamp-badge text-xs mt-4">{error}</p>}
      </div>
    </form>
  );
}
