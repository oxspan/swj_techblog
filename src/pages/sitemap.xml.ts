import type { APIRoute } from 'astro'
import { getCatalog, getTags } from '../lib/catalog'
import { absoluteUrl } from '../lib/url'

export const prerender = true

export const GET: APIRoute = async () => {
  const [{ posts, series }, tags] = await Promise.all([getCatalog(), getTags()])
  const staticPaths = ['', 'blog', 'series', 'projects', 'about', 'tags']
  const paths = [
    ...staticPaths,
    ...posts.map((post) => `blog/${post.id}`),
    ...series.map((item) => `series/${item.id}`),
    ...tags.map((tag) => `tags/${tag.id}`),
  ]
  const body = paths.map((path) => `<url><loc>${absoluteUrl(path)}</loc></url>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
