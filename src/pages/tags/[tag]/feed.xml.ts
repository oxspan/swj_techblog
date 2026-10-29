import type { APIRoute } from 'astro'
import { slug } from 'github-slugger'
import { getCatalog, getTags } from '../../../lib/catalog'
import { createFeed, rssResponse } from '../../../lib/rss'

export async function getStaticPaths() {
  const [{ posts }, tags] = await Promise.all([getCatalog(), getTags()])
  return tags.map((tag) => ({
    params: { tag: tag.id },
    props: { posts: posts.filter((post) => post.data.tags.some((label) => slug(label) === tag.id)) },
  }))
}

export const GET: APIRoute = ({ props, params }) =>
  rssResponse(createFeed(props.posts, `tags/${params.tag}/feed.xml`))
