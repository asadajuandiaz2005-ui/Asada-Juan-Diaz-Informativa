import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { useAlerts } from '../../../context/AlertContext';
import { DesconexionMedidorSchema, MotivoDesconexionValues, TipoIdentificacionValues, type MotivoDesconexion, type TipoIdentificacion } from "../../../Schemas/Solicitudes/Fisica/DesconexionMedidor";
import { useDesconexionFisica, useMedidores } from "../../../Hook/Solicitudes/HookFisicas";
import { Loader2 } from "lucide-react";

type Props = {
  onClose: () => void;
};
const STORAGE_KEY = 'desconexion_fisica_temp';

const FormularioDesconexionMedidor = ({ onClose }: Props) => {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [identificacion, setIdentificacion] = useState('');
  const { showError } = useAlerts();
  const mutation = useDesconexionFisica();
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const { medidores, isLoading: isMedidoresLoading } = useMedidores(identificacion);

  // Validación en tiempo real usando el schema
  const validateField = (fieldName: string, value: any, allValues?: any) => {
    const valuesToValidate = {
      ...allValues,
      [fieldName]: value,
    };

    const validation = DesconexionMedidorSchema.safeParse(valuesToValidate);
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
        return value.replace(/[^0-9]/g, '').slice(0, 9);
      case "Dimex":
        return value.replace(/[^0-9]/g, '').slice(0, 12);
      case "Pasaporte":
        return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9).toUpperCase();
      default:
        return value;
    }
  };

  const handleCedulaChange = (cedula: string) => {
    const tipoId = form.state.values.Tipo_Identificacion;
    const identificacionProcesada = handleIdentificacionInput(cedula, tipoId);

    form.setFieldValue('Identificacion', identificacionProcesada);
    setIdentificacion(identificacionProcesada);
    validateField('Identificacion', identificacionProcesada, form.state.values);

    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors['Identificacion'];
      return newErrors;
    });
  };


  const getPlaceholder = (fieldName: string, tipoIdentificacion?: TipoIdentificacion) => {
    if (fieldName === 'Identificacion') {
      switch (tipoIdentificacion) {
        case "Cedula Nacional": return '123456789';
        case "Dimex": return '123456789012';
        case "Pasaporte": return 'A1234567';
        default: return 'Seleccione tipo de identificación primero';
      }
    }
    return '';
  };
  const saveToSessionStorage = (values: any) => {
    try {
      const dataToSave = {
        Tipo_Identificacion: values.Tipo_Identificacion,
        Identificacion: values.Identificacion,
        Id_Medidor: values.Id_Medidor,
        Motivo_Desconexion: values.Motivo_Desconexion,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error al guardar en sessionStorage:', error);
    }
  };
  const form = useForm({
    defaultValues: {
      Tipo_Identificacion: "Cedula Nacional",
      Identificacion: "",
      Motivo_Desconexion: "" as MotivoDesconexion,
      Id_Medidor: undefined as number | undefined,
    },

    onSubmit: async ({ value }) => {
      setFormErrors({});
      // Validar que sea afiliado (tenga medidores activos)
      if (!identificacion || medidores.length === 0) {
        showError(
          "No Eres Afiliado",
          "No puedes solicitar la desconexión porque no eres un afiliado con medidores activos. Completa tu afiliación primero."
        );
        // No mostrar error en el formulario, solo alerta global
        return;
      }
      try {
        const payload = {
          ...value,
        };

        const validation = DesconexionMedidorSchema.safeParse(value);
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

        const formData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            formData.append(key, String(val));
          }
        });

        setIsSending(true);
        await mutation.createDesconexion(formData);
        sessionStorage.removeItem(STORAGE_KEY);

        form.reset();
        setFieldErrors({});
        setMostrarFormulario(false);
        onClose();
      } catch (error: any) {
        // Error handling
      } finally {
        setIsSending(false);
      }
    },
  });
  // Mostrar alert cuando se verifica afiliación (igual que MedidorExtraFisico)
  useEffect(() => {
    if (
      identificacion &&
      !isMedidoresLoading &&
      identificacion.length >= 9
    ) {
      if (medidores.length > 0) {
        // Si es afiliado, podrías mostrar un success opcional
        // showSuccess(
        //   "Eres un afiliado puedes seguir con la solicitud",
        //   `. Medidores actuales: ${medidores.length}`
        // );
      } else {
        showError(
          "No Eres Afiliado",
          "No puedes solicitar la desconexión porque no eres un afiliado con medidores activos. Completa tu afiliación primero."
        );
      }
    }
  }, [identificacion, medidores.length, isMedidoresLoading, showError]);


  useEffect(() => {
    const savedData = sessionStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Cargar los valores en el formulario
        Object.entries(parsed).forEach(([key, value]) => {
          form.setFieldValue(key as any, value as any);
        });
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
      }
    }
  }, []);


  // El mensaje ahora se muestra como alert global, no local

  if (!mostrarFormulario) return null;

  const commonClasses = 'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring focus:ring-blue-300';

  return (
    <div className="flex justify-center text-gray-800 p-3 sm:p-4 w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="bg-white shadow-lg px-5 py-3 sm:px-6 sm:py-4 rounded-[24px] w-[95%] max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100"
      >
        <h2 className="text-center text-xl font-semibold mb-6">Formulario de desconexión de medidor</h2>

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
                      onChange={(e) => {
                        handleCedulaChange(e.target.value);
                        saveToSessionStorage({ ...form.state.values, Identificacion: e.target.value });
                      }}
                      placeholder={getPlaceholder('Identificacion', form.state.values.Tipo_Identificacion as TipoIdentificacion)}
                      disabled={!form.state.values.Tipo_Identificacion}
                      className={`${commonClasses} ${fieldErrors['Identificacion'] ? 'border-red-500 focus:ring-red-300' : ''} ${!form.state.values.Tipo_Identificacion ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      maxLength={
                        form.state.values.Tipo_Identificacion === 'Cedula Nacional' ? 9 :
                          form.state.values.Tipo_Identificacion === 'Dimex' ? 12 :
                            form.state.values.Tipo_Identificacion === 'Pasaporte' ? 9 : 20
                      }
                    />
                  </div>
                  {/* muestra errores de identificación */}
                  {fieldErrors['Identificacion'] && (
                    <span className="text-red-500 text-sm block mt-1">
                      {fieldErrors['Identificacion']}
                    </span>
                  )}
                  {formErrors['Identificacion'] && !fieldErrors['Identificacion'] && (
                    <span className="text-red-500 text-sm block mt-1">
                      {formErrors['Identificacion']}
                    </span>
                  )}
                  {/* mensaje si no es afiliado eliminado, solo alert global */}
                </div>
              )}
            </form.Field>
          </div>

          {/* Id del Medidor */}
          <div className="mb-3">
            <form.Field name="Id_Medidor">
              {(field) => (
                <div>
                  <label htmlFor="Id_Medidor" className="block mb-1 font-medium">
                    Medidor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={field.state.value || ""}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        field.handleChange(value);
                        validateField("Id_Medidor", value, { ...form.state.values, Id_Medidor: value });
                      }}
                      disabled={!form.state.values.Identificacion || isMedidoresLoading}
                      className={`${commonClasses} ${fieldErrors['Id_Medidor'] ? 'border-red-500 focus:ring-red-300' : ''} ${!form.state.values.Identificacion ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Selecciona un medidor</option>
                      {medidores && medidores.length > 0 ? (
                        medidores.map((medidor) => (
                          <option key={medidor.Id_Medidor} value={medidor.Id_Medidor || ""}>
                            {medidor.Numero_Medidor} {medidor.Estado ? `(${medidor.Estado})` : ""}
                          </option>
                        ))
                      ) : (
                        !isMedidoresLoading && form.state.values.Identificacion && (
                          <option disabled>No se encontraron medidores</option>
                        )
                      )}
                    </select>
                    {isMedidoresLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  {fieldErrors['Id_Medidor'] && (
                    <span className="text-red-500 text-sm block mt-1">
                      {fieldErrors['Id_Medidor']}
                    </span>
                  )}
                  {formErrors['Id_Medidor'] && !fieldErrors['Id_Medidor'] && (
                    <span className="text-red-500 text-sm block mt-1">
                      {formErrors['Id_Medidor']}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Motivo de Solicitud */}
          <form.Field name="Motivo_Desconexion">
            {(field) => (
              <div className="mb-3 w-full md:col-span-2">
                <label htmlFor="Motivo_Desconexion" className="block mb-1 font-medium">Motivo de desconexión <span className="text-red-500">*</span></label>
                <select
                  value={field.state.value}
                  onChange={(e) => {
                    const motivoSeleccionado = e.target.value as MotivoDesconexion;
                    field.handleChange(motivoSeleccionado);
                    validateField("Motivo_Desconexion", motivoSeleccionado, form.state.values);
                    saveToSessionStorage({ ...form.state.values, Motivo_Desconexion: motivoSeleccionado });
                  }}
                  className={commonClasses}
                >
                  <option value="" disabled selected>Elije una opcion</option>
                  {MotivoDesconexionValues.map((motivo) => (
                    <option key={motivo} value={motivo}>{motivo}</option>
                  ))}
                </select>
                {fieldErrors["Motivo_Desconexion"] && (
                  <span className="text-red-500 text-sm block mt-1">{fieldErrors["Motivo_Desconexion"]}</span>
                )}
                {formErrors["Motivo_Desconexion"] && !fieldErrors["Motivo_Desconexion"] && (
                  <span className="text-red-500 text-sm block mt-1">{formErrors["Motivo_Desconexion"]}</span>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <div className="flex justify-center gap-4 mt-6 ml-50">

          {/* Botones */}

          <div className="flex justify-end items-center gap-3 mt-8">
            <button
              type="submit"
              className="w-[140px] py-2 rounded transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              disabled={
                isSending ||
                !form.state.values.Tipo_Identificacion ||
                !form.state.values.Identificacion ||
                !form.state.values.Id_Medidor ||
                !form.state.values.Motivo_Desconexion ||
                Object.values(fieldErrors).some(Boolean) ||
                Object.values(formErrors).some(Boolean)
              }
            >
              {isSending ? 'Enviando...' : 'Enviar Solicitud'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default FormularioDesconexionMedidor;