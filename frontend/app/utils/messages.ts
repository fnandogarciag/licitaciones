export const MESSAGES = {
  codigoLink: {
    empty: 'El enlace no puede estar vacío',
    invalidFormat:
      'Pegue un enlace válido de SECOP (ej. https://www.secop.gov.co/...)',
    invalidDomain: 'El enlace debe ser del dominio secop.gov.co',
    noNotice: 'No se encontró un código "notice" válido en el enlace',
    help: 'Pegue el enlace SECOP; guardaremos sólo el código "notice" (p. ej. CO1.NTC.8934774)',
  },
} as const;
