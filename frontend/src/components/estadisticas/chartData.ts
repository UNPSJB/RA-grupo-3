export type ChartDatum = {
  name: string;
} & Record<string, number | string>;

export interface SeriesDescriptor {
  key: string;
  label: string;
  color: string;
}

export const defaultSeriesPalette: string[] = [
  '#1A9850',
  '#91CF60',
  '#FEE08B',
  '#D73027',
  '#3182BD',
  '#9ECAE1',
  '#FF7F0E',
  '#FDB863',
  '#A6CEE3',
  '#B2DF8A',
];
