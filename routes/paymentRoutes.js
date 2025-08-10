const express = require('express');
const router = express.Router();
const { simulatePayment } = require('../controllers/paymentController');

// Simuler un paiement
router.post('/simulate', simulatePayment);

module.exports = router;
