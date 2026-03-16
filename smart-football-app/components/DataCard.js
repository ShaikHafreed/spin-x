import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import PropTypes from 'prop-types'

export default function DataCard({ label, value, unit }) {
  const theme = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
      <Text variant="titleMedium" style={styles.label}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text variant="headlineMedium" style={[styles.value, { color: theme.colors.primary }]}>
          {value}
        </Text>
        {unit ? (
          <Text variant="titleMedium" style={styles.unit}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

DataCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  unit: PropTypes.string,
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    opacity: 0.85,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  value: {
    fontWeight: '700',
  },
  unit: {
    opacity: 0.8,
  },
})
