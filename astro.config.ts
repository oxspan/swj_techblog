import mdx from '@astrojs/mdx'
import { unified } from '@astrojs/markdown-remark'
import node from '@astrojs/node'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import rehypeKatex from 'rehype-katex'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkMath from 'remark-math'
import { rehypeDiagrams, remarkCompatibility } from './src/lib/markdown'

export default defineConfig({
  site: 'https://swj-techblog.vercel.app',
  adapter: process.env['QA_ADAPTER'] === 'node' ? node({ mode: 'standalone' }) : vercel(),
  integrations: [mdx()],
  markdown: {
    processor: unified({
      smartypants: false,
      remarkPlugins: [remarkMath, remarkAlert, remarkCompatibility],
      rehypePlugins: [rehypeKatex, rehypeDiagrams],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
