import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const AfiliacionJuridicaSchema = z.object({
  Cedula_Juridica: z.string()
    .length(12, 'La cédula jurídica debe tener 12 caracteres')
    .regex(/^3-\d{3}-\d{6}$/, 'La cédula jurídica debe tener el formato 3-XXX-XXXXXX'),

  Razon_Social: z.string()
      
    .min(2, 'La razón social debe tener al menos 2 caracteres')
    .max(255, 'La razón social no puede tener más de 255 caracteres'),

  Correo: z.string()
    .min(1, 'El correo electrónico es obligatorio')
    .max(255, 'El correo no puede tener más de 255 caracteres')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'El formato del correo electrónico no es válido' }),

  Numero_Telefono: z.string()
    .min(1, 'El número de teléfono es obligatorio')
    .refine((phone) => {
      const phoneNumber = parsePhoneNumberFromString(phone || "");
      return !!phoneNumber && phoneNumber.isValid();
    }, {
      message: 'Debe ingresar un número de teléfono válido'
    }),

  Direccion_Exacta: z.string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(254, 'La dirección no puede tener más de 255 caracteres'),

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