import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import katex from 'katex'
import { parse } from 'toml'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import * as T from '@effect-ts/core/Effect'
import * as OT from '@effect-ts/otel'
import grpc from '@grpc/grpc-js'

const require = createRequire(import.meta.url)
const sourceEntry = import.meta.resolve('@contentlayer2/source-files')
const { parseFieldData } = await import(new URL('fetchData/mapping/parseFieldData.js', sourceEntry))
const utilsEntry = import.meta.resolve('@contentlayer2/utils')
const { provideTracing } = await import(new URL('tracing-effect/index.js', utilsEntry))

test('Contentlayer accepts nested records and rejects invalid fields through patched Zod', async () => {
  for (const fieldType of ['nested', 'nested_polymorphic', 'nested_unnamed']) {
    const valid = parseFieldData({
      rawData: { nested: { count: 1 } },
      fieldType,
      fieldName: 'test',
    })
    assert.deepEqual(await T.runPromise(valid), { nested: { count: 1 } })
    const invalid = parseFieldData({ rawData: 7, fieldType, fieldName: 'test' })
    await assert.rejects(T.runPromise(invalid))
  }
})

test('MDX dependencies preserve CommonJS UUID and synchronous TOML contracts', () => {
  const { v4 } = require('uuid')
  assert.match(v4(), /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/)
  const data = parse('title = "test"\n[author]\nname = "Writer"')
  assert.equal(data.title, 'test')
  assert.equal(data.author.name, 'Writer')
  const ast = { type: 'root', children: [{ type: 'toml', value: 'title = "test"' }] }
  remarkMdxFrontmatter()(ast)
  assert.equal(ast.children[0].type, 'mdxjsEsm')
})

test('KaTeX renders math, preserves error fallback and rejects inherited trust', () => {
  assert.match(katex.renderToString('x^2'), /class="katex"/)
  assert.match(
    katex.renderToString('\\notARealCommand', { throwOnError: false }),
    /notARealCommand/
  )
  assert.ok(require.resolve('katex/dist/katex.css'))
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'trust')
  Object.defineProperty(Object.prototype, 'trust', {
    value: true,
    writable: true,
    configurable: true,
  })
  try {
    const output = katex.renderToString('\\href{javascript:alert(1)}{link}', {
      throwOnError: false,
    })
    assert.doesNotMatch(output, /href="javascript:/)
  } finally {
    if (previous) Object.defineProperty(Object.prototype, 'trust', previous)
    else delete Object.prototype.trust
  }
})

test('Contentlayer OTel layer exports a real span and flushes on managed shutdown', async (t) => {
  const requests = []
  const server = new grpc.Server()
  server.addService(
    {
      export: {
        path: '/opentelemetry.proto.collector.trace.v1.TraceService/Export',
        requestStream: false,
        responseStream: false,
        requestDeserialize: (bytes) => bytes,
        responseSerialize: () => Buffer.alloc(0),
      },
    },
    {
      export(call, callback) {
        requests.push(call.request)
        callback(null, {})
      },
    }
  )
  const port = await new Promise((resolve, reject) => {
    server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (error, boundPort) => {
      if (error) reject(error)
      else resolve(boundPort)
    })
  })
  const previous = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = `http://127.0.0.1:${port}`
  t.after(() => {
    if (previous === undefined) delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    else process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = previous
    server.forceShutdown()
  })
  const program = T.gen(function* (_) {
    const { tracer } = yield* _(OT.Tracer)
    yield* _(T.succeedWith(() => tracer.startSpan('security-test-span').end()))
  })
  await T.runPromise(provideTracing('security-compatibility', 'otel')(program))
  assert.equal(requests.length, 1)
  assert.ok(requests[0].includes(Buffer.from('security-test-span')))
  assert.ok(requests[0].includes(Buffer.from('security-compatibility')))
})
