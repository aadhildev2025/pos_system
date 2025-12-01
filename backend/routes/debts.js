const express = require('express');
const Debt = require('../models/Debt');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const { generateDebtStatementPDF } = require('../services/pdfService');

const router = express.Router();

// Get all debts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const debts = await Debt.find()
      .populate('customerId')
      .populate('transactionId')
      .sort({ createdAt: -1 });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get debts by customer
router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  try {
    const debts = await Debt.find({ customerId: req.params.customerId })
      .populate('customerId')
      .populate('transactionId')
      .sort({ createdAt: -1 });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record debt payment
router.put('/:debtId', authMiddleware, async (req, res) => {
  try {
    const { paymentAmount } = req.body;

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const debt = await Debt.findById(req.params.debtId).populate('customerId');
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    const actualPayment = Math.min(paymentAmount, debt.remainingAmount);
    debt.paidAmount += actualPayment;
    debt.remainingAmount -= actualPayment;

    debt.paymentHistory.push({
      amount: actualPayment,
      date: new Date(),
    });

    await debt.save();

    // Update customer total debt
    const customer = debt.customerId;
    customer.totalDebt = Math.max(0, customer.totalDebt - actualPayment);
    await customer.save();

    res.json(debt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download debt statement PDF
router.get('/statement/:customerId', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const debts = await Debt.find({ customerId: req.params.customerId })
      .populate('transactionId')
      .sort({ createdAt: -1 });

    const transactions = await Transaction.find({ customerId: req.params.customerId })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    const filePath = await generateDebtStatementPDF(customer, debts, transactions);

    res.download(filePath, `debt_statement_${customer.name}_${Date.now()}.pdf`, (err) => {
      if (err) console.error('Download error:', err);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
