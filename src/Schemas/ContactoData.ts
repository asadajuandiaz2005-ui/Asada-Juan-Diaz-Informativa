import { z } from 'zod';


function getMaxLength(fieldName: string, fieldType: string): number {
  if (fieldType === 'textarea') return 299
  if (fieldName === 'Correo') return 100
  if (fieldName === 'Ubicacion') return 100
  if (fieldName.includes('Nombre') || fieldName.includes('Apellido')) return 50
  return 10 // Límite por defecto
}

export function getDynamicContactoSchema(campos: Record<string, any>) {
  const dynamicSchemaShape: Record<string, z.ZodTypeAny> = {};
  Object.entries(campos).forEach(([fieldName, fieldProps]) => {
    if (fieldProps.type === 'file') {
      dynamicSchemaShape[fieldName] = z.instanceof(File).optional();
    } else if (fieldProps.required) {
      const maxLength = getMaxLength(fieldName, fieldProps.type)
      let schema: z.ZodTypeAny = z
        .string()
        .min(1, `${fieldProps.label} es requerido`)
        .max(maxLength, `${fieldProps.label} no puede exceder ${maxLength+1} caracteres`)
      if (fieldName === 'Correo') {
        schema = (schema as z.ZodString).regex(
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          'El correo debe ser un email válido'
        );
      }
      dynamicSchemaShape[fieldName] = schema;
    } else {
      const maxLength = getMaxLength(fieldName, fieldProps.type)
      dynamicSchemaShape[fieldName] = z
        .string()
        .max(maxLength, `${fieldProps.label} no puede exceder ${maxLength+1} caracteres`)
        .optional();
    }
  });
  return z.object(dynamicSchemaShape);
}

export function getFieldSchemas(campos: Record<string, any>): Record<string, z.ZodTypeAny> {
  const fieldSchemas: Record<string, z.ZodTypeAny> = {};
  Object.entries(campos).forEach(([fieldName, fieldProps]) => {
    if (fieldProps.type === 'file') {
      fieldSchemas[fieldName] = z.instanceof(File).optional();
    } else if (fieldProps.required) {
      const maxLength = getMaxLength(fieldName, fieldProps.type)
      let schema: z.ZodTypeAny = z
        .string()
        .min(1, `${fieldProps.label} es requerido`)
        .max(maxLength, `${fieldProps.label} no puede exceder ${maxLength+1} caracteres`)
      if (fieldName === 'Correo') {
        schema = (schema as z.ZodString).regex(
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          'El correo debe ser un email válido'
        );
      }
      fieldSchemas[fieldName] = schema;
    } else {
      const maxLength = getMaxLength(fieldName, fieldProps.type)
      fieldSchemas[fieldName] = z
        .string()
        .max(maxLength, `${fieldProps.label} no puede exceder ${maxLength+1} caracteres`)
        .optional();
    }
  });
  return fieldSchemas;
}

export function validateSingleField(schema: z.ZodTypeAny, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
}