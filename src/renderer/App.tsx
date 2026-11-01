import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, Minus, Square, Lock, Volume2 } from 'lucide-react'
import type { TabsUpdate } from './types'
import { UrlBar } from './components/UrlBar'

export function App() {
  const [state, setState] = useState<TabsUpdate>({ activeId: null, tabs: [] })
  const contentRef = useRef<HTMLDivElement>(null)
  const active = state.tabs.find((t) => t.id === state.activeId)

  useEffect(() => window.void.tabs.onUpdate(setState), [])

  // Raportuj prostokąt obszaru treści — tam main osadza WebContentsView.
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const report = () => {
      const r = el.getBoundingClientRect()
      window.void.view.setBounds({ x: r.x, y: r.y, width: r.width, height: r.height })
    }
    const ro = new ResizeObserver(report)
    ro.observe(el)
    window.addEventListener('resize', report)
    report()
    return () => { ro.disconnect(); window.removeEventListener('resize', report) }
  }, [])

  // Skróty klawiszowe w obrębie powłoki
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 't') { e.preventDefault(); window.void.tabs.create() }
      if (e.ctrlKey && e.key.toLowerCase() === 'w' && state.activeId !== null) { e.preventDefault(); window.void.tabs.close(state.activeId) }
      if (e.ctrlKey && e.key.toLowerCase() === 'r') { e.preventDefault(); window.void.nav.reload() }
      if (e.key === 'F12') window.void.nav.devtools()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.activeId])

  return (
    <div className="void-shell">
      <header className="void-titlebar">
        <span className="void-logo">VOID</span>

        <button className="void-iconbtn" disabled={!active?.canGoBack} onClick={() => window.void.nav.back()} title="Wstecz">
          <ArrowLeft size={15} />
        </button>
        <button className="void-iconbtn" disabled={!active?.canGoForward} onClick={() => window.void.nav.forward()} title="Dalej">
          <ArrowRight size={15} />
        </button>
        <button
          className="void-iconbtn"
          onClick={() => (active?.loading ? window.void.nav.stop() : window.void.nav.reload())}
          title={active?.loading ? 'Zatrzymaj' : 'Odśwież'}
        >
          {active?.loading ? <X size={15} /> : <RotateCw size={14} />}
        </button>

        <UrlBar url={active?.url ?? ''} icon={<Lock size={12} className="void-lock" />} />

        <nav className="void-tabs">
          {state.tabs.map((t) => (
            <div
              key={t.id}
              className={'void-tab' + (t.id === state.activeId ? ' active' : '')}
              onMouseDown={(e) => {
                if (e.button === 1) { e.preventDefault(); window.void.tabs.close(t.id) }
                else if (e.button === 0) window.void.tabs.activate(t.id)
              }}
              title={t.title}
            >
              {t.loading ? (
                <span className="void-tab__loader" />
              ) : t.favicon ? (
                <img className="void-tab__icon" src={t.favicon} alt="" />
              ) : (
                <span className="void-tab__icon" style={{ background: '#1a1a1a' }} />
              )}
              <span className="void-tab__title">{t.title}</span>
              {t.audible && <Volume2 size={12} />}
              <button
                className="void-tab__close"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => window.void.tabs.close(t.id)}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </nav>
        <button className="void-iconbtn" onClick={() => window.void.tabs.create()} title="Nowa karta (Ctrl+T)">
          <Plus size={15} />
        </button>

        <div className="void-spacer" />

        <button className="void-iconbtn" onClick={() => window.void.win.minimize()}><Minus size={14} /></button>
        <button className="void-iconbtn" onClick={() => window.void.win.maximize()}><Square size={11} /></button>
        <button className="void-iconbtn" onClick={() => window.void.win.close()}><X size={15} /></button>
      </header>

      <main ref={contentRef} className="void-content" />
    </div>
  )
}

