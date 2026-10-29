import { defineCollection, reference } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const blog = defineCollection({
  loader: glob({
    base: './data/blog',
    pattern: '**/*.mdx',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    summary: z.string().default(''),
    tags: z.array(z.string()).default([]),
    images: z.array(z.string()).optional(),
    authors: z.array(reference('authors')).prefault(['default']),
    presentation: z.string().optional(),
    bibliography: z.string().optional(),
    canonicalUrl: z.url().optional(),
  }),
})

const authors = defineCollection({
  loader: glob({ base: './data/authors', pattern: '**/*.mdx' }),
  schema: z.object({
    name: z.string(),
    avatar: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    email: z.email().optional(),
    github: z.url().optional(),
    linkedin: z.url().optional(),
  }),
})

const series = defineCollection({
  loader: glob({ base: './data/series', pattern: '*.json' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    posts: z.array(reference('blog')).min(1),
  }),
})

const projects = defineCollection({
  loader: glob({ base: './data/projects', pattern: '*.json' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    imgSrc: z.string(),
    href: z.url(),
    relatedPosts: z.array(reference('blog')).default([]),
  }),
})

export const collections = { blog, authors, series, projects }
