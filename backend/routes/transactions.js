const express = require('express');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Debt = require('../models/Debt');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const { generateReceiptPDF } = require('../services/pdfService');

const router = express.Router();

// Get all transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('customerId')
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customerId')
      .populate('items.productId');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { customerId, items, totalAmount, paidAmount, paymentMethod } = req.body;

    if (!items || items.length === 0 || !totalAmount || paidAmount === undefined) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const transactionId = 'TXN' + Date.now();
    const debtAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

    const transaction = new Transaction({
      transactionId,
      customerId: customerId || null, // Handle optional customer
      items,
      totalAmount,
      paidAmount,
      debtAmount,
      paymentMethod,
      paymentStatus,
    });

    await transaction.save();

    // Update customer total debt ONLY if customerId is present
    if (customerId && debtAmount > 0) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.totalDebt += debtAmount;
        await customer.save();

        // Create debt record
        const debt = new Debt({
          customerId,
          transactionId: transaction._id,
          amount: debtAmount,
          remainingAmount: debtAmount,
        });
        await debt.save();
      }
    }

    // Update product quantities
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
      }
    }

    // Correctly populate using array syntax or separate awaits
    await transaction.populate([
      { path: 'customerId' },
      { path: 'items.productId' }
    ]);

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Download receipt PDF
router.get('/receipt/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customerId')
      .populate('items.productId');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const customer = transaction.customerId || { name: 'Walk-in Customer', phone: '', address: '' };
    const filePath = await generateReceiptPDF(transaction, customer);

    res.download(filePath, `receipt_${transaction.transactionId}.pdf`, (err) => {
      if (err) console.error('Download error:', err);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
