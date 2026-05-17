import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Tipo para TipoIdentificacion - Debe coincidir con el backend
export const TipoIdentificacionValues = [
  'Cedula Nacional',
  'Dimex',
  'Pasaporte',
] as const;
export type TipoIdentificacion = typeof TipoIdentificacionValues[number];

// Validaciones adaptadas del backend DTO
export const AfiliacionSchema = z.object({
  // Validaciones de CreateSolicitudFisicaDto - COMUNES
  Tipo_Identificacion: z.enum(TipoIdentificacionValues, {
    errorMap: () => ({ message: 'El tipo de identificación debe ser uno de los siguientes: Cedula Nacional, Dimex, Pasaporte' }),
  }),

  Identificacion: z.string()
    .min(1, 'La identificación no puede estar vacía')
    .refine(val => val.trim().length > 0, 'La identificación no puede estar vacía')
    .transform(val => val.trim()),

  Nombre: z.string()
    .min(1, 'El nombre no puede estar vacío')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(49, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' })
    .refine(val => val.trim().length > 0, 'El nombre no puede estar vacío')
    .transform(val => val.trim()),

  Apellido1: z.string()
    .min(1, 'El primer apellido no puede estar vacío')
    .min(2, 'El primer apellido debe tener al menos 2 caracteres')
    .max(49, 'El primer apellido no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El primer apellido solo puede contener letras y espacios' })
    .refine(val => val.trim().length > 0, 'El primer apellido no puede estar vacío')
    .transform(val => val.trim()),

  Apellido2: z.string()
    .min(1, 'El segundo apellido no puede estar vacío')
    .min(2, 'El segundo apellido debe tener al menos 2 caracteres')
    .max(49, 'El segundo apellido no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, { message: 'El segundo apellido solo puede contener letras y espacios' })
    .transform(val => val.trim()),

  Correo: z.string()
    .min(1, 'El correo no puede estar vacío')
    .max(99, 'El correo no puede tener más de 100 caracteres')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'El formato del correo electrónico no es válido' })
    .transform(val => val.trim().toLowerCase()),

  Numero_Telefono: z.string()
    .min(1, 'El número de teléfono no puede estar vacío')
    .refine((phone) => {
      const phoneNumber = parsePhoneNumberFromString(phone || "");
      return !!phoneNumber && phoneNumber.isValid();
    }, {
      message: 'Debe ingresar un número de teléfono válido'
    })
    .transform((phone) => {
      const phoneNumber = parsePhoneNumberFromString(phone || "");
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error('Debe ingresar un número de teléfono válido');
      }
      return phoneNumber.format('E.164');
    }),

  // Validaciones específicas de CreateSolicitudAfiliacionFisicaDto
  Direccion_Exacta: z.string()
    .min(1, 'La dirección no puede estar vacía')
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(254, 'La dirección no puede tener más de 255 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#-]+$/, { message: 'La dirección solo puede contener letras, números, espacios y los caracteres .,-#' })
    .refine(val => val.trim().length > 0, 'La dirección no puede estar vacía')
    .transform(val => val.trim()),

  Edad: z.coerce.number({
    invalid_type_error: 'La edad debe ser un número entero',
  })
    .int('La edad debe ser un numero entero')
    .min(18, 'La edad mínima para realizar la solicitud es 18 años')
    .max(90, 'La edad máxima permitida es 90 años')
    .positive('La edad debe ser un número positivo'),

  // Validaciones de archivos (específicas del frontend)
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
}).refine(
  (data) => {
    // Validación específica según tipo de identificación
    const identificacion = data.Identificacion.trim();

    switch (data.Tipo_Identificacion) {
      case "Cedula Nacional":
        // Exactamente 9 dígitos, solo números
        return /^\d{9}$/.test(identificacion);
      case "Dimex":
        // Máximo 12 dígitos, solo números
        return /^\d{1,12}$/.test(identificacion);
      case "Pasaporte":
        // Máximo 9 caracteres alfanuméricos (letras y números)
        return /^[A-Z0-9]{1,9}$/i.test(identificacion);
      default:
        return false;
    }
  },
  (data) => {
    // Mensaje de error específico según el tipo
    let message = 'Formato de identificación inválido';

    switch (data.Tipo_Identificacion) {
      case "Cedula Nacional":
        message = 'La cédula debe tener exactamente 9 dígitos numéricos';
        break;
      case "Dimex":
        message = 'El DIMEX debe tener entre 1 y 12 dígitos numéricos';
        break;
      case "Pasaporte":
        message = 'El pasaporte debe tener entre 1 y 9 caracteres alfanuméricos';
        break;
    }

    return {
      message,
      path: ["Identificacion"],
    };
  }
);

export type FormularioAfiliacionData = z.infer<typeof AfiliacionSchema>;
export type Afiliacion = z.infer<typeof AfiliacionSchema>;