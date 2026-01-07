import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./features/appSlice";
import authReducer from "./features/authSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.timestamp'],
        ignoredPaths: ['auth.lastAuthCheck', 'app.performance.lastInteractionTime'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
