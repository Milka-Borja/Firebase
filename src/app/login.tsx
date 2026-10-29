/**
 * Pantalla de inicio de sesión.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
 
import { Aviso } from '@/components/aviso';
import { Boton } from '@/components/boton';
import { CampoTexto } from '@/components/campo-texto';
import { PantallaHoja } from '@/components/pantalla-hoja';
import { colores, espacio, fuentes } from '@/constants/tema';
import { useSesion } from '@/context/sesion';
import { mensajeDeError } from '@/lib/errores-firebase';
import { validarCorreo } from '@/lib/validaciones';
 
export default function PantallaLogin() {
  const { iniciarSesion } = useSesion();
 
  // Estado del formulario: un useState por campo es lo más claro para empezar.
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<{ correo?: string | null; clave?: string | null }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
 
  async function manejarIngreso() {
    // 1. Validamos en el teléfono antes de llamar a Firebase.
    const nuevosErrores = {
      correo: validarCorreo(correo),
      clave: clave ? null : 'Escribe tu contraseña.',
    };
    setErrores(nuevosErrores);
    setErrorGeneral(null);
    if (nuevosErrores.correo || nuevosErrores.clave) return;
 
    // 2. Llamamos a Firebase. Si funciona, el layout raíz cambia de pantalla solo.
    setEnviando(true);
    try {
      await iniciarSesion(correo, clave);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
      // finally no sirve aquí para todo: si el ingreso funciona, esta pantalla
      // se desmonta y no debemos actualizar su estado.
      setEnviando(false);
    }
  }
 
  return (
    <PantallaHoja
      antetitulo="ESFOT, Escuela Politécnica Nacional"
      titulo={'Inicia\nsesión'}
      bajada="Ingresa con el correo y la contraseña de tu cuenta.">
      {errorGeneral ? <Aviso tipo="error" mensaje={errorGeneral} /> : null}
 
      <CampoTexto
        etiqueta="Correo"
        placeholder="nombre.apellido@epn.edu.ec"
        value={correo}
        onChangeText={setCorreo}
        error={errores.correo}
        keyboardType="email-address"
        textContentType="emailAddress" // permite autocompletar en iOS
        autoComplete="email" // y en Android
        returnKeyType="next"
      />
 
      <CampoTexto
        etiqueta="Contraseña"
        value={clave}
        onChangeText={setClave}
        error={errores.clave}
        esClave
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={manejarIngreso} // "Enter" en el teclado también envía
      />
 
      <View style={styles.olvido}>
        <Boton
          variante="enlace"
          texto="¿Olvidaste tu contraseña?"
          // Pasamos el correo escrito para no obligar a escribirlo otra vez.
          onPress={() => router.push({ pathname: '/recuperar', params: { correo } })}
        />
      </View>
 
      <Boton texto="Iniciar sesión" onPress={manejarIngreso} cargando={enviando} />
 
      <View style={styles.pie}>
        <Text style={styles.pieTexto}>¿Aún no tienes cuenta?</Text>
        <Boton variante="enlace" texto="Crea una" onPress={() => router.push('/registro')} />
      </View>
    </PantallaHoja>
  );
}
 
const styles = StyleSheet.create({
  olvido: {
    alignItems: 'flex-end',
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: espacio.s - 2,
    marginTop: espacio.m,
  },
  pieTexto: {
    color: colores.lapiz,
    fontFamily: fuentes.texto,
    fontSize: 15,
  },
});
