import { StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import PropTypes from 'prop-types'
import { appTheme } from '../styles/theme'

export default function HomeHeader({ connectionStatus, lastUpdated }) {
  return (
    <Card mode="contained" style={styles.topCard}>
      <Card.Content>
        <Text variant="headlineMedium" style={styles.appTitle}>
          Smart Football
        </Text>
        <Text variant="bodyMedium" style={styles.statusText}>
          {connectionStatus}
        </Text>
        <Text variant="bodySmall" style={styles.statusText}>
          Last update: {lastUpdated}
        </Text>
      </Card.Content>
    </Card>
  )
}

HomeHeader.propTypes = {
  connectionStatus: PropTypes.string.isRequired,
  lastUpdated: PropTypes.string.isRequired,
}

const styles = StyleSheet.create({
  topCard: {
    backgroundColor: appTheme.colors.surface,
    marginTop: 8,
  },
  appTitle: {
    fontWeight: '800',
    color: appTheme.colors.primary,
  },
  statusText: {
    marginTop: 6,
    opacity: 0.9,
  },
})
