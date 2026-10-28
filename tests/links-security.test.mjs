import assert from 'node:assert/strict'
import test from 'node:test'
import { safeLinkHref } from '../lib/links.mjs'

test('MDX links reject executable and malformed URL schemes', () => {
  for (const href of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    '\njavascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'https://[invalid',
  ]) {
    assert.equal(safeLinkHref(href), undefined, href)
  }
})

test('MDX links preserve normal navigation and contact addresses', () => {
  for (const href of [
    '/blog/한글',
    '#heading',
    '../post',
    'https://example.com/?a=1&b=2',
    '//example.com/path',
    'mailto:reader@example.com',
    'tel:+821012345678',
  ]) {
    assert.equal(safeLinkHref(href), href)
  }
})
