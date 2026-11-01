import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, Minus, Square, Lock, SlidersHorizontal } from 'lucide-react'
import type { TabsUpdate } from './types'
import { UrlBar } from './components/UrlBar'
import { TabStrip } from './components/TabStrip'
import { SettingsPanel } from './components/SettingsPanel'
import { useSettings } from './store/customization'

export function App() {
  const [state, setState] = useState<TabsUpdate>({ activeId: null, tabs: [] })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const s = useSettings()
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (e.ctrlKey && k === 't') { e.preventDefault(); window.void.tabs.create() }
      if (e.ctrlKey && k === 'w' && state.activeId !== null) { e.preventDefault(); window.void.tabs.close(state.activeId) }
      if (e.ctrlKey && k === 'r') { e.preventDefault(); window.void.nav.reload() }
      if (e.ctrlKey && k === ',') { e.preventDefault(); setSettingsOpen((v) => !v) }
      if (e.key === 'F12') window.void.nav.devtools()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.activeId])

  const tabsPos = s.tabs.position
  const tbPos = s.toolbar.position
  const tabsInToolbar = tabsPos === tbPos
  const vertical = tabsPos === 'left' || tabsPos === 'right'

  const tabs = <TabStrip tabs={state.tabs} activeId={state.activeId} vertical={vertical} />
  const newTabBtn = (
    <button className="void-iconbtn" onClick={() => window.void.tabs.create()} title="Nowa karta (Ctrl+T)">
      <Plus size={15} />
    </button>
  )

  const urlbar = (
    <div className={'void-urlbar-slot align-' + s.urlbar.align}>
      <UrlBar url={active?.url ?? ''} title={active?.title ?? ''} icon={<Lock size={12} className="void-lock" />} />
    </div>
  )

  const toolbar = (
    <header className={'void-titlebar pos-' + tbPos}>
      {s.toolbar.showLogo && <span className="void-logo">VOID</span>}
      {s.toolbar.showNavButtons && (
        <>
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
        </>
      )}
      {tabsInToolbar ? (
        <>
          {urlbar}
          {tabs}
          {newTabBtn}
          <div className="void-spacer" />
        </>
      ) : (
        urlbar
      )}
      <button className={'void-iconbtn' + (settingsOpen ? ' on' : '')} onClick={() => setSettingsOpen((v) => !v)} title="Customizacja (Ctrl+,)">
        <SlidersHorizontal size={14} />
      </button>
      <button className="void-iconbtn" onClick={() => window.void.win.minimize()}><Minus size={14} /></button>
      <button className="void-iconbtn" onClick={() => window.void.win.maximize()}><Square size={11} /></button>
      <button className="void-iconbtn" onClick={() => window.void.win.close()}><X size={15} /></button>
    </header>
  )

  const hStrip = (pos: 'top' | 'bottom') =>
    !tabsInToolbar && tabsPos === pos ? (
      <div className={'void-tabstrip pos-' + pos}>{tabs}{newTabBtn}<div className="void-spacer" /></div>
    ) : null

  const vStrip = (pos: 'left' | 'right') =>
    tabsPos === pos ? (
      <div className={'void-vtabs pos-' + pos}>{tabs}<div className="void-vtabs__new">{newTabBtn}</div></div>
    ) : null

  return (
    <div className="void-shell">
      {tbPos === 'top' && toolbar}
      {hStrip('top')}
      <div className="void-middle">
        {vStrip('left')}
        <main ref={contentRef} className="void-content" />
        {vStrip('right')}
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </div>
      {hStrip('bottom')}
      {tbPos === 'bottom' && toolbar}
    </div>
  )
}
