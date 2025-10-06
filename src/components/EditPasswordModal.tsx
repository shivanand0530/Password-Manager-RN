import React, { useState, useEffect, useReducer } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Save, Star, Eye, EyeOff } from 'lucide-react-native';
import { PasswordEntry } from '@/types/password';
import { calculatePasswordStrength } from '@/utils/encryption';

interface EditPasswordModalProps {
  isVisible: boolean;
  entry: PasswordEntry | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<PasswordEntry>) => void;
  categories: any[];
  colors: any;
}

interface FormState {
  title: string;
  username: string;
  password: string;
  website: string;
  notes: string;
  category: string;
  isFavorite: boolean;
  showPassword: boolean;
}

type FormAction = 
  | { type: 'SET_FIELD'; field: keyof FormState; value: any }
  | { type: 'LOAD_ENTRY'; entry: PasswordEntry }
  | { type: 'TOGGLE_SHOW_PASSWORD' }
  | { type: 'TOGGLE_FAVORITE' };

const initialState: FormState = {
  title: '',
  username: '',
  password: '',
  website: '',
  notes: '',
  category: '6',
  isFavorite: false,
  showPassword: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'LOAD_ENTRY':
      return {
        ...state,
        title: action.entry.title,
        username: action.entry.username,
        password: action.entry.password,
        website: action.entry.website || '',
        notes: action.entry.notes || '',
        category: action.entry.category,
        isFavorite: action.entry.isFavorite,
      };
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'TOGGLE_FAVORITE':
      return { ...state, isFavorite: !state.isFavorite };
    default:
      return state;
  }
}

export default function EditPasswordModal({
  isVisible,
  entry,
  onClose,
  onSave,
  categories,
  colors,
}: EditPasswordModalProps) {
  // Initialize state with entry data - using lazy initializer to avoid re-computation
  const [formState, dispatch] = useReducer(
    formReducer, 
    entry,
    (initialEntry) => {
      if (initialEntry) {
        return {
          title: initialEntry.title,
          username: initialEntry.username,
          password: initialEntry.password,
          website: initialEntry.website || '',
          notes: initialEntry.notes || '',
          category: initialEntry.category,
          isFavorite: initialEntry.isFavorite,
          showPassword: false,
        };
      }
      return initialState;
    }
  );

  const passwordStrength = calculatePasswordStrength(formState.password);

  const handleSave = () => {
    if (!formState.title.trim() || !formState.username.trim() || !formState.password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!entry) return;

    const updates = {
      title: formState.title.trim(),
      username: formState.username.trim(),
      password: formState.password.trim(),
      website: formState.website.trim(),
      notes: formState.notes.trim(),
      category: formState.category,
      isFavorite: formState.isFavorite,
      updatedAt: new Date(),
    };

    onSave(entry.id, updates);
  };

  const getStrengthColor = () => {
    return passwordStrength.color;
  };

  const getStrengthText = () => {
    return passwordStrength.label;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Gmail, Facebook"
              placeholderTextColor={colors.textMuted}
              value={formState.title}
              onChangeText={(value) => dispatch({ type: 'SET_FIELD', field: 'title', value })}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Username/Email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="username@example.com"
              placeholderTextColor={colors.textMuted}
              value={formState.username}
              onChangeText={(value) => dispatch({ type: 'SET_FIELD', field: 'username', value })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                value={formState.password}
                onChangeText={(value) => dispatch({ type: 'SET_FIELD', field: 'password', value })}
                secureTextEntry={!formState.showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => dispatch({ type: 'TOGGLE_SHOW_PASSWORD' })}
              >
                {formState.showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {formState.password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      { 
                        backgroundColor: getStrengthColor(), 
                        width: `${(passwordStrength.score / 5) * 100}%` 
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                  {getStrengthText()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Website</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="https://example.com"
              placeholderTextColor={colors.textMuted}
              value={formState.website}
              onChangeText={(value) => dispatch({ type: 'SET_FIELD', field: 'website', value })}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textMuted}
              value={formState.notes}
              onChangeText={(value) => dispatch({ type: 'SET_FIELD', field: 'notes', value })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.favoriteRow}>
              <Text style={[styles.label, { color: colors.text }]}>Mark as Favorite</Text>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => dispatch({ type: 'TOGGLE_FAVORITE' })}
              >
                <Star
                  size={24}
                  color={formState.isFavorite ? colors.warning : colors.textMuted}
                  fill={formState.isFavorite ? colors.warning : 'transparent'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Save size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    paddingRight: 56,
    fontSize: 16,
    borderWidth: 1,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  favoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
