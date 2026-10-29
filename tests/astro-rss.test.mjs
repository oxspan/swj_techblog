import assert from 'node:assert/strict'
import test from 'node:test'
import { createFeed } from '../src/lib/rss.ts'

const posts = [
  {
    id: 'spring/<unsafe>',
    data: {
      title: 'A & B < C',
      summary: '"quoted" & useful',
      date: new Date('2026-10-29T00:00:00Z'),
      tags: ['Spring & Kotlin'],
    },
  },
]

test('Given public posts, when RSS is generated, then dynamic XML values remain data', () => {
  const feed = createFeed(posts)

  assert.match(feed, /A &amp; B &lt; C/)
  assert.match(feed, /&quot;quoted&quot; &amp; useful/)
  assert.match(feed, /Spring &amp; Kotlin/)
  assert.doesNotMatch(feed, /<unsafe>/)
})
