import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Star, Grid2x2 as Grid } from 'lucide-react-native';
import { PasswordEntry } from '@/types/password';
import SimplePasswordCard from '@/components/SimplePasswordCard';
import PasswordBottomSheet from '@/components/PasswordBottomSheet';
import EditPasswordModal from '@/components/EditPasswordModal';
import { useTheme } from '@/context/ThemeContext';
import { lightTheme, darkTheme } from '@/styles/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadPasswords as loadPasswordsAsync, deletePassword, updatePassword, deserializePassword, selectAllPasswords, selectPasswordsLoading } from '@/store/Slices/passwordSlice';
import { selectAllCategories } from '@/store/Slices/categoriesSlice';


export default function PasswordsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const passwords = useAppSelector(selectAllPasswords);
  const loading = useAppSelector(selectPasswordsLoading);
  const categories = useAppSelector(selectAllCategories);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadPasswordsAsync());
  }, [dispatch]);

  // Refresh passwords when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Queue the dispatch to avoid scheduling updates during render
      queueMicrotask(() => {
        dispatch(loadPasswordsAsync());
      });
      return () => {};
    }, [dispatch])
  );

  const handleEdit = (entry: PasswordEntry) => {
    // Close bottom sheet and open edit modal
    setIsBottomSheetVisible(false);
    setTimeout(() => {
      setSelectedPassword(entry);
      setIsEditModalVisible(true);
    }, 300);
  };

  const handleSaveEdit = async (id: string, updates: Partial<PasswordEntry>) => {
    try {
      await dispatch(updatePassword({ id, updates })).unwrap();
      setIsEditModalVisible(false);
      setSelectedPassword(null);
      // Refresh the list
      dispatch(loadPasswordsAsync());
    } catch (error) {
      console.error('Failed to update password:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      dispatch(deletePassword(id));
    } catch (error) {
      console.error('Failed to delete password:', error);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const password = passwords.find(p => p.id === id);
      if (password) {
        dispatch(updatePassword({ id, updates: { isFavorite: !password.isFavorite } }));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handlePasswordPress = (entry: PasswordEntry) => {
    setSelectedPassword(entry);
    setIsBottomSheetVisible(true);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedPassword(null);
  };

  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = password.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         password.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         password.website?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFavorites = !showFavoritesOnly || password.isFavorite;
    
    return matchesSearch && matchesFavorites;
  });

  const favoriteCount = passwords.filter(p => p.isFavorite).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'right', 'left']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading passwords...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'right', 'left']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Passwords</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {passwords.length} passwords • {favoriteCount} favorites
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search passwords..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border }, 
            showFavoritesOnly && [styles.filterButtonActive, { borderColor: colors.warning }]
          ]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star
            size={20}
            color={showFavoritesOnly ? colors.warning : colors.textMuted}
            fill={showFavoritesOnly ? colors.warning : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {filteredPasswords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Grid size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {passwords.length === 0 ? 'No passwords yet' : 'No matching passwords'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {passwords.length === 0
              ? 'Tap the + button to add your first password'
              : 'Try adjusting your search or filters'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPasswords}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SimplePasswordCard
              entry={item}
              onPress={handlePasswordPress}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      </KeyboardAvoidingView>
      
      <PasswordBottomSheet
        isVisible={isBottomSheetVisible}
        entry={selectedPassword}
        onClose={handleCloseBottomSheet}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
        colors={colors}
      />

      <EditPasswordModal
        key={selectedPassword?.id || 'new'}
        isVisible={isEditModalVisible}
        entry={selectedPassword}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedPassword(null);
        }}
        onSave={handleSaveEdit}
        categories={categories}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  filterButton: {
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterButtonActive: {
    borderWidth: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#9ca3af',
  },
});