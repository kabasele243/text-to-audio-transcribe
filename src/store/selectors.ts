import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';
import { filesAdapter } from './slices/filesSlice';

// Create entity selectors with proper RootState typing
const filesEntitySelectors = filesAdapter.getSelectors((state: RootState) => state.files.files);

// Base selectors
export const selectFilesState = (state: RootState) => state.files;
export const selectSettingsState = (state: RootState) => state.settings;
export const selectUiState = (state: RootState) => state.ui;

// Files selectors - using the properly typed entity selectors
export const selectProcessedFiles = filesEntitySelectors.selectAll;
export const selectFileById = filesEntitySelectors.selectById;
export const selectIsReadingFiles = (state: RootState) => state.files.isReadingFiles;
export const selectIsTranscribing = (state: RootState) => state.files.isTranscribing;
export const selectIsDownloading = (state: RootState) => state.files.isDownloading;
export const selectIsRestoringAudio = (state: RootState) => state.files.isRestoringAudio;
export const selectTranscriptionProgress = (state: RootState) => state.files.transcriptionProgress;
export const selectFilesError = (state: RootState) => state.files.error;

// Settings selectors
export const selectSelectedVoice = (state: RootState) => state.settings.selectedVoice;
export const selectAvailableVoices = (state: RootState) => state.settings.availableVoices;
export const selectSelectedSpeed = (state: RootState) => state.settings.selectedSpeed;
export const selectIsLoadingVoices = (state: RootState) => state.settings.isLoadingVoices;

// UI selectors
export const selectGlobalMessage = (state: RootState) => state.ui.globalMessage;

// RTK Best Practice: Memoized computed selectors using createSelector
export const selectReadyFiles = createSelector(
  [selectProcessedFiles],
  (files) => files.filter(file => file.status === 'ready')
);

export const selectTranscribedFiles = createSelector(
  [selectProcessedFiles],
  (files) => files.filter(file => file.status === 'transcribed' && file.audioSrc)
);

export const selectTranscribedFilesNeedingAudioRestoration = createSelector(
  [selectProcessedFiles],
  (files) => files.filter(file => 
    file.status === 'transcribed' && 
    (!file.audioSrc || file.audioSrc.startsWith('blob:'))
  )
);

export const selectFilesWithErrors = createSelector(
  [selectProcessedFiles],
  (files) => files.filter(file => file.status === 'error')
);

export const selectCanTranscribe = createSelector(
  [selectReadyFiles, selectIsTranscribing, selectIsReadingFiles, selectIsRestoringAudio],
  (readyFiles, isTranscribing, isReading, isRestoring) => 
    readyFiles.length > 0 && !isTranscribing && !isReading && !isRestoring
);

export const selectCanClear = createSelector(
  [selectProcessedFiles, selectIsTranscribing, selectIsReadingFiles, selectIsRestoringAudio],
  (files, isTranscribing, isReading, isRestoring) =>
    files.length > 0 && !isTranscribing && !isReading && !isRestoring
);

export const selectCanDownload = createSelector(
  [selectTranscribedFiles, selectIsDownloading, selectIsTranscribing, selectIsReadingFiles, selectIsRestoringAudio],
  (transcribedFiles, isDownloading, isTranscribing, isReading, isRestoring) =>
    transcribedFiles.length > 0 && !isDownloading && !isTranscribing && !isReading && !isRestoring
);

// Progress selectors
export const selectTranscriptionProgressPercentage = createSelector(
  [selectTranscriptionProgress],
  (progress) => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  }
);

// Statistics selectors
export const selectFileStatistics = createSelector(
  [selectProcessedFiles],
  (files) => ({
    total: files.length,
    ready: files.filter(f => f.status === 'ready').length,
    processing: files.filter(f => f.status === 'processing').length,
    transcribed: files.filter(f => f.status === 'transcribed').length,
    errors: files.filter(f => f.status === 'error').length,
  })
); 