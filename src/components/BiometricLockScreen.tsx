import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint, Shield, Eye } from 'lucide-react-native';
import { BiometricAuth } from '@/services/biometricAuth';
import { useTheme } from '@/context/ThemeContext';
import { lightTheme, darkTheme } from '@/styles/theme';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

export default function BiometricLockScreen({ onUnlock }: BiometricLockScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('Authenticate to unlock');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    checkBiometricSupport();
    getAuthPromptMessage();
  }, []);

  const checkBiometricSupport = async () => {
    const supported = await BiometricAuth.isBiometricSupported();
    setBiometricSupported(supported);
  };

  const getAuthPromptMessage = async () => {
    const message = await BiometricAuth.getAuthPromptMessage();
    setAuthPromptMessage(message);
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      const result = await BiometricAuth.authenticate();
      
      if (result.success) {
        onUnlock();
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Please try again',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    if (authPromptMessage.includes('Face ID') || authPromptMessage.includes('face')) {
      return <Eye size={80} color={colors.primary} />;
    } else if (authPromptMessage.includes('fingerprint') || authPromptMessage.includes('Fingerprint')) {
      return <Fingerprint size={80} color={colors.primary} />;
    } else {
      return <Shield size={80} color={colors.primary} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {getBiometricIcon()}
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          GuardVault
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Your passwords are protected
        </Text>
        
        <View style={styles.authSection}>
          <TouchableOpacity
            style={[
              styles.authButton,
              { 
                backgroundColor: colors.primary,
                opacity: isAuthenticating || !biometricSupported ? 0.6 : 1
              }
            ]}
            onPress={handleBiometricAuth}
            disabled={isAuthenticating || !biometricSupported}
            activeOpacity={0.8}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Fingerprint size={24} color="white" />
                <Text style={styles.authButtonText}>
                  {biometricSupported ? authPromptMessage : 'Biometric not available'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {!biometricSupported && (
            <Text style={[styles.warningText, { color: colors.textMuted }]}>
              Please enable biometric authentication in your device settings
            </Text>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Tap the button above to unlock your passwords
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 48,
    textAlign: 'center',
  },
  authSection: {
    width: '100%',
    alignItems: 'center',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 250,
    gap: 12,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 32,
    right: 32,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});