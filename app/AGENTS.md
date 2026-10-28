# APP ROUTES

App Router의 URL 구성, 서버 데이터 준비, SEO와 provider 경계를 다룹니다. 공통 규칙은 루트 문서를 따릅니다.

## WHERE TO LOOK

| URL·역할                      | 파일                                   | 연결                             |
| ----------------------------- | -------------------------------------- | -------------------------------- |
| `/`                           | `page.tsx` → `Main.tsx`                | 정렬된 글 목록 → 홈 표시         |
| `/blog`                       | `blog/page.tsx`                        | 목록 1페이지                     |
| `/blog/page/[page]`           | `blog/page/[page]/page.tsx`            | 페이지 번호별 목록               |
| `/blog/[...slug]`             | `blog/[...slug]/page.tsx`              | 글 metadata·JSON-LD·MDX 렌더링   |
| `/tags`, `/tags/[tag]`        | `tags/page.tsx`, `tags/[tag]/page.tsx` | 태그 집계·필터 목록              |
| `/about`                      | `about/page.tsx`                       | 기본 작성자 MDX → `AuthorLayout` |
| `/projects`                   | `projects/page.tsx`                    | `projectsData` → `Card`          |
| `/api/newsletter`             | `api/newsletter/route.ts`              | POST 전용 입력 검증 → Buttondown |
| `/sitemap.xml`, `/robots.txt` | `sitemap.ts`, `robots.ts`              | 사이트 URL 기반 검색엔진 응답    |

## DATA FLOW & PAGINATION

- 홈과 블로그 목록은 `allCoreContent(sortPosts(allBlogs))`로 렌더링용 데이터를 준비합니다.
  글 상세의 이전·다음 링크도 같은 정렬 결과에서 인덱스를 기준으로 고릅니다.
- `POSTS_PER_PAGE = 5`는 `blog/page.tsx`와 `blog/page/[page]/page.tsx`에 각각 있습니다.
  페이지 크기를 바꿀 때 두 파일의 slice·totalPages·정적 경로 생성이 일치해야 합니다.
- 홈의 `Main.tsx`는 별도 `MAX_DISPLAY = 5`로 자릅니다. 블로그 페이지 크기와 자동 연동되지 않습니다.
- 페이지 라우트의 정적 경로 수와 표시 페이지 수는 공개 글 기준입니다.
  필터 조건을 바꿀 때 생성 경로와 표시 목록의 개수를 따로 확인하세요.
- `ListLayoutWithTags`는 `initialDisplayPosts`가 비면 전체 `posts`로 대체합니다.
  빈 slice를 넘기는 것만으로 빈 페이지가 되지 않습니다.
- 페이지 번호는 해제한 값에 `parseInt(page)`를 적용하며 범위·NaN 검증이 없습니다.
  페이지네이션 링크는 pathname의 첫 구간을 basePath로 삼고 1페이지로는 `/blog/`를 사용합니다.
- 태그 상세는 slug로 필터링한 전체 목록만 넘깁니다. 현재 태그별 페이지네이션 라우트는 없습니다.

## ROUTE CONTRACTS

- Next.js 15의 페이지·metadata `params`는 Promise입니다. 먼저 `await params`로 해제합니다.
- 글 정적 params는 `slug.split('/')` 배열, 조회 시에는 해제한 배열을 join 후 `decodeURI`합니다.
  한글·중첩 경로를 변경하면 본문 조회와 `generateMetadata`의 변환을 함께 확인하세요.
- 태그 정적 params는 `tag-data.json`의 키입니다. 조회는 해제한 tag를 `decodeURI`한 후
  `github-slugger`의 `slug(t)` 결과와 비교합니다.
- 글 상세와 metadata는 `publishedPosts`로 공개 글만 조회하며 초안·미등록 slug는 `notFound()`로 404 처리합니다.
- 태그·페이지 번호 라우트에는 `dynamicParams = false`가 없습니다. 정적 params만으로 입력 검증을 대신하지 마세요.

## SEO & CLIENT BOUNDARIES

- `seo.tsx`의 `genPageMetadata`는 블로그·소개·프로젝트·태그 목록·태그 상세에서 사용합니다.
  `description` 인자는 Open Graph에 들어가며 최상위 `description` 필드는 이 helper가 설정하지 않습니다.
  마지막 `...rest`가 기본 필드를 덮어쓰므로 `openGraph` 등을 전달하면 객체 전체가 대체됩니다.
- 글 상세는 helper 대신 article metadata와 JSON-LD를 직접 만듭니다.
  페이지 번호 라우트는 별도 metadata export가 없습니다.
- 실제 shell은 `layout.tsx`입니다. `ThemeProviders` 안에 Analytics와 페이지 틀이 있고,
  `SearchProvider`는 Header·main을 감싸며 Footer는 그 바깥에 있습니다.
- `app` 내부의 `'use client'` 선언은 `theme-providers.tsx`에만 있습니다.
  목록의 pathname 사용은 client 컴포넌트인 `layouts/ListLayoutWithTags.tsx`에서 처리합니다.
  서버 라우트에서 콘텐츠를 준비하고 현재 client 경계를 유지하세요.
- favicon·theme-color·RSS link 선언은 `layout.tsx`와 `head.tsx` 양쪽 소스에 있습니다.
  head 관련 변경 시 두 파일을 확인하되 실제 중복 출력 여부는 렌더링 결과로 판단하세요.
- sitemap의 고정 경로는 홈·blog·projects·tags뿐입니다. 새 페이지나 about이 자동 등록되지는 않습니다.
- Newsletter는 POST만 지원하며 `lib/newsletter.mjs`에서 Origin·본문·이메일을 검증합니다.
  키 미설정 시 503; 프로세스별 요청 제한의 한계는 `SECURITY.md`를 확인하세요.
