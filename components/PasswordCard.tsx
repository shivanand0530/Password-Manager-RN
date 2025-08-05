import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Eye, EyeOff, Copy, CreditCard as Edit, Trash2, Star, Globe } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { PasswordEntry } from '@/types/password';
import { lightTheme, darkTheme } from '@/app/styles/theme';

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  theme?: 'light' | 'dark' | 'system';
  colors?: any;
}

export default function PasswordCard({ entry, onEdit, onDelete, onToggleFavorite, theme = 'dark', colors = darkTheme }: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${type} copied to clipboard`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Password',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{entry.title}</Text>
          {entry.website && (
            <TouchableOpacity style={styles.websiteButton}>
              <Globe size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => onToggleFavorite(entry.id)}
        >
          <Star
            size={20}
            color={entry.isFavorite ? colors.warning : colors.textMuted}
            fill={entry.isFavorite ? colors.warning : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Username</Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: colors.text }]}>{entry.username}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => copyToClipboard(entry.username, 'Username')}
          >
            <Copy size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: colors.text }]}>
            {showPassword ? entry.password : '••••••••'}
          </Text>
          <View style={styles.passwordActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={16} color={colors.textMuted} />
              ) : (
                <Eye size={16} color={colors.textMuted} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copyToClipboard(entry.password, 'Password')}
            >
              <Copy size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {entry.notes && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Notes</Text>
          <Text style={[styles.notes, { color: colors.textSecondary }]}>{entry.notes}</Text>
        </View>
      )}

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(entry)}>
          <Edit size={16} color={colors.primary} />
          <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={16} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  websiteButton: {
    padding: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});