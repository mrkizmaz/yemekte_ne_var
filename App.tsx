import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppRoot from './src/App'

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#f4ebe0" />
      <AppRoot />
    </SafeAreaProvider>
  )
}
