# PROJECT KNOWLEDGE BASE

생성: 2026-10-29 · 기준 커밋: `c992e7b` · 브랜치: `main`

## OVERVIEW

손우진의 한국어 기술 블로그입니다. Astro 7.4.2, MDX 8.1.1, Tailwind CSS 4.3.3과
Vercel adapter를 사용합니다. 정적 콘텐츠를 우선하며 검색·테마·목차·구독에만 작은 클라이언트
스크립트를 둡니다.

## STRUCTURE

```text
src/pages/               # Astro 파일 기반 라우트와 서버리스 API
src/components/          # 목록·시리즈·댓글·구독 컴포넌트
src/layouts/             # 공통 HTML shell
src/lib/                 # 콘텐츠 카탈로그·RSS·Markdown 호환 계층
src/styles/              # 역할 토큰과 전역 반응형 스타일
data/blog/               # URL을 보존하는 기존 MDX 글
data/authors/            # 작성자 MDX
data/series/             # 시리즈 정의와 명시적 글 순서
data/projects/           # 검증된 프로젝트 정보
public/static/           # 기존 글 이미지와 사이트 자산
public/diagrams/         # 빌드 전에 검증하는 Mermaid SVG
tests/                   # Node 내장 러너 기반 이관·RSS·보안 회귀 테스트
```

## WHERE TO LOOK

| 작업 | 위치 | 함께 확인할 곳 |
| --- | --- | --- |
| 사이트 제목·주소 | `src/config.ts` | RSS, sitemap, layout |
| 콘텐츠 스키마 | `src/content.config.ts` | `data/` frontmatter |
| 전체 콘텐츠 정책 | `src/lib/catalog.ts` | draft 제외, 시리즈 참조 |
| 공통 헤더·검색·테마 | `src/layouts/BaseLayout.astro` | `src/styles/global.css` |
| 글 상세·목차·댓글 | `src/pages/blog/[...slug].astro` | `Comments.astro` |
| 홈 편집 순서 | `data/editorial.json` | 글·시리즈 id |
| RSS·검색·sitemap | `src/pages/*.xml.ts`, `search.json.ts` | `src/lib/rss.ts` |
| 뉴스레터 입력 경계 | `src/pages/api/newsletter.ts` | `lib/newsletter.mjs` |
| 디자인 계약 | `DESIGN.md` | 390/768/1440, 두 테마 |

## CONVENTIONS

- 글의 `data/blog` 상대 경로가 공개 `/blog/<id>` URL입니다. 리다이렉트 없이 이동·이름 변경하지 않습니다.
- 모든 컬렉션 입력은 Zod 스키마로 검증합니다. 잘못된 참조를 빈 값으로 숨기지 않습니다.
- TypeScript는 Astro strictest를 따릅니다. `any`, 무근거 assertion, `@ts-ignore`를 추가하지 않습니다.
- 작은따옴표, 세미콜론 없음, 2칸, 폭 100을 유지합니다.
- 생성물 `.astro`, `dist`, `.vercel/output`과 실브라우저 증거는 소스로 수정하지 않습니다.
- 외부 스크립트·서비스를 추가하면 `vercel.json` CSP와 미설정·실패 상태를 함께 확인합니다.

## COMMANDS

저장소에 Yarn 실행 파일이 포함되어 있습니다.

```bash
node .yarn/releases/yarn-4.18.1.cjs install --immutable
node .yarn/releases/yarn-4.18.1.cjs dev
node .yarn/releases/yarn-4.18.1.cjs check
node .yarn/releases/yarn-4.18.1.cjs test
node .yarn/releases/yarn-4.18.1.cjs build:qa
node .yarn/releases/yarn-4.18.1.cjs audit
```

## VALIDATION

- 코드·콘텐츠 변경은 최소 `check`와 `test`를 실행합니다.
- UI 변경은 390/768/1440px, 밝음/어두움, 실제 Chromium에서 확인합니다.
- 완료 주장은 공개 경로·검색·RSS·sitemap·구독 입력 경계의 실제 산출물에 묶습니다.
- Giscus와 Buttondown은 자격 증명 없는 로컬 검증만으로 실서비스 연결을 주장하지 않습니다.
