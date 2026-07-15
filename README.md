# 대외활동 기록보관소

공모전·동아리·봉사·인턴 — 흩어진 대외활동을 한 서고에 모으는 아카이버.
개인 기록이 기본이고, 활동마다 초대 링크로 함께한 친구를 참여자로 불러올 수 있다.

## 기능

- **서고**: 활동 기록 (기간·역할·내용·성과) + 증빙 파일 보관 (수료증, 상장, 사진 — 최대 20MB)
- **초대**: 활동 상세의 초대 링크를 친구에게 보내면, 가입 후 그 활동이 친구의 서고에도 나타난다
- **스크랩**: 공고 URL·마감일을 스크랩하면 D-day 순으로 정렬, 지원 상태(지원예정→합격 등) 관리
- **연대기·통계**: 연도별 타임라인, 연도별 활동 수, 분야별 분포

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

DB(SQLite)와 업로드 파일은 `data/`에 자동 생성된다. 별도 설정 없음.

## 구조

- Next.js 16 (App Router, server actions) + TypeScript + Tailwind 4
- SQLite (better-sqlite3) + Drizzle ORM — 스키마는 `src/db/schema.ts`, DDL은 `src/db/index.ts`
- 세션 인증 직접 구현 (bcrypt + httpOnly 쿠키) — `src/lib/auth.ts`
- 서버 액션 전부 `src/lib/actions.ts`
