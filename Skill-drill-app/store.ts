import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import secureStorage from "./utils/secureStorage";
import appReducer from "./features/appSlice";
import authReducer from "./features/authSlice";

const authPersistConfig = {
  key: 'auth',
  storage: secureStorage,
  whitelist: ['refreshToken'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: persistedAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER', 'persist/PURGE'],
        ignoredActionPaths: ['payload.timestamp', 'register'],
        ignoredPaths: ['auth.lastAuthCheck', 'app.performance.lastInteractionTime'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
