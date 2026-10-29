import type { CollectionEntry } from 'astro:content'
import { site } from '../config.ts'
import { absoluteUrl } from './url.ts'

const escapeXml = (value: string): string =>
  value
    .replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export function createFeed(posts: readonly CollectionEntry<'blog'>[], path = 'feed.xml'): string {
  const items = posts.map((post) => {
    const url = absoluteUrl(`blog/${post.id}`)
    return `<item><guid>${escapeXml(url)}</guid><title>${escapeXml(post.data.title)}</title><link>${escapeXml(url)}</link><description>${escapeXml(post.data.summary)}</description><pubDate>${post.data.date.toUTCString()}</pubDate>${post.data.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('')}</item>`
  }).join('')
  const lastBuildDate = posts[0]?.data.date.toUTCString() ?? new Date(0).toUTCString()
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(site.title)}</title><link>${absoluteUrl('blog')}</link><description>${escapeXml(site.description)}</description><language>${site.language}</language><lastBuildDate>${lastBuildDate}</lastBuildDate><atom:link href="${escapeXml(absoluteUrl(path))}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`
}

export const rssResponse = (content: string): Response =>
  new Response(content, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
