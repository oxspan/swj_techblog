import { site } from '../config.ts'

export function publicPath(path: string): string {
  return `/${path.split('/').map(encodeURIComponent).join('/')}`
}

export function absoluteUrl(path: string): string {
  return `${site.url}${publicPath(path)}`
}
