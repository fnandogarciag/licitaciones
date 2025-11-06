export const MESSAGES = {
  codigoLink: {
    empty: 'El enlace no puede estar vacío',
    invalidFormat:
      'El enlace debe incluir un código NTC válido (ej. https://www.secop.gov.co/...?notice=CO1.NTC.123456)',
    invalidDomain: 'El enlace debe ser del dominio secop.gov.co',
    noNotice:
      'No se encontró un código NTC válido en el enlace (debe tener formato CO1.NTC.número o NTC.número)',
    help: 'Pegue el enlace SECOP completo con código NTC válido (ej. CO1.NTC.8934774)',
  },
} as const;
