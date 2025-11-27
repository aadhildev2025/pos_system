const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, quantity, category, supplier, costPrice } = req.body;

    if (!name || !price || !supplier) {
      return res.status(400).json({ message: 'Name, price, and supplier are required' });
    }

    const product = new Product({
      name,
      description,
      price,
      quantity,
      category,
      supplier,
      costPrice,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
