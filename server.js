require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const connectDB = require('./config/db');
require('./config/passport');

const app = express();

// --- Base de datos ---
connectDB();

// Render (y la mayoría de PaaS) corren la app detrás de un proxy que
// termina el HTTPS. Sin esto, Express no confía en "x-forwarded-proto"
// y cree que la conexión es HTTP, por lo que nunca setea cookies "secure".
// Eso es lo que hace que el login "no pegue": el OAuth funciona, pero
// la cookie de sesión no se guarda y en la siguiente carga vuelves a
// aparecer como no logueado.
app.set('trust proxy', 1);

// --- Vistas ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

// --- Middlewares ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'clave_temporal_insegura',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Variables disponibles en todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAdmin = req.user && req.user.email === process.env.ADMIN_EMAIL;
  next();
});

// --- Rutas ---
app.use('/auth', require('./routes/auth'));
app.use('/voto', require('./routes/votes'));
app.use('/comentario', require('./routes/comments'));
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/pages'));

// 404
app.use((req, res) => res.status(404).render('404', { title: 'No encontrado' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));