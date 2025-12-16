const express = require('express');
const router = express.Router();
const StoreProduct = require('../models/StoreProduct');
const authMiddleware = require('../middleware/auth');

// Get all store products
router.get('/', authMiddleware, async (req, res) => {
    try {
        const products = await StoreProduct.find().sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create new store product
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, costPrice, quantity, barcode, category, notes } = req.body;

        // Validation
        if (!name || !costPrice || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Name, cost price, and quantity are required'
            });
        }

        const product = new StoreProduct({
            name,
            costPrice,
            quantity,
            barcode: barcode || '',
            category: category || '',
            notes: notes || ''
        });

        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update store product
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, costPrice, quantity, barcode, category, notes } = req.body;

        const product = await StoreProduct.findByIdAndUpdate(
            req.params.id,
            { name, costPrice, quantity, barcode, category, notes },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete store product
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await StoreProduct.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Search store products
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.json({ success: true, data: [] });
        }

        const products = await StoreProduct.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { barcode: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        });

        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
