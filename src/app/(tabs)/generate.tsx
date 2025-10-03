import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Copy, Eye, EyeOff, FileSliders as Sliders, Save } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { generatePassword, calculatePasswordStrength } from '@/utils/encryption';
import { GeneratorOptions } from '@/types/password';
import { PasswordStorage } from '@/services/passwordStorage';
import { useTheme } from '@/context/ThemeContext';
import { lightTheme, darkTheme } from '@/styles/theme';

export default function GeneratePasswordScreen() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  const generateNewPassword = () => {
    const newPassword = generatePassword(options);
    setGeneratedPassword(newPassword);
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      await Clipboard.setStringAsync(generatedPassword);
      Alert.alert('Copied', 'Password copied to clipboard');
    }
  };
  
  const handleSavePassword = async () => {
    if (!title.trim() || !username.trim() || !generatedPassword) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await PasswordStorage.addPassword({
        title: title.trim(),
        username: username.trim(),
        password: generatedPassword,
        website: website.trim(),
        notes: '',
        category: 'other',
        isFavorite: false,
      });

      Alert.alert('Success', 'Password saved successfully!');
      setShowSaveForm(false);
      setTitle('');
      setUsername('');
      setWebsite('');
    } catch (error) {
      console.error('Failed to save password:', error);
      Alert.alert('Error', 'Failed to save password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const passwordStrength = generatedPassword ? calculatePasswordStrength(generatedPassword) : null;

  React.useEffect(() => {
    generateNewPassword();
  }, [options]);

  const toggleOption = (key: keyof GeneratorOptions) => {
    if (typeof options[key] === 'boolean') {
      setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const setLength = (length: number) => {
    setOptions(prev => ({ ...prev, length }));
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
          <Text style={[styles.title, { color: colors.text }]}>Password Generator</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Sliders size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.passwordSection, { backgroundColor: colors.card }]}>
          <View style={[styles.passwordContainer, { backgroundColor: colors.iconBackground, borderColor: colors.border }]}>
            <Text style={[styles.password, !showPassword && styles.passwordHidden, { color: colors.text }]}>
              {showPassword ? generatedPassword : '••••••••••••••••'}
            </Text>
            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.iconBackground }]}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.iconBackground }]} onPress={copyToClipboard}>
                <Copy size={20} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.iconBackground }]} onPress={generateNewPassword}>
                <RefreshCw size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {passwordStrength && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthInfo}>
                <Text style={[styles.strengthLabel, { color: colors.textMuted }]}>Strength:</Text>
                <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
              <View style={styles.strengthBarContainer}>
                {[...Array(6)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthBarSegment,
                      index < passwordStrength.score
                        ? { backgroundColor: passwordStrength.color }
                        : { backgroundColor: colors.border }
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Length: {options.length}</Text>
          <View style={styles.lengthOptions}>
            {[8, 12, 16, 20, 24, 32].map((length) => (
              <TouchableOpacity
                key={length}
                style={[
                  styles.lengthButton,
                  { backgroundColor: colors.iconBackground, borderColor: colors.border },
                  options.length === length && [styles.lengthButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                ]}
                onPress={() => setLength(length)}
              >
                <Text style={[
                  styles.lengthButtonText,
                  { color: colors.textSecondary },
                  options.length === length && [styles.lengthButtonTextActive, { color: '#ffffff' }]
                ]}>
                  {length}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleOptions}>
            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => toggleOption('includeUppercase')}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: colors.border },
                options.includeUppercase && [styles.checkboxActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}>
                {options.includeUppercase && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Uppercase Letters</Text>
                <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>A-Z</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => toggleOption('includeLowercase')}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: colors.border },
                options.includeLowercase && [styles.checkboxActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}>
                {options.includeLowercase && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Lowercase Letters</Text>
                <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>a-z</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => toggleOption('includeNumbers')}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: colors.border },
                options.includeNumbers && [styles.checkboxActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}>
                {options.includeNumbers && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Numbers</Text>
                <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>0-9</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => toggleOption('includeSymbols')}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: colors.border },
                options.includeSymbols && [styles.checkboxActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}>
                {options.includeSymbols && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Symbols</Text>
                <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>!@#$%^&*()</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => toggleOption('excludeSimilar')}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: colors.border },
                options.excludeSimilar && [styles.checkboxActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}>
                {options.excludeSimilar && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Exclude Similar Characters</Text>
                <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>i, l, 1, L, o, 0, O</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {showSaveForm ? (
          <View style={[styles.saveForm, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Save Password</Text>
            
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.iconBackground, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., Gmail, Facebook, Work Email"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Username/Email *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.iconBackground, borderColor: colors.border, color: colors.text }]}
                placeholder="username@example.com"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Website (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.iconBackground, borderColor: colors.border, color: colors.text }]}
                placeholder="https://example.com"
                placeholderTextColor={colors.textMuted}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.iconBackground }]}
                onPress={() => setShowSaveForm(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.success }, saving && styles.saveButtonDisabled]} 
                onPress={handleSavePassword}
                disabled={saving}
              >
                <Save size={20} color="#ffffff" />
                <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>
                  {saving ? 'Saving...' : 'Save Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.generateButton, { backgroundColor: colors.primary }]} onPress={generateNewPassword}>
              {/* <RefreshCw size={20} color="#ffffff" style={{  }} /> */}
              <Text style={[styles.generateButtonText, { color: '#ffffff' }]}>Generate New Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.success }]} 
              onPress={() => setShowSaveForm(true)}
            >
              <Save size={20} color="#ffffff" />
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
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
  field: {
    marginBottom: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f9fafb',
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f9fafb',
  },
  settingsButton: {
    padding: 8,
  },
  passwordSection: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  passwordContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  password: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#f9fafb',
    marginRight: 12,
  },
  passwordHidden: {
    fontSize: 20,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#4b5563',
  },
  strengthContainer: {
    gap: 8,
  },
  strengthInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  optionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 16,
  },
  lengthOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  lengthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  lengthButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  lengthButtonText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  lengthButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  toggleOptions: {
    gap: 16,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f9fafb',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  generateButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  saveForm: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d1d5db',
  },
});