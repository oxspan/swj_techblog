/* eslint-disable jsx-a11y/anchor-has-content */
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'
import { safeLinkHref } from '../lib/links.mjs'

const CustomLink = ({ href, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const safeHref = safeLinkHref(href)
  if (safeHref === undefined) return <a {...rest} />
  const isInternalLink = href && href.startsWith('/') && !href.startsWith('//')
  const isAnchorLink = href && href.startsWith('#')

  if (isInternalLink) {
    return <Link href={href} {...rest} />
  }

  if (isAnchorLink) {
    return <a href={href} {...rest} />
  }

  return <a {...rest} target="_blank" rel="noopener noreferrer" href={safeHref} />
}

export default CustomLink
