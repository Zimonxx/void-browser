import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { initDrm, installSmartUserAgent } from './drm-manager'
import { ViewManager, Bounds } from './view-manager'

let win: BrowserWindow | null = null
let views: ViewManager | null = null

async function createWindow(): Promise<void> {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 480,
    minHeight: 320,
    frame: false,
    backgroundColor: '#000000',
    title: 'Void',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/ui-bridge.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  views = new ViewManager(win)
  win.once('ready-to-show', () => win?.show())
  win.on('maximize', () => win?.webContents.send('window:state', { maximized: true }))
  win.on('unmaximize', () => win?.webContents.send('window:state', { maximized: false }))

  if (process.env['ELECTRON_RENDERER_URL']) {
    await win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    await win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  views.create()
}

function registerIpc(): void {
  ipcMain.on('tab:new', (_e, url?: string) => views?.create(url))
  ipcMain.on('tab:close', (_e, id: number) => views?.close(id))
  ipcMain.on('tab:activate', (_e, id: number) => views?.activate(id))
  ipcMain.on('nav:go', (_e, input: string) => views?.navigate(input))
  ipcMain.on('nav:back', () => views?.back())
  ipcMain.on('nav:forward', () => views?.forward())
  ipcMain.on('nav:reload', () => views?.reload())
  ipcMain.on('nav:stop', () => views?.stop())
  ipcMain.on('nav:devtools', () => views?.devtools())
  ipcMain.on('view:bounds', (_e, b: Bounds) => views?.setBounds(b))
  ipcMain.on('view:visible', (_e, v: boolean) => views?.setVisible(v))
  ipcMain.on('win:minimize', () => win?.minimize())
  ipcMain.on('win:maximize', () => (win?.isMaximized() ? win.unmaximize() : win?.maximize()))
  ipcMain.on('win:close', () => win?.close())
}

app.whenReady().then(async () => {
  await initDrm()
  installSmartUserAgent()
  registerIpc()
  await createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
