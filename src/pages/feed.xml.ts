import type { APIRoute } from 'astro'
import { getCatalog } from '../lib/catalog'
import { createFeed, rssResponse } from '../lib/rss'

export const prerender = true
export const GET: APIRoute = async () => rssResponse(createFeed((await getCatalog()).posts))
