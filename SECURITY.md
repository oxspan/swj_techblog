# 보안 점검 및 유지보수

점검일: 2026-10-28. 현재 잠금 파일의 알려진 의존성 취약점과 저장소의 공개 요청·콘텐츠 출력 경로를 점검했습니다.
운영 배포·클라우드 계정·Git 전체 이력·미공개 취약점에 대한 침해 조사 결과는 아닙니다.

## 결과

- 전체 직접·간접 의존성 감사: **0건**, 종료 코드 0. 감사 제외·무시 설정 없음.
- 최초 잠금 파일의 취약 패키지 44개, 1차 업데이트 후 6개/10개 공지에서 모두 해소.
- 공개 newsletter 입력 경계, 초안 노출, JSON-LD/XML 이스케이프, 실행 URL scheme, CSP를 보강.
- 설치 재현성, lint, 타입 검사, production build 및 보안 회귀 테스트로 검증.
- 실제 발송·운영 계정에는 접근하지 않았고 아직 배포하지 않았습니다.

## 의존성 수정

| 항목                                           | 적용 버전·방법                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Next.js / bundle analyzer / eslint-config-next | 15.5.28, [공식 보안 수정](https://nextjs.org/blog/nextjs-security-update-october-14-2026) |
| Contentlayer2 / next-contentlayer2 / Pliny     | 0.5.8 / 0.5.8 / 0.4.1                                                                     |
| esbuild / Sharp                                | 0.28.2 / 0.35.5                                                                           |
| Yarn / Node 기준                               | Yarn 4.18.1, Node 24; Node 22.22.1+인 22.x도 허용                                         |
| Zod                                            | 4.6.6; Contentlayer의 세 record 호출을 v4 API로 패치                                      |
| OpenTelemetry core/resources/trace SDK         | 2.9.0; OTLP gRPC exporter 0.220.0                                                         |
| OpenTelemetry API                             | SDK가 선언한 호환 범위에 맞춰 1.9.0 고정                                                  |
| TOML / UUID / KaTeX                            | 5.0.1 / 11.1.1 / 0.18.2                                                                   |
| js-yaml / PostCSS / selector parser            | 취약 고정을 resolutions로 교체: 4.3.2 / ^8.5.23(잠금 8.5.31) / 6.1.5                      |

React/React DOM 18.3.1과 Tailwind 3.x는 유지합니다. Next.js 15는 점검일 기준 Maintenance LTS이며
[지원 정책](https://nextjs.org/support-policy)의 후속 변경을 확인해야 합니다.
사용하지 않는 image-size 및 Linux 전용 esbuild 직접 고정도 제거했습니다.

커밋 전 재감사에서 `deepmerge` 4.3.1의
[prototype poisoning 공지](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)가 추가로 탐지됐습니다.
수정 버전이 없어, 유일한 의존 경로인 `@svgr/webpack`과 하위 도구를 제거했습니다.
헤더 로고는 같은 SVG 원본·53×43 크기를 Next.js Image의 `unoptimized` 방식으로 표시합니다.
취약 패키지를 구버전으로 내리거나 감사에서 제외하지 않았습니다.
390px·1440px의 light/dark 네 가지 화면에서 변경 전후 헤더 픽셀 차이가 없음을 확인했습니다.

### 유지해야 하는 호환 패치

`.yarn/patches`와 `package.json`의 patch resolutions를 함께 관리합니다.
보안 버전 문자열만 바꾸거나 감사 경고를 숨긴 패치가 아닙니다.

- `@contentlayer2/source-files`: 실제 Zod 4를 설치하고
  `record(valueSchema)`를 `record(string(), valueSchema)`로 수정했습니다.
  [Zod v4 변경 사항](https://zod.dev/v4/changelog)을 기준으로 정상·잘못된 nested 필드를 검증했습니다.
- `@contentlayer2/utils`: 실제 OpenTelemetry 2.x를 설치하고
  Resource 생성과 span processor 등록을 새 생성자 API로 옮겼습니다.
  [OTel 2.x 이행 문서](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/upgrade-to-2.x.md)에 따라
  managed provider 종료 시 processor/exporter를 flush·shutdown합니다.
  취약한 구버전 Jaeger propagator는 의존 그래프에서 제거됐습니다.

전역 resolution을 삭제하거나 Contentlayer를 업그레이드할 때 `tests/dependency-compatibility.test.mjs`를 실행하세요.
이 테스트는 실제 Contentlayer 파싱과 로컬 gRPC 수집기로의 span 전송까지 검증합니다.
TOML의 객체 반환, UUID의 CommonJS v4 호출, KaTeX CSS 경로·수식 렌더링·오염된 prototype의 trust 거부도 확인합니다.

## 애플리케이션 수정과 근거

| 영역       | 수정 전 확인                                                                    | 수정 후                                                                                                  |
| ---------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 초안       | 합성 draft의 제목·요약이 metadata/태그 RSS에, URL이 sitemap/정적 params에 노출  | 공통 공개 필터; 상세·metadata는 404; sitemap/search/태그 집계/RSS/페이지 수에서 제외                     |
| JSON-LD    | 제목의 닫는 script 문자열이 HTML script 요소를 종료                             | JSON 직렬화 시 <를 유니코드 escape; 원본 structuredData도 변경하지 않음                                  |
| RSS        | &가 있는 태그로 XML 파싱 실패; 삭제된 태그 피드가 디스크에 남음                 | 모든 동적 XML 값 escape, 공개 글만 정렬, 올바른 self URL, 오래된 feed.xml만 정리                         |
| Newsletter | text/plain·다른 Origin·객체/잘못된 이메일이 provider에 전달, JSON 오류가 미처리 | POST만, 설정된 siteUrl Origin, JSON 타입/스키마 검증, 스트리밍 본문 제한, 일반화한 오류                  |
| 링크       | javascript/data 등 실행 scheme을 제한하지 않음                                  | http/https/mailto/tel 및 상대 주소만 허용; 외부 링크 rel/target을 props로 덮을 수 없음                   |
| CSP·이미지 | production unsafe-eval, 임의 connect-src, 이미지 domains                        | production eval 제거, 연결 대상 제한, object/base/frame/form 정책, HTTPS remotePatterns, SVG 최적화 거부 |

JSON-LD/RSS/MDX 링크의 입력은 현재 저장소 작성자가 관리합니다.
이를 외부 익명 사용자의 즉시 실행 가능한 XSS로 분류하지 않습니다.
MDX 자체는 코드를 실행할 수 있으므로 신뢰하지 않는 사용자 MDX를 빌드 입력으로 받아서는 안 됩니다.

### Newsletter 운영 계약

- Buttondown만 지원합니다. API 키가 없거나 설정이 유효하지 않으면 503으로 중단합니다.
- Origin은 `siteMetadata.siteUrl`과 정확히 일치해야 합니다. Host/Forwarded 헤더를 신뢰 목록으로 사용하지 않습니다.
  로컬·preview 도메인을 운영 도메인으로 자동 허용하지 않습니다.
- 요청 본문 최대 2 KiB, 본문 읽기와 provider 응답 각각 5초, 이메일 최대 254자.
- 고정 HTTPS endpoint, 자동 재시도 없음, redirect 거부, provider 오류 본문·자격 증명 미노출.
- 프로세스당 30회/분·동시 4개 제한. 다중 인스턴스·재시작 사이에는 공유되지 않습니다.
  대규모 분산 요청 방어는 배포 플랫폼의 rate limit/WAF 또는 CAPTCHA가 추가로 필요합니다.
- Origin 검사는 브라우저의 교차 출처 남용을 줄이며 서버 클라이언트의 인증 수단은 아닙니다.

## 검증

`yarn test`는 20개 보안/호환 회귀 테스트를 실행합니다.

- Newsletter 정상 mock 요청, 방법/Origin/media type/스키마 거부, 큰 본문, 느린 업로드,
  외부 오류·timeout, 재시도 금지, 요청 예산·동시성 제한.
- 초안 필터·prototype 모양 태그, JSON-LD script 종료 방지, RSS encoding·stale cleanup.
- 실제 Zod nested 파싱, TOML/UUID/KaTeX 호환, OTel 로컬 gRPC 전송·종료.
- 실행 URL scheme 차단과 일반 내비게이션 보존.

합성 MDX로 **수정 전 노출·잘못된 XML을 재현**한 뒤 production 빌드/HTTP에서
draft 404, sitemap/RSS 제외, XML 정상 파싱을 확인했습니다.
별도 Chromium 프로필에서는 script canary 미실행과 실제 MDX 렌더링을 확인했습니다.
합성 파일은 검증 후 제거하고 원래 글 27개·작성자 2개를 다시 빌드했습니다.
최종 실제 콘텐츠에서는 63개 URL, 21개 RSS XML, 브라우저 테마 전환·검색·글 이동을 확인했습니다.
재현 가능한 보안·호환 검증은 `tests/*.test.mjs`에 있으며, 로컬 브라우저 캡처와 실행 로그는 Git에 포함하지 않습니다.

실제 Next API에서도 교차 출처 403, media type 415, malformed/null/객체 이메일 400,
2 KiB 초과 413, GET 405, 미설정 키 503을 확인했습니다.
발송 검증은 mock transport만 사용했습니다.

현재 추적되는 텍스트 파일에서 비밀키 패턴을 검사했고 발견되지 않았습니다.
검사 대상은 private key, AWS/GitHub/Stripe 토큰 및 비어 있지 않은 credential 대입이며,
전용 secret scanner 또는 Git 이력 전체 검사와 동일한 보장은 아닙니다.

```bash
yarn install --immutable
yarn lint
yarn test
yarn build
yarn typecheck
yarn audit
```

Yarn 3의 quick-audit API는 HTTP 400으로 실패하여 최초 집계만 npm bulk advisory API를 사용했습니다.
현재 Yarn 4 감사 명령은 작동합니다. `--no-deprecations`는 지원 중단 안내만 제외합니다.

## 남아 있는 운영 조건

- 초기 hydration/theme용 inline script 때문에 CSP의 unsafe-inline은 유지합니다.
  nonce/hash 정책은 정적 페이지 생성·캐시 구조를 함께 검토해야 합니다.
- 외부 Giscus/Umami 계정, 실제 Buttondown 발송, 배포 플랫폼 설정은 자격 증명 없이 검증하지 않았습니다.
- Pliny 하위 react-virtual의 오래된 React peer 범위와 effect-ts의 구형 OTel peer 범위,
  Next의 incremental 경고/next lint 폐기 예정 안내,
  기존 글의 수식 문법 경고는 보안 감사와 별개로 남아 있습니다.
- 초안 필터는 사이트 출력 정책입니다. 공개 Git 저장소에 커밋한 MDX 원문은 비공개가 아닙니다.
- 운영 반영에는 잠금 파일·Yarn 패치·Node 설정을 포함한 재배포가 필요합니다.
