import { StyleSheet, View } from 'react-native'
import { Card, Text } from 'react-native-paper'
import PropTypes from 'prop-types'

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={styles.label}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.value}>
        {value}
      </Text>
    </View>
  )
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
}

export default function StudentDetails({ student }) {
  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Student Details
        </Text>
        <DetailRow label="Name" value={student.name} />
        <DetailRow label="Student ID" value={student.id} />
        <DetailRow label="Age" value={String(student.age)} />
        <DetailRow label="Position" value={student.position} />
        <DetailRow label="Dominant Foot" value={student.dominantFoot} />
      </Card.Content>
    </Card>
  )
}

StudentDetails.propTypes = {
  student: PropTypes.shape({
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
    position: PropTypes.string.isRequired,
    dominantFoot: PropTypes.string.isRequired,
  }).isRequired,
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    opacity: 0.85,
  },
  value: {
    fontWeight: '600',
  },
})
