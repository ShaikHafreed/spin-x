import { useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper'
import PropTypes from 'prop-types'
import {
  TARGET_DEVICE_NAME,
  connectToDevice,
  findSmartFootballDevice,
  scanNearbyDevices,
} from '../services/bluetoothService'

export default function BluetoothConnector({ onConnected, connectionStatus }) {
  const [devices, setDevices] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async () => {
    setError('')
    setIsScanning(true)

    try {
      const nearbyDevices = await scanNearbyDevices()
      setDevices(nearbyDevices)
    } catch (scanError) {
      setError(scanError.message || 'Failed to scan Bluetooth devices.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleConnect = async (device) => {
    setError('')
    setIsConnecting(true)

    try {
      const connectedDevice = await connectToDevice(device)
      onConnected(connectedDevice)
    } catch (connectError) {
      setError(connectError.message || 'Failed to connect to device.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnectSmartFootball = async () => {
    setError('')
    setIsConnecting(true)

    try {
      const device = await findSmartFootballDevice()
      if (!device) {
        throw new Error(`Device ${TARGET_DEVICE_NAME} was not found.`)
      }

      const connectedDevice = await connectToDevice(device)
      onConnected(connectedDevice)
    } catch (connectError) {
      setError(connectError.message || 'Could not connect to SmartFootball.')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Smart Football
      </Text>
      <Text variant="bodyMedium" style={styles.subTitle}>
        Connection: {connectionStatus}
      </Text>

      <Button
        mode="contained"
        style={styles.actionButton}
        onPress={handleConnectSmartFootball}
        disabled={isScanning || isConnecting}
      >
        Connect Device
      </Button>

      <Button
        mode="outlined"
        style={styles.actionButton}
        onPress={handleScan}
        disabled={isScanning || isConnecting}
      >
        Scan Nearby Devices
      </Button>

      {(isScanning || isConnecting) && <ActivityIndicator style={styles.loader} />}

      {error ? (
        <Text variant="bodyMedium" style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        style={styles.deviceList}
        ListEmptyComponent={
          <Text variant="bodySmall" style={styles.emptyText}>
            No devices listed yet. Scan to find Bluetooth devices.
          </Text>
        }
        renderItem={({ item }) => (
          <Card mode="outlined" style={styles.deviceCard}>
            <Card.Content>
              <Text variant="titleMedium">{item.name || 'Unnamed Device'}</Text>
              <Text variant="bodySmall">{item.address}</Text>
            </Card.Content>
            <Card.Actions>
              <Button
                compact
                onPress={() => handleConnect(item)}
                disabled={isScanning || isConnecting}
              >
                Connect
              </Button>
            </Card.Actions>
          </Card>
        )}
      />
    </View>
  )
}

BluetoothConnector.propTypes = {
  onConnected: PropTypes.func.isRequired,
  connectionStatus: PropTypes.string.isRequired,
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontWeight: '700',
  },
  subTitle: {
    marginTop: 8,
    marginBottom: 18,
    opacity: 0.9,
  },
  actionButton: {
    marginBottom: 10,
  },
  loader: {
    marginVertical: 10,
  },
  errorText: {
    marginTop: 10,
  },
  deviceList: {
    marginTop: 10,
    maxHeight: 300,
  },
  deviceCard: {
    marginBottom: 10,
  },
  emptyText: {
    marginTop: 8,
    opacity: 0.75,
  },
})
