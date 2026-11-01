import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSettings } from '../store/customization'
import { formatUrl } from '../lib/url-format'

/** Omni-URL Bar: format linku, szerokość px / % / auto-hug, rozszerzanie po fokusie. */
export function UrlBar({ url, title, icon }: { url: string; title: string; icon?: ReactNode }) {
  const s = useSettings().urlbar
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(url)
  const [hugWidth, setHugWidth] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  useEffect(() => { if (!editing) setValue(url) }, [url, editing])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); setEditing(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const segs = formatUrl(url, title, s)

  // Auto-Hug: mierzymy faktyczną szerokość tekstu
  useLayoutEffect(() => {
    if (measureRef.current) setHugWidth(measureRef.current.offsetWidth)
  }, [url, title, s.format, s.template, s.hideProtocol, s.hideWww, s.fontSize])

  const chrome = 24 + (s.showLock ? 20 : 0) // padding + ikona
  let width: string
  if (s.widthMode === 'auto') {
    const w = Math.min(s.maxWidth, Math.max(s.minWidth, hugWidth + chrome))
    width = (editing ? Math.min(s.maxWidth, w * s.focusExpand) : w) + 'px'
  } else if (s.widthMode === 'percent') {
    width = `calc(${s.widthPercent}% * ${editing ? s.focusExpand : 1})`
  } else {
    width = s.width * (editing ? s.focusExpand : 1) + 'px'
  }

  const content = segs.length ? (
    segs.map((g, i) =>
      g.href ? (
        <span
          key={i}
          className={`void-url-${g.kind} void-url-link`}
          onClick={(e) => { e.stopPropagation(); window.void.nav.go(g.href!) }}
        >
          {g.text}
        </span>
      ) : (
        <span key={i} className={`void-url-${g.kind}`}>{g.text}</span>
      )
    )
  ) : (
    <span className="void-url-path">Szukaj lub wpisz adres</span>
  )

  return (
    <div
      className={'void-urlbar' + (s.borderless ? ' borderless' : '') + (editing ? ' editing' : '')}
      style={{ width, minWidth: s.minWidth, maxWidth: s.maxWidth }}
    >
      {s.showLock && icon}
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) { window.void.nav.go(value); setEditing(false) }
            if (e.key === 'Escape') setEditing(false)
          }}
        />
      ) : (
        <div className="void-urlbar__display" onClick={() => setEditing(true)}>{content}</div>
      )}
      <span ref={measureRef} className="void-urlbar__measure" aria-hidden>{content}</span>
    </div>
  )
}
