const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Route simulateur
app.post("/api/payments/simulate", (req, res) => {
  const { phone, amount, provider } = req.body;

  if (!phone || !amount || !provider) {
    return res.status(400).json({ message: "Paramètres manquants" });
  }

  res.json({
    success: true,
    message: `Paiement simulé avec succès via ${provider}`,
    transactionId: `TX-${Date.now()}`,
    phone,
    amount,
    provider,
    status: "SUCCESS",
  });
});

// Lancement serveur
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Serveur paiement en écoute sur le port ${PORT}`);
});
