exports.simulatePayment = (req, res) => {
  const { phoneNumber, amount, operator } = req.body;

  if (!phoneNumber || !amount || !operator) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  // Simulation : 90% de succès
  const success = Math.random() < 0.9;

  if (success) {
    return res.status(200).json({
      status: 'success',
      operator,
      transactionId: `TX-${Date.now()}`,
      message: `Paiement de ${amount} FCFA via ${operator} réussi.`,
    });
  } else {
    return res.status(500).json({
      status: 'failed',
      operator,
      message: `Paiement échoué. Réessayez.`,
    });
  }
};
