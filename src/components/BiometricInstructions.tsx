import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Fingerprint, Shield, Eye, Lock } from 'lucide-react-native';

interface BiometricInstructionsProps {
  colors: any;
}

export default function BiometricInstructions({ colors }: BiometricInstructionsProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Shield size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Biometric Security</Text>
      </View>
      
      <Text style={[styles.description, { color: colors.textMuted }]}>
        Secure your password vault with biometric authentication:
      </Text>
      
      <View style={styles.features}>
        <View style={styles.feature}>
          <Fingerprint size={20} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>Fingerprint unlock</Text>
        </View>
        
        <View style={styles.feature}>
          <Eye size={20} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>Face ID support</Text>
        </View>
        
        <View style={styles.feature}>
          <Lock size={20} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>Auto-lock on background</Text>
        </View>
      </View>
      
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Enable biometric authentication in Settings → Security to protect your passwords.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  features: {
    gap: 12,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});