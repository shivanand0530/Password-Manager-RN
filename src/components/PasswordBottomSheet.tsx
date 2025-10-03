import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { Eye, EyeOff, Copy, Edit, Trash2, Star, Globe, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { PasswordEntry } from '@/types/password';

interface PasswordBottomSheetProps {
  isVisible: boolean;
  entry: PasswordEntry | null;
  onClose: () => void;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  colors: any;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PasswordBottomSheet({
  isVisible,
  entry,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  colors,
}: PasswordBottomSheetProps) {
  const [showPassword, setShowPassword] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPassword(false);
      onClose();
    });
  };

  const copyToClipboard = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${type} copied to clipboard`);
  };

  const handleDelete = () => {
    if (!entry) return;
    Alert.alert(
      'Delete Password',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(entry.id);
            handleClose();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!entry) return;
    onEdit(entry);
    handleClose();
  };

  if (!entry) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.bottomSheet,
            { backgroundColor: colors.card, transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.header}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.text }]}>{entry.title}</Text>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => onToggleFavorite(entry.id)}
              >
                <Star
                  size={24}
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
                  <Copy size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
              <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: colors.text }]}>
                  {showPassword ? entry.password : '••••••••••••'}
                </Text>
                <View style={styles.passwordActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.textMuted} />
                    ) : (
                      <Eye size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => copyToClipboard(entry.password, 'Password')}
                  >
                    <Copy size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {entry.website && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Website</Text>
                <View style={styles.valueContainer}>
                  <Text style={[styles.value, { color: colors.text }]}>{entry.website}</Text>
                  <Globe size={18} color={colors.textMuted} />
                </View>
              </View>
            )}

            {entry.notes && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Notes</Text>
                <Text style={[styles.notes, { color: colors.textSecondary }]}>
                  {entry.notes}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Edit size={18} color={colors.primary} />
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 size={18} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 4,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 12,
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
    marginTop: 12,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});