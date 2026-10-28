# CONTENT AUTHORING

`data`는 MDX 글·작성자와 사이트 설정의 원본입니다. 스키마 기준은 루트 `contentlayer.config.ts`입니다.

## WHERE TO LOOK

| 대상          | 위치                                   | 계약                                  |
| ------------- | -------------------------------------- | ------------------------------------- |
| 게시글        | `blog/**/*.mdx`                        | `Blog` 문서; 하위 폴더도 URL에 포함   |
| 작성자        | `authors/**/*.mdx`                     | `Authors` 문서; 파일 slug로 글과 연결 |
| 사이트 설정   | `siteMetadata.js`                      | 제목·주소·외부 서비스 설정            |
| 메뉴·프로젝트 | `headerNavLinks.ts`, `projectsData.ts` | 표시 순서와 카드 데이터               |
| 인용 자료     | `references-data.bib`                  | `bibliography` 경로는 `data` 기준     |

## FRONTMATTER

`Blog`의 필수 필드는 `title: string`, `date: date` 두 개입니다. 최소 예시:

```yaml
---
title: 'Spring 예제'
date: '2026-10-28'
---
```

선택 필드와 사용 조건:

| 필드           | 타입·기본값            | 작성 시 확인                                                           |
| -------------- | ---------------------- | ---------------------------------------------------------------------- |
| `tags`         | 문자열 배열, 기본 `[]` | 기존 태그 표기와 통일                                                  |
| `lastmod`      | 날짜                   | 수정일; 미지정 시 SEO에서 `date` 사용                                  |
| `draft`        | boolean                | 비공개 보장은 아래 주의사항 참고                                       |
| `summary`      | 문자열                 | 목록·SEO·RSS 요약                                                      |
| `images`       | JSON                   | `['/static/images/main-thumbnail.png']`처럼 비어 있지 않은 배열 사용   |
| `authors`      | 문자열 배열            | 생략하면 `['default']`; `authors/default.mdx` 등 실제 작성자 slug 사용 |
| `layout`       | 문자열                 | `PostLayout`(기본), `PostSimple`, `PostBanner` 중 선택                 |
| `bibliography` | 문자열                 | 예: `references-data.bib`                                              |
| `canonicalUrl` | 문자열                 | 스키마에는 있으나 현재 글 metadata에서 직접 반영하지 않음              |

- `images`는 스키마가 JSON이어도 구조화 데이터가 `images[0]`을 읽으므로 문자열 단독으로 쓰지 않습니다.
- 작성자 이름이 아닌 slug를 `authors`에 넣습니다. 없는 slug는 작성자 조회에 실패합니다.
- layout 키는 `app/blog/[...slug]/page.tsx`의 `layouts` 맵과 일치해야 합니다.
- `Authors`는 `name: string`이 필수입니다. 선택 문자열 필드는 `avatar`, `occupation`,
  `company`, `email`, `twitter`, `linkedin`, `github`, `layout`입니다.

## URL·MDX 계약

- `data/blog/spring/spring_knowhow_01.mdx` → slug `spring/spring_knowhow_01`
  → `/blog/spring/spring_knowhow_01`. 제목이 아닌 파일 경로로 URL이 결정됩니다.
  기존 글의 파일명·폴더 이동은 URL 변경이므로 기존 링크에 미치는 영향을 확인합니다.
- `public/static/images/main-thumbnail.png`는 본문에서 `/static/images/main-thumbnail.png`로 참조합니다.
- 태그 링크·집계·RSS는 `github-slugger`의 `slug()`를 사용합니다. 예: `Spring Boot` →
  `spring-boot`. 대소문자·공백·문장부호 차이가 같은 slug로 합쳐질 수 있으므로 기존 태그를 확인합니다.
- 공통 MDX 컴포넌트는 `components/MDXComponents.tsx`에 등록합니다.
  현재 `Image`, `TOCInline`, `BlogNewsletterForm`과 `a`, `pre` 매핑을 제공합니다.
- MDX는 GFM·수식·코드 제목·GitHub alert·인용 플러그인을 사용합니다.
  인용 파일의 기준 경로는 `contentlayer.config.ts`의 `rehypeCitation` 설정입니다.
- 새 Spring / Spring Boot 글의 코드 예시는 사용자 선호에 따라 Kotlin을 기본으로 작성합니다.
  기존 글의 Java 예시를 일괄 변환하는 규칙은 아닙니다.

## 공개 범위 주의

- `draft: true`는 production 목록·검색과 상세·metadata·sitemap·정적 params·RSS에서 제외됩니다.
  공통 정책은 `lib/publication.mjs`입니다. 새 공개 출력 경로에도 같은 필터를 적용하세요.
- 공개 Git 저장소에 커밋한 MDX 원문은 비공개가 아닙니다. draft를 기밀 저장 수단으로 사용하지 마세요.
- 게시물을 초안으로 전환하거나 태그를 제거하면 빌드가 오래된 생성 RSS를 정리합니다.
