import { PermissionsAndroid, Platform } from 'react-native'
import RNBluetoothClassic from 'react-native-bluetooth-classic'

const TARGET_DEVICE_NAME = 'SmartFootball'

async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android') {
    return true
  }

  if (Platform.Version < 31) {
    const locationGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Bluetooth scanning requires location permission on this Android version.',
        buttonPositive: 'Allow',
      },
    )

    return locationGranted === PermissionsAndroid.RESULTS.GRANTED
  }

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ])

  return (
    result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
    result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
  )
}

async function scanNearbyDevices() {
  const granted = await requestBluetoothPermissions()
  if (!granted) {
    throw new Error('Bluetooth permissions were denied.')
  }

  const enabled = await RNBluetoothClassic.isBluetoothEnabled()
  if (!enabled) {
    throw new Error('Bluetooth is disabled. Please enable Bluetooth and try again.')
  }

  const discovered = await RNBluetoothClassic.startDiscovery()
  const bonded = await RNBluetoothClassic.getBondedDevices()

  const allDevices = [...bonded, ...discovered]
  const uniqueByAddress = new Map()

  allDevices.forEach((device) => {
    if (device?.address) {
      uniqueByAddress.set(device.address, device)
    }
  })

  return Array.from(uniqueByAddress.values())
}

async function findSmartFootballDevice() {
  const devices = await scanNearbyDevices()
  return devices.find((device) => device.name === TARGET_DEVICE_NAME) || null
}

async function connectToDevice(device) {
  if (!device) {
    throw new Error('No device selected for connection.')
  }

  if (device.isConnected) {
    return device
  }

  const connected = await device.connect()
  if (!connected) {
    throw new Error('Failed to connect to selected device.')
  }

  return device
}

function subscribeToData(device, onData) {
  if (!device || typeof device.onDataReceived !== 'function') {
    throw new Error('Connected device does not support data listener.')
  }

  const subscription = device.onDataReceived((event) => {
    const payload = typeof event === 'string' ? event : event?.data
    if (payload) {
      onData(payload)
    }
  })

  return () => {
    if (subscription?.remove) {
      subscription.remove()
    }
  }
}

async function disconnectDevice(device) {
  if (device?.isConnected) {
    await device.disconnect()
  }
}

function clampScore(score) {
  if (score < 0) {
    return 0
  }
  if (score > 100) {
    return 100
  }
  return score
}

function getPerformanceBand(score) {
  if (score >= 80) {
    return 'Pro'
  }
  if (score >= 50) {
    return 'Intermediate'
  }
  return 'Beginner'
}

function calculatePerformance(force, spinX, spinY, spinZ) {
  const spinMagnitude = Math.hypot(spinX, spinY, spinZ)
  const forceScore = Math.min((force / 6) * 100, 100)
  const spinScore = Math.min((spinMagnitude / 1200) * 100, 100)
  const finalScore = clampScore(Math.round(forceScore * 0.65 + spinScore * 0.35))

  return {
    spinMagnitude,
    performanceScore: finalScore,
    performanceBand: getPerformanceBand(finalScore),
  }
}

function parseKickData(rawValue) {
  if (!rawValue) {
    return null
  }

  const values = String(rawValue).trim().split(',').map(Number)

  if (![4, 5].includes(values.length) || values.some((value) => Number.isNaN(value))) {
    return null
  }

  const [force, spinX, spinY, spinZ, firmwareScore] = values
  const calculated = calculatePerformance(force, spinX, spinY, spinZ)
  const scoreToUse =
    typeof firmwareScore === 'number' && !Number.isNaN(firmwareScore)
      ? clampScore(Math.round(firmwareScore))
      : calculated.performanceScore

  return {
    force,
    spinX,
    spinY,
    spinZ,
    spinMagnitude: calculated.spinMagnitude,
    performanceScore: scoreToUse,
    performanceBand: getPerformanceBand(scoreToUse),
    kickDetected: true,
    timestamp: Date.now(),
  }
}

export {
  TARGET_DEVICE_NAME,
  connectToDevice,
  disconnectDevice,
  findSmartFootballDevice,
  parseKickData,
  requestBluetoothPermissions,
  scanNearbyDevices,
  subscribeToData,
}
