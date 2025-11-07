// Define los tipos de datos que usarán los gráficos
export type SeriesKey = string; // Hacemos la 'key' un string genérico

export interface SeriesDescriptor {
  key: SeriesKey;
  label: string;
  color: string;
}

export interface ChartDatum {
  name: string;
  [key: string]: string | number;
}

// Paleta de colores por defecto
export const defaultSeriesPalette = [
  "#1A9850", // Verde Fuerte
  "#91CF60", // Verde Claro
  "#FEE08B", // Amarillo
  "#D73027", // Rojo
  "#4575B4", // Azul
  "#313695", // Azul Oscuro
  "#A50026", // Rojo Oscuro
  "#FDAE61", // Naranja
  "#ABD9E9", // Celeste
];
