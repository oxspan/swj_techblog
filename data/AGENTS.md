# CONTENT CONTRACT

## URL과 공개 범위

- `data/blog` 아래 MDX 상대 경로가 그대로 `/blog/<id>`가 됩니다.
- 기존 파일을 옮기거나 이름을 바꾸면 URL과 Giscus pathname 매핑이 바뀝니다. 리다이렉트와 댓글
  이전 계획 없이 변경하지 않습니다.
- `draft: true` 글은 목록, 시리즈, 태그, 검색, RSS와 sitemap에서 모두 제외됩니다.

## Frontmatter

- 필수: `title`, `date`, `tags`
- 선택: `lastmod`, `draft`, `summary`, `images`, `authors`, `presentation`, `canonicalUrl`
- `presentation`은 `simple`, `banner`, `default` 중 하나입니다. Astro의 예약된 MDX `layout` 필드는
  사용하지 않습니다.
- 날짜와 URL은 실제 값만 기록합니다. 확인되지 않은 역할·성과·현재 상태를 만들지 않습니다.

## 시리즈·프로젝트·홈 편집

- `data/series/*.json`의 `posts`는 실제 MDX id를 읽는 순서대로 나열합니다. 한 글을 여러 시리즈에
  중복 배정하지 않습니다.
- `data/projects/*.json`에는 확인된 설명과 링크만 둡니다.
- `data/editorial.json`은 홈 대표 글·시리즈 순서만 제어하며 존재하지 않는 id를 참조하지 않습니다.

## 작성과 검증

- 본문 H1은 페이지 제목과의 충돌을 막기 위해 H2로 정규화하되 내용은 삭제하지 않습니다.
- Mermaid 블록은 `public/diagrams`의 밝음·어두움 SVG와 일치해야 빌드됩니다.
- 변경 후 `yarn check`와 `yarn test`로 스키마, 공개 경로, 시리즈 참조, RSS를 확인합니다.
