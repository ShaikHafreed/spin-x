import { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { Card, Text } from 'react-native-paper'
import PropTypes from 'prop-types'

function getHitPosition(spinX, spinY) {
  let horizontal = 'Center'
  if (spinX > 80) {
    horizontal = 'Right'
  } else if (spinX < -80) {
    horizontal = 'Left'
  }

  let vertical = 'Mid'
  if (spinY > 80) {
    vertical = 'Upper'
  } else if (spinY < -80) {
    vertical = 'Lower'
  }

  return `${vertical}-${horizontal}`
}

function estimateDistanceMeters(force, spinX, spinY, spinZ) {
  const normalizedForce = Math.max(0, Math.min(force / 6, 1))
  const baseDistance = 8 + normalizedForce * 38

  const centerHitBoost = Math.abs(spinX) <= 80 ? 0.1 : -0.04
  const cleanContactBoost = Math.abs(spinY) <= 80 ? 0.08 : -0.02
  const spinBoost = Math.min(Math.abs(spinZ) / 1200, 0.15)

  const estimated = baseDistance * (1 + centerHitBoost + cleanContactBoost + spinBoost)
  return Math.max(4, Number(estimated.toFixed(1)))
}

export default function ForceTrajectoryCard({ metrics }) {
  const horizontalAnimation = useRef(new Animated.Value(0)).current
  const verticalAnimation = useRef(new Animated.Value(0)).current

  const normalizedForce = useMemo(() => Math.max(0, Math.min(metrics.force / 6, 1)), [metrics.force])
  const hitPosition = useMemo(() => getHitPosition(metrics.spinX, metrics.spinY), [metrics.spinX, metrics.spinY])
  const estimatedDistance = useMemo(
    () => estimateDistanceMeters(metrics.force, metrics.spinX, metrics.spinY, metrics.spinZ),
    [metrics.force, metrics.spinX, metrics.spinY, metrics.spinZ],
  )

  useEffect(() => {
    if (!metrics.kickDetected) {
      horizontalAnimation.setValue(0)
      verticalAnimation.setValue(0)
      return
    }

    const travelX = 220 * normalizedForce
    const travelY = -Math.max(-42, Math.min(42, metrics.spinY / 6))

    Animated.parallel([
      Animated.sequence([
        Animated.timing(horizontalAnimation, {
          toValue: travelX,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(horizontalAnimation, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(verticalAnimation, {
          toValue: travelY,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(verticalAnimation, {
          toValue: 0,
          duration: 620,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [
    metrics.kickDetected,
    metrics.timestamp,
    metrics.spinY,
    normalizedForce,
    horizontalAnimation,
    verticalAnimation,
  ])

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">Kick Simulation</Text>
        <Text variant="bodySmall" style={styles.detailsText}>
          Hit Position: {hitPosition}
        </Text>
        <Text variant="bodySmall" style={styles.detailsText}>
          Estimated Distance: {estimatedDistance} m
        </Text>

        <View style={styles.trackContainer}>
          <View style={styles.goalPost} />
          <Animated.View
            style={[
              styles.ball,
              {
                transform: [{ translateX: horizontalAnimation }, { translateY: verticalAnimation }],
              },
            ]}
          />
        </View>
      </Card.Content>
    </Card>
  )
}

ForceTrajectoryCard.propTypes = {
  metrics: PropTypes.shape({
    force: PropTypes.number.isRequired,
    spinX: PropTypes.number.isRequired,
    spinY: PropTypes.number.isRequired,
    spinZ: PropTypes.number.isRequired,
    kickDetected: PropTypes.bool.isRequired,
    timestamp: PropTypes.number,
  }).isRequired,
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
  },
  detailsText: {
    marginTop: 4,
    opacity: 0.9,
  },
  trackContainer: {
    marginTop: 14,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2b313f',
    backgroundColor: '#141922',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  goalPost: {
    position: 'absolute',
    right: 12,
    top: 24,
    bottom: 24,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#2ecc71',
    opacity: 0.75,
  },
  ball: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f1c40f',
    borderWidth: 1,
    borderColor: '#111',
  },
})
