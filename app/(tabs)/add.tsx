import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, Star, Eye, EyeOff } from 'lucide-react-native';
import { PasswordStorage } from '@/services/passwordStorage';
import { calculatePasswordStrength } from '@/utils/encryption';
import { useTheme } from '@/app/context/ThemeContext';
import { lightTheme, darkTheme } from '@/app/styles/theme';

const categories = [
  { id: 'social', name: 'Social Media', color: '#3b82f6' },
  { id: 'work', name: 'Work', color: '#059669' },
  { id: 'banking', name: 'Banking', color: '#dc2626' },
  { id: 'shopping', name: 'Shopping', color: '#f59e0b' },
  { id: 'entertainment', name: 'Entertainment', color: '#8b5cf6' },
  { id: 'other', name: 'Other', color: '#6b7280' },
];

export default function AddPasswordScreen() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('other');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordStrength = calculatePasswordStrength(password);

  const handleSave = async () => {
    if (!title.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await PasswordStorage.addPassword({
        title: title.trim(),
        username: username.trim(),
        password: password.trim(),
        website: website.trim(),
        notes: notes.trim(),
        category,
        isFavorite,
      });

      Alert.alert('Success', 'Password saved successfully!', [
        { text: 'OK', onPress: clearForm }
      ]);
    } catch (error) {
      console.error('Failed to save password:', error);
      Alert.alert('Error', 'Failed to save password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setUsername('');
    setPassword('');
    setWebsite('');
    setNotes('');
    setCategory('other');
    setIsFavorite(false);
    setShowPassword(false);
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
          <Text style={[styles.title, { color: colors.text }]}>Add Password</Text>
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Star
              size={24}
              color={isFavorite ? colors.warning : colors.textMuted}
              fill={isFavorite ? colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Gmail, Facebook, Work Email"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              testID="title-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Username/Email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="username@example.com"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="username-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                testID="password-input"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Website (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="https://example.com"
              placeholderTextColor={colors.textMuted}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
              testID="website-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    { borderColor: cat.color },
                    category === cat.id && { backgroundColor: cat.color }
                  ]}
                  onPress={() => setCategory(cat.id)}
                  accessibilityLabel={`Select ${cat.name} category`}
                  testID={`category-${cat.id}`}
                >
                  <Text style={[
                    styles.categoryText,
                    { color: category === cat.id ? '#ffffff' : colors.textSecondary },
                    category === cat.id && styles.categoryTextActive
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: colors.card }]}
            onPress={clearForm}
            accessibilityLabel="Clear form"
          >
            <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { backgroundColor: colors.primary },
              saving && [styles.saveButtonDisabled, { opacity: 0.6 }]
            ]}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel={saving ? "Saving password" : "Save password"}
          >
            <Save size={20} color="#ffffff" />
            <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>
              {saving ? 'Saving...' : 'Save Password'}
            </Text>
          </TouchableOpacity>
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
  favoriteButton: {
    padding: 8,
  },
  favoriteButtonActive: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  form: {
    gap: 20,
  },
  field: {
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    paddingRight: 56,
    fontSize: 16,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  strengthBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d1d5db',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});