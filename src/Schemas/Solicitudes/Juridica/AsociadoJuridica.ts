import { z } from 'zod';

export const AsociadoJuridicaSchema = z.object({
  Cedula_Juridica: z.string()
    .min(1, 'La cédula jurídica es obligatoria')
    .max(14, 'La cédula jurídica no puede tener más de 15 caracteres'),



  Motivo_Solicitud: z.string()
    .min(10, 'El motivo de la solicitud debe tener al menos 10 caracteres'),
});