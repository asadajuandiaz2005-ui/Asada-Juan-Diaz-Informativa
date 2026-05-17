import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { AfiliacionSchema, TipoIdentificacionValues, type TipoIdentificacion } from "../../../Schemas/Solicitudes/Fisica/Afiliacion";
import { useAfiliacionFisica } from "../../../Hook/Solicitudes/HookFisicas";
import { useCedulaLookup } from "../../../Hook/Solicitudes/CedulaLookHook";
import PhoneInputComponent from "../PhoneInputComponent";
type Props = {
  onClose: () => void;
  initialView?: "afiliacion" | "medidor-extra";
};

const normalizePhoneNumber = (phone: string): string => {
  if (!phone.startsWith('+')) {
    throw new Error('El número debe incluir el código de país y comenzar con "+". Ejemplo: +5215512345678');
  }
  return phone;
};

const STORAGE_KEY = 'afiliacion_fisica_temp';

const FormularioAfiliacion = ({ onClose, initialView = "afiliacion" }: Props) => {
  const sanitizeNameInput = (value: string) => value.replace(/\d/g, "");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<{ [key: string]: File | null }>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const planosInputRef = useRef<HTMLInputElement>(null);
  const escrituraInputRef = useRef<HTMLInputElement>(null);
  const [_mostrarFormulario, setMostrarFormulario] = useState(true);
  // Estado para mostrar medidor extra
  const [showMedidorExtra, setShowMedidorExtra] = useState(initialView === "medidor-extra");
  const mutation = useAfiliacionFisica();

  const { lookup, isLoading: loadingCedula } = useCedulaLookup()

  // Validación en tiempo real de todos los campos
  const validateAllFields = (values: any) => {
    try {
      AfiliacionSchema.parse(values);
      setFieldErrors({});
    } catch (error: any) {
      const errors: Record<string, string> = {};
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          const field = err.path[0] as string;
          if (!errors[field]) {
            errors[field] = err.message;
          }
        });
      }
      setFieldErrors(errors);
    }
  };

  // Validación en tiempo real usando el schema
  const validateField = (fieldName: string, value: any, allValues?: any) => {
    const valuesToValidate = {
      ...allValues,
      [fieldName]: value,
    };

    const validation = AfiliacionSchema.safeParse(valuesToValidate);
    const fieldIssue = validation.success
      ? undefined
      : validation.error.errors.find((err) => err.path[0] === fieldName);

    setFieldErrors(prev => {
      const newErrors = { ...prev };
      if (fieldIssue) {
        newErrors[fieldName] = fieldIssue.message;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  };


  const handleIdentificacionInput = (value: string, tipoId: string): string => {
    switch (tipoId) {
      case "Cedula Nacional":
        // Solo números, máximo 9 dígitos
        return value.replace(/[^0-9]/g, '').slice(0, 9);
      case "Dimex":
        // Solo números, máximo 12 dígitos
        return value.replace(/[^0-9]/g, '').slice(0, 12);
      case "Pasaporte":
        // Alfanumérico, máximo 9 caracteres, convertir a mayúsculas
        return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9).toUpperCase();
      default:
        return value;
    }
  };

  // Función para cambio de Identificacion 
  const handleCedulaChange = async (cedula: string) => {
    const tipoId = form.state.values.Tipo_Identificacion;
    const identificacion = handleIdentificacionInput(cedula, tipoId);

    form.setFieldValue('Identificacion', identificacion);
    validateField('Identificacion', identificacion, form.state.values);

    // Limpiar errores
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors['Identificacion'];
      return newErrors;
    });

    // Buscar datos solo si es cédula nacional y tiene 9 dígitos
    if (tipoId === 'Cedula Nacional' && /^\d{9}$/.test(identificacion)) {
      const resultado = await lookup(identificacion);
      if (resultado) {
        // Autocompletar campos con los datos de la API
        form.setFieldValue('Nombre', resultado.firstname || '');
        form.setFieldValue('Apellido1', resultado.lastname1 || '');
        form.setFieldValue('Apellido2', resultado.lastname2 || '');
      }
    }
  };



  const getPlaceholder = (fieldName: string, tipoIdentificacion?: TipoIdentificacion) => {
    const placeholders: Record<string, string> = {
      Nombre: 'Juan Carlos',
      Apellido1: 'Pérez',
      Apellido2: 'González',
      Correo: 'ejemplo@correo.com',
      Numero_Telefono: '+50688887777',
      Direccion_Exacta: 'San José, del Banco Nacional 200m sur',
      Edad: '25',
    };
    if (fieldName === 'Identificacion') {
      switch (tipoIdentificacion) {
        case "Cedula Nacional": return '123456789';
        case "Dimex": return '123456789012';
        case "Pasaporte": return 'A1234567';
        default: return 'Seleccione tipo de identificación primero';
      }
    }
    return placeholders[fieldName] || '';
  };

  const saveToSessionStorage = (values: any) => {
    try {
      // Guardamos todo excepto los archivos
      const dataToSave = {
        Nombre: values.Nombre,
        Apellido1: values.Apellido1,
        Apellido2: values.Apellido2,
        Tipo_Identificacion: values.Tipo_Identificacion,
        Identificacion: values.Identificacion,
        Correo: values.Correo,
        Numero_Telefono: values.Numero_Telefono,
        Direccion_Exacta: values.Direccion_Exacta,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error al guardar en sessionStorage:', error);
    }
  };

  const form = useForm({
    defaultValues: {
      Nombre: '',
      Apellido1: '',
      Apellido2: '',
      Tipo_Identificacion: "Cedula Nacional",
      Identificacion: '',
      Correo: '',
      Direccion_Exacta: '',
      Numero_Telefono: '',
      Edad: undefined as number | undefined,
      Planos_Terreno: undefined as File | undefined,
      Certificacion_Literal: undefined as File | undefined,
      Motivo_Solicitud: '',
    },

    onSubmit: async ({ value }) => {
      setFormErrors({});
      try {
        const validation = AfiliacionSchema.safeParse(value);
        if (!validation.success) {
          const validationErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            const field = err.path[0] as string;
            if (!validationErrors[field]) {
              validationErrors[field] = err.message;
            }
          });
          setFormErrors(validationErrors);
          return;
        }

        const payload = {
          ...value,
          Numero_Telefono: normalizePhoneNumber(value.Numero_Telefono),
        };

        const formData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            if (val instanceof File) {
              formData.append(key, val);
            } else {
              formData.append(key, val.toString());
            }
          }
        });

        setIsSending(true);
        await mutation.createAfiliacion(formData);
        sessionStorage.removeItem(STORAGE_KEY);

        form.reset();
        setFormErrors({});
        setFieldErrors({});
        setArchivoSeleccionado({});
        setMostrarFormulario(false);

        onClose();
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('El número debe incluir el código de país')) {
          setFormErrors(prev => ({
            ...prev,
            Numero_Telefono: error.message,
          }));
        }
        console.log('Error al enviar formulario de afiliación:', error);
      } finally {
        setIsSending(false);
      }
    },
  });

  useEffect(() => {
    const shouldShow = initialView === "medidor-extra";
    if (showMedidorExtra !== shouldShow) {
      setShowMedidorExtra(shouldShow);
    }
  }, [initialView, showMedidorExtra]);
  useEffect(() => {
    const savedData = sessionStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Cargar los valores en el formulario
        Object.entries(parsed).forEach(([key, value]) => {
          if (key !== 'Planos_Terreno' && key !== 'Certificacion_Literal') {
            form.setFieldValue(key as any, value as any);
          }
        });
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
      }
    }
  }, []); //prueba 


  const commonClasses = 'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring focus:ring-blue-300';



  return (
    <div className="w-full text-gray-800">
      <div
        className="scrollbar-hide w-full rounded-[24px] bg-white px-4 py-3 sm:px-6 sm:py-4"
      >
        <h2 className="text-center text-xl font-semibold mb-4">Solicitud de Afiliación - Persona Física</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            validateAllFields(form.state.values);
            form.handleSubmit();
          }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            {/* Tipo de Identificación */}
            <div className="mb-3">
              <form.Field name="Tipo_Identificacion">
                {(field) => (
                  <div>
                    <label htmlFor="Tipo_Identificacion" className="block mb-1 font-medium">
                      Tipo de Identificación <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        validateField('Tipo_Identificacion', e.target.value, form.state.values);
                        form.setFieldValue('Identificacion', '');
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors['Identificacion'];
                          return newErrors;
                        });
                        // Limpiar error de identificación duplicada al cambiar tipo
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors['Identificacion'];
                          return newErrors;
                        });
                      }}
                      className={`${commonClasses} ${fieldErrors['Tipo_Identificacion'] ? 'border-blue-500 focus:ring-blue-300' : ''}`}
                    >
                      <option value="">Seleccione tipo de identificación</option>
                      {TipoIdentificacionValues.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                )}
              </form.Field>
            </div>

            {/* Número de Identificación */}
            <div className="mb-3">
              <form.Field name="Identificacion">
                {(field) => (
                  <div>
                    <label htmlFor="Identificacion" className="block mb-1 font-medium">
                      Número de Identificación <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={field.state.value}
                        onChange={(e) => handleCedulaChange(e.target.value)}
                        placeholder={getPlaceholder('Identificacion', form.state.values.Tipo_Identificacion as TipoIdentificacion)}
                        disabled={!form.state.values.Tipo_Identificacion || loadingCedula}
                        className={`${commonClasses} ${(fieldErrors['Identificacion'] || formErrors['Identificacion']) ? 'border-red-500 focus:ring-red-300' : ''} ${!form.state.values.Tipo_Identificacion ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        maxLength={
                          form.state.values.Tipo_Identificacion === 'Cedula Nacional' ? 9 :
                            form.state.values.Tipo_Identificacion === 'Dimex' ? 12 :
                              form.state.values.Tipo_Identificacion === 'Pasaporte' ? 9 : 20
                        }
                      />
                      {loadingCedula && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {loadingCedula && <p className="text-xs text-blue-600 mt-1">Buscando información...</p>}
                    {/* Mostrar error de validación de formato */}
                    {fieldErrors['Identificacion'] && (
                      <span className="text-red-500 text-sm block mt-1">
                        {fieldErrors['Identificacion']}
                      </span>
                    )}
                    {/* Mostrar error de identificación duplicada */}
                    {formErrors['Identificacion'] && !fieldErrors['Identificacion'] && (
                      <span className="text-red-500 text-sm block mt-1">
                        {formErrors['Identificacion']}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Nombre */}
            <form.Field name="Nombre">
              {(field) => (
                <div className="mb-3 w-full">
                  <label htmlFor="Nombre" className="block mb-1 font-medium">Nombre <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => {
                      const cleanValue = sanitizeNameInput(e.target.value);
                      field.handleChange(cleanValue);
                      validateField("Nombre", cleanValue, form.state.values);
                      saveToSessionStorage({ ...form.state.values, Nombre: cleanValue });
                    }}
                    placeholder={getPlaceholder("Nombre")}
                    maxLength={50}
                    className={commonClasses}
                  />
                  {fieldErrors["Nombre"] && (
                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Nombre"]}</span>
                  )}
                  {formErrors["Nombre"] && !fieldErrors["Nombre"] && (
                    <span className="text-red-500 text-sm block mt-1">{formErrors["Nombre"]}</span>
                  )}

                </div>
              )}
            </form.Field>
            {/* Primer Apellido */}
            <form.Field name="Apellido1">
              {(field) => (
                <div className="mb-3 w-full">
                  <label htmlFor="Apellido1" className="block mb-1 font-medium">Primer Apellido <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => {
                      const cleanValue = sanitizeNameInput(e.target.value);
                      field.handleChange(cleanValue);
                      validateField("Apellido1", cleanValue, form.state.values);
                      saveToSessionStorage({ ...form.state.values, Apellido1: cleanValue });
                    }}
                    placeholder={getPlaceholder("Apellido1")}
                    maxLength={50}
                    className={commonClasses}
                  />
                  {fieldErrors["Apellido1"] && (
                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Apellido1"]}</span>
                  )}
                  {formErrors["Apellido1"] && !fieldErrors["Apellido1"] && (
                    <span className="text-red-500 text-sm block mt-1">{formErrors["Apellido1"]}</span>
                  )}
                </div>
              )}
            </form.Field>
            {/* Segundo Apellido */}
            <form.Field name="Apellido2">
              {(field) => (
                <div className="mb-3 w-full">
                  <label htmlFor="Apellido2" className="block mb-1 font-medium">Segundo Apellido <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => {
                      const cleanValue = sanitizeNameInput(e.target.value);
                      field.handleChange(cleanValue);
                      validateField("Apellido2", cleanValue, form.state.values);
                      saveToSessionStorage({ ...form.state.values, Apellido2: cleanValue });
                    }}
                    placeholder={getPlaceholder("Apellido2")}
                    maxLength={50}
                    className={commonClasses}
                  />
                  {fieldErrors["Apellido2"] && (
                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Apellido2"]}</span>
                  )}
                  {formErrors["Apellido2"] && !fieldErrors["Apellido2"] && (
                    <span className="text-red-500 text-sm block mt-1">{formErrors["Apellido2"]}</span>
                  )}
                </div>
              )}
            </form.Field>
            {/* Dirección Exacta */}
            <form.Field name="Direccion_Exacta">
              {(field) => (
                <div className="mb-3 w-full">
                  <label htmlFor="Direccion_Exacta" className="block mb-1 font-medium">Dirección exacta <span className="text-red-500">*</span></label>
                  <textarea
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      validateField("Direccion_Exacta", e.target.value, form.state.values);
                      saveToSessionStorage({ ...form.state.values, Direccion_Exacta: e.target.value }); // ← NUEVO
                    }}
                    placeholder={getPlaceholder("Direccion_Exacta")}
                    maxLength={100}
                    className={commonClasses}
                  />
                  {fieldErrors["Direccion_Exacta"] && (
                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Direccion_Exacta"]}</span>
                  )}
                  {formErrors["Direccion_Exacta"] && !fieldErrors["Direccion_Exacta"] && (
                    <span className="text-red-500 text-sm block mt-1">{formErrors["Direccion_Exacta"]}</span>
                  )}
                </div>
              )}
            </form.Field>
            {/* Correo */}
            <form.Field name="Correo">
              {(field) => (
                <div className="mb-3 w-full">
                  <label htmlFor="Correo" className="block mb-1 font-medium">Correo electrónico <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      validateField("Correo", e.target.value, form.state.values);
                      saveToSessionStorage({ ...form.state.values, Correo: e.target.value }); // ← NUEVO
                    }}
                    placeholder={getPlaceholder("Correo")}
                    maxLength={100}
                    className={commonClasses}
                  />
                  {fieldErrors["Correo"] && (
                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Correo"]}</span>
                  )}
                  {formErrors["Correo"] && !fieldErrors["Correo"] && (
                    <span className="text-red-500 text-sm block mt-1">{formErrors["Correo"]}</span>
                  )}
                </div>
              )}
            </form.Field>
            {/* Teléfono internacional */}
            <form.Field name="Numero_Telefono">
              {(field) => (
                <div className="mb-3 w-full">
                  <label htmlFor="Numero_Telefono" className="block mb-1 font-medium">Número de teléfono <span className="text-red-500">*</span></label>
                  <PhoneInputComponent
                    value={field.state.value}
                    onChange={(value) => {
                      field.handleChange(value || "");
                      validateField("Numero_Telefono", value || "", form.state.values);
                      saveToSessionStorage({ ...form.state.values, Numero_Telefono: value || "" }); // ← NUEVO
                    }}
                    className={`${fieldErrors["Numero_Telefono"] ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors["Numero_Telefono"] && (
                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Numero_Telefono"]}</span>
                  )}
                  {formErrors["Numero_Telefono"] && !fieldErrors["Numero_Telefono"] && (
                    <span className="text-red-500 text-sm block mt-1">{formErrors["Numero_Telefono"]}</span>
                  )}
                </div>
              )}
            </form.Field>
            {/* Edad */}
            <form.Field name="Edad">
              {(field) => (
                <div className="mb-3 w-full">
                  <label htmlFor="Edad" className="block mb-1 font-medium">Edad <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={18}
                    value={field.state.value || ''}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                   
                      const edadValue = soloNumeros === '' ? undefined : Number(soloNumeros);
                      field.handleChange(edadValue);
                      validateField("Edad", edadValue, form.state.values);
                      saveToSessionStorage({ ...form.state.values, Edad: edadValue });
                    }}
                    placeholder={getPlaceholder("Edad")}
                    className={commonClasses}
                  />
                  {fieldErrors["Edad"] && (
                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Edad"]}</span>
                  )}
                  {formErrors["Edad"] && !fieldErrors["Edad"] && (
                    <span className="text-red-500 text-sm block mt-1">{formErrors["Edad"]}</span>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Archivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <form.Field name="Planos_Terreno">
              {(field) => {
                const archivoActual = archivoSeleccionado["Planos_Terreno"] ?? null;
                return (
                  <div className="w-full mb-2">
                    <label htmlFor="Planos_Terreno" className="block mb-1 font-medium">Planos del terreno <span className="text-red-500">*</span></label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.heic,.pdf"
                      disabled={!!archivoActual}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        field.handleChange(file ?? undefined);
                        setArchivoSeleccionado(prev => ({ ...prev, ["Planos_Terreno"]: file }));
                        validateField("Planos_Terreno", file);
                      }}
                      className="hidden"
                      id="Planos_Terreno"
                      ref={planosInputRef}
                      key={archivoActual ? archivoActual.name : 'planos'}
                    />
                    <label
                      htmlFor="Planos_Terreno"
                      className={`inline-block text-white bg-blue-600 px-3 py-1 rounded text-sm ${archivoActual ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#6FCAF1] cursor-pointer'}`}
                    >
                      {archivoActual ? 'Archivo cargado' : 'Subir archivo'}
                    </label>
                    {archivoActual && (
                      <div className="border rounded-md p-3 bg-gray-50 pb-2 mb-2 flex justify-between items-center">
                        <span>{archivoActual.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            field.handleChange(undefined);
                            setArchivoSeleccionado(prev => ({ ...prev, ["Planos_Terreno"]: null }));
                            setFieldErrors(prev => ({
                              ...prev,
                              ["Planos_Terreno"]: `Debe subir el plano del terreno`,
                            }));
                            if (planosInputRef.current) planosInputRef.current.value = "";
                          }}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                    {fieldErrors["Planos_Terreno"] && (
                      <span className="text-red-500 text-sm block mt-1">
                        {fieldErrors["Planos_Terreno"]}
                      </span>
                    )}
                    {formErrors["Planos_Terreno"] && !fieldErrors["Planos_Terreno"] && (
                      <span className="text-red-500 text-sm block mt-1">
                        {formErrors["Planos_Terreno"]}
                      </span>
                    )}
                  </div>
                );
              }}
            </form.Field>
            <form.Field name="Certificacion_Literal">
              {(field) => {
                const archivoActual = archivoSeleccionado["Certificacion_Literal"] ?? null;
                return (
                  <div className="w-full mb-2">
                    <label htmlFor="Certificacion_Literal" className="block mb-1 font-medium">Certificacion Literal del terreno <span className="text-red-500">*</span></label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.heic,.pdf"  // 🔥 CAMBIO: Agregué .pdf
                      disabled={!!archivoActual}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        field.handleChange(file ?? undefined);
                        setArchivoSeleccionado(prev => ({ ...prev, ["Certificacion_Literal"]: file }));
                        validateField("Certificacion_Literal", file);
                      }}
                      className="hidden"
                      id="Certificacion_Literal"
                      ref={escrituraInputRef}
                      key={archivoActual ? archivoActual.name : 'escritura'}
                    />
                    <label
                      htmlFor="Certificacion_Literal"
                      className={`inline-block text-white bg-blue-600 px-3 py-1 rounded text-sm ${archivoActual ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#6FCAF1] cursor-pointer'}`}
                    >
                      {archivoActual ? 'Archivo cargado' : 'Subir archivo'}
                    </label>
                    {archivoActual && (
                      <div className="border rounded-md p-3 bg-gray-50 pb-2 mb-2 flex justify-between items-center">
                        <span>{archivoActual.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            field.handleChange(undefined);
                            setArchivoSeleccionado(prev => ({ ...prev, ["Certificacion_Literal"]: null }));
                            setFieldErrors(prev => ({
                              ...prev,
                              ["Certificacion_Literal"]: `Debe subir la certificacion literal del terreno`,
                            }));
                            if (escrituraInputRef.current) escrituraInputRef.current.value = "";
                          }}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                    {fieldErrors["Certificacion_Literal"] && (
                      <span className="text-red-500 text-sm block mt-1">
                        {fieldErrors["Certificacion_Literal"]}
                      </span>
                    )}
                    {formErrors["Certificacion_Literal"] && !fieldErrors["Certificacion_Literal"] && (
                      <span className="text-red-500 text-sm block mt-1">
                        {formErrors["Certificacion_Literal"]}
                      </span>
                    )}
                  </div>
                );
              }}
            </form.Field>
          </div>


          <div className="flex justify-start md:justify-end items-center w-full md:w-auto gap-3 mt-6">
            <button
              type="submit"
              className="w-sm md:w-auto px-1 py-1.5 md:px-6 md:py-4 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md: text-lg font-medium"
              disabled={
                isSending ||
                Object.values(fieldErrors).some(Boolean) ||
                Object.values(formErrors).some(Boolean) ||
                [
                  form.state.values.Nombre,
                  form.state.values.Apellido1,
                  form.state.values.Apellido2,
                  form.state.values.Tipo_Identificacion,
                  form.state.values.Identificacion,
                  form.state.values.Correo,
                  form.state.values.Direccion_Exacta,
                  form.state.values.Numero_Telefono,
                  form.state.values.Edad,
                  form.state.values.Planos_Terreno,
                  form.state.values.Certificacion_Literal
                ].some(val => val === undefined || val === null || val === "")
              }
            >
              {isSending ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="w-xs md:w-auto px-1 py-1.5 md:px-6 md:py-4 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-60 text-sm md: text-lg disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div >
  );
};

export default FormularioAfiliacion;