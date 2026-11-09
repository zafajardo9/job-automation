import '@tanstack/react-start/server-only'
import type { LookupAddress } from 'node:dns'
import { lookup } from 'node:dns/promises'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { request as httpsRequest } from 'node:https'
import ipaddr from 'ipaddr.js'
import { WorkspaceError } from '~/lib/workspace-error.server'
import { publicLink } from './job-input'

const maxBytes = 2 * 1024 * 1024
const redirects = new Set([301, 302, 303, 307, 308])

export function isPublicAddress(value: string) {
  const address = ipaddr.process(value)
  if (address.range() !== 'unicast') return false

  if (address.kind() === 'ipv6') {
    const ipv6 = address as ipaddr.IPv6
    // Global unicast only. Exclude special-use IETF and documentation blocks.
    return ipv6.match(ipaddr.IPv6.parse('2000::'), 3)
      && !ipv6.match(ipaddr.IPv6.parse('2001::'), 23)
      && !ipv6.match(ipaddr.IPv6.parse('3fff::'), 20)
  }

  const ipv4 = address as ipaddr.IPv4
  return !ipv4.match(ipaddr.IPv4.parse('192.0.0.0'), 24)
    && !ipv4.match(ipaddr.IPv4.parse('192.88.99.0'), 24)
}

async function resolvePublicHost(hostname: string, signal: AbortSignal) {
  const host = hostname.replace(/^\[|\]$/g, '')
  const addresses = await new Promise<LookupAddress[]>((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    void lookup(host, { all: true }).then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort))
  })
  const first = addresses[0]
  if (!first || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new WorkspaceError('The posting URL must point to a public website.')
  }
  return first.address
}

function fetchAddress(url: URL, address: string, signal: AbortSignal) {
  const secure = url.protocol === 'https:'
  const request = secure ? httpsRequest : httpRequest
  return new Promise<IncomingMessage>((resolve, reject) => {
    const outbound = request({
      hostname: address,
      // Connect to the validated address while preserving TLS and HTTP host identity.
      servername: ipaddr.isValid(url.hostname.replace(/^\[|\]$/g, '')) ? undefined : url.hostname,
      port: secure ? 443 : 80,
      path: url.pathname + url.search,
      headers: { Host: url.host, Accept: 'text/html, application/xhtml+xml' },
      agent: false,
      maxHeaderSize: 16 * 1024,
      signal,
    }, resolve)
    outbound.on('error', reject)
    outbound.end()
  })
}

async function readHtml(response: IncomingMessage) {
  const type = response.headers['content-type']?.split(';')[0]?.trim().toLowerCase()
  const size = Number(response.headers['content-length'])
  const encoding = response.headers['content-encoding']
  if ((type !== 'text/html' && type !== 'application/xhtml+xml')
    || size > maxBytes || (encoding && encoding !== 'identity')) {
    response.destroy()
    throw new Error('The posting did not return supported HTML.')
  }

  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of response) {
    total += chunk.length
    if (total > maxBytes) throw new Error('The posting page is too large.')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export async function fetchPublicHtml(value: string) {
  const signal = AbortSignal.timeout(8_000)
  let url = new URL(publicLink.parse(value))
  for (let count = 0; count <= 3; count++) {
    if (!publicLink.safeParse(url.href).success || url.port) {
      throw new WorkspaceError('Use a public posting URL on a standard HTTP or HTTPS port.')
    }
    const address = await resolvePublicHost(url.hostname, signal)
    const response = await fetchAddress(url, address, signal)
    if (redirects.has(response.statusCode ?? 0) && response.headers.location) {
      response.destroy()
      url = new URL(response.headers.location, url)
      continue
    }

    if (response.statusCode !== 200) {
      response.destroy()
      throw new Error('The posting could not be opened.')
    }
    return { html: await readHtml(response), url: url.href }
  }
  throw new Error('The posting redirected too many times.')
}
