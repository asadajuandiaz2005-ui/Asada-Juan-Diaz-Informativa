export interface Imagen {
  Id_Imagen: number;
  Nombre_Imagen: string;
  Imagen: string; // URL pública (Dropbox o servidor)
  Visible?: boolean;
}

// Estado inicial vacío
export const ImagenInicialState: Imagen = {
  Id_Imagen: 0,
  Nombre_Imagen: "",
  Imagen: "",
  Visible: false,
};