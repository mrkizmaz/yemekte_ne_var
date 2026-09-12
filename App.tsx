import { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppRoot from './src/App'

if (Platform.OS === 'web') {
  require('./src/web.css')
}

function lockWebPageScroll() {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  const body = document.body
  html.style.height = '100%'
  html.style.overflow = 'hidden'
  body.style.height = '100%'
  body.style.overflow = 'hidden'
  body.style.overscrollBehavior = 'none'
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') return
    lockWebPageScroll()
  }, [])

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, height: '100%', backgroundColor: '#e7d5c2', alignItems: 'center', overflow: 'hidden' }}>
        <View style={{ flex: 1, height: '100%', width: '100%', maxWidth: 430, backgroundColor: '#f4ebe0', overflow: 'hidden' }}>
          <StatusBar style="dark" backgroundColor="#f4ebe0" />
          <AppRoot />
        </View>
      </View>
    </SafeAreaProvider>
  )
}
