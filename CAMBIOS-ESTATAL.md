# Cambios: versión estatal (Veracruz)

Archivos nuevos: config/veracruz-districts.js, seed/seed-veracruz.js, public/css/landing.css, public/js/landing.js
Archivos modificados: models/District.js, routes/pages.js (home + /api/estado/resumen), views/index.ejs, views/partials/layout.ejs, package.json

## Cómo aplicarlo
1. Copia estos archivos sobre tu proyecto (respeta rutas).
2. `npm run seed:veracruz -- --dry-run`  → revisa qué crearía/actualizaría.
3. `npm run seed:veracruz`               → no borra nada; empata por (tipo, número).
4. Completa config/veracruz-districts.js con los distritos faltantes (19 federales / 30 locales).

## Pendiente que NO pude verificar
- Solo hay 3 federales y 13 locales cargados. La numeración local difiere entre fuentes (borrador INE nov-2022 vs. lista final ene-2023). Confírmala con el acuerdo del DOF del 26/01/2023.
- Tus distritos actuales (ej. "f1") pueden tener otra numeración: el dry-run te avisa si creará duplicados.
