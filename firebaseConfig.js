import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey ?? "",
  authDomain: extra.firebaseAuthDomain ?? "",
  projectId: extra.firebaseProjectId ?? "",
  storageBucket: extra.firebaseStorageBucket ?? "",
  messagingSenderId: extra.firebaseMessagingSenderId ?? "",
  appId: extra.firebaseAppId ?? "",
  measurementId: extra.firebaseMeasurementId ?? "",
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  throw new Error(
    "Firebase configuration is missing. Please add your Firebase keys to app.json under expo.extra.",
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** @type {import("firebase/auth").Auth} */
let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };

export const db = getFirestore(app);

export const storage = getStorage(app);

