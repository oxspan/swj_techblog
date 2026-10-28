import siteMetadata from '../data/siteMetadata.js'
import { allBlogs } from '../.contentlayer/generated/index.mjs'
import { writeRssFeeds } from '../lib/rss.mjs'

export default function rss() {
  writeRssFeeds(siteMetadata, allBlogs)
  console.log('RSS feed generated...')
}
