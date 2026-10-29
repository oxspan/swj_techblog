import { getCollection } from 'astro:content'
import { slug } from 'github-slugger'
import { z } from 'astro/zod'
import editorialData from '../../data/editorial.json'

export class ContentRelationError extends Error {
  constructor(
    readonly relation: string,
    readonly id: string
  ) {
    super(`Invalid ${relation}: ${id}`)
    this.name = 'ContentRelationError'
  }
}

const editorialSchema = z.object({
  featuredPosts: z.array(z.string()),
  featuredSeries: z.array(z.string()),
})

export async function getCatalog() {
  const [allPosts, definitions, projects] = await Promise.all([
    getCollection('blog'),
    getCollection('series'),
    getCollection('projects'),
  ])
  const existing = new Set(allPosts.map((post) => post.id))
  const assigned = new Set<string>()

  for (const item of definitions) {
    for (const reference of item.data.posts) {
      if (!existing.has(reference.id)) throw new ContentRelationError('series post', reference.id)
      if (assigned.has(reference.id)) {
        throw new ContentRelationError('duplicate series assignment', reference.id)
      }
      assigned.add(reference.id)
    }
  }

  const posts = allPosts
    .filter((post) => !post.data.draft)
    .sort((left, right) => right.data.date.valueOf() - left.data.date.valueOf())
  const byId = new Map(posts.map((post) => [post.id, post]))
  const series = definitions
    .map((item) => ({
      ...item,
      posts: item.data.posts.flatMap((reference) => {
        const post = byId.get(reference.id)
        return post ? [post] : []
      }),
    }))
    .filter((item) => item.posts.length > 0)
  const editorial = editorialSchema.parse(editorialData)

  for (const id of editorial.featuredPosts) {
    if (!byId.has(id)) throw new ContentRelationError('featured post', id)
  }
  for (const id of editorial.featuredSeries) {
    if (!series.some((item) => item.id === id)) {
      throw new ContentRelationError('featured series', id)
    }
  }
  return { posts, series, projects, editorial }
}

export async function getTags() {
  const { posts } = await getCatalog()
  const counts = new Map<string, { readonly label: string; readonly count: number }>()
  for (const post of posts) {
    for (const label of post.data.tags) {
      const id = slug(label)
      const current = counts.get(id)
      counts.set(id, { label, count: (current?.count ?? 0) + 1 })
    }
  }
  return [...counts.entries()]
    .map(([id, value]) => ({ id, ...value }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'ko'))
}
