# PROJECT KNOWLEDGE BASE

생성: 2026-10-28 · 기준 커밋: `57ac4ed` · 브랜치: `main`

## OVERVIEW

손우진의 한국어 기술 블로그. Next.js 15.5.28 App Router, React 18.3.1,
Tailwind CSS 3, Contentlayer2 0.5.8, Pliny 0.4.1 기반의 단일 패키지입니다.
응답은 기본적으로 한국어 존댓말로, 기술 판단은 실제 코드와 검증 결과를 근거로 설명합니다.

## STRUCTURE

```text
app/                    # 라우트·전역 shell·SEO; 세부 규칙은 app/AGENTS.md
components/             # 공통 UI, MDX 컴포넌트 등록, 댓글·검색 진입점
layouts/                # 글·목록·작성자 렌더링 템플릿
data/                   # MDX·사이트 설정; 세부 규칙은 data/AGENTS.md
css/                    # Tailwind 전역 스타일과 Prism 코드 강조
public/static/          # 게시글 이미지·프로필·favicon 원본
scripts/                # production build 이후 RSS 생성
lib/                    # 공개 콘텐츠 정책·RSS·newsletter 입력 경계·링크 검증
tests/                  # Node 내장 러너의 보안·호환 회귀 테스트
contentlayer.config.ts  # 콘텐츠 스키마·MDX 플러그인·파생 인덱스 생성
next.config.js          # Contentlayer 통합·CSP·이미지 도메인
```

## WHERE TO LOOK

| 작업                         | 위치                                                         | 확인할 연결                          |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| 사이트 제목·주소·외부 서비스 | `data/siteMetadata.js`                                       | 앱·Contentlayer·RSS가 공유           |
| 전역 헤더·푸터·provider      | `app/layout.tsx`                                             | `Header`, `Footer`, `ThemeProviders` |
| 홈 화면                      | `app/page.tsx`, `app/Main.tsx`                               | 생성 콘텐츠를 정렬해 전달            |
| 글 목록·태그 sidebar         | `layouts/ListLayoutWithTags.tsx`                             | 블로그·페이지네이션·태그가 공유      |
| 글 본문 템플릿               | `layouts/PostLayout.tsx`, `PostSimple.tsx`, `PostBanner.tsx` | 라우트의 layout 맵과 연동            |
| MDX 컴포넌트 추가            | `components/MDXComponents.tsx`                               | 렌더러에 전달하는 공통 registry      |
| 내비게이션·프로젝트 카드     | `data/headerNavLinks.ts`, `data/projectsData.ts`             | 설정 배열 편집                       |
| 디자인 토큰·본문 스타일      | `tailwind.config.js`, `css/tailwind.css`                     | primary=pink, class 기반 dark mode   |
| RSS                          | `lib/rss.mjs`, `scripts/rss.mjs`, `scripts/postbuild.mjs`     | 공개 콘텐츠의 전체·태그별 피드 생성   |
| 검색·태그 인덱스             | `contentlayer.config.ts`                                     | `onSuccess`에서 파일 기록            |

## CODE MAP

AST 선언·import와 소스를 대조한 지도입니다. TypeScript LSP 미설치로 semantic 참조 수는
미측정이며, 아래 호출 관계는 정적 import 기준입니다.

| 심볼                                  | 위치                             | 역할·관계                                |
| ------------------------------------- | -------------------------------- | ---------------------------------------- |
| `RootLayout`                          | `app/layout.tsx`                 | 실제 전역 shell                          |
| `Blog`, `Authors`                     | `contentlayer.config.ts`         | MDX 문서 스키마와 계산 필드              |
| `createTagCount`, `createSearchIndex` | `contentlayer.config.ts`         | 콘텐츠 컴파일 후 파생 데이터 생성        |
| `genPageMetadata`                     | `app/seo.tsx`                    | 5개 라우트 파일에서 공통 SEO 생성에 사용 |
| `components`                          | `components/MDXComponents.tsx`   | MDX의 이미지·링크·코드 블록 매핑         |
| `ListLayoutWithTags`                  | `layouts/ListLayoutWithTags.tsx` | 3개 목록 라우트에서 사용                 |
| `writeRssFeeds`                       | `lib/rss.mjs`                    | 전체·태그별 RSS 작성과 오래된 피드 제거   |

## CONVENTIONS

- 실제 소스는 루트의 `app`, `components`, `layouts`, `data`, `lib`에 있습니다. `src`, `pages`는 없습니다.
- 경로 별칭은 `tsconfig.json`과 `jsconfig.json`에 함께 정의되어 있습니다.
  `@/components/*`, `@/data/*`, `@/layouts/*`, `@/css/*`와 `contentlayer/generated`를 사용합니다.
- `contentlayer/generated`는 `.contentlayer/generated`를 가리키므로 콘텐츠 생성 전에는 타입이 없습니다.
- 포맷은 작은따옴표, 세미콜론 없음, 2칸, 폭 100, trailingComma `es5`입니다.
- TypeScript는 `strict: false`, `strictNullChecks: true`입니다. 엄격 모드 전체 활성화로 가정하지 마세요.
- `data/siteMetadata.js`의 CommonJS export는 Node ESM RSS에서도 읽습니다. 모듈 형식 변경 시 양쪽을 확인하세요.
- Tailwind는 `data/**/*.mdx`와 Pliny 배포 JS도 검색합니다. 콘텐츠/UI 경로를 추가하면 `content` glob을 확인하세요.
- 외부 분석·댓글 서비스를 바꾸면 `next.config.js`의 CSP도 함께 확인하세요.

## ANTI-PATTERNS

- `.contentlayer`, `.next`, `public/search.json`, RSS XML을 콘텐츠 원본으로 수정하지 마세요.
  `app/tag-data.json`도 생성물이며 Git 추적 대상이므로 생성 후 diff를 확인하세요.
- `components/LayoutWrapper.tsx`를 실제 전역 shell로, `layouts/ListLayout.tsx`를 현재 목록으로 오인하지 마세요.
  현재 소스에서 두 파일을 import하는 곳은 없습니다.
- 자동 수정은 `yarn lint:fix`로 명시합니다. `yarn lint`는 소스를 수정하지 않습니다.
- 보안 resolution의 근거와 잔여 경고는 `SECURITY.md`를 확인하세요. 감사 제외로 경고를 숨기지 마세요.
- `.yarn/patches`는 Zod 4·OpenTelemetry 2와 Contentlayer의 호환 패치입니다. 의존성 변경 시 호환 테스트를 실행하세요.
- 글 이동·이름 변경, layout·작성자 변경 전에는 `data/AGENTS.md`의 URL·렌더링 계약을 확인하세요.

## COMMANDS

저장소 루트에서 Node.js 24와 Yarn 4.18.1을 사용합니다. `.yarnrc.yml`은 저장소 Yarn 바이너리와
`node-modules` linker를 지정합니다. 전역 Yarn이 없으면 `node .yarn/releases/yarn-4.18.1.cjs`로 대체합니다.

```bash
yarn install --immutable
yarn dev           # INIT_CWD를 설정한 개발 서버
yarn start         # 이것도 개발 서버(next dev)
yarn build         # Next build + RSS 후처리
yarn serve         # production 서버(next start); build 선행
yarn analyze       # bundle 분석; RSS 후처리는 실행하지 않음
yarn lint          # app/components/layouts/scripts/lib/tests 자동 수정 없는 검사
yarn lint:fix      # 소스 자동 수정
yarn typecheck     # 생성 콘텐츠·라우트 타입 필요; incremental 캐시 기록 가능
yarn test          # Node 내장 러너; 보안 경계와 의존성 실제 호출 검증
yarn audit         # 모든 직접·간접 의존성; 새 경고 시 exit 1
```

## VALIDATION & NOTES

- 테스트는 `tests/*.test.mjs`와 `yarn test`를 사용합니다. 전용 format 스크립트와 GitHub Actions workflow는 없습니다.
  코드·콘텐츠 변경의 통합 검증은 `yarn build`, 정적 검사는 `yarn lint`와 `yarn typecheck`를 사용합니다.
- 빌드/개발 중 Contentlayer가 `app/tag-data.json`과 설정된 검색 인덱스를 갱신합니다.
  production build 후처리는 `public/feed.xml`, `public/tags/<tag>/feed.xml`을 생성합니다.
- `.nvmrc`는 Node 24를 선택합니다. `engines`는 Node 22.22.1 이상인 22.x 또는 24.x입니다.
  RSS 후처리는 Node ESM으로 실행하며 실험 플래그가 필요하지 않습니다.
- `app/layout.tsx`는 `next/font/google`을 사용하므로 빌드 시 폰트 다운로드가 필요할 수 있습니다.
- 환경 변수 이름은 `.env.example`과 `data/siteMetadata.js`를 함께 확인하세요.
  provider 설정이 있다는 사실만으로 외부 서비스가 작동한다고 단정하지 마세요.
- `.husky/pre-commit`은 lint-staged를 호출하며 ESLint/Prettier가 staged 파일을 수정합니다.
  `prepare` 스크립트는 없으므로 설치만으로 훅 활성화를 보장하지 않습니다.
