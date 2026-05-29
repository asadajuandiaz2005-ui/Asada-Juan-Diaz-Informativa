export interface MedidorExtraJuridica {
  Cedula_Juridica: string;
  Direccion_Exacta: string;

  Planos_Terreno?: File | string;
  Certificacion_Literal?: File | string;
}

export const MedidorExtraJuridicaInicialState: MedidorExtraJuridica = {
  Cedula_Juridica: '',
  Direccion_Exacta: '',

};