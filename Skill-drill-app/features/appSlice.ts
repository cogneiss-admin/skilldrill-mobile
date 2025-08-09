import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type AppState = {
  ready: boolean;
};

const initialState: AppState = {
  ready: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setReady(state, action: PayloadAction<boolean | undefined>) {
      state.ready = action.payload ?? true;
    },
  },
});

export const { setReady } = appSlice.actions;
export default appSlice.reducer;
