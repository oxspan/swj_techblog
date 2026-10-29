import { createHash } from 'node:crypto'

export const diagramKey = (source: string): string =>
  createHash('sha256').update(source).digest('hex').slice(0, 20)
