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

export interface TabsUpdate {
  activeId: number | null
  tabs: TabState[]
}

declare global {
  interface Window {
    void: {
      tabs: {
        create(url?: string): void
        close(id: number): void
        activate(id: number): void
        onUpdate(cb: (s: TabsUpdate) => void): () => void
      }
      nav: { go(i: string): void; back(): void; forward(): void; reload(): void; stop(): void; devtools(): void }
      view: { setBounds(b: { x: number; y: number; width: number; height: number }): void; setVisible(v: boolean): void }
      win: { minimize(): void; maximize(): void; close(): void }
    }
  }
}
