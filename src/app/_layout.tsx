import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { BiometricProvider, useBiometric } from '@/context/BiometricContext';
import BiometricLockScreen from '@/components/BiometricLockScreen';
import { store, persistor } from '../store/persistedStore';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, Text, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { loadPasswords } from '@/store/Slices/passwordSlice';
import { AppDispatch } from '../store/persistedStore';

LogBox.ignoreLogs(['Warning: useInsertionEffect']);
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('useInsertionEffect')) {
      return;
    }
    originalWarn(...args);
  };
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Load passwords from SQLite when app starts
    // Queue the dispatch to run after the current render cycle
    queueMicrotask(() => {
      dispatch(loadPasswords());
    });
  }, [dispatch]);

  return <>{children}</>;
}

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
      <PersistGate 
        loading={
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        } 
        persistor={persistor}
      >
        <AppInitializer>
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </SafeAreaProvider>
        </AppInitializer>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <BiometricProvider>
        <Layout />
      </BiometricProvider>
    </ThemeProvider>
  );
}
