import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, Star, Eye, EyeOff } from 'lucide-react-native';
import { calculatePasswordStrength } from '@/utils/encryption';
import { useTheme } from '@/context/ThemeContext';
import { lightTheme, darkTheme } from '@/styles/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { savePassword, updatePassword, selectPasswordsLoading, selectPasswordsError, clearError } from '@/store/Slices/passwordSlice';
import { selectAllCategories } from '@/store/Slices/categoriesSlice';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function AddPasswordScreen() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectAllCategories);
  const isLoading = useAppSelector(selectPasswordsLoading);
  const error = useAppSelector(selectPasswordsError);
  
  // Check if we're in edit mode
  const isEditMode = !!params.id;
  const editingPasswordId = params.id as string | undefined;
  
  // Local form state
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('6'); // Default to "Other" category
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = calculatePasswordStrength(password);

  // Clear form function
  const clearForm = () => {
    setTitle('');
    setUsername('');
    setPassword('');
    setWebsite('');
    setNotes('');
    setCategory('6');
    setIsFavorite(false);
    setShowPassword(false);
  };

  // Clear any existing errors when component mounts
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      if (isEditMode && editingPasswordId) {
        // Update existing password
        const updates = {
          title: title.trim(),
          username: username.trim(),
          password: password.trim(),
          website: website.trim(),
          notes: notes.trim(),
          category,
          isFavorite,
          updatedAt: new Date(),
        };

        await dispatch(updatePassword({ id: editingPasswordId, updates })).unwrap();

        Alert.alert('Success', 'Password updated successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              router.back();
              // Clear form after a short delay to ensure navigation completes
              setTimeout(() => clearForm(), 100);
            }
          }
        ]);
      } else {
        // Add new password
        const passwordData = {
          title: title.trim(),
          username: username.trim(),
          password: password.trim(),
          website: website.trim(),
          notes: notes.trim(),
          category,
          isFavorite,
        };

        await dispatch(savePassword(passwordData)).unwrap();

        Alert.alert('Success', 'Password saved successfully!', [
          { text: 'OK', onPress: clearForm }
        ]);
      }
    } catch (error) {
      console.error('Failed to save password:', error);
      const errorMessage = typeof error === 'string' ? error : 'Failed to save password. Please try again.';
      Alert.alert('Error', errorMessage);
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
          <Text style={[styles.title, { color: colors.text }]}>
            {isEditMode ? 'Edit Password' : 'Add Password'}
          </Text>
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

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme === 'dark' ? '#FEF2F2' : '#FEF2F2' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

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
                <View style={styles.strengthBarContainer}>
                  <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color, width: `${(passwordStrength.score / 5) * 100}%` }]} />
                </View>
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
              isLoading && [styles.saveButtonDisabled, { opacity: 0.6 }]
            ]}
            onPress={handleSave}
            disabled={isLoading}
            accessibilityLabel={isLoading ? "Saving password" : "Save password"}
          >
            <Save size={20} color="#ffffff" />
            <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>
              {isLoading ? 'Saving...' : 'Save Password'}
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
  strengthBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 70,
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
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});