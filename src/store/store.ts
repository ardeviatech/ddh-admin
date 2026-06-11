import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import patientsReducer from "./slices/patientsSlice";
import fpeReducer from "./slices/fpeSlice";

const persistStorage = (storage as any)?.default ?? storage;
import consultationReducer from "./slices/consultationSlice";
import inventoryReducer from "./slices/inventorySlice";
import auditLogReducer from "./slices/auditLogSlice";
import surveyReducer from "./slices/surveySlice";
import patientFlowReducer from "./slices/patientFlowSlice";
import usersReducer from "./slices/usersSlice";
import queueReducer from "./slices/queueSlice";
import { auditLogMiddleware } from "./middleware/auditLogMiddleware";

const persistConfig = {
  key: "root",
  storage: persistStorage,
  whitelist: ["auth", "patients", "queue"], // persist only essential state for faster reloads
};

const rootReducer = combineReducers({
  auth: authReducer,
  patients: patientsReducer,
  fpe: fpeReducer,
  consultation: consultationReducer,
  inventory: inventoryReducer,
  auditLog: auditLogReducer,
  survey: surveyReducer,
  patientFlow: patientFlowReducer,
  users: usersReducer,
  queue: queueReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer(
  persistConfig,
  rootReducer,
) as unknown as typeof rootReducer;

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(auditLogMiddleware),
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
