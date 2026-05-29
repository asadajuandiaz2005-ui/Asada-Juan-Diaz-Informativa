import { z } from 'zod';

// Enum para tipo de identificación
export const TipoIdentificacionValues = [
  'Cedula Nacional',
  'Dimex',
  'Pasaporte',
] as const;
export type TipoIdentificacion = typeof TipoIdentificacionValues[number];

export const MotivoDesconexionValues = [
  'Cambio de domicilio',
  'Ya no requiere el servicio',
  'Cambio de propietario',
  'Casa desocupada',
  'Otro',
] as const;

export type MotivoDesconexion = string;

export const DesconexionMedidorSchema = z.object({
  Tipo_Identificacion: z.enum(TipoIdentificacionValues, {
    errorMap: () => ({ message: 'El tipo de identificación debe ser uno de los siguientes: Cedula Nacional, Dimex, Pasaporte' }),
  }),

  Identificacion: z.string()
    .trim()
    .min(1, 'La identificación no puede estar vacía'),

  Motivo_Desconexion: z.string()
    .trim()
    .min(1, 'Debe ingresar una causa de desconexión válida'),

  Id_Medidor: z.number()
    .min(1, 'El Id del medidor no puede estar vacío')
    .gt(0, 'El Id del medidor debe ser mayor a 0')
    .positive('El Id del medidor debe ser positivo')
    .int('El Id del medidor debe ser un número entero'),
});

export type DesconexionMedidor = z.infer<typeof DesconexionMedidorSchema>;