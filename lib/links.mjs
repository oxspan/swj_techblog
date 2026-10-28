/** @param {string} href @returns {string | undefined} */
export function safeLinkHref(href) {
  try {
    const url = new URL(href, 'https://internal.invalid')
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? href : undefined
  } catch (error) {
    if (error instanceof TypeError) return undefined
    throw error
  }
}
