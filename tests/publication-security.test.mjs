import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { publishedPosts, publishedTagCounts, serializeJsonLd } from '../lib/publication.mjs'
import { escapeXml, generateRss, writeRssFeeds } from '../lib/rss.mjs'

const config = {
  siteUrl: 'https://example.com/?a=1&b="2"',
  title: 'Title & <test>',
  description: '<description> & "quoted"',
  language: 'ko&KR',
  email: 'me&you@example.com',
  author: 'Author <name>',
}
const older = {
  slug: 'older',
  title: 'Older & <test>',
  date: '2020-01-01',
  tags: ['Security & Tests', '__proto__', 'constructor'],
}
const newer = { ...older, slug: 'newer', title: 'Newer', date: '2026-01-01' }
const draft = { ...newer, slug: 'draft', title: 'DRAFT SECRET', draft: true }

test('publication and prototype-like tag counts exclude drafts without mutating input', () => {
  const posts = [draft, older, newer]
  assert.deepEqual(publishedPosts(posts), [older, newer])
  assert.equal(posts[0], draft)
  const counts = publishedTagCounts(posts)
  assert.equal(counts.__proto__, 2)
  assert.equal(counts.constructor, 2)
  assert.equal(counts['security--tests'], 2)
  assert.equal(JSON.parse(JSON.stringify(counts)).__proto__, 2)
})

test('JSON-LD remains parseable data and cannot close its HTML script element', () => {
  const data = Object.freeze({ headline: '</script><script>alert(1)</script>', title: '<!--' })
  const serialized = serializeJsonLd(data)
  assert.equal(serialized.includes('<'), false)
  assert.deepEqual(JSON.parse(serialized), data)
})

test('RSS encodes all dynamic XML text and attribute values', () => {
  assert.equal(escapeXml(`<>&"'\u0000`), '&lt;&gt;&amp;&quot;&apos;')
  const xml = generateRss(config, [{ ...older, summary: '<summary>&' }], 'tags/a&b/feed.xml')
  for (const value of [
    config.title,
    config.description,
    config.language,
    config.author,
    older.title,
  ]) {
    assert.ok(xml.includes(escapeXml(value)))
    assert.equal(xml.includes(value), false)
  }
  assert.ok(xml.includes('<category>Security &amp; Tests</category>'))
  assert.ok(
    xml.includes('href="https://example.com/?a=1&amp;b=&quot;2&quot;/tags/a&amp;b/feed.xml"')
  )
  assert.equal(xml.includes('undefined'), false)
})

test('feeds stay published, sorted and self-linked; stale feeds disappear but assets remain', (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'blog-rss-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const staleDir = path.join(dir, 'tags', 'obsolete')
  mkdirSync(staleDir, { recursive: true })
  writeFileSync(path.join(staleDir, 'feed.xml'), 'stale secret')
  writeFileSync(path.join(staleDir, 'asset.txt'), 'keep me')
  const site = { ...config, siteUrl: 'https://example.com' }
  writeRssFeeds(site, [older, draft, newer], dir)
  const rootXml = readFileSync(path.join(dir, 'feed.xml'), 'utf8')
  const tagFile = path.join(dir, 'tags', 'security--tests', 'feed.xml')
  const tagXml = readFileSync(tagFile, 'utf8')
  for (const xml of [rootXml, tagXml]) {
    assert.equal(xml.includes('DRAFT SECRET'), false)
    assert.ok(xml.indexOf('<title>Newer</title>') < xml.indexOf('<title>Older'))
  }
  assert.ok(tagXml.includes('href="https://example.com/tags/security--tests/feed.xml"'))
  assert.equal(existsSync(path.join(staleDir, 'feed.xml')), false)
  assert.equal(readFileSync(path.join(staleDir, 'asset.txt'), 'utf8'), 'keep me')
  writeRssFeeds(site, [draft], dir)
  assert.equal(existsSync(path.join(dir, 'feed.xml')), false)
  assert.equal(existsSync(tagFile), false)
  assert.equal(readFileSync(path.join(staleDir, 'asset.txt'), 'utf8'), 'keep me')
})
