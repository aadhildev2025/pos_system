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

    // Strict validation
    if (!name || !supplier) {
      return res.status(400).json({ message: 'Name and supplier are required' });
    }

    // Ensure price is a valid number, default to 0
    let parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) parsedPrice = 0;
    if (price === undefined || price === null || price === '') {
      // Check if strictly required by UI logic, but schema allows 0. 
      // If user sent empty string, let's assume they want 0 or fail validation?
      // User UI validation usually catches empty required fields, but let's be safe.
      // Based on user report, we default to 0 to prevent crash.
    }

    const product = new Product({
      name: String(name),
      description: description ? String(description) : '',
      price: parsedPrice,
      quantity: parseInt(quantity) || 0,
      category: category ? String(category) : '',
      supplier: String(supplier),
      costPrice: parseFloat(costPrice) || 0,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ message: 'Server error while creating product', error: error.message });
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
