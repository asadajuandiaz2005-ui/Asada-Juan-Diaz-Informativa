export const TipoIdentificacion = {
  CEDULA: 'Cedula Nacional',
  DIMEX: 'Dimex',
  PASAPORTE: 'Pasaporte',
  CEDULA_JURIDICA: 'Cedula Juridica',
} as const;

export type TipoIdentificacion =
  (typeof TipoIdentificacion)[keyof typeof TipoIdentificacion];

export type EstadoRecibo = 'Pagado' | 'Pendiente' | 'Vencido';

export interface ConsultaFisicaDTO {
  Tipo_Identificacion?: TipoIdentificacion;
  Identificacion?: string;
  Numero_Medidor?: number;
}

export interface ConsultaJuridicaDTO {
  Cedula_Juridica?: string;
  Numero_Medidor?: number;
}

export interface GenerarFacturaConsultaDTO {
  Numero_Medidor?: number;
  Tipo_Identificacion?: TipoIdentificacion;
  Identificacion?: string;
  Cedula_Juridica?: string;
}

export interface ReciboConsulta {
  numeroRecibo: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monto: number;
  estado: EstadoRecibo;
  periodo: string;
}

export interface TipoTarifaLectura {
  Id_Tarifa_Lectura: number;
  Nombre_Tipo_Tarifa: string;
}

export interface EstadoMedidor {
  Id_Estado: number;
  Nombre_Estado: string;
}

export interface MedidorLectura {
  Id_Medidor: number;
  Numero_Medidor: number;
  Estado: EstadoMedidor;
}

export interface AfiliadoFisicoLectura {
  Id_Afiliado: number;
  Tipo_Entidad: number;
  Correo: string;
  Numero: string;
  Tipo_Identificacion: TipoIdentificacion;
  Identificacion: string;
  Nombre: string;
  Primer_Apellido: string;
  Segundo_Apellido: string;
}

export interface AfiliadoJuridicoLectura {
  Id_Afiliado: number;
  Tipo_Entidad: number;
  Correo: string;
  Numero: string;
  Cedula_Juridica: string;
  Razon_Social: string;
}

export type AfiliadoLectura = AfiliadoFisicoLectura | AfiliadoJuridicoLectura;

export interface LecturaConsulta {
  Id_Lectura: number;
  Tipo_Tarifa: TipoTarifaLectura;
  Consumo_Calculado_M3: number;
  Fecha_Lectura: string;
  Medidor: MedidorLectura;
  Afiliado: AfiliadoLectura;
}

export interface EstadoFactura {
  Id_Estado_Factura?: number;
  Id_Estado?: number;
  Nombre_Estado: string;
}

export interface Factura {
  Id_Factura?: number;
  Numero_Factura: string;
  Consumo_M3?: number;
  Cargo_Fijo: string;
  Cargo_Consumo: string;
  Cargo_Recurso_Hidrico: string;
  Otros_Cargos: string;
  Subtotal: string;
  Impuestos: string;
  Total: string;
  Fecha_Emision: string;
  Fecha_Vencimiento: string;
  Estado: EstadoFactura;
  Tipo_Tarifa_Aplicada?: string;
  Observaciones?: string;
}

export interface AfiliadoMedidor {
  Identificacion?: string;
  Nombre_Completo?: string;
  Cedula_Juridica?: string;
  Razon_Social?: string;
}

export interface MedidorConsultaResultado {
  Numero_Medidor?: number;
  Afiliado?: AfiliadoMedidor;
  BadRequestException?: string;
  Historial_Lecturas?: LecturaConsulta[];
  Total_Facturas?: number;
  Facturas?: Factura[];
}

export interface AfiliadoFisicoConsulta {
  Nombre_Completo?: string;
  Identificacion?: string;
}

export interface AfiliadoJuridicoConsulta {
  Razon_Social?: string;
  Cedula_Juridica?: string;
}

export interface ConsultaFisicaResponse {
  Afiliado: AfiliadoFisicoConsulta;
  Total_Medidores: number;
  Medidores: MedidorConsultaResultado[];
}

export interface ConsultaJuridicaResponse {
  Afiliado: AfiliadoJuridicoConsulta;
  Total_Medidores: number;
  Medidores: MedidorConsultaResultado[];
}

export interface ConsultaMedidorResponse {
  Afiliado: AfiliadoMedidor;
  Historial_Lecturas?: LecturaConsulta[];
  Facturas?: Factura[];
  Total_Facturas?: number;
  Numero_Medidor?: number;
}


export type ConsultaResultado =
  | { tipo: 'fisica'; data: ConsultaFisicaResponse }
  | { tipo: 'juridica'; data: ConsultaJuridicaResponse }
  | { tipo: 'medidor'; data: ConsultaMedidorResponse };
