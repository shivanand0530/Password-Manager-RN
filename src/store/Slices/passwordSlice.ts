import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { PasswordEntry, SerializedPasswordEntry } from '../../types/password';

interface PasswordState {
    passwords: SerializedPasswordEntry[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    selectedCategory: string | null;
    favorites: SerializedPasswordEntry[];
}

const initialState: PasswordState = {
    passwords: [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedCategory: null,
    favorites: [],
};

// Helper function to serialize PasswordEntry to SerializedPasswordEntry
const serializePassword = (password: PasswordEntry): SerializedPasswordEntry => ({
    ...password,
    createdAt: password.createdAt.toISOString(),
    updatedAt: password.updatedAt.toISOString(),
});

// Helper function to deserialize SerializedPasswordEntry to PasswordEntry
export const deserializePassword = (password: SerializedPasswordEntry): PasswordEntry => ({
    ...password,
    createdAt: new Date(password.createdAt),
    updatedAt: new Date(password.updatedAt),
});

// Async thunks for database operations
export const loadPasswords = createAsyncThunk(
    'passwords/loadPasswords',
    async () => {
        const { PasswordStorage } = await import('../../services/passwordStorage');
        const passwords = await PasswordStorage.loadPasswords();
        return passwords.map(serializePassword);
    }
);

export const savePassword = createAsyncThunk(
    'passwords/savePassword',
    async (password: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        const { PasswordStorage } = await import('../../services/passwordStorage');
        // addPassword now returns the created entry with the correct ID
        const newEntry = await PasswordStorage.addPassword(password);
        // Serialize dates for Redux store
        return {
            ...newEntry,
            createdAt: newEntry.createdAt.toISOString(),
            updatedAt: newEntry.updatedAt.toISOString(),
        };
    }
);

export const updatePassword = createAsyncThunk(
    'passwords/updatePassword',
    async ({ id, updates }: { id: string; updates: Partial<PasswordEntry> }) => {
        const { PasswordStorage } = await import('../../services/passwordStorage');
        await PasswordStorage.updatePassword(id, updates);
        
        // Serialize the updates for Redux store
        const serializedUpdates: Partial<SerializedPasswordEntry> = {};
        
        // Copy all non-date fields
        Object.keys(updates).forEach(key => {
            if (key !== 'createdAt' && key !== 'updatedAt') {
                (serializedUpdates as any)[key] = updates[key as keyof PasswordEntry];
            }
        });
        
        // Handle date fields specifically
        if (updates.createdAt) {
            serializedUpdates.createdAt = updates.createdAt.toISOString();
        }
        if (updates.updatedAt) {
            serializedUpdates.updatedAt = updates.updatedAt.toISOString();
        }
        
        return { id, updates: serializedUpdates };
    }
);

export const deletePassword = createAsyncThunk(
    'passwords/deletePassword',
    async (id: string) => {
        const { PasswordStorage } = await import('../../services/passwordStorage');
        await PasswordStorage.deletePassword(id);
        return id;
    }
);

const passwordSlice = createSlice({
    name: "passwords",
    initialState,
    reducers: {
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategory = action.payload;
        },
        toggleFavorite: (state, action: PayloadAction<string>) => {
            const password = state.passwords.find(p => p.id === action.payload);
            if (password) {
                password.isFavorite = !password.isFavorite;
                if (password.isFavorite) {
                    state.favorites.push(password);
                } else {
                    state.favorites = state.favorites.filter(p => p.id !== action.payload);
                }
            }
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Load passwords
            .addCase(loadPasswords.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadPasswords.fulfilled, (state, action) => {
                state.loading = false;
                state.passwords = action.payload;
                state.favorites = action.payload.filter((p: SerializedPasswordEntry) => p.isFavorite);
            })
            .addCase(loadPasswords.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to load passwords';
            })
            // Save password
            .addCase(savePassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(savePassword.fulfilled, (state, action) => {
                state.loading = false;
                state.passwords.push(action.payload);
                if (action.payload.isFavorite) {
                    state.favorites.push(action.payload);
                }
            })
            .addCase(savePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to save password';
            })
            // Update password
            .addCase(updatePassword.fulfilled, (state, action) => {
                const { id, updates } = action.payload;
                const index = state.passwords.findIndex(p => p.id === id);
                if (index !== -1) {
                    // Update the password with string updatedAt
                    const updatedPassword = {
                        ...state.passwords[index],
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    state.passwords[index] = updatedPassword;
                    
                    // Update favorites list if needed
                    const favIndex = state.favorites.findIndex(p => p.id === id);
                    if (updates.isFavorite === true && favIndex === -1) {
                        state.favorites.push(updatedPassword);
                    } else if (updates.isFavorite === false && favIndex !== -1) {
                        state.favorites.splice(favIndex, 1);
                    } else if (favIndex !== -1) {
                        state.favorites[favIndex] = updatedPassword;
                    }
                }
            })
            // Delete password
            .addCase(deletePassword.fulfilled, (state, action) => {
                state.passwords = state.passwords.filter(p => p.id !== action.payload);
                state.favorites = state.favorites.filter(p => p.id !== action.payload);
            });
    },
});

export const { setSearchQuery, setSelectedCategory, toggleFavorite, clearError } = passwordSlice.actions;

// Base selectors
const selectPasswordState = (state: { passwords: PasswordState }) => state.passwords;
export const selectSerializedPasswords = (state: { passwords: PasswordState }) => state.passwords.passwords;
export const selectSerializedFavorites = (state: { passwords: PasswordState }) => state.passwords.favorites;
export const selectPasswordsLoading = (state: { passwords: PasswordState }) => state.passwords.loading;
export const selectPasswordsError = (state: { passwords: PasswordState }) => state.passwords.error;
export const selectSearchQuery = (state: { passwords: PasswordState }) => state.passwords.searchQuery;
export const selectSelectedCategory = (state: { passwords: PasswordState }) => state.passwords.selectedCategory;

// Memoized selectors
export const selectAllPasswords = createSelector(
    [selectSerializedPasswords],
    (serializedPasswords) => serializedPasswords.map(deserializePassword)
);

export const selectFavoritePasswords = createSelector(
    [selectSerializedFavorites],
    (serializedFavorites) => serializedFavorites.map(deserializePassword)
);

export const selectFilteredPasswords = createSelector(
    [selectSerializedPasswords, selectSearchQuery, selectSelectedCategory],
    (passwords, searchQuery, selectedCategory) => {
        const filteredPasswords = passwords.filter(password => {
            const matchesSearch = !searchQuery || 
                password.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                password.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                password.website?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = !selectedCategory || password.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
        
        return filteredPasswords.map(deserializePassword);
    }
);

export default passwordSlice.reducer;
