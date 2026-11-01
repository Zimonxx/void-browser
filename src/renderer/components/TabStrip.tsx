import { X, Volume2 } from 'lucide-react'
import type { TabState } from '../types'
import { useSettings } from '../store/customization'

/** Karty — poziomo (pasek) lub pionowo (sidebar w stylu Arc). */
export function TabStrip({ tabs, activeId, vertical }: { tabs: TabState[]; activeId: number | null; vertical: boolean }) {
  const s = useSettings().tabs
  return (
    <nav className={'void-tabs' + (vertical ? ' vertical' : '')}>
      {tabs.map((t) => (
        <div
          key={t.id}
          className={'void-tab' + (t.id === activeId ? ' active' : '')}
          onMouseDown={(e) => {
            if (e.button === 1) { e.preventDefault(); window.void.tabs.close(t.id) }
            else if (e.button === 0) window.void.tabs.activate(t.id)
          }}
          title={t.title}
        >
          {s.showFavicon &&
            (t.loading ? (
              <span className="void-tab__loader" />
            ) : t.favicon ? (
              <img className="void-tab__icon" src={t.favicon} alt="" />
            ) : (
              <span className="void-tab__icon void-tab__icon--empty" />
            ))}
          <span className="void-tab__title">{t.title}</span>
          {t.audible && <Volume2 size={12} />}
          {s.showClose && (
            <button
              className="void-tab__close"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => window.void.tabs.close(t.id)}
            >
              <X size={11} />
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}
