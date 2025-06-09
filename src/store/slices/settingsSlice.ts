import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchAvailableVoices } from '../../services/transcriptionService';

export interface SettingsState {
  selectedVoice: string;
  availableVoices: string[];
  selectedSpeed: number;
  isLoadingVoices: boolean;
}

const initialState: SettingsState = {
  selectedVoice: 'am_michael',
  availableVoices: ['am_michael'],
  selectedSpeed: 1.0,
  isLoadingVoices: false,
};

// Async thunk for loading available voices
export const loadVoices = createAsyncThunk(
  'settings/loadVoices',
  async () => {
    const voices = await fetchAvailableVoices();
    return voices;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSelectedVoice: (state, action: PayloadAction<string>) => {
      state.selectedVoice = action.payload;
    },
    setSelectedSpeed: (state, action: PayloadAction<number>) => {
      state.selectedSpeed = action.payload;
    },
    setAvailableVoices: (state, action: PayloadAction<string[]>) => {
      state.availableVoices = action.payload;
    },
    resetSettings: (state) => {
      // Reset only user-configurable settings to defaults
      state.selectedVoice = initialState.selectedVoice;
      state.selectedSpeed = initialState.selectedSpeed;
      // Keep available voices and loading state as they are
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadVoices.pending, (state) => {
        state.isLoadingVoices = true;
      })
      .addCase(loadVoices.fulfilled, (state, action) => {
        state.isLoadingVoices = false;
        // Ensure 'am_michael' is in the list and set as default if available
        const uniqueVoices = Array.from(new Set(['am_michael', ...action.payload]));
        state.availableVoices = uniqueVoices;
        
        if (uniqueVoices.includes('am_michael')) {
          state.selectedVoice = 'am_michael';
        } else if (uniqueVoices.length > 0) {
          state.selectedVoice = uniqueVoices[0]; // Fallback to first available
        }
      })
      .addCase(loadVoices.rejected, (state, action) => {
        state.isLoadingVoices = false;
        console.error("Failed to load voices, using default:", action.error);
        // Keep 'am_michael' as default if loading fails
        if (!state.availableVoices.includes('am_michael')) {
          state.availableVoices = Array.from(new Set(['am_michael', ...state.availableVoices]));
        }
        state.selectedVoice = 'am_michael';
      });
  },
});

export const {
  setSelectedVoice,
  setSelectedSpeed,
  setAvailableVoices,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer; 