// index.js (version sécurisée)
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');

const app = express();

// middlewares de sécurité généraux
app.use(helmet()); // headers de sécurité
app.use(express.json({ limit: '10kb' })); // limite corps pour éviter abus
app.use(mongoSanitize()); // nettoie les $ operators (si jamais DB)
app.use(xss()); // évite l'injection XSS
app.use(morgan('combined')); // logs des requêtes

// CORS : restreindre les origines si souhaité
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
}));

// Rate limiter (par IP) : protège contre brute force / abus
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // max 60 requêtes par minute / IP
  message: { message: 'Trop de requêtes. Réessayez dans 1 minute.' }
});
app.use(limiter);

// Middleware API Key (simple protection d'accès)
function apiKeyMiddleware(req, res, next) {
  const clientKey = req.header('x-api-key') || req.query.api_key;
  if (!process.env.API_KEY) {
    // si pas défini (dev), on laisse passer (ou inverser selon préférence)
    return next();
  }
  if (!clientKey || clientKey !== process.env.API_KEY) {
    return res.status(401).json({ message: 'Accès refusé : API key invalide.' });
  }
  next();
}

// Route test simple
app.get('/', (req, res) => {
  res.send('Simulateur Paiement Mobile Money (sécurisé) 📱');
});

/**
 * Route POST /api/payments/simulate
 * - validation des champs avec express-validator
 * - apiKeyMiddleware protège la route
 */
app.post(
  '/api/payments/simulate',
  apiKeyMiddleware,
  // validations
  [
    body('phone')
      .trim()
      .matches(/^229\d{8}$/).withMessage('Le numéro doit commencer par 229 suivi de 8 chiffres.'),
    body('amount')
      .isFloat({ gt: 0 }).withMessage('Le montant doit être un nombre supérieur à 0.'),
    body('provider')
      .isIn(['Moov', 'MTN']).withMessage('Provider invalide (Moov ou MTN).')
  ],
  async (req, res) => {
    // vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Données invalides', errors: errors.array() });
    }

    const { phone, amount, provider } = req.body;

    // Simulation plus réaliste : status aléatoire (SUCCESS, FAILED, PENDING)
    const rnd = Math.random();
    let status = 'PENDING';
    if (rnd < 0.8) status = 'SUCCESS';
    else if (rnd < 0.95) status = 'FAILED';
    else status = 'PENDING';

    // Simuler délai (non-blocant)
    // Ici on renvoie immédiatement ; pour plus réaliste, on peut utiliser setTimeout
    const transaction = {
      transactionId: `TX-${Date.now()}`,
      phone,
      amount,
      provider,
      status,
      timestamp: new Date().toISOString()
    };

    // Log minimal (morgan fait déjà les requêtes). Ici on ajoute un log spécifique.
    console.log('Simulated transaction:', transaction);

    // Réponse
    if (status === 'SUCCESS') {
      return res.status(200).json({ ...transaction, message: `Paiement de ${amount} FCFA via ${provider} réussi.` });
    } else if (status === 'FAILED') {
      return res.status(402).json({ ...transaction, message: 'Paiement refusé.' });
    } else {
      return res.status(202).json({ ...transaction, message: 'Paiement en cours (PENDING).' });
    }
  }
);

// Handler d'erreurs global (dernier middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

// démarrage
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Serveur sécurisé démarré sur http://localhost:${PORT} (PORT=${PORT})`);
});
