import type { APIRoute } from 'astro'
import { getCatalog } from '../lib/catalog'

export const prerender = true

export const GET: APIRoute = async () => {
  const { posts } = await getCatalog()
  return Response.json(
    posts.map((post) => ({
      title: post.data.title,
      summary: post.data.summary,
      tags: post.data.tags,
      href: `/blog/${post.id}`,
    }))
  )
}
