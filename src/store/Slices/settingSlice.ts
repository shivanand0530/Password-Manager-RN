import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeneratorOptions } from '../../types/password';

export interface SecuritySettings {
  biometricEnabled: boolean;
  autoLockTimeout: number; // in minutes
  requireMasterPassword: boolean;
  showPasswordPreview: boolean;
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  security: SecuritySettings;
  passwordGenerator: GeneratorOptions;
  backupEnabled: boolean;
  notifications: {
    passwordExpiry: boolean;
    weakPasswords: boolean;
    duplicatePasswords: boolean;
  };
}

const initialState: SettingsState = {
  theme: 'system',
  security: {
    biometricEnabled: false,
    autoLockTimeout: 5,
    requireMasterPassword: true,
    showPasswordPreview: false,
  },
  passwordGenerator: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true,
  },
  backupEnabled: false,
  notifications: {
    passwordExpiry: true,
    weakPasswords: true,
    duplicatePasswords: true,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<SecuritySettings>>) => {
      state.security = { ...state.security, ...action.payload };
    },
    updatePasswordGenerator: (state, action: PayloadAction<Partial<GeneratorOptions>>) => {
      state.passwordGenerator = { ...state.passwordGenerator, ...action.payload };
    },
    setBackupEnabled: (state, action: PayloadAction<boolean>) => {
      state.backupEnabled = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<typeof initialState.notifications>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
  },
});

export const {
  setTheme,
  updateSecuritySettings,
  updatePasswordGenerator,
  setBackupEnabled,
  updateNotificationSettings,
} = settingsSlice.actions;

// Selectors
export const selectTheme = (state: { settings: SettingsState }) => state.settings.theme;
export const selectSecuritySettings = (state: { settings: SettingsState }) => state.settings.security;
export const selectPasswordGenerator = (state: { settings: SettingsState }) => state.settings.passwordGenerator;
export const selectBackupEnabled = (state: { settings: SettingsState }) => state.settings.backupEnabled;
export const selectNotificationSettings = (state: { settings: SettingsState }) => state.settings.notifications;

export default settingsSlice.reducer;