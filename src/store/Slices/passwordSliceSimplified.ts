import { createSlice, PayloadAction, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { PasswordEntry } from '../../types/password';
import { encryptPassword, decryptPassword } from '../../utils/encryption';

// Serializable version for Redux store (all dates as strings)
interface SerializedPasswordEntry {
    id: string;
    title: string;
    username: string;
    password: string;
    website?: string;
    notes?: string;
    category: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

interface PasswordState {
    passwords: SerializedPasswordEntry[];
    loading: boolean;
    error: string | null;
}

const initialState: PasswordState = {
    passwords: [],
    loading: false,
    error: null,
};

// Helper functions
const serializePassword = (password: PasswordEntry): SerializedPasswordEntry => ({
    ...password,
    createdAt: password.createdAt instanceof Date ? password.createdAt.toISOString() : password.createdAt,
    updatedAt: password.updatedAt instanceof Date ? password.updatedAt.toISOString() : password.updatedAt,
});

const deserializePassword = (password: SerializedPasswordEntry): PasswordEntry => ({
    ...password,
    createdAt: new Date(password.createdAt),
    updatedAt: new Date(password.updatedAt),
});

const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Async thunks for encrypted operations
export const savePassword = createAsyncThunk(
    'passwords/savePassword',
    async (password: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        const encryptedPassword = await encryptPassword(password.password);
        const now = new Date().toISOString();
        
        const newPassword: SerializedPasswordEntry = {
            ...password,
            id: generateId(),
            password: encryptedPassword,
            createdAt: now,
            updatedAt: now,
        };
        
        return newPassword;
    }
);

export const updatePasswordAsync = createAsyncThunk(
    'passwords/updatePasswordAsync',
    async ({ id, updates }: { id: string; updates: Partial<PasswordEntry> }) => {
        const updatedFields: any = { ...updates };
        
        // Encrypt password if it's being updated
        if (updates.password) {
            updatedFields.password = await encryptPassword(updates.password);
        }
        
        return { id, updates: updatedFields };
    }
);

const passwordSlice = createSlice({
    name: 'passwords',
    initialState,
    reducers: {
        // Internal action to add password (called by async thunk)
        addPasswordSuccess: (state, action: PayloadAction<SerializedPasswordEntry>) => {
            state.passwords.push(action.payload);
            state.loading = false;
            state.error = null;
        },

        // Internal action to update password (called by async thunk)
        updatePasswordSuccess: (state, action: PayloadAction<{ id: string; updates: any }>) => {
            const { id, updates } = action.payload;
            const index = state.passwords.findIndex(p => p.id === id);
            
            if (index !== -1) {
                const updatedPassword = {
                    ...state.passwords[index],
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };
                
                state.passwords[index] = updatedPassword;
                state.loading = false;
                state.error = null;
            }
        },

        // Delete a password
        deletePassword: (state, action: PayloadAction<string>) => {
            state.passwords = state.passwords.filter(p => p.id !== action.payload);
            state.error = null;
        },

        // Toggle favorite status
        toggleFavorite: (state, action: PayloadAction<string>) => {
            const index = state.passwords.findIndex(p => p.id === action.payload);
            if (index !== -1) {
                state.passwords[index].isFavorite = !state.passwords[index].isFavorite;
                state.passwords[index].updatedAt = new Date().toISOString();
            }
        },

        // Clear all passwords
        clearAllPasswords: (state) => {
            state.passwords = [];
            state.error = null;
        },

        // Set loading state
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },

        // Set error state
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        // Clear error
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Save password cases
            .addCase(savePassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(savePassword.fulfilled, (state, action) => {
                state.passwords.push(action.payload);
                state.loading = false;
                state.error = null;
            })
            .addCase(savePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to save password';
            })
            
            // Update password cases
            .addCase(updatePasswordAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePasswordAsync.fulfilled, (state, action) => {
                const { id, updates } = action.payload;
                const index = state.passwords.findIndex(p => p.id === id);
                
                if (index !== -1) {
                    state.passwords[index] = {
                        ...state.passwords[index],
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    };
                }
                
                state.loading = false;
                state.error = null;
            })
            .addCase(updatePasswordAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update password';
            });
    },
});

// Action creators
export const {
    addPasswordSuccess,
    updatePasswordSuccess,
    deletePassword,
    toggleFavorite,
    clearAllPasswords,
    setLoading,
    setError,
    clearError,
} = passwordSlice.actions;

// Export async actions with backward compatible names
export const updatePassword = updatePasswordAsync;

// Selectors with memoization for performance
export const selectAllPasswords = createSelector(
    [(state: { passwords: PasswordState }) => state.passwords.passwords],
    (passwords) => passwords.map(deserializePassword)
);

export const selectPasswordById = createSelector(
    [
        (state: { passwords: PasswordState }) => state.passwords.passwords,
        (_: any, id: string) => id
    ],
    (passwords, id) => {
        const password = passwords.find(p => p.id === id);
        return password ? deserializePassword(password) : null;
    }
);

export const selectPasswordsByCategory = createSelector(
    [
        (state: { passwords: PasswordState }) => state.passwords.passwords,
        (_: any, categoryId: string) => categoryId
    ],
    (passwords, categoryId) => {
        return passwords
            .filter(p => p.category === categoryId)
            .map(deserializePassword);
    }
);

export const selectFavoritePasswords = createSelector(
    [(state: { passwords: PasswordState }) => state.passwords.passwords],
    (passwords) => {
        return passwords
            .filter(p => p.isFavorite)
            .map(deserializePassword);
    }
);

export const selectPasswordsLoading = (state: { passwords: PasswordState }) => state.passwords.loading;
export const selectPasswordsError = (state: { passwords: PasswordState }) => state.passwords.error;
export const selectPasswordsCount = (state: { passwords: PasswordState }) => state.passwords.passwords.length;

// Export the reducer
export default passwordSlice.reducer;