import type { APIRoute } from 'astro'
import { createNewsletterHandler } from '../../../lib/newsletter.mjs'
import { site } from '../../config'

export const prerender = false

const subscribe = createNewsletterHandler(() => ({
  siteUrl: site.url,
  provider: 'buttondown',
  ...(process.env['BUTTONDOWN_API_KEY']
    ? { apiKey: process.env['BUTTONDOWN_API_KEY'] }
    : {}),
}))

export const POST: APIRoute = ({ request }) => subscribe(request)
