/* ============================================================
   VOID — Customization Store
   Jeden obiekt ustawień → zmienne CSS + logika układu.
   Persystencja: localStorage (Faza 3: plik .voidtheme).
   ============================================================ */
import { useSyncExternalStore } from 'react'

export type Side = 'top' | 'bottom' | 'left' | 'right'
export type UrlFormat = 'full' | 'semantic' | 'domain' | 'breadcrumb' | 'title' | 'template'
export type WidthMode = 'px' | 'percent' | 'auto'

export interface Settings {
  urlbar: {
    format: UrlFormat
    template: string
    hideProtocol: boolean
    hideWww: boolean
    stripTracking: boolean
    widthMode: WidthMode
    width: number
    widthPercent: number
    minWidth: number
    maxWidth: number
    focusExpand: number // mnożnik szerokości po kliknięciu (1 = bez zmiany)
    height: number
    radius: number
    fontSize: number
    align: 'left' | 'center' | 'right'
    showLock: boolean
    borderless: boolean
  }
  toolbar: {
    position: 'top' | 'bottom'
    height: number
    showLogo: boolean
    showNavButtons: boolean
  }
  tabs: {
    position: Side
    width: number
    minWidth: number
    verticalWidth: number
    height: number
    radius: number
    showFavicon: boolean
    showClose: boolean
  }
  layout: {
    gap: number
    contentInset: number
    contentRadius: number
    fontSize: number
  }
  colors: {
    bg: string
    accent: string
    text: string
    textDim: string
    border: string
    borderHover: string
    urlHost: string
    urlPath: string
    urlProto: string
    urlQuery: string
  }
  anim: {
    speed: number // 0 = instant, 1 = normalnie, 2 = cinematic
    easing: 'spring' | 'smooth' | 'snappy' | 'bounce' | 'linear' | 'custom'
    bezier: string
  }
  studio: {
    css: string
  }
}

export const EASINGS: Record<Exclude<Settings['anim']['easing'], 'custom'>, string> = {
  spring: 'cubic-bezier(0.22, 1.2, 0.36, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  snappy: 'cubic-bezier(0.2, 0.9, 0.1, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear'
}

export const DEFAULTS: Settings = {
  urlbar: {
    format: 'semantic',
    template: '{host} › {last}',
    hideProtocol: true,
    hideWww: true,
    stripTracking: true,
    widthMode: 'px',
    width: 520,
    widthPercent: 40,
    minWidth: 220,
    maxWidth: 900,
    focusExpand: 1.3,
    height: 30,
    radius: 10,
    fontSize: 12.5,
    align: 'center',
    showLock: true,
    borderless: false
  },
  toolbar: { position: 'top', height: 40, showLogo: true, showNavButtons: true },
  tabs: {
    position: 'top', width: 200, minWidth: 48, verticalWidth: 240, height: 28, radius: 8,
    showFavicon: true, showClose: true
  },
  layout: { gap: 6, contentInset: 0, contentRadius: 0, fontSize: 12.5 },
  colors: {
    bg: '#000000', accent: '#ffffff', text: '#e6e6e6', textDim: '#6b6b6b',
    border: '#141414', borderHover: '#2a2a2a',
    urlHost: '#ffffff', urlPath: '#777777', urlProto: '#333333', urlQuery: '#4a4a4a'
  },
  anim: { speed: 1, easing: 'spring', bezier: 'cubic-bezier(0.22, 1.2, 0.36, 1)' },
  studio: { css: '/* Void Studio — Twój własny CSS dla interfejsu przeglądarki */\n' }
}

const KEY = 'void.settings.v1'

function deepMerge<T>(base: T, over: any): T {
  if (!over || typeof over !== 'object') return base
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base }
  for (const k of Object.keys(base as any)) {
    const b = (base as any)[k]
    out[k] = b && typeof b === 'object' ? deepMerge(b, over[k]) : over[k] ?? b
  }
  return out
}

function load(): Settings {
  try { return deepMerge(DEFAULTS, JSON.parse(localStorage.getItem(KEY) || 'null')) }
  catch { return DEFAULTS }
}

let state: Settings = load()
const listeners = new Set<() => void>()

export function getSettings(): Settings { return state }

/** Aktualizacja ścieżką, np. set('urlbar', 'width', 640). */
export function set<S extends keyof Settings, K extends keyof Settings[S]>(section: S, key: K, value: Settings[S][K]): void {
  state = { ...state, [section]: { ...state[section], [key]: value } }
  localStorage.setItem(KEY, JSON.stringify(state))
  applyCssVars(state)
  listeners.forEach((l) => l())
}

export function resetSettings(): void {
  state = DEFAULTS
  localStorage.removeItem(KEY)
  applyCssVars(state)
  listeners.forEach((l) => l())
}

export function exportSettings(): string { return JSON.stringify(state, null, 2) }
export function importSettings(json: string): void {
  state = deepMerge(DEFAULTS, JSON.parse(json))
  localStorage.setItem(KEY, JSON.stringify(state))
  applyCssVars(state)
  listeners.forEach((l) => l())
}

export function useSettings(): Settings {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, getSettings)
}

/** Mapuje ustawienia na zmienne CSS z amoled-tokens.css. */
export function applyCssVars(s: Settings): void {
  const r = document.documentElement.style
  const px = (n: number) => n + 'px'
  r.setProperty('--void-bg', s.colors.bg)
  r.setProperty('--void-accent', s.colors.accent)
  r.setProperty('--void-text', s.colors.text)
  r.setProperty('--void-text-dim', s.colors.textDim)
  r.setProperty('--void-border', s.colors.border)
  r.setProperty('--void-border-hover', s.colors.borderHover)
  r.setProperty('--void-url-host', s.colors.urlHost)
  r.setProperty('--void-url-path', s.colors.urlPath)
  r.setProperty('--void-url-proto', s.colors.urlProto)
  r.setProperty('--void-url-query', s.colors.urlQuery)

  r.setProperty('--void-titlebar-height', px(s.toolbar.height))
  r.setProperty('--void-urlbar-height', px(s.urlbar.height))
  r.setProperty('--void-urlbar-radius', px(s.urlbar.radius))
  r.setProperty('--void-urlbar-font-size', px(s.urlbar.fontSize))
  r.setProperty('--void-urlbar-focus-expand', String(s.urlbar.focusExpand))
  r.setProperty('--void-tab-width', px(s.tabs.width))
  r.setProperty('--void-tab-min-width', px(s.tabs.minWidth))
  r.setProperty('--void-tab-height', px(s.tabs.height))
  r.setProperty('--void-tab-radius', px(s.tabs.radius))
  r.setProperty('--void-vtabs-width', px(s.tabs.verticalWidth))
  r.setProperty('--void-gap', px(s.layout.gap))
  r.setProperty('--void-content-inset', px(s.layout.contentInset))
  r.setProperty('--void-content-radius', px(s.layout.contentRadius))
  r.setProperty('--void-font-size', px(s.layout.fontSize))

  r.setProperty('--void-anim-speed', String(Math.max(0, s.anim.speed)))
  r.setProperty('--void-ease-spring', s.anim.easing === 'custom' ? s.anim.bezier : EASINGS[s.anim.easing])

  // Void Studio: własny CSS użytkownika
  let tag = document.getElementById('void-user-css') as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement('style')
    tag.id = 'void-user-css'
    document.head.appendChild(tag)
  }
  if (tag.textContent !== s.studio.css) tag.textContent = s.studio.css
}

applyCssVars(state)

