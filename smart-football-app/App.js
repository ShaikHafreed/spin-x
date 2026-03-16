import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Button, PaperProvider } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import BluetoothConnector from './components/BluetoothConnector'
import HomeHeader from './components/HomeHeader'
import KickDashboard from './components/KickDashboard'
import RawInputCard from './components/RawInputCard'
import { disconnectDevice, parseKickData, subscribeToData } from './services/bluetoothService'
import { appTheme } from './styles/theme'

const initialMetrics = {
  force: 0,
  spinX: 0,
  spinY: 0,
  spinZ: 0,
  spinMagnitude: 0,
  performanceScore: 0,
  performanceBand: 'Beginner',
  kickDetected: false,
  timestamp: null,
}

const studentProfile = {
  name: 'Arjun Kumar',
  id: 'SF-2026-014',
  age: 16,
  position: 'Forward',
  dominantFoot: 'Right',
}

export default function App() {
  const [connectedDevice, setConnectedDevice] = useState(null)
  const [screen, setScreen] = useState('home')
  const [metrics, setMetrics] = useState(initialMetrics)
  const [rawData, setRawData] = useState('Waiting for data...')
  const [connectionStatus, setConnectionStatus] = useState('Not connected')
  const unsubscribeRef = useRef(null)

  const lastUpdated = useMemo(() => {
    if (!metrics.timestamp) {
      return 'No data received yet'
    }

    return new Date(metrics.timestamp).toLocaleTimeString()
  }, [metrics.timestamp])

  useEffect(() => {
    if (!connectedDevice) {
      return undefined
    }

    setConnectionStatus(`Connected to ${connectedDevice.name || connectedDevice.address}`)

    try {
      unsubscribeRef.current = subscribeToData(connectedDevice, (incomingData) => {
        setRawData(incomingData)

        const parsed = parseKickData(incomingData)
        if (parsed) {
          setMetrics(parsed)
          setScreen('dashboard')
        }
      })
    } catch (error) {
      setConnectionStatus(error.message || 'Connected, but data stream failed to start.')
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [connectedDevice])

  const handleConnected = (device) => {
    setConnectedDevice(device)
    setScreen('dashboard')
  }

  const handleDisconnect = async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    await disconnectDevice(connectedDevice)
    setConnectedDevice(null)
    setConnectionStatus('Not connected')
    setScreen('home')
    setMetrics(initialMetrics)
    setRawData('Waiting for data...')
  }

  return (
    <PaperProvider theme={appTheme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <HomeHeader connectionStatus={connectionStatus} lastUpdated={lastUpdated} />

            {screen === 'home' ? (
              <BluetoothConnector
                connectionStatus={connectionStatus}
                onConnected={handleConnected}
              />
            ) : (
              <View>
                <Button mode="outlined" onPress={() => setScreen('home')} style={styles.switchButton}>
                  Back to Home
                </Button>

                <KickDashboard metrics={metrics} student={studentProfile} />

                <RawInputCard rawData={rawData} />

                <Button mode="text" onPress={handleDisconnect}>
                  Disconnect Device
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  container: {
    flex: 1,
  },
  switchButton: {
    marginTop: 20,
  },
})
