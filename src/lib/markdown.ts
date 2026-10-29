import { accessSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Root as HtmlRoot } from 'hast'
import type { Root as MarkdownRoot } from 'mdast'
import { SKIP, visit } from 'unist-util-visit'
import { diagramKey } from './diagram-key'

export function remarkCompatibility() {
  return (tree: MarkdownRoot): void => {
    visit(tree, 'heading', (node) => {
      if (node.depth === 1) node.depth = 2
    })
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'plainText') node.lang = 'plaintext'
      if (node.lang === 'jsp') node.lang = 'html'
      if (node.lang !== 'mermaid') return
      if (index === undefined || parent === undefined) {
        throw new TypeError('Diagram is missing its Markdown parent')
      }
      const url = `/diagrams/${diagramKey(node.value)}-light.svg`
      accessSync(resolve(`public${url}`))
      parent.children.splice(index, 1, {
        type: 'paragraph',
        children: [{ type: 'image', url, alt: `Mermaid: ${node.value.split('\n')[0]}` }],
      })
      return SKIP
    })
  }
}

export function rehypeDiagrams() {
  return (tree: HtmlRoot): void => {
    visit(tree, 'element', (node, index, parent) => {
      const src = node.properties['src']
      if (node.tagName !== 'img' || typeof src !== 'string' || !src.startsWith('/diagrams/')) return
      if (index === undefined || parent === undefined) {
        throw new TypeError('Diagram is missing its HTML parent')
      }
      parent.children.splice(index, 1, {
        type: 'element',
        tagName: 'span',
        properties: { className: ['mermaid-diagram'] },
        children: [
          {
            type: 'element',
            tagName: 'a',
            properties: {
              href: src,
              target: '_blank',
              rel: ['noopener'],
              'aria-label': '도표 원본 크게 보기',
            },
            children: [
              { ...node, properties: { ...node.properties, className: ['diagram-light'] } },
              {
                ...node,
                properties: {
                  ...node.properties,
                  src: src.replace('-light.svg', '-dark.svg'),
                  className: ['diagram-dark'],
                },
              },
            ],
          },
        ],
      })
      return SKIP
    })
  }
}
