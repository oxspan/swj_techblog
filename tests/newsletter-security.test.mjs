import assert from 'node:assert/strict'
import test from 'node:test'
import { createNewsletterHandler } from '../lib/newsletter.mjs'

const config = {
  siteUrl: 'https://blog.example/path',
  provider: 'buttondown',
  apiKey: 'secret-token',
}
const headers = { origin: 'https://blog.example', 'content-type': 'application/json' }
const validBody = JSON.stringify({ email: 'reader@example.com' })
function request(body = validBody, overrides = {}) {
  return new Request('https://blog.example/api/newsletter', {
    method: 'POST',
    headers,
    body,
    ...overrides,
  })
}
function setup(overrides = {}, transport = {}) {
  const calls = []
  const handler = createNewsletterHandler(() => ({ ...config, ...overrides }), {
    fetch: async (input) => {
      calls.push(input.clone())
      return new Response('{}', { status: 201 })
    },
    ...transport,
  })
  return { handler, calls }
}

test('valid request uses fixed Buttondown destination and existing payload', async () => {
  const { handler, calls } = setup()
  const result = await handler(request())
  assert.equal(result.status, 200)
  assert.deepEqual(await result.json(), { message: 'Successfully subscribed!' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.buttondown.email/v1/subscribers')
  assert.equal(calls[0].headers.get('authorization'), 'Token secret-token')
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[0].redirect, 'error')
  assert.deepEqual(await calls[0].json(), { email_address: 'reader@example.com' })
})

test('rejects GET, missing/foreign/null Origin and Host spoofing without provider calls', async () => {
  const { handler, calls } = setup()
  assert.equal((await handler(new Request('https://blog.example/api/newsletter'))).status, 405)
  for (const origin of ['', 'null', 'https://evil.example', 'https://blog.example.evil.example']) {
    const h = {
      'content-type': 'application/json',
      host: 'evil.example',
      'x-forwarded-host': 'evil.example',
    }
    if (origin) h.origin = origin
    assert.equal((await handler(request(validBody, { headers: h }))).status, 403)
  }
  assert.equal(calls.length, 0)
})

test('requires JSON media type, including against text/plain cross-origin payloads', async () => {
  const { handler, calls } = setup()
  for (const media of ['', 'text/plain', 'application/x-www-form-urlencoded']) {
    assert.equal(
      (await handler(request(validBody, { headers: { ...headers, 'content-type': media } })))
        .status,
      415
    )
  }
  assert.equal(calls.length, 0)
  assert.equal(
    (
      await handler(
        request(validBody, {
          headers: { ...headers, 'content-type': 'application/json; charset=utf-8' },
        })
      )
    ).status,
    200
  )
})

test('malformed JSON, null, wrong types, extra fields and long emails fail without network calls', async () => {
  const { handler, calls } = setup()
  for (const body of [
    '{',
    'null',
    '{}',
    '[]',
    '{"email":null}',
    '{"email":{}}',
    '{"email":123}',
    JSON.stringify({ email: 'not-an-email' }),
    JSON.stringify({ email: 'a'.repeat(250) + '@example.com' }),
    JSON.stringify({ email: 'reader@example.com', url: 'https://evil.example' }),
  ]) {
    const result = await handler(request(body))
    assert.equal(result.status, 400, body)
    assert.deepEqual(await result.json(), { error: 'Invalid subscription request.' })
  }
  assert.equal(calls.length, 0)
})

test('oversized chunked body is cancelled regardless of Content-Length', async () => {
  const { handler, calls } = setup()
  let cancelled = false
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1024))
      controller.enqueue(new Uint8Array(1025))
    },
    cancel() {
      cancelled = true
    },
  })
  const result = await handler(
    request(stream, { duplex: 'half', headers: { ...headers, 'content-length': '1' } })
  )
  assert.equal(result.status, 413)
  assert.equal(cancelled, true)
  assert.equal(calls.length, 0)
})

test('stalled body times out and releases its concurrency slot', async () => {
  const { handler, calls } = setup({}, { bodyTimeoutMs: 10 })
  assert.equal((await handler(request(new ReadableStream(), { duplex: 'half' }))).status, 408)
  assert.equal((await handler(request())).status, 200)
  assert.equal(calls.length, 1)
})

test('missing credentials and invalid config fail closed', async () => {
  for (const overrides of [
    { apiKey: undefined },
    { apiKey: ' ' },
    { provider: 'mailchimp' },
    { siteUrl: 'bad' },
    { siteUrl: 'file:///etc/passwd' },
    { siteUrl: 'https://user:pass@blog.example' },
  ]) {
    const { handler, calls } = setup(overrides)
    assert.equal((await handler(request())).status, 503)
    assert.equal(calls.length, 0)
  }
})

test('provider HTTP errors, network failure and timeout return generic errors without retry', async () => {
  for (const mode of ['http', 'network', 'timeout']) {
    let calls = 0
    const { handler } = setup(
      {},
      {
        timeoutMs: 10,
        fetch: async () => {
          calls += 1
          if (mode === 'http')
            return new Response('secret-token: private subscriber details', { status: 500 })
          if (mode === 'network') throw new Error('secret-token: internal network details')
          return new Promise(() => {})
        },
      }
    )
    const result = await handler(request())
    assert.equal(result.status, 502, mode)
    assert.deepEqual(await result.json(), { error: 'Newsletter temporarily unavailable.' })
    assert.equal(calls, 1, mode)
  }
})

test('process request budget caps provider calls and resets after one minute', async () => {
  let time = 0
  const { handler, calls } = setup({}, { now: () => time })
  for (let i = 0; i < 30; i += 1) assert.equal((await handler(request())).status, 200)
  assert.equal((await handler(request())).status, 429)
  assert.equal(calls.length, 30)
  time = 60_000
  assert.equal((await handler(request())).status, 200)
  assert.equal(calls.length, 31)
})

test('four in-flight requests cap concurrency and slots recover after completion', async () => {
  const releases = []
  const { handler } = setup({}, { fetch: () => new Promise((resolve) => releases.push(resolve)) })
  const pending = Array.from({ length: 4 }, () => handler(request()))
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(releases.length, 4)
  assert.equal((await handler(request())).status, 429)
  for (const release of releases) release(new Response('{}', { status: 201 }))
  assert.deepEqual(
    (await Promise.all(pending)).map((response) => response.status),
    [200, 200, 200, 200]
  )
  const next = handler(request())
  await new Promise((resolve) => setImmediate(resolve))
  releases[4](new Response('{}', { status: 201 }))
  assert.equal((await next).status, 200)
})
