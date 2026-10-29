import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import matter from 'gray-matter'

const root = new URL('..', import.meta.url).pathname

function walk(directory, suffix) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path, suffix) : path.endsWith(suffix) ? [path] : []
  })
}

test('Given the migration, when package metadata is read, then Astro is the only application framework', () => {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  assert.equal(packageJson.scripts.dev, 'astro dev')
  assert.equal(packageJson.scripts.build, 'astro build')
  assert.equal(packageJson.dependencies.astro, '7.4.2')
  assert.equal(packageJson.dependencies.next, undefined)
  assert.equal(packageJson.dependencies.react, undefined)
})

test('Given the existing articles, when frontmatter is inspected, then legacy Next layouts cannot trigger Astro MDX layout resolution', () => {
  const articles = walk(join(root, 'data/blog'), '.mdx')

  assert.equal(articles.length, 27)
  for (const article of articles) {
    const { data } = matter(readFileSync(article, 'utf8'))
    assert.equal(data.layout, undefined, article)
  }
})

test('Given the authored series, when references are resolved, then every chapter keeps an existing article URL', () => {
  const articles = new Set(
    walk(join(root, 'data/blog'), '.mdx').map((path) =>
      path.slice(join(root, 'data/blog').length + 1, -'.mdx'.length)
    )
  )
  const definitions = walk(join(root, 'data/series'), '.json').map((path) =>
    JSON.parse(readFileSync(path, 'utf8'))
  )
  const assigned = new Set()

  assert.equal(definitions.length, 4)
  for (const series of definitions) {
    for (const post of series.posts) {
      assert.equal(articles.has(post), true, `${series.slug}: ${post}`)
      assert.equal(assigned.has(post), false, `duplicate: ${post}`)
      assigned.add(post)
    }
  }
})

test('Given the public information architecture, when route sources are listed, then every primary destination exists', () => {
  const routes = [
    'src/pages/index.astro',
    'src/pages/blog/index.astro',
    'src/pages/blog/[...slug].astro',
    'src/pages/series/index.astro',
    'src/pages/series/[slug].astro',
    'src/pages/projects.astro',
    'src/pages/about.astro',
    'src/pages/tags/index.astro',
    'src/pages/tags/[tag].astro',
    'src/pages/feed.xml.ts',
    'src/pages/sitemap.xml.ts',
  ]

  for (const route of routes) assert.doesNotThrow(() => readFileSync(join(root, route)), route)
})
