import { z } from 'zod';

export const MotivoDesconexionValues = [
  'Cambio de domicilio',
  'Ya no requiere el servicio',
  'Cambio de propietario',
  'Casa desocupada',
  'Otro',
] as const;

export type MotivoDesconexion = string;

export const DesconexionJuridicaSchema = z.object({
  Cedula_Juridica: z.string()
    .trim()
    .min(1, 'La cédula jurídica no puede estar vacía'),

  Motivo_Desconexion: z.string()
    .trim()
    .min(1, 'Debe ingresar una causa de desconexión válida'),

  Id_Medidor: z.number()
    .min(1, 'El Id del medidor no puede estar vacío')
    .gt(0, 'El Id del medidor debe ser mayor a 0')
    .positive('El Id del medidor debe ser positivo')
    .int('El Id del medidor debe ser un número entero'),
});

export type DesconexionJuridica = z.infer<typeof DesconexionJuridicaSchema>;