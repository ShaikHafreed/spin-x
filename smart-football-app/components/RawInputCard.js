import { StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import PropTypes from 'prop-types'

export default function RawInputCard({ rawData }) {
  return (
    <Card mode="outlined" style={styles.rawCard}>
      <Card.Content>
        <Text variant="titleMedium">Raw Input</Text>
        <Text variant="bodyMedium" style={styles.rawText}>
          {rawData}
        </Text>
      </Card.Content>
    </Card>
  )
}

RawInputCard.propTypes = {
  rawData: PropTypes.string.isRequired,
}

const styles = StyleSheet.create({
  rawCard: {
    marginTop: 16,
  },
  rawText: {
    marginTop: 8,
  },
})
