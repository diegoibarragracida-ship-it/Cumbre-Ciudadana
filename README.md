# Cumbre Ciudadana · Altas Montañas de Veracruz

Plataforma de encuestas digitales de opinión sobre candidaturas locales y
federales de la región de las Altas Montañas de Veracruz. Login con Google
o Facebook, un voto por persona y distrito, gráfica de resultados en vivo
y comentarios ciudadanos por candidato.

> **Nota importante:** esto es una herramienta de **opinión ciudadana**, no
> un sistema de votación oficial. El texto de la interfaz ya lo aclara para
> evitar confusiones con procesos electorales reales — consérvalo.

## Stack

- Node.js + Express + EJS (servidor y vistas en un solo servicio, fácil de
  desplegar)
- MongoDB + Mongoose (base de datos)
- Passport.js (login con Google y Facebook)
- Chart.js / barras nativas + `fetch` cada 5s para el efecto "en vivo"
- Sesiones guardadas en MongoDB con `connect-mongo` (necesario porque Render
  no conserva archivos entre reinicios)

## 1. Requisitos antes de desplegar

### a) Base de datos — MongoDB Atlas (gratis)
1. Crea una cuenta en https://www.mongodb.com/cloud/atlas
2. Crea un cluster gratuito (M0).
3. En "Database Access" crea un usuario y contraseña.
4. En "Network Access" agrega `0.0.0.0/0` (permitir desde cualquier IP,
   necesario porque Render usa IPs dinámicas).
5. Copia el "Connection String" (botón Connect > Drivers) — se ve así:
   `mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/cumbreciudadana?retryWrites=true&w=majority`

### b) Login con Google
1. Ve a https://console.cloud.google.com/apis/credentials
2. Crea un proyecto, luego "Crear credenciales" > "ID de cliente de OAuth".
3. Tipo de aplicación: "Aplicación web".
4. En "URI de redireccionamiento autorizados" agrega:
   `https://TU-APP.onrender.com/auth/google/callback`
5. Copia el **Client ID** y **Client Secret**.

### c) Login con Facebook
1. Ve a https://developers.facebook.com/apps y crea una app tipo "Consumidor".
2. Agrega el producto "Facebook Login".
3. En "Configuración" > "Facebook Login" agrega como URI de redirección
   válida: `https://TU-APP.onrender.com/auth/facebook/callback`
4. Copia el **App ID** y **App Secret** (Configuración básica).
5. Mientras la app esté en modo "Desarrollo", solo tú y los usuarios que
   agregues como "Testers" podrán iniciar sesión. Para que cualquier
   persona pueda entrar, envía la app a revisión de Facebook (permiso
   `public_profile` y `email`) y actívala en modo "Live".

## 2. Desplegar en Render

1. Sube esta carpeta a un repositorio de GitHub.
2. En https://render.com crea un **Web Service** nuevo y conéctalo a tu
   repositorio.
3. Configuración:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. En la pestaña **Environment**, agrega estas variables (usa los valores
   que obtuviste en el paso 1):

   | Variable | Valor |
   |---|---|
   | `MONGO_URI` | tu connection string de Atlas |
   | `SESSION_SECRET` | cualquier cadena larga y aleatoria |
   | `BASE_URL` | `https://TU-APP.onrender.com` (usa el dominio que Render te asigna) |
   | `GOOGLE_CLIENT_ID` | de Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | de Google Cloud Console |
   | `FACEBOOK_APP_ID` | de Facebook Developers |
   | `FACEBOOK_APP_SECRET` | de Facebook Developers |
   | `ADMIN_EMAIL` | el correo con el que iniciarás sesión como administrador |
   | `NODE_ENV` | `production` |

5. **Importante:** una vez que Render te asigne tu dominio real (ej.
   `cumbreciudadana.onrender.com`), actualiza `BASE_URL` con ese valor y
   también actualiza las URIs de redirección en Google y Facebook para
   que coincidan exactamente. Vuelve a desplegar después del cambio.
6. Despliega. Cuando el servicio esté arriba, entra a tu URL con la
   cuenta de `ADMIN_EMAIL` y luego visita `/admin` para cargar tus
   distritos y candidatos reales (o corre el sembrado de ejemplo, ver
   abajo).

## 3. Correr en tu computadora (opcional, para probar antes de subir)

```bash
npm install
cp .env.example .env
# edita .env con tus datos (puedes dejar Google/Facebook vacíos para solo ver el diseño)
npm start
```

Abre http://localhost:3000

### Cargar datos de ejemplo
```bash
npm run seed
```
Esto crea los distritos federales reales 15 (Orizaba) y 16 (Córdoba), dos
distritos locales de ejemplo, y candidatos **ficticios** de muestra para
que veas la plataforma funcionando. Reemplázalos por los candidatos reales
desde el panel `/admin` antes de compartir el sitio — el sembrado es solo
para probar el diseño y el flujo de voto.

## 4. Cómo cargar tus candidatos reales

Inicia sesión con el correo que pusiste en `ADMIN_EMAIL` y entra a
`/admin`:
- Da de alta cada distrito (local o federal, con su número).
- Da de alta cada candidato: nombre, partido/coalición, una URL de foto
  (puedes subir la imagen a cualquier servicio como Cloudinary, Imgur o
  tu propio Drive público y pegar el enlace directo) y una breve
  biografía.

## 5. Reglas de negocio ya implementadas

- Un usuario solo puede tener **un voto vigente por distrito** (puede
  cambiarlo, pero no votar dos veces por candidatos distintos del mismo
  distrito).
- Los comentarios requieren sesión iniciada.
- La gráfica de resultados se actualiza sola cada 5 segundos sin recargar
  la página.
- Solo el correo definido en `ADMIN_EMAIL` puede entrar a `/admin`.

## 6. Ideas para siguientes pasos (no incluidas aún)

- Límite de un comentario cada cierto tiempo para evitar spam.
- Moderación/eliminación de comentarios desde `/admin`.
- Compartir resultados en redes sociales.
- Mapa de la región con los distritos.
