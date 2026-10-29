# 보안 점검 및 유지보수

점검일: 2026-10-29. Astro 마이그레이션 이후의 의존성, 콘텐츠 출력, 공개 API와 Vercel
배포 경계를 기준으로 작성했습니다. 클라우드 계정이나 외부 서비스 자체에 대한 침해 조사는
포함하지 않습니다.

## 현재 기준

- Astro 7.4.2, MDX 8.1.1, Tailwind CSS 4.3.3, Vercel adapter 11.0.16을 사용합니다.
- Node.js 24와 저장소에 포함된 Yarn 4.18.1 실행 파일을 기준으로 설치를 재현합니다.
- `yarn audit`에서 알려진 직접·간접 의존성 취약점 제안이 없음을 확인했습니다.
- Astro 진단, TypeScript 검사, production build와 Node 회귀 테스트를 통과했습니다.
- Vercel Preview에서 공개 경로와 보안 헤더를 확인했으며, 실제 외부 구독 요청은 보내지 않았습니다.

## 콘텐츠 경계

- `src/content.config.ts`의 Zod 스키마가 글·작성자·시리즈·프로젝트 입력을 검증합니다.
- `src/lib/catalog.ts`가 초안을 공개 목록, 상세 경로, 검색, RSS와 sitemap에서 제외합니다.
- 시리즈 글 참조는 존재 여부와 중복을 검증하며 잘못된 참조를 빈 값으로 숨기지 않습니다.
- MDX는 저장소 작성자가 관리하는 신뢰된 빌드 입력입니다. 익명 사용자가 제공한 MDX를 빌드에
  포함하거나 그대로 실행해서는 안 됩니다.
- RSS, sitemap과 JSON 검색 문서는 공개 글만 사용하고 URL 및 XML 경계를 회귀 테스트로
  검증합니다.

## 뉴스레터 API

- `POST /api/newsletter`만 지원하며 Buttondown의 고정 HTTPS endpoint로만 요청합니다.
- `BUTTONDOWN_API_KEY`가 없거나 설정이 유효하지 않으면 503으로 닫힙니다.
- 설정된 사이트 URL과 정확히 같은 Origin 및 `application/json` 요청만 허용합니다.
- 본문은 최대 2 KiB, 이메일은 최대 254자이며 예상하지 않은 필드를 거부합니다.
- 본문 읽기와 provider 응답은 각각 기본 5초 제한, 자동 재시도 없음, redirect 거부입니다.
- provider 오류 본문과 자격 증명은 응답에 노출하지 않습니다.
- 프로세스당 30회/분, 동시 4개 요청으로 제한합니다. 이 카운터는 인스턴스와 재시작 사이에
  공유되지 않으므로 대규모 분산 요청에는 Vercel Firewall이나 별도 rate limit이 필요합니다.

## 브라우저 및 배포 경계

`vercel.json`은 모든 경로에 다음 정책을 적용합니다.

- CSP: 자체 출처를 기본으로 사용하고 object, base, frame ancestor와 form action을 제한합니다.
- Giscus와 Umami에 필요한 script, frame, connect 출처만 명시적으로 허용합니다.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS를 적용합니다.
- 카메라, 마이크와 위치 권한을 비활성화하고 strict-origin referrer 정책을 사용합니다.

초기 테마 적용과 작은 인라인 상호작용 때문에 CSP의 `unsafe-inline` script/style은 현재 남아
있습니다. nonce 또는 hash 정책으로 바꾸려면 정적 페이지 생성과 캐시 구조를 함께 검토해야 합니다.

## 외부 서비스

- Giscus는 `PUBLIC_GISCUS_*` 값이 모두 있을 때만 로드하며, 없으면 미설정 상태를 표시합니다.
- Buttondown은 서버 전용 `BUTTONDOWN_API_KEY`가 있을 때만 호출합니다.
- 자격 증명이 없는 로컬·Preview 검증만으로 Giscus 댓글이나 Buttondown 실발송 연결을
  주장하지 않습니다.
- `.env`, `.env.local`과 Vercel 로컬 메타데이터는 Git에 포함하지 않습니다.

## 검증

```bash
node .yarn/releases/yarn-4.18.1.cjs install --immutable
node .yarn/releases/yarn-4.18.1.cjs check
node .yarn/releases/yarn-4.18.1.cjs test
node .yarn/releases/yarn-4.18.1.cjs build:qa
node .yarn/releases/yarn-4.18.1.cjs audit
```

UI 변경은 Chromium에서 390, 768, 1440px의 밝음·어두움 테마를 확인합니다. 완료 판단은 홈,
기존 글 URL, 검색, RSS, sitemap, robots와 뉴스레터 입력 경계의 실제 산출물에 묶습니다.

## 운영 시 확인할 사항

- 배포 전 `check`, `test`, `audit`와 Vercel Preview를 다시 실행합니다.
- Vercel의 Framework Preset은 Astro, Node.js는 24.x를 유지합니다.
- 환경 변수 이름과 값은 로그, 빌드 산출물, 클라이언트 번들에 노출하지 않습니다.
- 의존성이나 외부 스크립트 출처를 추가하면 CSP와 실패·미설정 상태를 함께 갱신합니다.
- 초안 필터는 사이트 출력 정책일 뿐입니다. 공개 Git 저장소에 커밋한 원문은 비공개가 아닙니다.
