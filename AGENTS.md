<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 대외활동 아카이버 — 프로젝트 규칙

대학생 대외활동 기록·공유 앱. 활동 기록 + 초대 링크(`/join/[token]`)로 참여자 공유 + 친구 타임라인 + 공고 스크랩.

## 구조

- Next.js 16 App Router + TypeScript + Tailwind 4. 별도 백엔드 없음. 실행: `npm run dev`
- 쓰기는 서버 액션(`src/lib/actions.ts`), 읽기는 `src/lib/queries.ts`. API 라우트는 파일 서빙(`app/api/files/`) 하나뿐 — 새 API 라우트를 만들기 전에 서버 액션으로 되는지 먼저 생각한다.
- 인증은 `src/lib/auth.ts`의 자체 세션 방식(bcryptjs). 외부 인증 라이브러리를 제안하지 않는다.

## DB — 주의

- better-sqlite3 + Drizzle. 스키마가 **두 곳에 중복 정의**되어 있다: `src/db/index.ts`(raw CREATE TABLE + 수동 마이그레이션)와 `src/db/schema.ts`(Drizzle). **테이블·컬럼을 바꾸면 반드시 두 파일을 함께 수정**하고, 기존 DB용 마이그레이션은 index.ts의 `PRAGMA table_info` 패턴을 따라 추가한다.
- `data/archive.db`는 실사용 데이터다. 지우거나 초기화하지 않는다.

## 디자인 컨셉 — "인광 관제실"

- #0a0e0d 청흑 캔버스 + #4dd8c0 인광 청록 액센트 + #f2b33d 호박 경고. D-day 추적(마감 관제)이 앱의 심장이라는 데서 나온 컨셉 — 헤더는 ARCHIVE 워드마크 + 상태 판독줄, 마감 임박은 `pulse-warn` 점멸.
- 폰트: 라틴 표제 Rajdhani + 데이터 JetBrains Mono (next/font/google 자체 호스팅, 한글은 시스템 산세리프 폴백).
- ⚠️ CSS 토큰 이름은 옛 종이 컨셉 시절 것을 유지 중: `--paper`=캔버스(다크), `--ink`=텍스트(밝음), `--stamp`=경고 레드, `--seal`=호박. 이름만 보고 밝은 색을 넣지 말 것. 새 색이 필요하면 `globals.css` 토큰에 추가하고 하드코딩하지 않는다.
- GitHub Primer를 그대로 베낀 요소(파란 링크·초록 버튼·user/repo 헤더 등)는 2026-07-15에 걷어냈다. 되돌리지 말 것.

## 확인 방법

- 변경 후 `npm run dev`로 띄워 해당 화면을 실제로 확인한다. 스키마 변경 시 기존 `data/archive.db`로도 서버가 정상 기동하는지 본다.
