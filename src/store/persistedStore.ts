import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import passwordReducer from './Slices/passwordSlice';
import categoriesReducer from './Slices/categoriesSlice';
import settingsReducer from './Slices/settingSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Only persist settings - passwords will be loaded from SQLite
  whitelist: ['settings', 'categories'],
  // Don't persist passwords in AsyncStorage since they're in SQLite
  blacklist: ['passwords'],
};

const rootReducer = combineReducers({
  passwords: passwordReducer,
  categories: categoriesReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
