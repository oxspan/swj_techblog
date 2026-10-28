import siteMetadata from '@/data/siteMetadata'
import { createNewsletterHandler } from '../../../lib/newsletter.mjs'

export const POST = createNewsletterHandler(() => ({
  siteUrl: siteMetadata.siteUrl,
  provider: siteMetadata.newsletter?.provider,
  apiKey: process.env.BUTTONDOWN_API_KEY,
}))
