import ky from 'ky'
import { z } from 'zod'

const subscriptionSchema = z.object({ email: z.email().max(254) }).strict()
const configSchema = z.object({
  siteUrl: z.url(),
  provider: z.literal('buttondown'),
  apiKey: z.string().trim().min(1),
})
const BODY_LIMIT = 2048
const WINDOW_MS = 60_000
const REQUEST_BUDGET = 30
const CONCURRENCY_LIMIT = 4

/** @param {number} status @param {string} error */
function failure(status, error) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** @param {Request} request @param {number} timeoutMs @returns {Promise<unknown>} */
async function readSubscription(request, timeoutMs) {
  if (!request.body) return failure(400, 'Invalid subscription request.')
  const reader = request.body.getReader()
  let expired = false
  const timer = setTimeout(() => {
    expired = true
    // Cancellation releases pending reads without waiting for the upload to finish.
    void reader.cancel().catch(() => undefined)
  }, timeoutMs)
  const chunks = []
  let size = 0
  try {
    while (size <= BODY_LIMIT) {
      const { done, value } = await reader.read()
      if (expired) return failure(408, 'Request timed out.')
      if (done) break
      size += value.byteLength
      if (size > BODY_LIMIT) {
        void reader.cancel().catch(() => undefined)
        return failure(413, 'Request body too large.')
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    // no-excuse-ok: catch -- HTTP boundary maps malformed JSON and broken streams alike.
    return failure(400, 'Invalid subscription request.')
  } finally {
    clearTimeout(timer)
    reader.releaseLock()
  }
}

/**
 * Process-local budget only: instances and restarts do not share these counters.
 * @param {() => {siteUrl?: string, provider?: string, apiKey?: string}} readConfig
 * @param {{fetch?: typeof globalThis.fetch, timeoutMs?: number, bodyTimeoutMs?: number, now?: () => number}} transport
 */
export function createNewsletterHandler(readConfig, transport = {}) {
  const now = transport.now ?? Date.now
  let windowStart = now()
  let requests = 0
  let active = 0
  /** @param {Request} request */
  return async function subscribe(request) {
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed.' },
        { status: 405, headers: { Allow: 'POST' } }
      )
    }
    const config = configSchema.safeParse(readConfig())
    if (!config.success) return failure(503, 'Newsletter temporarily unavailable.')
    const siteUrl = new URL(config.data.siteUrl)
    if (!['https:', 'http:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password) {
      return failure(503, 'Newsletter temporarily unavailable.')
    }
    if (request.headers.get('origin') !== siteUrl.origin) {
      return failure(403, 'Request origin is not allowed.')
    }
    if (
      request.headers.get('content-type')?.split(';', 1).at(0)?.trim().toLowerCase() !==
      'application/json'
    ) {
      return failure(415, 'Content-Type must be application/json.')
    }
    if (now() - windowStart >= WINDOW_MS) {
      windowStart = now()
      requests = 0
    }
    if (requests >= REQUEST_BUDGET || active >= CONCURRENCY_LIMIT) {
      return failure(429, 'Too many requests. Please try again later.')
    }
    requests += 1
    active += 1
    try {
      const body = await readSubscription(request, transport.bodyTimeoutMs ?? 5000)
      if (body instanceof Response) return body
      const parsed = subscriptionSchema.safeParse(body)
      if (!parsed.success) return failure(400, 'Invalid subscription request.')
      const response = await ky.post('https://api.buttondown.email/v1/subscribers', {
        headers: { Authorization: `Token ${config.data.apiKey}` },
        json: { email_address: parsed.data.email },
        timeout: transport.timeoutMs ?? 5000,
        retry: 0,
        throwHttpErrors: false,
        redirect: 'error',
        ...(transport.fetch ? { fetch: transport.fetch } : {}),
      })
      // Only the status is needed; do not buffer provider success or error payloads.
      void response.body?.cancel().catch(() => undefined)
      if (!response.ok) return failure(502, 'Newsletter temporarily unavailable.')
      return Response.json(
        { message: 'Successfully subscribed!' },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    } catch {
      // no-excuse-ok: catch -- Provider errors must never expose response bodies or credentials.
      return failure(502, 'Newsletter temporarily unavailable.')
    } finally {
      active -= 1
    }
  }
}
