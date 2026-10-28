import { slug } from 'github-slugger'

/** @template {{ draft?: boolean }} T @param {readonly T[]} posts @returns {T[]} */
export function publishedPosts(posts) {
  return posts.filter((post) => post.draft !== true)
}

/** @param {readonly { draft?: boolean, tags?: readonly string[] }[]} posts */
export function publishedTagCounts(posts) {
  const counts = new Map()
  for (const post of publishedPosts(posts)) {
    for (const tag of post.tags || []) {
      const key = slug(tag)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  }
  return Object.fromEntries(counts)
}

/** @param {object} data */
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
