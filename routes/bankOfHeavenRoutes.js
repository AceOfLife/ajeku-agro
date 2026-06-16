// routes/bankOfHeavenRoutes.js

const express = require('express');
const router = express.Router();

// Import the BankOfHeavenController
const BankOfHeavenController = require('../controllers/BankOfHeavenController');

// Get the current Bank of Heaven summary
router.get('/', BankOfHeavenController.getBankSummary);

// Update Bank of Heaven data (current_balance, expenses_per_week, income_per_week, transactions)
router.put('/', BankOfHeavenController.updateBankSummary);

router.put('/update', BankOfHeavenController.updateBankSummary);

module.exports = router;
