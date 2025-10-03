import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { BiometricAuth } from '@/services/biometricAuth';

interface BiometricContextType {
  isLocked: boolean;
  isBiometricEnabled: boolean;
  isBiometricSupported: boolean;
  unlockApp: () => Promise<boolean>;
  lockApp: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  checkBiometricSupport: () => Promise<void>;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

interface BiometricProviderProps {
  children: ReactNode;
}

export function BiometricProvider({ children }: BiometricProviderProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    initializeBiometric();
    setupAppStateListener();
  }, []);

  const initializeBiometric = async () => {
    try {
      // Check if biometric is supported
      const supported = await BiometricAuth.isBiometricSupported();
      setIsBiometricSupported(supported);

      // Check if biometric is enabled by user
      const enabled = await BiometricAuth.isBiometricEnabled();
      setIsBiometricEnabled(enabled);

      // Check if app is locked
      const locked = await BiometricAuth.isAppLocked();
      setIsLocked(locked);

      // If biometric is enabled and supported, and app is locked, don't auto-unlock
      // Let the user authenticate first
    } catch (error) {
      console.error('Error initializing biometric:', error);
      setIsLocked(true);
    }
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Lock the app when it goes to background
        const enabled = await BiometricAuth.isBiometricEnabled();
        if (enabled) {
          await lockApp();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  };

  const unlockApp = async (): Promise<boolean> => {
    try {
      // Simply unlock the app - authentication should be handled by the caller
      await BiometricAuth.setAppUnlocked();
      setIsLocked(false);
      return true;
    } catch (error) {
      console.error('Error unlocking app:', error);
      return false;
    }
  };

  const lockApp = async (): Promise<void> => {
    try {
      await BiometricAuth.setAppLocked();
      setIsLocked(true);
    } catch (error) {
      console.error('Error locking app:', error);
    }
  };

  const enableBiometric = async (): Promise<void> => {
    try {
      const supported = await BiometricAuth.isBiometricSupported();
      if (!supported) {
        throw new Error('Biometric authentication is not available');
      }

      // Test authentication before enabling
      const result = await BiometricAuth.authenticate();
      if (result.success) {
        await BiometricAuth.setBiometricEnabled(true);
        setIsBiometricEnabled(true);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      await BiometricAuth.setBiometricEnabled(false);
      await BiometricAuth.setAppUnlocked(); // Unlock since biometric is disabled
      setIsBiometricEnabled(false);
      setIsLocked(false);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  };

  const checkBiometricSupport = async (): Promise<void> => {
    try {
      const supported = await BiometricAuth.isBiometricSupported();
      setIsBiometricSupported(supported);
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsBiometricSupported(false);
    }
  };

  const value: BiometricContextType = {
    isLocked,
    isBiometricEnabled,
    isBiometricSupported,
    unlockApp,
    lockApp,
    enableBiometric,
    disableBiometric,
    checkBiometricSupport,
  };

  return (
    <BiometricContext.Provider value={value}>
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric(): BiometricContextType {
  const context = useContext(BiometricContext);
  if (context === undefined) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }
  return context;
}