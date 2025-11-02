// Módulo que exporta una función para obtener el salario mínimo mensual legal vigente (SMMLV) en Colombia según el año
export default function SMMLV(año: number): number {
  const value = Salarios[año];
  return typeof value === 'number' && !isNaN(value) ? value : 0;
}

const Salarios: { [año: number]: number } = {
  2000: 260100,
  2001: 286000,
  2002: 309000,
  2003: 332000,
  2004: 358000,
  2005: 381500,
  2006: 408000,
  2007: 433700,
  2008: 461500,
  2009: 496900,
  2010: 515000,
  2011: 535600,
  2012: 566700,
  2013: 589500,
  2014: 616000,
  2015: 644350,
  2016: 689455,
  2017: 737717,
  2018: 781242,
  2019: 828116,
  2020: 877803,
  2021: 908526,
  2022: 1000000,
  2023: 1160000,
  2024: 1300000,
  2025: 1423500,
};
const SMMLV_ACTUAL = Salarios[Math.max(...Object.keys(Salarios).map(Number))];
export { SMMLV_ACTUAL, Salarios };
