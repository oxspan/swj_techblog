import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { slug } from 'github-slugger'
import { sortPosts } from 'pliny/utils/contentlayer.js'
import { publishedPosts } from './publication.mjs'

/** @param {string} value */
export function escapeXml(value) {
  return (
    value
      // XML 1.0 permits tab, LF and CR but rejects other control characters.
      // eslint-disable-next-line no-control-regex
      .replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  )
}

const generateRssItem = (config, post) => `
  <item>
    <guid>${escapeXml(`${config.siteUrl}/blog/${post.slug}`)}</guid>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(`${config.siteUrl}/blog/${post.slug}`)}</link>
    ${post.summary ? `<description>${escapeXml(post.summary)}</description>` : ''}
    <pubDate>${escapeXml(new Date(post.date).toUTCString())}</pubDate>
    <author>${escapeXml(`${config.email} (${config.author})`)}</author>
    ${(post.tags || []).map((tag) => `<category>${escapeXml(tag)}</category>`).join('')}
  </item>
`

export const generateRss = (config, posts, page = 'feed.xml') => `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escapeXml(config.title)}</title>
      <link>${escapeXml(`${config.siteUrl}/blog`)}</link>
      <description>${escapeXml(config.description)}</description>
      <language>${escapeXml(config.language)}</language>
      <managingEditor>${escapeXml(`${config.email} (${config.author})`)}</managingEditor>
      <webMaster>${escapeXml(`${config.email} (${config.author})`)}</webMaster>
      <lastBuildDate>${escapeXml(new Date(posts[0].date).toUTCString())}</lastBuildDate>
      <atom:link href="${escapeXml(`${config.siteUrl}/${page}`)}" rel="self" type="application/rss+xml"/>
      ${posts.map((post) => generateRssItem(config, post)).join('')}
    </channel>
  </rss>
`

export function writeRssFeeds(config, posts, publicDir = 'public') {
  const sortedPosts = sortPosts(publishedPosts(posts))
  const tagsDir = path.join(publicDir, 'tags')
  mkdirSync(tagsDir, { recursive: true })
  rmSync(path.join(publicDir, 'feed.xml'), { force: true })
  for (const entry of readdirSync(tagsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      rmSync(path.join(tagsDir, entry.name, 'feed.xml'), { force: true })
    }
  }
  if (sortedPosts.length === 0) return

  writeFileSync(path.join(publicDir, 'feed.xml'), generateRss(config, sortedPosts))
  const tags = new Set(sortedPosts.flatMap((post) => (post.tags || []).map((tag) => slug(tag))))
  for (const tag of tags) {
    const filteredPosts = sortedPosts.filter((post) =>
      (post.tags || []).some((value) => slug(value) === tag)
    )
    const rssPath = path.join(tagsDir, tag)
    mkdirSync(rssPath, { recursive: true })
    writeFileSync(
      path.join(rssPath, 'feed.xml'),
      generateRss(config, filteredPosts, `tags/${tag}/feed.xml`)
    )
  }
}
