import { MD3DarkTheme } from 'react-native-paper'

export const appTheme = {
  ...MD3DarkTheme,
  roundness: 14,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2ecc71',
    secondary: '#27ae60',
    tertiary: '#145a32',
    background: '#0f1115',
    surface: '#171a21',
    surfaceVariant: '#1e232d',
    outline: '#2b313f',
    onPrimary: '#07130b',
    onBackground: '#e9edf2',
    onSurface: '#e9edf2',
  },
}
