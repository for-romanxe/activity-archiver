"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup } from "@/lib/actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const action = mode === "login" ? login : signup;
  const [error, formAction, pending] = useActionState(action, null);
  const other = mode === "login" ? "/signup" : "/login";
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="dossier w-full max-w-md p-8">
        <p className="label-mono text-accent">Archive Console</p>
        <h1 className="text-xl font-semibold mt-1">
          대외활동 기록보관소
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {mode === "login"
            ? "로그인해서 내 활동 저장소에 접근하세요."
            : "새 계정을 만들어 나만의 저장소를 시작하세요."}
        </p>
        <div className="rule-dashed my-6" />
        <form action={formAction} className="space-y-5">
          {next && <input type="hidden" name="next" value={next} />}
          {mode === "signup" && (
            <div>
              <label className="label-mono">이름</label>
              <input name="name" className="field" placeholder="홍길동" required />
            </div>
          )}
          <div>
            <label className="label-mono">이메일</label>
            <input name="email" type="email" className="field" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label-mono">비밀번호{mode === "signup" && " (8자 이상)"}</label>
            <input name="password" type="password" className="field" required minLength={mode === "signup" ? 8 : undefined} />
          </div>
          {error && <p className="stamp-badge text-xs">{error}</p>}
          <button className="btn-ink w-full" disabled={pending}>
            {pending ? "확인 중…" : mode === "login" ? "로그인" : "계정 만들기"}
          </button>
        </form>
        <p className="mt-5 text-sm text-ink-soft">
          {mode === "login" ? "처음이신가요? " : "이미 계정이 있나요? "}
          <Link href={`${other}${nextQs}`} className="underline text-accent font-medium">
            {mode === "login" ? "계정 만들기" : "로그인"}
          </Link>
        </p>
      </div>
    </main>
  );
}
