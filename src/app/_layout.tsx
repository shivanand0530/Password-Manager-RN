import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { BiometricProvider, useBiometric } from '@/context/BiometricContext';
import BiometricLockScreen from '@/components/BiometricLockScreen';
import { store } from '@/store';
import { Provider } from 'react-redux';

function Layout() {
  useFrameworkReady();
  const { isDark } = useTheme();
  const { isLocked, isBiometricEnabled, unlockApp } = useBiometric();

  // Show lock screen if app is locked and biometric is enabled
  if (isLocked && isBiometricEnabled) {
    return <BiometricLockScreen onUnlock={unlockApp} />;
  }

  return (
    <Provider store={store}>
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
    </Provider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <BiometricProvider>
        <Layout />
      </BiometricProvider>
    </ThemeProvider>
  );
}
