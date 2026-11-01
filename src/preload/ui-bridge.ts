import { contextBridge, ipcRenderer } from 'electron'

const api = {
  tabs: {
    create: (url?: string) => ipcRenderer.send('tab:new', url),
    close: (id: number) => ipcRenderer.send('tab:close', id),
    activate: (id: number) => ipcRenderer.send('tab:activate', id),
    onUpdate: (cb: (state: any) => void) => {
      const h = (_e: unknown, s: any) => cb(s)
      ipcRenderer.on('tabs:update', h)
      return () => ipcRenderer.removeListener('tabs:update', h)
    }
  },
  nav: {
    go: (input: string) => ipcRenderer.send('nav:go', input),
    back: () => ipcRenderer.send('nav:back'),
    forward: () => ipcRenderer.send('nav:forward'),
    reload: () => ipcRenderer.send('nav:reload'),
    stop: () => ipcRenderer.send('nav:stop'),
    devtools: () => ipcRenderer.send('nav:devtools')
  },
  view: {
    setBounds: (b: { x: number; y: number; width: number; height: number }) => ipcRenderer.send('view:bounds', b),
    setVisible: (v: boolean) => ipcRenderer.send('view:visible', v)
  },
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close')
  }
}

contextBridge.exposeInMainWorld('void', api)
export type VoidApi = typeof api
