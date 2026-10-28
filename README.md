![tailwind-nextjs-banner](/public/static/images/twitter-card.png)

# 손우진 : 기술블로그

![image](https://github.com/swj9707/swj_techblog/assets/36991763/7dc90ff6-ef61-46a1-85e2-3ef651815f81)

- Next.js, Tailwind CSS Starter를 통해 생성 한 기술 블로그입니다.

## 개발 환경

Node.js 24와 Yarn 4.18.1을 사용합니다. Node.js 22.22.1 이상인 22.x도 지원합니다.
Yarn 실행 파일은 저장소에 포함되어 있습니다.

```bash
nvm use
node .yarn/releases/yarn-4.18.1.cjs install --immutable
node .yarn/releases/yarn-4.18.1.cjs dev
```

Corepack 또는 Yarn이 설정되어 있으면 아래 명령을 사용할 수 있습니다.

```bash
yarn lint        # 자동 수정 없는 검사
yarn lint:fix    # 명시적으로 자동 수정
yarn test        # 보안·의존성 호환 회귀 테스트
yarn build       # 콘텐츠·Next.js·RSS 생성
yarn typecheck   # 최초에는 build로 콘텐츠/라우트 타입 생성 필요
yarn serve       # 빌드한 production 서버
yarn audit       # 개발 도구를 포함한 모든 직접·간접 의존성 감사
```

현재 업데이트 범위, Contentlayer 호환 패치와 운영 시 주의점은 [SECURITY.md](SECURITY.md)에 기록했습니다.
알려진 의존성 취약점은 전체 감사에서 0건입니다. 새 공지가 발견되면 `yarn audit`는 종료 코드 1을 반환합니다.

## Reference

- [Next.js & Tailwind CSS Starter blog Repo ](https://github.com/timlrx/tailwind-nextjs-starter-blog)

## Licence

[MIT](https://github.com/timlrx/tailwind-nextjs-starter-blog/blob/main/LICENSE) © [Timothy Lin](https://www.timlrx.com)
