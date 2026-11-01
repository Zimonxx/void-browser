import { app, components, session } from 'electron'

/** Domeny VOD, na których przedstawiamy się jako czysty Chrome (Smart UA Spoofing). */
const VOD_DOMAINS = [
  'netflix.com', 'spotify.com', 'primevideo.com', 'amazon.com', 'max.com', 'hbomax.com',
  'disneyplus.com', 'canalplus.com', 'player.pl', 'polsatboxgo.pl', 'youtube.com', 'tidal.com'
]

export function chromeUserAgent(): string {
  const chromeVersion = process.versions.chrome
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
}

export function voidUserAgent(): string {
  return `${chromeUserAgent()} Void/${app.getVersion()}`
}

function isVodHost(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return VOD_DOMAINS.some((d) => host === d || host.endsWith('.' + d))
  } catch {
    return false
  }
}

/** Czeka na komponent Widevine CDM (Castlabs ECS) przed otwarciem okien. */
export async function initDrm(): Promise<void> {
  try {
    // `components` istnieje tylko w buildzie Castlabs Electron
    if (components && typeof components.whenReady === 'function') {
      await components.whenReady()
      console.log('[Void DRM] Widevine CDM ready:', components.status())
    } else {
      console.warn('[Void DRM] components API unavailable — not a Castlabs build?')
    }
  } catch (err) {
    console.error('[Void DRM] Widevine init failed:', err)
  }
}

/** Ustawia UA globalnie oraz podmienia na czysty Chrome dla serwisów VOD. */
export function installSmartUserAgent(): void {
  const ses = session.defaultSession
  ses.setUserAgent(voidUserAgent())
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    if (isVodHost(details.url)) {
      details.requestHeaders['User-Agent'] = chromeUserAgent()
    }
    callback({ requestHeaders: details.requestHeaders })
  })
}
