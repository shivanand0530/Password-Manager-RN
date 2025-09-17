import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Download, Upload, Trash2, Info, Lock, Smartphone, Moon, Sun, Monitor } from 'lucide-react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { lightTheme, darkTheme } from '@/app/styles/theme';
import { PasswordStorage } from '@/services/passwordStorage';
import * as Sharing from 'expo-sharing';
import { exportDatabaseFile } from '@/services/database';

export default function SettingsScreen() {
  const { theme, isDark, setTheme } = useTheme();
  const colors = isDark ? darkTheme : lightTheme;
  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will export your password data to a secure file. Make sure to store it safely.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Export data') },
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'This feature will import password data from a file. This will replace your current data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', onPress: () => console.log('Import data') },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your passwords. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: handleClearAllDataConfirm },
      ]
    );
  };

  const handleExportDB = async () => {
    try {
      const exportPath = await exportDatabaseFile();
      await Sharing.shareAsync(exportPath, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Export Password Database',
        UTI: 'public.database'
      });
      Alert.alert('Success', 'Database exported successfully');
    } catch (error) {
      console.error('Error exporting database:', error);
      Alert.alert('Error', 'Failed to export database');
    }
  };

  const handleClearAllDataConfirm = async () => {
    try {
      await PasswordStorage.clearAllData();
      Alert.alert('Success', 'All password data has been cleared.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      Alert.alert('Error', 'Failed to clear password data. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'right', 'left']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
           <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
          
           { /*<TouchableOpacity style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Master Password</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Change your master password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Smartphone size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Biometric Authentication</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Use fingerprint or face recognition</Text>
            </View>
            <Switch 
              value={false} 
              onValueChange={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.settingItem} onPress={handleExportDB}>
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Download size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Export Database</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Download a backup of your database</Text>
            </View>
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Auto-lock</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Lock app after 5 minutes of inactivity</Text>
            </View>
            <Switch 
              value={false} 
              onValueChange={() => Alert.alert('Coming Soon', 'This feature will be available in a future update.')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </TouchableOpacity> */}
        </View>


        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setTheme('light')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Sun size={20} color={theme === 'light' ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Light Theme</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Use light color scheme</Text>
            </View>
            {theme === 'light' && (
              <View style={styles.checkmark}>
                <View style={[styles.checkmarkDot, { backgroundColor: colors.primary }]} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setTheme('dark')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Moon size={20} color={theme === 'dark' ? colors.purple : colors.textMuted} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Theme</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Use dark color scheme</Text>
            </View>
            {theme === 'dark' && (
              <View style={styles.checkmark}>
                <View style={[styles.checkmarkDot, { backgroundColor: colors.primary }]} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setTheme('system')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Monitor size={20} color={theme === 'system' ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>System Default</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Follow system theme</Text>
            </View>
            {theme === 'system' && (
              <View style={styles.checkmark}>
                <View style={[styles.checkmarkDot, { backgroundColor: colors.primary }]} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Info size={20} color={colors.textMuted} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>App Version</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>1.0.0</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.dangerSection, { backgroundColor: colors.card, borderColor: colors.danger }]}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleClearAllData}>
            <View style={[styles.settingIcon, { backgroundColor: colors.iconBackground }]}>
              <Trash2 size={20} color={colors.danger} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.dangerTitle, { color: colors.danger }]}>Clear All Data</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Permanently delete all passwords</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Your passwords are encrypted and stored securely on your device.
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  dangerSection: {
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});