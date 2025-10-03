import {configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import passwordReducer from './Slices/passwordSlice';
import categoriesReducer from './Slices/categoriesSlice';
import settingsReducer from './Slices/settingSlice';


const rootReducer = combineReducers({
    passwords: passwordReducer,
    categories: categoriesReducer,
    settings: settingsReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
