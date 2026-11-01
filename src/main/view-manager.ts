import { BrowserWindow, WebContentsView, shell } from 'electron'
import { join } from 'path'

export interface TabState {
  id: number
  url: string
  title: string
  favicon?: string
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
  audible: boolean
}

export interface Bounds { x: number; y: number; width: number; height: number }

export const NEW_TAB_URL = 'https://duckduckgo.com/'

/** Zarządza kartami (WebContentsView) wewnątrz okna Void. */
export class ViewManager {
  private tabs = new Map<number, WebContentsView>()
  private activeId: number | null = null
  private bounds: Bounds = { x: 0, y: 0, width: 800, height: 600 }

  constructor(private win: BrowserWindow) {}

  private emit(): void {
    if (this.win.isDestroyed()) return
    this.win.webContents.send('tabs:update', {
      activeId: this.activeId,
      tabs: [...this.tabs.entries()].map(([id, v]) => this.snapshot(id, v))
    })
  }

  private snapshot(id: number, v: WebContentsView): TabState {
    const wc = v.webContents
    return {
      id,
      url: wc.getURL(),
      title: wc.getTitle() || 'Nowa karta',
      favicon: (v as any).__favicon,
      loading: wc.isLoading(),
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
      audible: wc.isCurrentlyAudible()
    }
  }

  create(url: string = NEW_TAB_URL): number {
    const view = new WebContentsView({
      webPreferences: {
        preload: join(__dirname, '../preload/web-preload.js'),
        contextIsolation: true,
        sandbox: true,
        plugins: true
      }
    })
    view.setBackgroundColor('#000000')
    const id = view.webContents.id
    this.tabs.set(id, view)

    const wc = view.webContents
    const update = () => this.emit()
    wc.on('did-start-loading', update)
    wc.on('did-stop-loading', update)
    wc.on('did-navigate', update)
    wc.on('did-navigate-in-page', update)
    wc.on('page-title-updated', update)
    wc.on('audio-state-changed', update)
    wc.on('page-favicon-updated', (_e, icons) => {
      ;(view as any).__favicon = icons[0]
      update()
    })
    wc.setWindowOpenHandler(({ url: target }) => {
      if (/^https?:/.test(target)) this.activate(this.create(target))
      else shell.openExternal(target)
      return { action: 'deny' }
    })

    wc.loadURL(url)
    this.activate(id)
    return id
  }

  activate(id: number): void {
    const view = this.tabs.get(id)
    if (!view) return
    if (this.activeId !== null && this.activeId !== id) {
      const prev = this.tabs.get(this.activeId)
      if (prev) this.win.contentView.removeChildView(prev)
    }
    this.activeId = id
    this.win.contentView.addChildView(view)
    view.setBounds(this.bounds)
    this.emit()
  }

  close(id: number): void {
    const view = this.tabs.get(id)
    if (!view) return
    const order = [...this.tabs.keys()]
    const idx = order.indexOf(id)
    this.win.contentView.removeChildView(view)
    view.webContents.close()
    this.tabs.delete(id)
    if (this.activeId === id) {
      this.activeId = null
      const next = order[idx + 1] ?? order[idx - 1]
      if (next !== undefined && this.tabs.has(next)) this.activate(next)
      else this.create()
    }
    this.emit()
  }

  setBounds(b: Bounds): void {
    this.bounds = {
      x: Math.round(b.x), y: Math.round(b.y),
      width: Math.max(0, Math.round(b.width)), height: Math.max(0, Math.round(b.height))
    }
    const v = this.activeId !== null ? this.tabs.get(this.activeId) : undefined
    v?.setBounds(this.bounds)
  }

  /** Ukrywa stronę (np. gdy otwarta jest Command Palette nachodząca na widok). */
  setVisible(visible: boolean): void {
    const v = this.activeId !== null ? this.tabs.get(this.activeId) : undefined
    v?.setVisible(visible)
  }

  private active(): Electron.WebContents | undefined {
    return this.activeId !== null ? this.tabs.get(this.activeId)?.webContents : undefined
  }

  navigate(input: string): void {
    const wc = this.active()
    if (!wc) return
    wc.loadURL(normalizeInput(input))
  }

  back(): void { const wc = this.active(); if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack() }
  forward(): void { const wc = this.active(); if (wc?.navigationHistory.canGoForward()) wc.navigationHistory.goForward() }
  reload(): void { this.active()?.reload() }
  stop(): void { this.active()?.stop() }
  devtools(): void { this.active()?.toggleDevTools() }
}

/** Zamienia wpis z paska na URL lub zapytanie wyszukiwarki. */
export function normalizeInput(input: string): string {
  const s = input.trim()
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) || s.startsWith('about:')) return s
  if (/^localhost(:\d+)?(\/.*)?$/i.test(s)) return 'http://' + s
  if (!/\s/.test(s) && /^[^\s]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(s)) return 'https://' + s
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(s)
}
