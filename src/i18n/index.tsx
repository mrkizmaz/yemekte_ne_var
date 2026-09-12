import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { MealSlot } from '../types'
import { setCurrentLang, translations, type Lang, type MsgKey } from './translations'

const LANG_KEY = 'ne-var-lang'

function detectLang(): Lang {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator.language : ''
    if (nav.toLowerCase().startsWith('de')) return 'de'
  } catch {
    // ignore
  }
  return 'tr'
}

function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
}

type I18n = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: MsgKey, vars?: Record<string, string | number>) => string
}

const Ctx = createContext<I18n | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('tr')

  useEffect(() => {
    let cancelled = false
    void AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (cancelled) return
      const next = saved === 'de' || saved === 'tr' ? saved : detectLang()
      setCurrentLang(next)
      setLangState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setLang = useCallback((next: Lang) => {
    setCurrentLang(next)
    setLangState(next)
    void AsyncStorage.setItem(LANG_KEY, next)
  }, [])

  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => format(translations[lang][key], vars),
    [lang],
  )

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('I18n missing')
  return ctx
}

export function slotLabel(id: MealSlot, t: I18n['t']) {
  if (id === 'kahvalti') return t('slotKahvalti')
  if (id === 'aksam') return t('slotAksam')
  return t('slotOgle')
}

export function slotHint(id: MealSlot, t: I18n['t']) {
  if (id === 'kahvalti') return t('hintKahvalti')
  if (id === 'aksam') return t('hintAksam')
  return t('hintOgle')
}

export { getCurrentLang, msg, type Lang, type MsgKey } from './translations'
