# 우진의 데브로그

Spring과 백엔드 시스템을 직접 만들고 문제를 풀며 얻은 내용을 기록하는 한국어 기술 블로그입니다.
Astro의 정적 콘텐츠 우선 구조로 운영하고, 검색·테마·목차·구독처럼 필요한 상호작용만 작은
브라우저 스크립트로 제공합니다.

## 기술 구성

- Astro 7 Content Collections와 MDX
- Tailwind CSS 4
- Vercel adapter와 서버리스 뉴스레터 API
- Node.js 24, Yarn 4.18.1

## 로컬 실행

```bash
nvm use
node .yarn/releases/yarn-4.18.1.cjs install --immutable
node .yarn/releases/yarn-4.18.1.cjs dev
```

전역 Yarn이 준비되어 있다면 `node .yarn/releases/yarn-4.18.1.cjs` 대신 `yarn`을 사용할 수 있습니다.

```bash
yarn check      # Astro 진단과 TypeScript 검사
yarn test       # production build와 회귀 테스트
yarn build      # Vercel 배포 산출물 생성
yarn build:qa   # 로컬 실브라우저 QA용 Node 서버 산출물 생성
yarn audit      # 직접·간접 의존성 보안 감사
```

## 콘텐츠와 편집 정보

- 글: `data/blog/**/*.mdx`
- 작성자: `data/authors/*.mdx`
- 시리즈: `data/series/*.json`
- 프로젝트: `data/projects/*.json`
- 홈 편집 순서: `data/editorial.json`
- 사이트 설정: `src/config.ts`

글 파일의 상대 경로가 공개 URL `/blog/<상대 경로>`가 됩니다. 기존 URL과 댓글 매핑을 보호하기
위해 파일 이동이나 이름 변경은 리다이렉트 계획 없이 하지 않습니다. 레이아웃과 접근성 계약은
[DESIGN.md](DESIGN.md)를 따릅니다.

## 외부 서비스

`.env.example`의 `PUBLIC_GISCUS_*` 값이 모두 있으면 글 하단 댓글을 연결합니다. 값이 없으면
미설정 상태를 명시합니다. `BUTTONDOWN_API_KEY`가 없으면 뉴스레터 API는 503으로 응답합니다.

## 라이선스

[MIT](LICENSE)
