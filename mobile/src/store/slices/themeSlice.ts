import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeType } from '../../theme/themes';

interface ThemeState {
  currentTheme: ThemeType;
}

const initialState: ThemeState = {
  currentTheme: 'verde',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.currentTheme = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;