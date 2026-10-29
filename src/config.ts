export const site = {
  title: '우진의 데브로그',
  author: 'Woojin Son',
  description: 'Spring과 백엔드 시스템의 원리, 직접 만들고 문제를 풀며 쌓은 경험을 기록합니다.',
  language: 'ko-KR',
  url: 'https://swj-techblog.vercel.app',
  email: 'wujins58@gmail.com',
  github: 'https://github.com/swj9707',
  linkedin: 'https://www.linkedin.com/in/woojin-son-18989b202',
  socialImage: '/static/images/main-thumbnail.png',
} as const

export const navigation = [
  { href: '/blog', label: '기록' },
  { href: '/series', label: '시리즈' },
  { href: '/projects', label: '프로젝트' },
  { href: '/about', label: '소개' },
] as const
