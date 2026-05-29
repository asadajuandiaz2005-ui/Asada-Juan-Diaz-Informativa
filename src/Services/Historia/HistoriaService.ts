import apiAuth from "../../api/apiAuth";
import type { Imagen } from "../../models/Historia/Historia";


export const getImagenes = async (): Promise<Imagen[]> => {
  const response = await apiAuth.get<Imagen[]>("/imagenes");
  // Solo mostrar imágenes visibles en el sitio informativo
  return response.data.filter((imagen) => imagen.Visible);
};

/*
export const getAllHistoria = async (): Promise<Historia[]> => {
  const response = await apiAuth.get<Historia[]>("/historia/all");
  return response.data;
}; 
*/