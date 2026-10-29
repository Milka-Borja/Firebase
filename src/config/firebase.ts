/**
 * Conexión con Firebase para Android e iOS.
 * Expo elige este archivo en el móvil. 
 */
import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { Platform } from 'react-native';
 
// Los valores vienen del archivo .env.local. Expo solo expone a la app
// las variables que empiezan con EXPO_PUBLIC_.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
 
// Con la recarga rapida (Fast Refresh) este módulo se puede ejecutar más de
// una vez. getApps() evita el error "Firebase App named '[DEFAULT]' already exists".
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const almacenamientoAuth = createAsyncStorage('firebase-auth');

// initializeAuth solo se puede llamar una vez por app. Si ya existe, lo reutilizamos.
function crearAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(almacenamientoAuth),
    });
  } catch (error) {
    // Fast Refresh puede volver a ejecutar este módulo después de inicializar Auth.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      return getAuth(app);
    }

    throw error;
  }
}
 
export const auth = crearAuth();
 
// Los correos de recuperacion de contraseña llegarán en español.
auth.languageCode = 'es';
