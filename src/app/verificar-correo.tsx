/**
 * Pantalla de espera hasta que Firebase confirme el correo de la cuenta.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Aviso } from '@/components/aviso';
import { Boton } from '@/components/boton';
import { PantallaHoja } from '@/components/pantalla-hoja';
import { colores, espacio, fuentes } from '@/constants/tema';
import { useSesion } from '@/context/sesion';
import { mensajeDeError } from '@/lib/errores-firebase';

export default function PantallaVerificarCorreo() {
  const {
    usuario,
    errorEnvioVerificacion,
    actualizarVerificacionCorreo,
    reenviarVerificacionCorreo,
    cerrarSesion,
  } = useSesion();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function manejarActualizacion() {
    setActualizando(true);
    setErrorGeneral(null);
    setMensajeExito(null);
    try {
      await actualizarVerificacionCorreo();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    } finally {
      setActualizando(false);
    }
  }

  async function manejarReenvio() {
    setReenviando(true);
    setErrorGeneral(null);
    setMensajeExito(null);
    try {
      await reenviarVerificacionCorreo();
      setMensajeExito('Enviamos otro enlace de verificación a tu correo.');
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    } finally {
      setReenviando(false);
    }
  }

  async function manejarSalida() {
    setSaliendo(true);
    try {
      await cerrarSesion();
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
      setSaliendo(false);
    }
  }

  return (
    <PantallaHoja
      titulo={'Verifica tu\ncorreo'}
      bajada="Antes de continuar, confirma tu dirección de correo electrónico.">
      {errorEnvioVerificacion ? (
        <Aviso tipo="error" mensaje={mensajeDeError(errorEnvioVerificacion)} />
      ) : null}
      {errorGeneral ? <Aviso tipo="error" mensaje={errorGeneral} /> : null}
      {mensajeExito ? <Aviso tipo="exito" mensaje={mensajeExito} /> : null}

      <View style={styles.instrucciones}>
        <Text style={styles.texto}>
          Enviamos un enlace de verificación a:
        </Text>
        <Text style={styles.correo}>{usuario?.email}</Text>
        <Text style={styles.texto}>
          Abre el mensaje y confirma tu correo. Después, vuelve aquí y toca
          «Ya verifiqué mi correo».
        </Text>
      </View>

      <Boton
        texto="Ya verifiqué mi correo"
        onPress={manejarActualizacion}
        cargando={actualizando}
      />
      <Boton
        variante="secundario"
        texto="Reenviar correo"
        onPress={manejarReenvio}
        cargando={reenviando}
      />
      <Boton
        variante="enlace"
        texto="Cerrar sesión"
        onPress={manejarSalida}
        cargando={saliendo}
      />
    </PantallaHoja>
  );
}

const styles = StyleSheet.create({
  instrucciones: {
    gap: espacio.s,
  },
  texto: {
    color: colores.lapiz,
    fontFamily: fuentes.texto,
    fontSize: 16,
    lineHeight: 23,
  },
  correo: {
    color: colores.grafito,
    fontFamily: fuentes.textoMedio,
    fontSize: 16,
  },
});
