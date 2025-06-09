import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, Transform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import filesReducer from './slices/filesSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';

// Transform to handle blob URLs in persisted state
const filesTransform: Transform<any, any> = {
  in: (inboundState) => {
    // When persisting: clean up blob URLs since they won't work after refresh
    if (inboundState?.files?.entities) {
      const cleanedEntities = { ...inboundState.files.entities };
      Object.keys(cleanedEntities).forEach(key => {
        const file = cleanedEntities[key];
        if (file?.audioSrc?.startsWith('blob:')) {
          // Clear blob URLs but keep the file marked as transcribed
          cleanedEntities[key] = {
            ...file,
            audioSrc: '', // Clear the blob URL
          };
        }
      });
      return {
        ...inboundState,
        files: {
          ...inboundState.files,
          entities: cleanedEntities,
        },
      };
    }
    return inboundState;
  },
  out: (outboundState) => {
    // When rehydrating: return state as-is
    return outboundState;
  },
};

// Configure persistence for the entire root state
const rootPersistConfig = {
  key: 'root',
  storage,
  // Blacklist temporary states that shouldn't persist across sessions
  blacklist: [], // We'll handle specific field exclusions in nested configs
};

// Configure persistence for files slice - exclude temporary states
const filesPersistConfig = {
  key: 'files',
  storage,
  // Exclude temporary loading states and progress that shouldn't persist
  blacklist: ['isReadingFiles', 'isTranscribing', 'isDownloading', 'isRestoringAudio', 'transcriptionProgress', 'error'],
  transforms: [filesTransform], // Apply the transform to handle blob URLs
};

// Configure persistence for settings slice - persist everything
const settingsPersistConfig = {
  key: 'settings',
  storage,
  // Persist all settings
};

// Configure persistence for UI slice - exclude temporary messages
const uiPersistConfig = {
  key: 'ui',
  storage,
  // Exclude temporary global messages
  blacklist: ['globalMessage'],
};

// Create persisted reducers
const persistedFilesReducer = persistReducer(filesPersistConfig, filesReducer);
const persistedSettingsReducer = persistReducer(settingsPersistConfig, settingsReducer);
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);

// Combine all reducers
const rootReducer = combineReducers({
  files: persistedFilesReducer,
  settings: persistedSettingsReducer,
  ui: persistedUiReducer,
});

// Apply root persistence configuration
const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedRootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check (including Redux Persist actions)
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Enable listener behavior for RTK Query (if we add it later)
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Pre-typed hooks export for convenience
export type AppStore = typeof store; 