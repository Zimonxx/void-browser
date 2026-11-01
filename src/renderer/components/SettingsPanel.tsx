import { ReactNode, useState } from 'react'
import { X, RotateCcw, Download, Upload } from 'lucide-react'
import { DEFAULTS, Settings, exportSettings, importSettings, resetSettings, set, useSettings } from '../store/customization'

type Sec = keyof Settings

/* ---------- Małe kontrolki ---------- */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="vs-row">
      <span className="vs-label">{label}</span>
      <span className="vs-ctrl">{children}</span>
    </label>
  )
}

function Num<S extends Sec>({ sec, k, label, min, max, step = 1, unit = 'px' }: {
  sec: S; k: keyof Settings[S]; label: string; min: number; max: number; step?: number; unit?: string
}) {
  const v = useSettings()[sec][k] as unknown as number
  const upd = (n: number) => !Number.isNaN(n) && set(sec, k, n as any)
  return (
    <Row label={label}>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => upd(+e.target.value)} />
      <input className="vs-num" type="number" step={step} value={v} onChange={(e) => upd(+e.target.value)} />
      <span className="vs-unit">{unit}</span>
    </Row>
  )
}

function Sel<S extends Sec>({ sec, k, label, options }: {
  sec: S; k: keyof Settings[S]; label: string; options: [string, string][]
}) {
  const v = useSettings()[sec][k] as unknown as string
  return (
    <Row label={label}>
      <div className="vs-seg">
        {options.map(([val, txt]) => (
          <button key={val} className={v === val ? 'on' : ''} onClick={() => set(sec, k, val as any)}>{txt}</button>
        ))}
      </div>
    </Row>
  )
}

function Bool<S extends Sec>({ sec, k, label }: { sec: S; k: keyof Settings[S]; label: string }) {
  const v = useSettings()[sec][k] as unknown as boolean
  return (
    <Row label={label}>
      <button className={'vs-toggle' + (v ? ' on' : '')} onClick={() => set(sec, k, !v as any)}><i /></button>
    </Row>
  )
}

function Txt<S extends Sec>({ sec, k, label }: { sec: S; k: keyof Settings[S]; label: string }) {
  const v = useSettings()[sec][k] as unknown as string
  return (
    <Row label={label}>
      <input className="vs-text" value={v} spellCheck={false} onChange={(e) => set(sec, k, e.target.value as any)} />
    </Row>
  )
}

function Color<S extends Sec>({ sec, k, label }: { sec: S; k: keyof Settings[S]; label: string }) {
  const v = useSettings()[sec][k] as unknown as string
  return (
    <Row label={label}>
      <input type="color" value={v} onChange={(e) => set(sec, k, e.target.value as any)} />
      <input className="vs-text vs-hex" value={v} spellCheck={false} onChange={(e) => set(sec, k, e.target.value as any)} />
    </Row>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="vs-group">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

/* ---------- Panel ---------- */
const TABS = ['URL', 'Układ', 'Karty', 'Kolory', 'Animacje', 'Profil'] as const

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('URL')
  const s = useSettings()
  const [io, setIo] = useState('')

  return (
    <aside className="void-settings">
      <header className="vs-head">
        <span>Customizacja</span>
        <button className="void-iconbtn" onClick={onClose}><X size={14} /></button>
      </header>
      <div className="vs-tabs">
        {TABS.map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      <div className="vs-body">
        {tab === 'URL' && (
          <>
            <Group title="Format linku">
              <Sel sec="urlbar" k="format" label="Styl" options={[
                ['semantic', 'Semantyczny'], ['domain', 'Domena'], ['breadcrumb', 'Okruszki'],
                ['title', 'Tytuł'], ['full', 'Pełny'], ['template', 'Szablon']
              ]} />
              {s.urlbar.format === 'template' && (
                <>
                  <Txt sec="urlbar" k="template" label="Szablon" />
                  <p className="vs-hint">
                    Zmienne: {'{host} {root} {sub} {path} {first} {last} {query} {hash} {title} {protocol} {port} {depth}'}
                  </p>
                </>
              )}
              <Bool sec="urlbar" k="hideProtocol" label="Ukryj https://" />
              <Bool sec="urlbar" k="hideWww" label="Ukryj www." />
              <Bool sec="urlbar" k="stripTracking" label="Wytnij parametry śledzące" />
              <Bool sec="urlbar" k="showLock" label="Ikona kłódki" />
            </Group>
            <Group title="Szerokość">
              <Sel sec="urlbar" k="widthMode" label="Tryb" options={[['px', 'px'], ['percent', '%'], ['auto', 'Auto-Hug']]} />
              {s.urlbar.widthMode === 'px' && <Num sec="urlbar" k="width" label="Szerokość" min={120} max={1600} />}
              {s.urlbar.widthMode === 'percent' && <Num sec="urlbar" k="widthPercent" label="Szerokość" min={5} max={100} unit="%" />}
              <Num sec="urlbar" k="minWidth" label="Min" min={60} max={1200} />
              <Num sec="urlbar" k="maxWidth" label="Max" min={120} max={2400} />
              <Num sec="urlbar" k="focusExpand" label="Rozszerz po kliknięciu" min={1} max={2.5} step={0.05} unit="×" />
            </Group>
            <Group title="Wygląd">
              <Sel sec="urlbar" k="align" label="Wyrównanie" options={[['left', 'Lewo'], ['center', 'Środek'], ['right', 'Prawo']]} />
              <Num sec="urlbar" k="height" label="Wysokość" min={18} max={60} />
              <Num sec="urlbar" k="radius" label="Zaokrąglenie" min={0} max={30} />
              <Num sec="urlbar" k="fontSize" label="Rozmiar czcionki" min={9} max={20} step={0.5} />
              <Bool sec="urlbar" k="borderless" label="Bez obramowania" />
            </Group>
          </>
        )}

        {tab === 'Układ' && (
          <>
            <Group title="Pasek narzędzi">
              <Sel sec="toolbar" k="position" label="Pozycja" options={[['top', 'Góra'], ['bottom', 'Dół']]} />
              <Num sec="toolbar" k="height" label="Wysokość" min={24} max={80} />
              <Bool sec="toolbar" k="showLogo" label="Logo VOID" />
              <Bool sec="toolbar" k="showNavButtons" label="Przyciski nawigacji" />
            </Group>
            <Group title="Obszar strony">
              <Num sec="layout" k="contentInset" label="Margines strony" min={0} max={40} />
              <Num sec="layout" k="contentRadius" label="Zaokrąglenie strony" min={0} max={30} />
              <Num sec="layout" k="gap" label="Odstępy UI" min={0} max={24} />
              <Num sec="layout" k="fontSize" label="Czcionka UI" min={9} max={18} step={0.5} />
            </Group>
          </>
        )}

        {tab === 'Karty' && (
          <Group title="Karty">
            <Sel sec="tabs" k="position" label="Pozycja" options={[['top', 'Góra'], ['bottom', 'Dół'], ['left', 'Lewo'], ['right', 'Prawo']]} />
            <Num sec="tabs" k="width" label="Szerokość karty" min={40} max={400} />
            <Num sec="tabs" k="minWidth" label="Min. szerokość" min={24} max={200} />
            <Num sec="tabs" k="verticalWidth" label="Szerokość panelu bocznego" min={48} max={500} />
            <Num sec="tabs" k="height" label="Wysokość karty" min={18} max={56} />
            <Num sec="tabs" k="radius" label="Zaokrąglenie" min={0} max={20} />
            <Bool sec="tabs" k="showFavicon" label="Favikony" />
            <Bool sec="tabs" k="showClose" label="Przycisk zamknięcia" />
          </Group>
        )}

        {tab === 'Kolory' && (
          <>
            <Group title="Interfejs">
              <Color sec="colors" k="bg" label="Tło" />
              <Color sec="colors" k="accent" label="Akcent" />
              <Color sec="colors" k="text" label="Tekst" />
              <Color sec="colors" k="textDim" label="Tekst przygaszony" />
              <Color sec="colors" k="border" label="Obramowanie" />
              <Color sec="colors" k="borderHover" label="Obramowanie (hover)" />
            </Group>
            <Group title="Kolory linku">
              <Color sec="colors" k="urlHost" label="Domena" />
              <Color sec="colors" k="urlPath" label="Ścieżka" />
              <Color sec="colors" k="urlQuery" label="Parametry" />
              <Color sec="colors" k="urlProto" label="Protokół / subdomena" />
            </Group>
          </>
        )}

        {tab === 'Animacje' && (
          <Group title="Animacje">
            <Num sec="anim" k="speed" label="Mnożnik czasu" min={0} max={3} step={0.05} unit="×" />
            <p className="vs-hint">0× = natychmiast (brutalist), 1× = domyślnie, 2×+ = kinowo</p>
            <Sel sec="anim" k="easing" label="Krzywa" options={[
              ['spring', 'Sprężyna'], ['bounce', 'Odbicie'], ['smooth', 'Płynna'],
              ['snappy', 'Szybka'], ['linear', 'Liniowa'], ['custom', 'Własna']
            ]} />
            {s.anim.easing === 'custom' && <Txt sec="anim" k="bezier" label="cubic-bezier" />}
            <div className="vs-anim-demo"><i /></div>
          </Group>
        )}

        {tab === 'Profil' && (
          <Group title="Eksport / import (.voidtheme)">
            <textarea className="vs-io" value={io} spellCheck={false} onChange={(e) => setIo(e.target.value)} placeholder="Wklej JSON profilu..." />
            <div className="vs-actions">
              <button onClick={() => setIo(exportSettings())}><Download size={12} /> Eksportuj</button>
              <button onClick={() => { try { importSettings(io) } catch { alert('Niepoprawny JSON') } }}><Upload size={12} /> Importuj</button>
              <button onClick={() => { if (confirm('Przywrócić domyślne?')) resetSettings() }}><RotateCcw size={12} /> Reset</button>
            </div>
            <p className="vs-hint">Domyślna szerokość URL: {DEFAULTS.urlbar.width}px</p>
          </Group>
        )}
      </div>
    </aside>
  )
}

