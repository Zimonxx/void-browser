/* ============================================================
   VOID — Omni-URL Formatter
   Zamienia URL na listę segmentów z typami (do kolorowania).
   ============================================================ */
import type { Settings } from '../store/customization'

export type SegKind = 'proto' | 'host' | 'sub' | 'path' | 'query' | 'hash' | 'sep' | 'title' | 'text'
export interface Seg { text: string; kind: SegKind; href?: string }

const TRACKING = /^(utm_\w+|fbclid|gclid|dclid|msclkid|mc_eid|mc_cid|igshid|yclid|_ga|_gl|ref_src|si)$/i

export function stripTracking(u: URL): URL {
  const c = new URL(u.toString())
  for (const k of [...c.searchParams.keys()]) if (TRACKING.test(k)) c.searchParams.delete(k)
  return c
}

export function formatUrl(raw: string, title: string, s: Settings['urlbar']): Seg[] {
  let u: URL
  try { u = new URL(raw) } catch { return raw ? [{ text: raw, kind: 'text' }] : [] }
  if (!/^https?:$/.test(u.protocol)) return [{ text: raw, kind: 'text' }]
  if (s.stripTracking) u = stripTracking(u)

  const host = s.hideWww ? u.hostname.replace(/^www\./, '') : u.hostname
  const hostFull = host + (u.port ? ':' + u.port : '')
  const parts = host.split('.')
  const root = parts.slice(-2).join('.')
  const sub = parts.length > 2 ? parts.slice(0, -2).join('.') + '.' : ''
  const pathSegs = u.pathname.split('/').filter(Boolean).map(decodeSafe)
  const proto = s.hideProtocol ? [] : [{ text: u.protocol + '//', kind: 'proto' as const }]

  switch (s.format) {
    case 'full':
      return [{ text: s.hideProtocol ? u.toString().replace(/^https?:\/\//, '') : u.toString(), kind: 'text' }]

    case 'domain':
      return [...proto, { text: hostFull, kind: 'host' }]

    case 'breadcrumb': {
      const out: Seg[] = [...proto, { text: hostFull, kind: 'host', href: u.origin + '/' }]
      let acc = u.origin
      for (const p of pathSegs) {
        acc += '/' + encodeURIComponent(p)
        out.push({ text: ' › ', kind: 'sep' }, { text: p, kind: 'path', href: acc })
      }
      return out
    }

    case 'title':
      return [{ text: title || hostFull, kind: 'title' }, { text: '  ' + hostFull, kind: 'sub' }]

    case 'template': {
      const vars: Record<string, string> = {
        protocol: u.protocol.replace(':', ''), host: hostFull, root, sub: sub.replace(/\.$/, ''),
        path: decodeSafe(u.pathname), last: pathSegs[pathSegs.length - 1] ?? '', first: pathSegs[0] ?? '',
        query: u.search, hash: u.hash, title, port: u.port, depth: String(pathSegs.length)
      }
      const text = s.template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
      return [{ text, kind: 'text' }]
    }

    case 'semantic':
    default:
      return [
        ...proto,
        ...(sub ? [{ text: sub, kind: 'sub' as const }] : []),
        { text: root + (u.port ? ':' + u.port : ''), kind: 'host' },
        ...(u.pathname !== '/' ? [{ text: decodeSafe(u.pathname), kind: 'path' as const }] : []),
        ...(u.search ? [{ text: u.search, kind: 'query' as const }] : []),
        ...(u.hash ? [{ text: u.hash, kind: 'hash' as const }] : [])
      ]
  }
}

function decodeSafe(s: string): string {
  try { return decodeURIComponent(s) } catch { return s }
}
