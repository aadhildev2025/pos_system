const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

// Get profit analytics for different time periods
router.get('/profit', authMiddleware, async (req, res) => {
    try {
        const now = new Date();

        // Define time periods
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch transactions with populated product data
        const allTransactions = await Transaction.find()
            .populate('items.productId', 'costPrice')
            .sort({ createdAt: -1 });

        // Helper function to calculate profit for a period
        const calculateProfit = (transactions) => {
            let revenue = 0;
            let cogs = 0;
            let transactionCount = 0;

            transactions.forEach(tx => {
                // Only count paid amount as revenue
                revenue += tx.paidAmount || 0;
                transactionCount++;

                // Calculate COGS for this transaction
                if (tx.items && tx.items.length > 0) {
                    tx.items.forEach(item => {
                        const costPrice = item.productId?.costPrice || 0;
                        cogs += item.quantity * costPrice;
                    });
                }
            });

            const profit = revenue - cogs;
            const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

            return {
                revenue: parseFloat(revenue.toFixed(2)),
                cogs: parseFloat(cogs.toFixed(2)),
                profit: parseFloat(profit.toFixed(2)),
                margin: parseFloat(margin.toFixed(2)),
                transactions: transactionCount
            };
        };

        // Filter and calculate for each period
        const todayTransactions = allTransactions.filter(tx =>
            new Date(tx.createdAt) >= todayStart
        );

        const weekTransactions = allTransactions.filter(tx =>
            new Date(tx.createdAt) >= weekStart
        );

        const monthTransactions = allTransactions.filter(tx =>
            new Date(tx.createdAt) >= monthStart
        );

        const result = {
            today: calculateProfit(todayTransactions),
            week: calculateProfit(weekTransactions),
            month: calculateProfit(monthTransactions)
        };

        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Profit calculation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
