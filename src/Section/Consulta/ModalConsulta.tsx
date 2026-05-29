import { useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
    AlertCircle,
    Building2,
    Calendar,
    ChevronDown,
    Droplets,
    FileText,
    Gauge,
    UserRound,
    Wallet,
    X,
} from 'lucide-react';
import type {
    AfiliadoJuridicoLectura,
    ConsultaResultado,
    LecturaConsulta,
    MedidorConsultaResultado,
} from '../../types/Consulta/Pagos';
import { getEstadoFacturaBadgeClass } from '../../utils/Consulta/estadoFacturaBadge';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    resultado: ConsultaResultado | null;
    onDownload: () => void;
    isDownloading: boolean;
};

const currencyFormatter = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const modalVariants: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
};

const sectionContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            delayChildren: 0.12,
            staggerChildren: 0.08,
        },
    },
};

const sectionItemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.28, ease: 'easeOut' },
    },
};

const isAfiliadoJuridico = (
    afiliado: LecturaConsulta['Afiliado']
): afiliado is AfiliadoJuridicoLectura => 'Razon_Social' in afiliado;

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
};

const formatCedulaJuridica = (cedula: string | undefined): string => {
    if (!cedula) return 'No disponible';
    const clean = cedula.replaceAll(/\D/g, '');
    if (clean.length !== 10) return cedula;
    return `${clean.substring(0, 1)}-${clean.substring(1, 4)}-${clean.substring(4)}`;
};

const getNombreTitularLectura = (lectura: LecturaConsulta) => {
    const afiliado = lectura?.Afiliado;
    if (!afiliado || typeof afiliado !== 'object') {
        return 'No disponible';
    }

    if (isAfiliadoJuridico(afiliado)) {
        return afiliado.Razon_Social;
    }

    if ('Nombre' in afiliado && 'Primer_Apellido' in afiliado) {
        return `${afiliado.Nombre} ${afiliado.Primer_Apellido}`;
    }

    return 'No disponible';
};

const getTitularDesdeMedidor = (medidor: MedidorConsultaResultado) => {
    // If it has 'Afiliado' directly (like the new por medidor response)
    if (medidor.Afiliado) {
        return {
            nombre: medidor.Afiliado.Nombre_Completo || medidor.Afiliado.Razon_Social || 'No disponible',
            documento: medidor.Afiliado.Identificacion || medidor.Afiliado.Cedula_Juridica || 'No disponible',
            esJuridico: !!medidor.Afiliado.Cedula_Juridica || !!medidor.Afiliado.Razon_Social,
        };
    }

    const primeraLectura = medidor.Historial_Lecturas?.[0];
    if (!primeraLectura) {
        return null;
    }

    if (isAfiliadoJuridico(primeraLectura.Afiliado)) {
        return {
            nombre: primeraLectura.Afiliado.Razon_Social,
            documento: primeraLectura.Afiliado.Cedula_Juridica,
            esJuridico: true,
        };
    }

    return {
        nombre: `${primeraLectura.Afiliado.Nombre} ${primeraLectura.Afiliado.Primer_Apellido}`,
        documento: primeraLectura.Afiliado.Identificacion,
        esJuridico: false,
    };
};

const hasMedidores = (value: unknown): value is { Medidores: MedidorConsultaResultado[] } => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const maybe = value as { Medidores?: unknown };
    return Array.isArray(maybe.Medidores);
};

const hasJuridicoAfiliado = (
    value: unknown
): value is { Afiliado: { Razon_Social: string; Cedula_Juridica: string } } => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const maybe = value as { Afiliado?: unknown };
    if (!maybe.Afiliado || typeof maybe.Afiliado !== 'object') {
        return false;
    }

    return 'Razon_Social' in maybe.Afiliado && 'Cedula_Juridica' in maybe.Afiliado;
};

const hasFisicoAfiliado = (
    value: unknown
): value is { Afiliado: { Nombre_Completo: string; Identificacion: string } } => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const maybe = value as { Afiliado?: unknown };
    if (!maybe.Afiliado || typeof maybe.Afiliado !== 'object') {
        return false;
    }

    return 'Nombre_Completo' in maybe.Afiliado && 'Identificacion' in maybe.Afiliado;
};

const isSingleMedidor = (value: unknown): value is MedidorConsultaResultado => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    return 'Historial_Lecturas' in value || 'Facturas' in value;
};

type TitularResumen = {
    nombreAfiliado: string;
    documentoAfiliado: string;
    esTitularJuridico: boolean;
};

const getMedidoresDesdeResultado = (resultado: ConsultaResultado): MedidorConsultaResultado[] => {
    if (resultado.tipo === 'medidor') {
        return [resultado.data];
    }

    if (hasMedidores(resultado.data)) {
        return resultado.data.Medidores;
    }

    if (isSingleMedidor(resultado.data)) {
        return [resultado.data];
    }

    return [];
};

const getTitularResumen = (
    resultado: ConsultaResultado,
    medidores: MedidorConsultaResultado[]
): TitularResumen => {
    const primerMedidor = medidores[0];
    const titularDesdePrimerMedidor = primerMedidor ? getTitularDesdeMedidor(primerMedidor) : null;

    if (resultado.tipo === 'fisica') {
        if (hasFisicoAfiliado(resultado.data)) {
            return {
                nombreAfiliado: resultado.data.Afiliado.Nombre_Completo,
                documentoAfiliado: resultado.data.Afiliado.Identificacion,
                esTitularJuridico: false,
            };
        }

        return {
            nombreAfiliado: titularDesdePrimerMedidor?.nombre ?? 'No disponible',
            documentoAfiliado: titularDesdePrimerMedidor?.documento ?? 'No disponible',
            esTitularJuridico: titularDesdePrimerMedidor?.esJuridico ?? false,
        };
    }

    if (resultado.tipo === 'juridica') {
        if (hasJuridicoAfiliado(resultado.data)) {
            return {
                nombreAfiliado: resultado.data.Afiliado.Razon_Social,
                documentoAfiliado: resultado.data.Afiliado.Cedula_Juridica,
                esTitularJuridico: true,
            };
        }

        return {
            nombreAfiliado: titularDesdePrimerMedidor?.nombre ?? 'No disponible',
            documentoAfiliado: titularDesdePrimerMedidor?.documento ?? 'No disponible',
            esTitularJuridico: titularDesdePrimerMedidor?.esJuridico ?? false,
        };
    }

    const titularMedidor = getTitularDesdeMedidor(resultado.data);
    return {
        nombreAfiliado: titularMedidor?.nombre ?? 'No disponible',
        documentoAfiliado: titularMedidor?.documento ?? 'No disponible',
        esTitularJuridico: titularMedidor?.esJuridico ?? false,
    };
};

const getSubtitulo = (tipo: ConsultaResultado['tipo']): string => {
    if (tipo === 'fisica') {
        return 'Afiliado fisico';
    }

    if (tipo === 'juridica') {
        return 'Afiliado juridico';
    }

    return 'Consulta por numero de medidor';
};

const renderMedidor = (medidor: MedidorConsultaResultado, index: number) => {
    const historial = medidor.Historial_Lecturas ?? [];
    const facturas = medidor.Facturas ?? [];
    const primeraLectura = historial[0];
    const afiliadoMedidor = medidor.Afiliado || primeraLectura?.Afiliado;
    const esJuridico = afiliadoMedidor && ('Razon_Social' in afiliadoMedidor || 'Cedula_Juridica' in afiliadoMedidor);

    let nombreAfiliadorMedidor = 'No disponible';
    let cedulaAfiliado: string | undefined;
    let tipoAfiliado = 'Nombre';

    if (esJuridico && afiliadoMedidor) {
        const afiliadoJur = afiliadoMedidor as any;
        nombreAfiliadorMedidor = afiliadoJur.Razon_Social || 'No disponible';
        cedulaAfiliado = afiliadoJur.Identificacion || afiliadoJur.Cedula_Juridica;
        tipoAfiliado = 'Razón Social';
    } else if (afiliadoMedidor) {
        const afiliadoFisico = afiliadoMedidor as any;
        nombreAfiliadorMedidor = afiliadoFisico.Nombre_Completo
            || (afiliadoFisico.Nombre ? `${afiliadoFisico.Nombre} ${afiliadoFisico.Primer_Apellido || ''}`.trim() : '')
            || 'No disponible';
        cedulaAfiliado = afiliadoFisico.Identificacion;
    }

    const cedulaLabel = esJuridico ? 'Cédula Jurídica' : 'Cédula Física';
    const cedulaFormateada = esJuridico ? formatCedulaJuridica(cedulaAfiliado) : cedulaAfiliado;

    return (
        <article
            key={`${medidor.Numero_Medidor}-${index}`}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm"
        >
            <div className="bg-blue-50 border-b border-gray-200 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Gauge className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Medidor #{medidor.Numero_Medidor}</h4>
                        <p className="text-xs text-gray-600 mt-1">Afiliado: {nombreAfiliadorMedidor}</p>
                    </div>
                </div>
                {medidor.BadRequestException ? (
                    <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Sin lectura
                    </span>
                ) : (
                    <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Con datos
                    </span>
                )}
            </div>

            {medidor.BadRequestException && (
                <div className="p-5 border-b border-gray-200">
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                        <p className="font-semibold mb-1">⚠️ {medidor.BadRequestException}</p>
                        <p className="text-xs text-red-600">
                            Verifique el numero de medidor o intente de nuevo en unos minutos.
                        </p>
                    </div>
                </div>
            )}

            {!medidor.BadRequestException && (
                <>
                    {afiliadoMedidor && (
                        <div className="border-b border-gray-200 px-5 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                        {tipoAfiliado}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">{nombreAfiliadorMedidor}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                        {cedulaLabel}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {cedulaFormateada}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                        Tipo Tarifa
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {primeraLectura?.Tipo_Tarifa?.Nombre_Tipo_Tarifa || 'No disponible'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {facturas.length > 0 && facturas.some(f => f.Total) && (
                        <div className="border-b border-gray-200 p-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="rounded-lg bg-blue-50 p-4">
                                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Total a pagar</p>
                                    <p className="text-lg font-bold text-blue-900">
                                        {formatCurrency(facturas.reduce((sum, f) => sum + (f.Total ? Number(f.Total.replace(/[^0-9.-]+/g,"")) : 0), 0))}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-cyan-50 p-4">
                                    <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wider mb-2">Consumo Total</p>
                                    <p className="text-lg font-bold text-cyan-900">
                                        {formatCurrency(facturas.reduce((sum, f) => sum + (f.Cargo_Consumo ? Number(f.Cargo_Consumo.replace(/[^0-9.-]+/g,"")) : 0), 0))}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-indigo-50 p-4">
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">Recurso Hídrico</p>
                                    <p className="text-lg font-bold text-indigo-900">
                                        {formatCurrency(facturas.reduce((sum, f) => sum + (f.Cargo_Recurso_Hidrico ? Number(f.Cargo_Recurso_Hidrico.replace(/[^0-9.-]+/g,"")) : 0), 0))}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-4">
                                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Cargo Fijo</p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {formatCurrency(facturas.reduce((sum, f) => sum + (f.Cargo_Fijo ? Number(f.Cargo_Fijo.replace(/[^0-9.-]+/g,"")) : 0), 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {historial.length > 0 && (
                        <div className="p-5">
                            <details className="group" open={true}>
                                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg bg-gray-50 px-4 py-3 font-medium text-gray-900 hover:bg-gray-100">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        Historial de lecturas ({historial.length})
                                    </span>
                                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                </summary>

                                <div className="mt-4 space-y-3">
                                    {historial.map((lectura) => (
                                        <div
                                            key={lectura.Id_Lectura}
                                            className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors"
                                        >
                                            <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
                                                <span className="inline-flex items-center gap-2 font-medium text-gray-900">
                                                    <Calendar className="h-4 w-4 text-blue-600" />
                                                    {formatDate(lectura.Fecha_Lectura)}
                                                </span>
                                                <span className="inline-flex items-center gap-2 font-medium text-gray-900">
                                                    <Droplets className="h-4 w-4 text-cyan-600" />
                                                    {lectura.Consumo_Calculado_M3} m³
                                                </span>
                                                <span className="inline-flex items-center gap-2 font-medium text-gray-900">
                                                    <Gauge className="h-4 w-4 text-indigo-600" />
                                                    {lectura.Tipo_Tarifa.Nombre_Tipo_Tarifa}
                                                </span>
                                            </div>
                                            <div className="border-t border-gray-100 pt-3 space-y-1 text-xs text-gray-600">
                                                <p>Medidor: <span className="font-semibold text-gray-900">#{lectura.Medidor?.Numero_Medidor ?? 'No disponible'}</span></p>
                                                <p>Estado: <span className="font-semibold text-gray-900">{lectura.Medidor?.Estado?.Nombre_Estado ?? 'No disponible'}</span></p>
                                                <p>Titular: <span className="font-semibold text-gray-900">{getNombreTitularLectura(lectura)}</span></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    )}

                    {facturas.length > 0 && (
                        <div className="p-5">
                            <details className="group" open={true}>
                                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg bg-gray-50 px-4 py-3 font-medium text-gray-900 hover:bg-gray-100">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        Facturas ({facturas.length})
                                    </span>
                                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                </summary>

                                <div className="mt-4 space-y-3">
                                    {facturas.map((factura) => (
                                        <div
                                            key={factura.Numero_Factura}
                                            className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                <span className="font-medium text-gray-900">{factura.Numero_Factura}</span>
                                                <span className={getEstadoFacturaBadgeClass(factura.Estado?.Nombre_Estado)}>
                                                    {factura.Estado?.Nombre_Estado || 'Desconocido'}
                                                </span>
                                            </div>

                                            <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Emisión</p>
                                                        <p className="text-sm font-medium text-gray-900">{formatDate(factura.Fecha_Emision)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Vencimiento</p>
                                                        <p className="text-sm font-medium text-gray-900">{formatDate(factura.Fecha_Vencimiento)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                                    <span className="font-semibold text-gray-900">Total:</span>
                                                    <span className="text-lg font-bold text-blue-600">{factura.Total || '0.00'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    )}
                </>
            )}
        </article>
    );
};

const ModalConsulta = ({ isOpen, onClose, resultado, onDownload, isDownloading }: Props) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    if (!isOpen || !resultado) {
        return null;
    }

    const medidores = getMedidoresDesdeResultado(resultado);
    const medidoresConError = medidores.filter((medidor) => !!medidor.BadRequestException).length;
    const totalAPagar = medidores.reduce((sum, medidor) => {
        const facturas = medidor.Facturas ?? [];
        const sumFacturas = facturas.reduce((fSum, f) => {
            const num = Number(f.Total?.replace(/[^0-9.-]+/g,""));
            return fSum + (isNaN(num) ? 0 : num);
        }, 0);
        return sum + sumFacturas;
    }, 0);
    const { nombreAfiliado, documentoAfiliado, esTitularJuridico } = getTitularResumen(resultado, medidores);
    const subtitulo = getSubtitulo(resultado.tipo);

    return (
        <dialog
            ref={dialogRef}
            open
            className="w-full h-full fixed inset-0 z-50 m-0 flex items-center justify-center border-0 bg-black/25 p-4 backdrop-blur-sm"
        >
            <motion.div
                className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 id="consulta-modal-title" className="text-xl font-bold text-gray-900">Resultado de consulta</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                {subtitulo}
                            </p>
                        </div>
                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
                    <motion.div className="space-y-6" variants={sectionContainerVariants}>
                        <motion.div
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                            variants={sectionItemVariants}
                        >
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <h3 className="text-base font-bold text-gray-900">Resumen</h3>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Titular
                                        </p>
                                        <p className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                                            {esTitularJuridico ? (
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                            ) : (
                                                <UserRound className="h-4 w-4 text-blue-600" />
                                            )}
                                            {nombreAfiliado}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Documento
                                        </p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {esTitularJuridico ? formatCedulaJuridica(documentoAfiliado) : documentoAfiliado}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Total de medidores
                                        </p>
                                        <p className="text-lg font-bold text-gray-900">{medidores.length}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Total a pagar
                                        </p>
                                        <p className="inline-flex items-center gap-1 text-lg font-bold text-blue-600">
                                            <Wallet className="h-4 w-4" />
                                            {formatCurrency(totalAPagar)}
                                        </p>
                                    </div>
                                </div>

                                {medidoresConError > 0 && (
                                    <p className="mt-4 inline-flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3" aria-live="polite">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        {medidoresConError} medidor(es) no tienen lectura disponible.
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                            variants={sectionItemVariants}
                        >
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <h3 className="text-base font-bold text-gray-900">Detalle de medidores</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {medidores.map((medidor, index) => renderMedidor(medidor, index))}
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                <footer className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
                    <button
                        onClick={onDownload}
                        disabled={isDownloading}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            isDownloading
                                ? 'bg-blue-300 text-white cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isDownloading ? 'Generando PDF...' : 'Descargar PDF'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </footer>
            </motion.div>
        </dialog>
    );
};

export default ModalConsulta;

