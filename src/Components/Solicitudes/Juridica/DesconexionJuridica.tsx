import { useAlerts } from "../../../context/AlertContext";
import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { DesconexionJuridicaSchema, MotivoDesconexionValues } from "../../../Schemas/Solicitudes/Juridica/DesconexionMedidorJuridica";
import type { MotivoDesconexion } from "../../../Schemas/Solicitudes/Juridica/DesconexionMedidorJuridica";
import { useDesconexionJuridica, useMedidoresJuridica } from "../../../Hook/Solicitudes/HookJuridicas";
import { Loader2 } from "lucide-react";

type Props = {
    onClose: () => void;
};
const STORAGE_KEY = 'desconexionmedidor_juridica_temp';

// Función para formatear la cédula jurídica con guiones
function formatCedulaJuridica(value: string) {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted += digits[0];
    if (digits.length > 1) formatted += "-" + digits.slice(1, 4);
    if (digits.length > 4) formatted += "-" + digits.slice(4, 10);
    return formatted;
}

const DesconexionMedidorJuridica = ({ onClose }: Props) => {
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSending, setIsSending] = useState(false);
    const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
    const [motivoOtro, setMotivoOtro] = useState('');
    const mutation = useDesconexionJuridica();
    const { showError } = useAlerts();

    const [mostrarFormulario, setMostrarFormulario] = useState(true);
    const [cedulaJuridica, setCedulaJuridica] = useState('');
    const { medidores, isLoading: isMedidoresLoading } = useMedidoresJuridica(cedulaJuridica);

    const validateField = (fieldName: string, value: any, allValues?: any) => {
        const valuesToValidate = {
            ...allValues,
            [fieldName]: value,
        };

        const validation = DesconexionJuridicaSchema.safeParse(valuesToValidate);
        const fieldIssue = validation.success
            ? undefined
            : validation.error.errors.find((err) => err.path[0] === fieldName);

        setFieldErrors(prev => {
            const next = { ...prev };
            if (fieldIssue) next[fieldName] = fieldIssue.message;
            else delete next[fieldName];
            return next;
        });
    };

    const saveToSessionStorage = (values: any) => {
        try {
            const dataToSave = {
                Cedula_Juridica: values.Cedula_Juridica,
                Id_Medidor: values.Id_Medidor,
                Motivo_Desconexion: values.Motivo_Desconexion,
                Motivo_Desconexion_Seleccionado: values.Motivo_Desconexion_Seleccionado,
                Motivo_Desconexion_Otro: values.Motivo_Desconexion_Otro,
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error al guardar en sessionStorage:', error);
        }
    };

    const form = useForm({
        defaultValues: {
            Cedula_Juridica: '',
            Motivo_Desconexion: '' as MotivoDesconexion,
            Id_Medidor: undefined as number | undefined,
        },

        onSubmit: async ({ value }) => {
            setFormErrors({});

            // Validar que sea afiliado (tenga medidores activos)
            if (!cedulaJuridica || medidores.length === 0) {
                showError(
                    "No Eres Afiliado",
                    "No puedes solicitar la desconexión porque no eres un afiliado con medidores activos. Completa tu afiliación primero."
                );
                return;
            }

            try {
                const validation = DesconexionJuridicaSchema.safeParse(value);
                if (!validation.success) {
                    const fieldErrors: Record<string, string> = {};
                    validation.error.errors.forEach((err) => {
                        const field = err.path[0] as string;
                        fieldErrors[field] = err.message;
                    });
                    setFormErrors(fieldErrors);
                    return;
                }

                const formData = new FormData();
                Object.entries(value).forEach(([key, val]) => {
                    if (val !== undefined && val !== null && val !== "") {
                        formData.append(key, val.toString());
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
                console.log("🔍 ERROR EN SOLICITUD DE DESCONEXIÓN JURÍDICA:", error);
            } finally {
                setIsSending(false);
            }
        },
    });

    const commonClasses = 'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring focus:ring-blue-300';

    // Labels para los campos jurídicos
    const fieldLabels: { [key: string]: string } = {
        Cedula_Juridica: "Cédula Jurídica",
        Motivo_Desconexion: "Motivo de la Desconexión",
    };


    useEffect(() => {
        const savedData = sessionStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                Object.entries(parsed).forEach(([key, value]) => {
                    if (key === 'Cedula_Juridica' && typeof value === 'string') {
                        form.setFieldValue(key as any, value as any);
                        setCedulaJuridica(value.replace(/-/g, ''));
                    }

                    if (key === 'Id_Medidor') {
                        form.setFieldValue(key as any, value as any);
                    }
                });

                const savedMotivo = typeof parsed.Motivo_Desconexion === 'string' ? parsed.Motivo_Desconexion : '';
                const savedSeleccionado = typeof parsed.Motivo_Desconexion_Seleccionado === 'string'
                    ? parsed.Motivo_Desconexion_Seleccionado
                    : (MotivoDesconexionValues.includes(savedMotivo as any) ? savedMotivo : savedMotivo ? 'Otro' : '');
                const savedOtro = typeof parsed.Motivo_Desconexion_Otro === 'string'
                    ? parsed.Motivo_Desconexion_Otro
                    : (savedSeleccionado === 'Otro' ? savedMotivo : '');

                setMotivoSeleccionado(savedSeleccionado);
                setMotivoOtro(savedOtro);
                form.setFieldValue('Motivo_Desconexion', savedSeleccionado === 'Otro' ? savedOtro : savedMotivo);
            } catch (error) {
                console.error('Error al cargar datos guardados:', error);
            }
        }
    }, []);

    //strar alert cuando se verifica afiliación (igual que DesconexionFisica)
    useEffect(() => {
        if (
            cedulaJuridica &&
            !isMedidoresLoading &&
            cedulaJuridica.length >= 10 // cédula jurídica CR tiene 10 dígitos
        ) {
            if (medidores.length === 0) {
                showError(
                    "No Eres Afiliado",
                    "No puedes solicitar la desconexión porque no eres un afiliado con medidores activos. Completa tu afiliación primero."
                );
            }
        }
    }, [cedulaJuridica, medidores.length, isMedidoresLoading, showError]);

    if (!mostrarFormulario) return null;

    return (
        <div className="flex justify-center text-gray-800 p-3 sm:p-4 w-full">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="px-5 py-3 sm:px-6 sm:py-4 rounded-[24px] w-[95%] max-w-7xl mx-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100"
            >
                <h2 className="text-center text-xl font-semibold mb-6">Formulario de desconexión de medidor - Jurídica</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {/* Campo Cédula Jurídica */}
                    <form.Field name="Cedula_Juridica">
                        {(field) => (
                            <div className="mb-3 w-full">
                                <label className="block mb-1 font-medium">
                                    {fieldLabels["Cedula_Juridica"]}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={typeof field.state.value === "string" ? field.state.value : ""}
                                        onChange={(e) => {
                                            const formatted = formatCedulaJuridica(e.target.value);
                                            const cedula = formatted.replace(/-/g, '');
                                            field.handleChange(formatted);
                                            validateField("Cedula_Juridica", formatted, form.state.values);
                                            setCedulaJuridica(cedula);
                                            form.setFieldValue('Id_Medidor', undefined);
                                            saveToSessionStorage({ ...form.state.values, Cedula_Juridica: formatted });
                                        }}
                                        placeholder="3-XXX-XXXXXX"
                                        className={commonClasses}
                                        maxLength={255}
                                    />
                                </div>
                                {fieldErrors["Cedula_Juridica"] && (
                                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Cedula_Juridica"]}</span>
                                )}
                                {formErrors["Cedula_Juridica"] && !fieldErrors["Cedula_Juridica"] && (
                                    <span className="text-red-500 text-sm block mt-1">{formErrors["Cedula_Juridica"]}</span>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Campo Motivo de Desconexión */}
                    <form.Field name="Motivo_Desconexion">
                        {(field) => (
                            <div className="mb-3 w-full">
                                <label className="block mb-1 font-medium">
                                    {fieldLabels["Motivo_Desconexion"]}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={motivoSeleccionado}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setMotivoSeleccionado(value);

                                        if (value === 'Otro') {
                                            setMotivoOtro('');
                                            field.handleChange('');
                                            setFieldErrors(prev => {
                                                const next = { ...prev };
                                                delete next['Motivo_Desconexion'];
                                                return next;
                                            });
                                            saveToSessionStorage({
                                                ...form.state.values,
                                                Motivo_Desconexion: '',
                                                Motivo_Desconexion_Seleccionado: value,
                                                Motivo_Desconexion_Otro: '',
                                            });
                                            return;
                                        }

                                        field.handleChange(value);
                                        validateField("Motivo_Desconexion", value, form.state.values);
                                        saveToSessionStorage({
                                            ...form.state.values,
                                            Motivo_Desconexion: value,
                                            Motivo_Desconexion_Seleccionado: value,
                                            Motivo_Desconexion_Otro: '',
                                        });
                                    }}
                                    className={commonClasses}
                                >
                                    <option value="" disabled>Elige una opción</option>
                                    {MotivoDesconexionValues.map((motivo) => (
                                        <option key={motivo} value={motivo}>{motivo}</option>
                                    ))}
                                </select>
                                {motivoSeleccionado === 'Otro' && (
                                    <div className="mt-3">
                                        <label className="block mb-1 font-medium">
                                            Especifique el motivo <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={motivoOtro}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setMotivoOtro(value);
                                                field.handleChange(value);
                                                validateField("Motivo_Desconexion", value, form.state.values);
                                                saveToSessionStorage({
                                                    ...form.state.values,
                                                    Motivo_Desconexion: value,
                                                    Motivo_Desconexion_Seleccionado: 'Otro',
                                                    Motivo_Desconexion_Otro: value,
                                                });
                                            }}
                                            placeholder="Escriba el motivo de desconexión"
                                            maxLength={250}
                                            className={`${commonClasses} resize-none h-24 overflow-y-auto scrollbar-thumb-blue-600 scrollbar-thin scrollbar-track-blue-100`}
                                        />
                                    </div>
                                )}
                                {fieldErrors["Motivo_Desconexion"] && (
                                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Motivo_Desconexion"]}</span>
                                )}
                                {formErrors["Motivo_Desconexion"] && !fieldErrors["Motivo_Desconexion"] && (
                                    <span className="text-red-500 text-sm block mt-1">{formErrors["Motivo_Desconexion"]}</span>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Campo Id_Medidor */}
                    <form.Field name="Id_Medidor">
                        {(field) => (
                            <div className="mb-3 w-full">
                                <label className="block mb-1 font-medium">
                                    Medidor <span className="text-red-500">*</span>
                                </label>

                                <div className="relative">
                                    <select
                                        value={field.state.value != null ? String(field.state.value) : ""}
                                        onChange={(e) => {
                                            const nextValue = e.target.value ? Number(e.target.value) : undefined;
                                            field.handleChange(nextValue);
                                            validateField("Id_Medidor", nextValue, { ...form.state.values, Id_Medidor: nextValue });
                                            saveToSessionStorage({ ...form.state.values, Id_Medidor: nextValue });
                                        }}
                                        disabled={!cedulaJuridica || isMedidoresLoading}
                                        className={`${commonClasses} ${fieldErrors["Id_Medidor"] ? 'border-red-500 focus:ring-red-300' : ''} ${!cedulaJuridica ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Selecciona un medidor</option>
                                        {medidores && medidores.length > 0 ? (
                                            medidores.map((medidor) => (
                                                <option key={medidor.Id_Medidor} value={String(medidor.Id_Medidor ?? "")}>
                                                    {medidor.Numero_Medidor} {medidor.Estado ? `(${medidor.Estado})` : ""}
                                                </option>
                                            ))
                                        ) : (
                                            !isMedidoresLoading && cedulaJuridica && (
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

                                {fieldErrors["Id_Medidor"] && (
                                    <span className="text-red-500 text-sm block mt-1">{fieldErrors["Id_Medidor"]}</span>
                                )}
                                {formErrors["Id_Medidor"] && !fieldErrors["Id_Medidor"] && (
                                    <span className="text-red-500 text-sm block mt-1">{formErrors["Id_Medidor"]}</span>
                                )}
                            </div>
                        )}
                    </form.Field>
                </div>


                <div className="flex justify-start md:justify-end items-center w-full md:w-auto gap-3 mt-6">
                    <button
                        type="submit"
                        className="w-sm md:w-auto px-1 py-1.5 md:px-6 md:py-4 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md: text-lg font-medium"
                        disabled={
                            isSending ||
                            !form.state.values.Cedula_Juridica ||
                            !form.state.values.Id_Medidor ||
                            !(motivoSeleccionado === 'Otro' ? motivoOtro.trim() : form.state.values.Motivo_Desconexion) ||
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
                        className="w-xs md:w-auto px-1 py-1.5 md:px-6 md:py-4 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-60 text-sm md: text-lg disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>

                </div>
            </form>
        </div>
    );
};

export default DesconexionMedidorJuridica;