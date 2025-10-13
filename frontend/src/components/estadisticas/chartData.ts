export type SeriesKey = 'muyBueno' | 'bueno' | 'malo' | 'muyMalo';

export interface SeriesDescriptor {
  key: SeriesKey;
  label: string;
  color: string;
}

export const responseSeries: SeriesDescriptor[] = [
  { key: 'muyBueno', label: 'Muy bueno', color: '#1A9850' },
  { key: 'bueno', label: 'Bueno', color: '#91CF60' },
  { key: 'malo', label: 'Malo', color: '#FEE08B' },
  { key: 'muyMalo', label: 'Muy malo', color: '#D73027' },
];

export type ChartDatum = {
  name: string;
} & Record<SeriesKey, number>;

export const chartData: ChartDatum[] = [
  {
    name: 'A',
    bueno: 10,
    muyBueno: 0,
    malo: 1,
    muyMalo: 10,
  },
  {
    name: 'B',
    bueno: 5,
    muyBueno: 5,
    malo: 6,
    muyMalo: 5,
  },
  {
    name: 'C',
    bueno: 1,
    muyBueno: 9,
    malo: 11,
    muyMalo: 0,
  },
  {
    name: 'D',
    bueno: 0,
    muyBueno: 0,
    malo: 0,
    muyMalo: 21,
  },
  {
    name: 'E',
    bueno: 21,
    muyBueno: 0,
    malo: 0,
    muyMalo: 0,
  },
  {
    name: 'F',
    bueno: 1,
    muyBueno: 0,
    malo: 5,
    muyMalo: 15,
  },
  {
    name: 'G',
    bueno: 10,
    muyBueno: 0,
    malo: 1,
    muyMalo: 10,
  },
];
