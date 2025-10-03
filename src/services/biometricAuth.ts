import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BiometricAuth {
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly APP_LOCKED_KEY = 'app_locked';

  /**
   * Check if the device supports biometric authentication
   */
  static async isBiometricSupported(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  }

  /**
   * Get available authentication types
   */
  static async getAvailableAuthTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting auth types:', error);
      return [];
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(): Promise<{
    success: boolean;
    error?: string;
    biometricType?: string;
  }> {
    try {
      const isSupported = await this.isBiometricSupported();
      
      if (!isSupported) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const authTypes = await this.getAvailableAuthTypes();
      let promptMessage = 'Authenticate to access your passwords';
      
      if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        promptMessage = 'Use your fingerprint to unlock your passwords';
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Store successful auth
        await this.setAppUnlocked();
        return {
          success: true,
          biometricType: authTypes[0] ? LocalAuthentication.AuthenticationType[authTypes[0]] : 'biometric',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'An error occurred during authentication',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled by user
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication
   */
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.BIOMETRIC_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.error('Error setting biometric enabled status:', error);
      throw error;
    }
  }

  /**
   * Check if app is currently locked
   */
  static async isAppLocked(): Promise<boolean> {
    try {
      const locked = await AsyncStorage.getItem(this.APP_LOCKED_KEY);
      return locked !== 'false'; // Default to locked if not set
    } catch (error) {
      console.error('Error checking app lock status:', error);
      return true; // Default to locked on error
    }
  }

  /**
   * Lock the app
   */
  static async setAppLocked(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.APP_LOCKED_KEY, 'true');
    } catch (error) {
      console.error('Error locking app:', error);
      throw error;
    }
  }

  /**
   * Unlock the app
   */
  static async setAppUnlocked(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.APP_LOCKED_KEY, 'false');
    } catch (error) {
      console.error('Error unlocking app:', error);
      throw error;
    }
  }

  /**
   * Get authentication prompt message based on available biometrics
   */
  static async getAuthPromptMessage(): Promise<string> {
    try {
      const authTypes = await this.getAvailableAuthTypes();
      
       if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Use fingerprint to unlock';
      }
       else {
        return 'Authenticate to unlock';
      }
    } catch (error) {
      return 'Authenticate to unlock';
    }
  }
}