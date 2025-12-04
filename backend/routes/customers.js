const express = require('express');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Debt = require('../models/Debt');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, whatsappNumber, address, creditLimit, initialDebt } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // Parse initial debt
    const debtAmount = initialDebt && !isNaN(parseFloat(initialDebt)) ? parseFloat(initialDebt) : 0;

    const customer = new Customer({
      name,
      phone,
      whatsappNumber,
      address,
      creditLimit,
      totalDebt: debtAmount,
    });

    await customer.save();

    // If there's an initial debt, create transaction and debt records
    if (debtAmount > 0) {
      // Create Opening Balance Transaction
      const transaction = new Transaction({
        transactionId: `OB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: customer._id,
        items: [{
          productName: 'Opening Balance',
          quantity: 1,
          price: debtAmount
        }],
        totalAmount: debtAmount,
        paidAmount: 0,
        debtAmount: debtAmount,
        paymentMethod: 'credit',
        paymentStatus: 'pending'
      });

      await transaction.save();

      // Create Debt Record
      const debt = new Debt({
        customerId: customer._id,
        transactionId: transaction._id,
        amount: debtAmount,
        remainingAmount: debtAmount,
        paidAmount: 0
      });

      await debt.save();
    }

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { initialDebt, ...updateData } = req.body;

    // Get the existing customer first
    const existingCustomer = await Customer.findById(req.params.id);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Parse the debt amount to add
    const debtToAdd = initialDebt && !isNaN(parseFloat(initialDebt)) ? parseFloat(initialDebt) : 0;

    // Update customer data (excluding initialDebt)
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // If there's debt to add, create transaction and debt records
    if (debtToAdd > 0) {
      // Update customer's total debt
      customer.totalDebt = (customer.totalDebt || 0) + debtToAdd;
      await customer.save();

      // Create Additional Debt Transaction
      const transaction = new Transaction({
        transactionId: `AD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: customer._id,
        items: [{
          productName: 'Additional Debt',
          quantity: 1,
          price: debtToAdd
        }],
        totalAmount: debtToAdd,
        paidAmount: 0,
        debtAmount: debtToAdd,
        paymentMethod: 'credit',
        paymentStatus: 'pending'
      });

      await transaction.save();

      // Create Debt Record
      const debt = new Debt({
        customerId: customer._id,
        transactionId: transaction._id,
        amount: debtToAdd,
        remainingAmount: debtToAdd,
        paidAmount: 0
      });

      await debt.save();
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
