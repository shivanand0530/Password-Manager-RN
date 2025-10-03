import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, Globe } from 'lucide-react-native';
import { PasswordEntry } from '@/types/password';

interface SimplePasswordCardProps {
  entry: PasswordEntry;
  onPress: (entry: PasswordEntry) => void;
  colors: any;
}

export default function SimplePasswordCard({ entry, onPress, colors }: SimplePasswordCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(entry)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {entry.title}
          </Text>
          <Text style={[styles.username, { color: colors.textMuted }]} numberOfLines={1}>
            {entry.username}
          </Text>
        </View>
        
        <View style={styles.indicators}>
          {entry.website && (
            <Globe size={16} color={colors.textMuted} />
          )}
          {entry.isFavorite && (
            <Star 
              size={16} 
              color={colors.warning} 
              fill={colors.warning} 
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});