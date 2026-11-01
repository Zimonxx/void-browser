import { ReactNode, useEffect, useRef, useState } from 'react'

/** Bazowy pasek adresu: w spoczynku semantyczne podświetlenie, po kliknięciu pełny URL. */
export function UrlBar({ url, icon }: { url: string; icon?: ReactNode }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(url)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!editing) setValue(url) }, [url, editing])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); setEditing(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  let parts: { proto: string; host: string; path: string } | null = null
  try {
    const u = new URL(url)
    parts = { proto: u.protocol + '//', host: u.host, path: u.pathname === '/' ? '' : u.pathname + u.search }
  } catch { /* puste lub niestandardowe */ }

  return (
    <div className="void-urlbar">
      {icon}
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
        <div className="void-urlbar__display" onClick={() => setEditing(true)}>
          {parts ? (
            <>
              <span className="void-url-proto">{parts.proto}</span>
              <span className="void-url-host">{parts.host}</span>
              <span className="void-url-path">{parts.path}</span>
            </>
          ) : (
            <span className="void-url-path">{url || 'Szukaj lub wpisz adres'}</span>
          )}
        </div>
      )}
    </div>
  )
}

