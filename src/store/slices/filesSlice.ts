import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import type { ProcessedFile, FileStatus } from '../../types';
import { transcribeText, TranscriptionResult } from '../../services/transcriptionService';

// RTK Best Practice: Use createEntityAdapter for normalized state
const filesAdapter = createEntityAdapter<ProcessedFile>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

interface FilesState {
  files: ReturnType<typeof filesAdapter.getInitialState>;
  isReadingFiles: boolean;
  isTranscribing: boolean;
  isDownloading: boolean;
  isRestoringAudio: boolean;
  transcriptionProgress: {
    current: number;
    total: number;
    currentFileName: string | null;
  };
  error: string | null;
}

const initialState: FilesState = {
  files: filesAdapter.getInitialState(),
  isReadingFiles: false,
  isTranscribing: false,
  isDownloading: false,
  isRestoringAudio: false,
  transcriptionProgress: {
    current: 0,
    total: 0,
    currentFileName: null,
  },
  error: null,
};

// Helper function to check if a blob URL is still valid
const isBlobUrlValid = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// New async thunk to restore audio data after rehydration
export const restoreAudioData = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'files/restoreAudioData',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const transcribedFiles = Object.values(state.files.files.entities).filter(
        (file: any) => file?.status === 'transcribed' && file?.audioSrc
      ) as ProcessedFile[];

      if (transcribedFiles.length === 0) return;

      // Check which blob URLs are invalid
      const invalidFiles: ProcessedFile[] = [];
      for (const file of transcribedFiles) {
        if (file.audioSrc?.startsWith('blob:')) {
          const isValid = await isBlobUrlValid(file.audioSrc);
          if (!isValid) {
            invalidFiles.push(file);
          }
        }
      }

      if (invalidFiles.length === 0) return;

      // Mark files as needing audio restoration
      for (const file of invalidFiles) {
        dispatch(updateFileStatus({ 
          fileId: file.id, 
          status: 'transcribed' // Keep status as transcribed but clear audioSrc
        }));
        dispatch(updateFileWithAudio({ fileId: file.id, audioSrc: '' }));
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore audio data';
      return rejectWithValue(message);
    }
  }
);

// New async thunk to re-fetch audio for a specific file
export const refetchAudioForFile = createAsyncThunk<
  { fileId: string; audioSrc: string },
  { file: ProcessedFile; voice: string; speed: number },
  { rejectValue: string }
>(
  'files/refetchAudioForFile',
  async (params, { rejectWithValue }) => {
    try {
      const { file, voice, speed } = params;
      const result = await transcribeText(file.content, file.name, voice, speed);
      return { fileId: file.id, audioSrc: result.audioSrc };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to re-fetch audio';
      return rejectWithValue(message);
    }
  }
);

// RTK Best Practice: Proper async thunk typing and error handling
export const transcribeFile = createAsyncThunk<
  { fileId: string; result: TranscriptionResult },
  { file: ProcessedFile; voice: string; speed: number },
  { rejectValue: string }
>(
  'files/transcribeFile',
  async (params, { rejectWithValue }) => {
    try {
      const { file, voice, speed } = params;
      const result = await transcribeText(file.content, file.name, voice, speed);
      return { fileId: file.id, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown transcription error';
      return rejectWithValue(message);
    }
  }
);

// RTK Best Practice: Enhanced bulk operation with proper error handling
export const transcribeMultipleFiles = createAsyncThunk<
  { successCount: number; errorCount: number },
  { files: ProcessedFile[]; voice: string; speed: number },
  { rejectValue: string }
>(
  'files/transcribeMultipleFiles',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const { files, voice, speed } = params;
      let successCount = 0;
      let errorCount = 0;

      // Update progress tracking
      dispatch(setTranscriptionProgress({ current: 0, total: files.length, currentFileName: null }));

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress
        dispatch(setTranscriptionProgress({ 
          current: i + 1, 
          total: files.length, 
          currentFileName: file.name 
        }));

        try {
          await dispatch(transcribeFile({ file, voice, speed })).unwrap();
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to transcribe ${file.name}:`, error);
        }
      }

      // Reset progress
      dispatch(setTranscriptionProgress({ current: 0, total: 0, currentFileName: null }));

      return { successCount, errorCount };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk transcription failed';
      return rejectWithValue(message);
    }
  }
);

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    // RTK Best Practice: Use builder callback pattern for better organization
    setIsReadingFiles: (state, action: PayloadAction<boolean>) => {
      state.isReadingFiles = action.payload;
      if (!action.payload) {
        state.error = null; // Clear errors when not reading
      }
    },
    setIsTranscribing: (state, action: PayloadAction<boolean>) => {
      state.isTranscribing = action.payload;
      if (!action.payload) {
        state.transcriptionProgress = { current: 0, total: 0, currentFileName: null };
      }
    },
    setIsDownloading: (state, action: PayloadAction<boolean>) => {
      state.isDownloading = action.payload;
    },
    setIsRestoringAudio: (state, action: PayloadAction<boolean>) => {
      state.isRestoringAudio = action.payload;
    },
    setTranscriptionProgress: (state, action: PayloadAction<{
      current: number;
      total: number;
      currentFileName: string | null;
    }>) => {
      state.transcriptionProgress = action.payload;
    },
    addProcessedFiles: (state, action: PayloadAction<ProcessedFile[]>) => {
      // RTK Best Practice: Use adapter methods for normalized operations
      filesAdapter.addMany(state.files, action.payload);
      state.error = null;
    },
    updateFileStatus: (state, action: PayloadAction<{ 
      fileId: string; 
      status: FileStatus; 
      error?: string;
    }>) => {
      const { fileId, status, error } = action.payload;
      filesAdapter.updateOne(state.files, {
        id: fileId,
        changes: { 
          status, 
          ...(error && { error }),
          ...(status !== 'error' && { error: undefined }) // Clear error if status is not error
        }
      });
    },
    updateFileWithAudio: (state, action: PayloadAction<{ 
      fileId: string; 
      audioSrc: string;
    }>) => {
      const { fileId, audioSrc } = action.payload;
      filesAdapter.updateOne(state.files, {
        id: fileId,
        changes: { 
          status: 'transcribed', 
          audioSrc,
          error: undefined // Clear any previous errors
        }
      });
    },
    clearAllFiles: (state) => {
      // RTK Best Practice: Use adapter method for clearing
      filesAdapter.removeAll(state.files);
      state.error = null;
      state.transcriptionProgress = { current: 0, total: 0, currentFileName: null };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Audio restoration
      .addCase(restoreAudioData.pending, (state) => {
        state.isRestoringAudio = true;
        state.error = null;
      })
      .addCase(restoreAudioData.fulfilled, (state) => {
        state.isRestoringAudio = false;
      })
      .addCase(restoreAudioData.rejected, (state, action) => {
        state.isRestoringAudio = false;
        state.error = action.payload || 'Failed to restore audio data';
      })
      // Re-fetch audio for specific file
      .addCase(refetchAudioForFile.pending, (state, action) => {
        const fileId = action.meta.arg.file.id;
        filesAdapter.updateOne(state.files, {
          id: fileId,
          changes: { status: 'processing', error: undefined }
        });
      })
      .addCase(refetchAudioForFile.fulfilled, (state, action) => {
        const { fileId, audioSrc } = action.payload;
        filesAdapter.updateOne(state.files, {
          id: fileId,
          changes: { 
            status: 'transcribed', 
            audioSrc,
            error: undefined
          }
        });
      })
      .addCase(refetchAudioForFile.rejected, (state, action) => {
        const fileId = action.meta.arg.file.id;
        const errorMessage = action.payload || 'Failed to re-fetch audio';
        
        filesAdapter.updateOne(state.files, {
          id: fileId,
          changes: { 
            status: 'error', 
            error: errorMessage
          }
        });
      })
      // Single file transcription
      .addCase(transcribeFile.pending, (state, action) => {
        const fileId = action.meta.arg.file.id;
        filesAdapter.updateOne(state.files, {
          id: fileId,
          changes: { status: 'processing', error: undefined }
        });
        state.isTranscribing = true;
        state.error = null;
      })
      .addCase(transcribeFile.fulfilled, (state, action) => {
        const { fileId, result } = action.payload;
        filesAdapter.updateOne(state.files, {
          id: fileId,
          changes: { 
            status: 'transcribed', 
            audioSrc: result.audioSrc,
            error: undefined
          }
        });
        // Check if all transcriptions are complete
        const files = Object.values(state.files.entities);
        const stillProcessing = files.some(f => f?.status === 'processing');
        if (!stillProcessing) {
          state.isTranscribing = false;
        }
      })
      .addCase(transcribeFile.rejected, (state, action) => {
        const fileId = action.meta.arg.file.id;
        const errorMessage = action.payload || action.error.message || 'Transcription failed';
        
        filesAdapter.updateOne(state.files, {
          id: fileId,
          changes: { 
            status: 'error', 
            error: errorMessage
          }
        });
        
        // Check if all transcriptions are complete
        const files = Object.values(state.files.entities);
        const stillProcessing = files.some(f => f?.status === 'processing');
        if (!stillProcessing) {
          state.isTranscribing = false;
        }
      })
      // Multiple files transcription
      .addCase(transcribeMultipleFiles.pending, (state) => {
        state.isTranscribing = true;
        state.error = null;
      })
      .addCase(transcribeMultipleFiles.fulfilled, (state, action) => {
        state.isTranscribing = false;
        const { successCount, errorCount } = action.payload;
        
        if (errorCount > 0) {
          state.error = `Completed with ${successCount} successes and ${errorCount} errors`;
        }
      })
      .addCase(transcribeMultipleFiles.rejected, (state, action) => {
        state.isTranscribing = false;
        state.error = action.payload || 'Bulk transcription failed';
      });
  },
});

// RTK Best Practice: Export selectors using adapter selectors
export const {
  selectAll: selectAllFiles,
  selectById: selectFileById,
  selectIds: selectFileIds,
  selectEntities: selectFileEntities,
  selectTotal: selectFilesCount,
} = filesAdapter.getSelectors((state: { files: FilesState }) => state.files.files);

export const {
  setIsReadingFiles,
  setIsTranscribing,
  setIsDownloading,
  setIsRestoringAudio,
  setTranscriptionProgress,
  addProcessedFiles,
  updateFileStatus,
  updateFileWithAudio,
  clearAllFiles,
  clearError,
} = filesSlice.actions;

export default filesSlice.reducer;

// Export the adapter for use in selectors
export { filesAdapter }; 