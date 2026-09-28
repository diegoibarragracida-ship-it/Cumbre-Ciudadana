// Catálogo de distritos electorales de Veracruz (distritación 2023: 19 federales y 30 locales).
//
// IMPORTANTE: solo están cargados los distritos que pude contrastar con fuentes públicas
// (INE / prensa del INE-Veracruz). Completa el resto con el acuerdo oficial del INE
// (DOF 26/01/2023 para los locales; Memoria de la Distritación Nacional 2021-2023 para
// los federales) y marca verified:true cuando lo confirmes. `npm run seed:veracruz -- --dry-run`
// muestra qué haría antes de tocar la base.
const AM = 'Altas Montañas';

module.exports = [
  // ---- Federales ----
  { type: 'federal', number: 13, cabecera: 'Huatusco', region: AM, verified: true,
    municipalities: ['Atoyac','Camarón de Tejeda','Carrillo Puerto','Comapa','Cotaxtla','Huatusco','Ixhuatlán del Café','Jamapa','Manlio Fabio Altamirano','Medellín de Bravo','Paso del Macho','Sochiapa','Soledad de Doblado','Tepatlaxco','Tlacotepec de Mejía','Zentla'] },
  { type: 'federal', number: 15, cabecera: 'Orizaba', region: AM, verified: true,
    municipalities: ['Alpatláhuac','Atzacan','Calcahualco','Chocamán','Coscomatepec','Huiloapan de Cuauhtémoc','Ixhuatlancillo','La Perla','Mariano Escobedo','Orizaba','Río Blanco','Tomatlán'] },
  { type: 'federal', number: 16, cabecera: 'Córdoba', region: AM, verified: true,
    municipalities: ['Amatlán de los Reyes','Córdoba','Cuitláhuac','Fortín','Ixtaczoquitlán','Yanga'] },

  // ---- Locales (numeración según lista de prensa del INE-Veracruz, ene-2023; VERIFICAR contra el DOF) ----
  { type: 'local', number: 1,  cabecera: 'Pánuco',          verified: false },
  { type: 'local', number: 2,  cabecera: 'Tantoyuca',       verified: false, indigenous: true },
  { type: 'local', number: 3,  cabecera: 'Tuxpan',          verified: false },
  { type: 'local', number: 4,  cabecera: 'Álamo',           verified: false, indigenous: true },
  { type: 'local', number: 18, cabecera: 'Huatusco',        region: AM, verified: false },
  { type: 'local', number: 19, cabecera: 'Córdoba',         region: AM, verified: false },
  { type: 'local', number: 20, cabecera: 'Orizaba',         region: AM, verified: false },
  { type: 'local', number: 21, cabecera: 'Río Blanco',      region: AM, verified: false },
  { type: 'local', number: 22, cabecera: 'Zongolica',       region: AM, verified: false, indigenous: true },
  { type: 'local', number: 23, cabecera: 'Cosamaloapan',    verified: false },
  { type: 'local', number: 24, cabecera: 'Santiago Tuxtla', verified: false },
  { type: 'local', number: 25, cabecera: 'San Andrés Tuxtla', verified: false },
  { type: 'local', number: 27, cabecera: 'Acayucan',        verified: false, indigenous: true }
];
