/**
 * Contexto de sesión: el único lugar de la app que habla con Firebase Auth.
 *
 * Las pantallas no importan Firebase directamente; llaman a las funciones de
 * este contexto (iniciarSesion, registrarse, etc.). Así, si mañana se cambia
 * Firebase por otro proveedor, solo se reescribe este archivo.
 */
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
 
import { auth } from '@/config/firebase';
 
type ValorSesion = {
  /** Usuario conectado, o null si nadie ha iniciado sesión. */
  usuario: User | null;
  /** Indica si el correo de la cuenta activa ya fue verificado por Firebase. */
  correoVerificado: boolean;
  /** Nombre del perfil (displayName), siempre actualizado tras el registro. */
  nombre: string | null;
  /** true mientras Firebase revisa si hay una sesión guardada. */
  cargando: boolean;
  iniciarSesion: (correo: string, clave: string) => Promise<void>;
  registrarse: (nombre: string, correo: string, clave: string) => Promise<void>;
  actualizarVerificacionCorreo: () => Promise<void>;
  reenviarVerificacionCorreo: () => Promise<void>;
  errorEnvioVerificacion: unknown | null;
  enviarCorreoRecuperacion: (correo: string) => Promise<void>;
  cambiarClave: (claveActual: string, claveNueva: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};
 
const ContextoSesion = createContext<ValorSesion | null>(null);
 
/** Hook para leer la sesión desde cualquier pantalla. */
export function useSesion(): ValorSesion {
  // `use` es la forma moderna (React 19) de leer un contexto.
  const valor = use(ContextoSesion);
  if (!valor) {
    throw new Error('useSesion debe usarse dentro de <ProveedorSesion>.');
  }
  return valor;
}
 
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [correoVerificado, setCorreoVerificado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorEnvioVerificacion, setErrorEnvioVerificacion] = useState<unknown | null>(null);
  // Nombre del perfil guardado aparte: updateProfile modifica el mismo objeto
  // `user` sin cambiar su referencia, así que React no detectaría el cambio
  // si las pantallas leyeran usuario.displayName directamente.
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChanged se dispara al arrancar (con la sesión guardada o null)
    // y cada vez que alguien inicia o cierra sesión. Es la fuente de verdad:
    // la navegación (Stack.Protected en _layout.tsx) depende de este estado.
    const cancelarSuscripcion = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUsuario(usuarioFirebase);
      setCorreoVerificado(usuarioFirebase?.emailVerified ?? false);
      setNombre(usuarioFirebase?.displayName ?? null);
      setCargando(false);
    });
    // Al desmontar el proveedor dejamos de escuchar para no fugar memoria.
    return cancelarSuscripcion;
  }, []);
 
  async function iniciarSesion(correo: string, clave: string) {
    await signInWithEmailAndPassword(auth, correo.trim(), clave);
    // No navegamos aquí: onAuthStateChanged actualiza `usuario` y el
    // Stack.Protected muestra automáticamente la pantalla de bienvenida.
  }
 
  async function registrarse(nombreCompleto: string, correo: string, clave: string) {
    // Crear la cuenta también inicia la sesión.
    const credencial = await createUserWithEmailAndPassword(auth, correo.trim(), clave);
    // Guardamos el nombre en el perfil de Firebase (campo displayName).
    const nombreLimpio = nombreCompleto.trim();
    await updateProfile(credencial.user, { displayName: nombreLimpio });
    setNombre(nombreLimpio);
    try {
      await sendEmailVerification(credencial.user);
      setErrorEnvioVerificacion(null);
    } catch (error) {
      setErrorEnvioVerificacion(error);
      throw error;
    }
  }

  async function actualizarVerificacionCorreo() {
    const actual = auth.currentUser;
    if (!actual) throw new Error('No hay una sesión activa.');

    await reload(actual);
    setUsuario(actual);
    setNombre(actual.displayName);
    setCorreoVerificado(actual.emailVerified);
  }

  async function reenviarVerificacionCorreo() {
    const actual = auth.currentUser;
    if (!actual) throw new Error('No hay una sesión activa.');

    try {
      await sendEmailVerification(actual);
      setErrorEnvioVerificacion(null);
    } catch (error) {
      setErrorEnvioVerificacion(error);
      throw error;
    }
  }
 
  async function enviarCorreoRecuperacion(correo: string) {
    // Firebase envía un correo con un enlace a su página de restablecimiento.
    // Si el correo no existe, por la protección de enumeración NO lanza error:
    // por eso la pantalla muestra un mensaje neutro.
    await sendPasswordResetEmail(auth, correo.trim());
  }
 
  async function cambiarClave(claveActual: string, claveNueva: string) {
    const actual = auth.currentUser;
    if (!actual?.email) throw new Error('No hay una sesión activa.');
 
    // updatePassword es una operación sensible: Firebase la rechaza con
    // "auth/requires-recent-login" si la sesión no es reciente. Por eso
    // primero confirmamos la identidad con la contraseña actual.
    const credencial = EmailAuthProvider.credential(actual.email, claveActual);
    await reauthenticateWithCredential(actual, credencial);
    await updatePassword(actual, claveNueva);
  }
 
  async function cerrarSesion() {
    await signOut(auth);
  }
 
  return (
    <ContextoSesion
      value={{
        usuario,
        correoVerificado,
        nombre,
        cargando,
        iniciarSesion,
        registrarse,
        actualizarVerificacionCorreo,
        reenviarVerificacionCorreo,
        errorEnvioVerificacion,
        enviarCorreoRecuperacion,
        cambiarClave,
        cerrarSesion,
      }}>
      {children}
    </ContextoSesion>
  );
}
