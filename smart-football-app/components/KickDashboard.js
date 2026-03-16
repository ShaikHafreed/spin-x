import { StyleSheet, View } from 'react-native'
import { Chip, Text } from 'react-native-paper'
import PropTypes from 'prop-types'
import DataCard from './DataCard'
import StudentDetails from './StudentDetails'

export default function KickDashboard({ metrics, student }) {
  const statusLabel = metrics.kickDetected ? 'Kick Detected' : 'Waiting for kick'

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Dashboard
      </Text>

      <DataCard label="Kick Force" value={metrics.force.toFixed(1)} unit="g" />
      <DataCard label="Spin X" value={String(metrics.spinX)} />
      <DataCard label="Spin Y" value={String(metrics.spinY)} />
      <DataCard label="Spin Z" value={String(metrics.spinZ)} />
      <DataCard label="Spin Magnitude" value={metrics.spinMagnitude.toFixed(1)} />
      <DataCard label="Performance Score" value={String(metrics.performanceScore)} unit="/100" />
      <DataCard label="Performance Band" value={metrics.performanceBand} />

      <View style={styles.statusRow}>
        <Text variant="titleMedium">Status</Text>
        <Chip mode="outlined" selected={metrics.kickDetected} compact>
          {statusLabel}
        </Chip>
      </View>

      <StudentDetails student={student} />
    </View>
  )
}

KickDashboard.propTypes = {
  metrics: PropTypes.shape({
    force: PropTypes.number.isRequired,
    spinX: PropTypes.number.isRequired,
    spinY: PropTypes.number.isRequired,
    spinZ: PropTypes.number.isRequired,
    spinMagnitude: PropTypes.number.isRequired,
    performanceScore: PropTypes.number.isRequired,
    performanceBand: PropTypes.string.isRequired,
    kickDetected: PropTypes.bool.isRequired,
  }).isRequired,
  student: PropTypes.shape({
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
    position: PropTypes.string.isRequired,
    dominantFoot: PropTypes.string.isRequired,
  }).isRequired,
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    marginBottom: 14,
    fontWeight: '700',
  },
  statusRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
