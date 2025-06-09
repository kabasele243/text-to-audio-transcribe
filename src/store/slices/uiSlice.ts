import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  globalMessage: string | null;
}

const initialState: UiState = {
  globalMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalMessage: (state, action: PayloadAction<string | null>) => {
      state.globalMessage = action.payload;
    },
    clearGlobalMessage: (state) => {
      state.globalMessage = null;
    },
  },
});

export const {
  setGlobalMessage,
  clearGlobalMessage,
} = uiSlice.actions;

export default uiSlice.reducer; 