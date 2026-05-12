import { z } from 'zod';

export const MotivoDesconexionValues = [
  'Morosidad',
  'Infracción al reglamento de prestación del servicio',
  'Conexión ilegal a terceros',
  'Solicitud expresa de retiro del servicio por parte del usuario (traslado fuera de Juan Díaz)',
] as const;

export type MotivoDesconexion = typeof MotivoDesconexionValues[number];

export const DesconexionJuridicaSchema = z.object({
  Cedula_Juridica: z.string()
    .trim()
    .min(1, 'La cédula jurídica no puede estar vacía'),

  Motivo_Desconexion: z.enum(MotivoDesconexionValues, {
    errorMap: () => ({ message: 'Debe seleccionar una causa de desconexión válida' }),
  }),

  Id_Medidor: z.number()
    .min(1, 'El Id del medidor no puede estar vacío')
    .gt(0, 'El Id del medidor debe ser mayor a 0')
    .positive('El Id del medidor debe ser positivo')
    .int('El Id del medidor debe ser un número entero'),
});

export type DesconexionJuridica = z.infer<typeof DesconexionJuridicaSchema>;