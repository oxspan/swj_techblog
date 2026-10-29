import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname
const output = join(root, '.vercel/output/static')

function walk(directory, filename) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return walk(path, filename)
    return entry.name === filename ? [path] : []
  })
}

test('Given a production build, when static output is inspected, then all public articles and discovery files exist', () => {
  const articleIndexes = walk(join(output, 'blog'), 'index.html')
  const search = JSON.parse(readFileSync(join(output, 'search.json'), 'utf8'))
  const feed = readFileSync(join(output, 'feed.xml'), 'utf8')
  const sitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8')
  const robots = readFileSync(join(output, 'robots.txt'), 'utf8')

  assert.equal(articleIndexes.length, 28)
  assert.equal(search.length, 27)
  assert.match(feed, /<rss version="2\.0"/)
  assert.match(sitemap, /\/series\/understanding-spring/)
  assert.match(sitemap, /\/blog\/deepdive\/deepdive-04/)
  assert.match(
    sitemap,
    /\/blog\/daily\/%5B%ED%9A%8C%EA%B3%A0%5D_2023%EB%85%84_%ED%9A%8C%EA%B3%A0/
  )
  assert.doesNotMatch(sitemap, /<loc>[^<]*(?:\s|\[|\]|[^\x00-\x7F])/)
  assert.equal(
    robots,
    'User-agent: *\nAllow: /\nSitemap: https://swj-techblog.vercel.app/sitemap.xml\n'
  )
})

test('Given generated tag feeds, when output is inspected, then every tag has a discoverable RSS document', () => {
  const feeds = walk(join(output, 'tags'), 'feed.xml')

  assert.equal(feeds.length, 20)
  for (const feed of feeds) assert.match(readFileSync(feed, 'utf8'), /<atom:link /)
})

test('Given legacy article ids, when RSS is generated, then discovery URLs are safely encoded', () => {
  const feed = readFileSync(join(output, 'feed.xml'), 'utf8')

  assert.match(
    feed,
    /\/blog\/daily\/%5B%ED%9A%8C%EA%B3%A0%5D_2023%EB%85%84_%ED%9A%8C%EA%B3%A0/
  )
  assert.doesNotMatch(feed, /<link>[^<]*(?:\s|\[|\]|[^\x00-\x7F])/)
})

test('Given legacy Markdown headings and lists, when articles are rendered, then authored content is preserved', () => {
  const cqrs = readFileSync(join(output, 'blog/backend/hands_on_cqrs/index.html'), 'utf8')
  const spring = readFileSync(
    join(output, 'blog/spring/spring_knowhow_06/index.html'),
    'utf8'
  )

  assert.match(cqrs, /<h2 id="intro">Intro<\/h2>/)
  assert.match(spring, /<ol>/)
})
