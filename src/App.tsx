import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StoreProvider, useStore } from './store'
import type { Tab } from './types'
import type { DayView } from './dates'
import {
  AdminMealInfo,
  AdminPanel,
  AdminSuggestions,
  Home,
  MealDetail,
  Profile,
  Suggest,
  Welcome,
} from './screens'
import { styles as ui } from './ui'

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={[ui.screen, ui.screenPad, { justifyContent: 'center' }]}>
          <Text style={ui.brand}>Bir şey ters gitti</Text>
          <Text style={ui.muted}>Uygulamayı kapatıp tekrar açmayı dene.</Text>
        </View>
      )
    }
    return this.props.children
  }
}

function AppShell() {
  const { userName, isAdmin, ready } = useStore()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('bugun')
  const [mealId, setMealId] = useState<string | null>(null)
  const [dayView, setDayView] = useState<DayView>('bugun')
  const wasLoggedIn = useRef(false)

  useEffect(() => {
    if (userName && !wasLoggedIn.current) {
      setTab('bugun')
      setDayView('bugun')
      setMealId(null)
    }
    wasLoggedIn.current = Boolean(userName)
  }, [userName])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mealId) {
        setMealId(null)
        return true
      }
      if (tab !== 'bugun') {
        setTab('bugun')
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [mealId, tab])

  const tabs = useMemo(
    () =>
      [
        { id: 'bugun' as const, label: 'Bugün', ico: '🍽️' },
        { id: 'oneriler' as const, label: 'Öneriler', ico: '✨' },
        { id: 'admin' as const, label: 'Menü', ico: '📅' },
        { id: 'adminOneriler' as const, label: 'Öneriler', ico: '✨' },
        { id: 'profil' as const, label: 'Profil', ico: '👤' },
      ].filter((t) => {
        if (t.id === 'admin' || t.id === 'adminOneriler') return isAdmin
        if (t.id === 'oneriler') return !isAdmin
        return true
      }),
    [isAdmin],
  )

  if (!ready) {
    return (
      <View style={[ui.screen, { justifyContent: 'center', paddingTop: insets.top }]}>
        <Text style={ui.empty}>Yükleniyor...</Text>
      </View>
    )
  }

  if (!userName) {
    return (
      <View style={[ui.screen, { paddingTop: insets.top }]}>
        <Welcome />
      </View>
    )
  }

  return (
    <View style={ui.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          ui.screenPad,
          { paddingTop: 16 + insets.top, paddingBottom: mealId ? 24 + insets.bottom : 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {mealId && tab === 'admin' && isAdmin ? (
          <AdminMealInfo mealId={mealId} onBack={() => setMealId(null)} />
        ) : mealId ? (
          <MealDetail mealId={mealId} onBack={() => setMealId(null)} />
        ) : tab === 'bugun' ? (
          <Home dayView={dayView} setDayView={setDayView} onOpen={setMealId} />
        ) : tab === 'oneriler' ? (
          <Suggest />
        ) : tab === 'admin' && isAdmin ? (
          <AdminPanel onOpen={setMealId} />
        ) : tab === 'adminOneriler' && isAdmin ? (
          <AdminSuggestions />
        ) : (
          <Profile />
        )}
      </ScrollView>
      {!mealId ? (
        <View style={[ui.nav, { paddingBottom: 8 + insets.bottom }]}>
          {tabs.map((t) => (
            <PressNav key={t.id} ico={t.ico} label={t.label} on={tab === t.id} onPress={() => setTab(t.id)} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function PressNav({
  ico,
  label,
  on,
  onPress,
}: {
  ico: string
  label: string
  on: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={ui.navBtn}>
      <Text style={ui.navIco}>{ico}</Text>
      <Text style={[ui.navLabel, on && ui.navOn]}>{label}</Text>
    </Pressable>
  )
}

export default function AppRoot() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </ErrorBoundary>
  )
}
