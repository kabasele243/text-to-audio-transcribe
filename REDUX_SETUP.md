# Redux Toolkit State Management

This document explains the Redux Toolkit implementation added to the Text-to-Audio Transcriber application.

## Overview

The application now uses Redux Toolkit for centralized state management, replacing the previous local React state approach. This provides better state predictability, debugging capabilities, and separation of concerns.

## Store Structure

The Redux store is organized into three main slices:

### 1. Files Slice (`src/store/slices/filesSlice.ts`)

Manages all file processing state:

- **State:**
  - `processedFiles`: Array of uploaded/processed files
  - `isReadingFiles`: Loading state for file reading operations
  - `isTranscribing`: Loading state for transcription operations
  - `isDownloading`: Loading state for download operations

- **Actions:**
  - `setIsReadingFiles(boolean)`: Toggle file reading state
  - `setIsTranscribing(boolean)`: Toggle transcription state
  - `setIsDownloading(boolean)`: Toggle download state
  - `addProcessedFiles(ProcessedFile[])`: Add new files to the list
  - `updateFileStatus()`: Update individual file status
  - `updateFileWithAudio()`: Update file with transcribed audio
  - `clearAllFiles()`: Clear all processed files

- **Async Thunks:**
  - `transcribeFile`: Transcribe a single file
  - `transcribeMultipleFiles`: Transcribe multiple files sequentially with better state management

### 2. Settings Slice (`src/store/slices/settingsSlice.ts`)

Manages application settings:

- **State:**
  - `selectedVoice`: Currently selected voice for transcription
  - `availableVoices`: List of available voices
  - `selectedSpeed`: Current playback speed setting
  - `isLoadingVoices`: Loading state for voice fetching

- **Actions:**
  - `setSelectedVoice(string)`: Change selected voice
  - `setSelectedSpeed(number)`: Change speed setting
  - `setAvailableVoices(string[])`: Update available voices list

- **Async Thunks:**
  - `loadVoices`: Fetch available voices from the API

### 3. UI Slice (`src/store/slices/uiSlice.ts`)

Manages UI-specific state:

- **State:**
  - `globalMessage`: Global status/notification message

- **Actions:**
  - `setGlobalMessage(string | null)`: Set status message
  - `clearGlobalMessage()`: Clear status message

## Usage in Components

### Hooks

The application uses typed Redux hooks for better TypeScript support:

```typescript
import { useAppDispatch, useAppSelector } from './store/hooks';

// In components
const dispatch = useAppDispatch();
const files = useAppSelector(state => state.files.processedFiles);
```

### Selectors

Pre-built selectors are available in `src/store/selectors.ts`:

```typescript
import { selectProcessedFiles, selectCanTranscribe } from './store/selectors';

const files = useAppSelector(selectProcessedFiles);
const canTranscribe = useAppSelector(selectCanTranscribe);
```

## Migration from Local State

The main `App.tsx` component has been refactored to use Redux instead of local state:

### Before (Local State)
```typescript
const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
const [isTranscribing, setIsTranscribing] = useState(false);
// ... more useState calls
```

### After (Redux)
```typescript
const dispatch = useAppDispatch();
const processedFiles = useAppSelector(state => state.files.processedFiles);
const isTranscribing = useAppSelector(state => state.files.isTranscribing);
// ... using selectors
```

## Benefits

1. **Centralized State**: All application state is in one predictable location
2. **Better Debugging**: Redux DevTools support for time-travel debugging
3. **Type Safety**: Full TypeScript support with typed actions and selectors
4. **Performance**: Optimized re-renders with fine-grained subscriptions
5. **Testability**: Easy to test actions and reducers in isolation
6. **Async Handling**: Built-in support for async operations with Redux Toolkit Query-like patterns

## Key Features

- **Immer Integration**: State mutations are handled safely with Immer
- **Async Thunks**: Complex async workflows are properly managed
- **Error Handling**: Comprehensive error states for all async operations
- **Loading States**: Proper loading indicators for all operations
- **Bulk Operations**: Efficient handling of multiple file transcriptions

## Development

To extend the Redux setup:

1. Add new actions to existing slices or create new slices
2. Use the typed hooks (`useAppDispatch`, `useAppSelector`)
3. Create selectors for computed state
4. Use async thunks for async operations
5. Handle loading and error states appropriately

The Redux DevTools extension can be used to debug state changes and time-travel through application state. 