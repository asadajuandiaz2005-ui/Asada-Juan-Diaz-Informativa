
import { z } from 'zod';


export const MedidorExtraJuridicaSchema = z.object({
  Cedula_Juridica: z.string()
    .length(12, 'La cédula jurídica debe tener 12 caracteres')
    .regex(/^3-\d{3}-\d{6}$/, 'La cédula jurídica debe tener el formato 3-XXX-XXXXXX'),

  Direccion_Exacta: z.string()
    .trim()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(255, 'La dirección no puede tener más de 255 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#-]+$/, 'La dirección solo puede contener letras, números, espacios y los caracteres .,-#')
    .transform((val) => val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase()),

  Planos_Terreno: z.instanceof(File, { message: "Debe subir el plano del terreno" })
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'].includes(file.type),
      'El plano del terreno debe ser JPG, JPEG, PNG, HEIC o PDF'
    ),

  Certificacion_Literal: z.instanceof(File, { message: "Debe subir la certificacion literal del terreno" })
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'].includes(file.type),
      'La certificacion literal del terreno debe ser JPG, JPEG, PNG, HEIC o PDF'
    ),
});

export type MedidorExtraJuridica = z.infer<typeof MedidorExtraJuridicaSchema>;