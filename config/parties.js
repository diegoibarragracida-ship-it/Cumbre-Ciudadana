// Partidos políticos nacionales con registro vigente ante el INE,
// que competirán en el proceso electoral 2027.
// Fuente: resoluciones del Consejo General del INE, sesión del 25/26 de
// junio de 2026 (otorgó registro a PAZ y Somos México; con esa
// incorporación quedaron 8 partidos nacionales).
//
// Los colores son una aproximación de la identidad de marca de cada
// partido para uso visual en esta app (no son valores "oficiales" de
// un manual de marca publicado por el INE, salvo donde se indica).
// Revisa y ajusta el hex si el logo real del partido no coincide.
//
// NOTA: Somos México fue obligado por el INE a cambiar su emblema y
// color (usaban rosa, por confusión con un partido local). A la fecha
// de este archivo no hay un hex oficial confirmado públicamente para
// su nuevo color — quedó con un tono neutro provisional, AJÚSTALO en
// cuanto tengas el color definitivo de su nuevo emblema.

module.exports = [
  { key: 'morena', name: 'MORENA', color: '#9F2241' },
  { key: 'pan', name: 'PAN', color: '#0055A5' },
  { key: 'pri', name: 'PRI', color: '#0D7137' },
  { key: 'pvem', name: 'PVEM', color: '#1AA64A' },
  { key: 'pt', name: 'PT', color: '#D52B1E' },
  { key: 'mc', name: 'Movimiento Ciudadano', color: '#FF6D02' },
  { key: 'paz', name: 'PAZ', color: '#7B2FBE' },
  { key: 'somos-mx', name: 'Somos México', color: '#5B7FA6' },
  // Opción libre para partidos/candidaturas locales que no están en
  // la lista nacional (ej. partidos locales de Veracruz) o para
  // cuando el admin prefiera escribir el nombre y color a mano.
  { key: 'otro', name: 'Otro / candidatura local (definir manualmente)', color: '#3EE6D0' }
];
