import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppRoot from './src/App'

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#e7d5c2', alignItems: 'center' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 430, backgroundColor: '#f4ebe0' }}>
          <StatusBar style="dark" backgroundColor="#f4ebe0" />
          <AppRoot />
        </View>
      </View>
    </SafeAreaProvider>
  )
}
