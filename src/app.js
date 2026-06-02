require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const swaggerUi  = require('swagger-ui-express');
const jsYaml     = require('js-yaml');
const fs         = require('fs');

const routes          = require('./routes/index');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Nécessaire pour Swagger UI
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Swagger ───────────────────────────────────────────────────
try {
  const swaggerFile = fs.readFileSync(
    path.join(__dirname, 'docs', 'swagger.yaml'), 'utf8'
  );
  const swaggerDoc = jsYaml.load(swaggerFile);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customSiteTitle: 'Blog REST API — Docs',
    swaggerOptions: {
      persistAuthorization: true,  // Garde le token entre les rechargements
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',        // Sections repliées par défaut
    },
  }));
} catch (err) {
  console.warn('Swagger docs not loaded:', err.message);
}

// ── Routes ────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Error handler ─────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;