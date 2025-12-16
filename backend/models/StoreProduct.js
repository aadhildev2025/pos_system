const mongoose = require('mongoose');

const StoreProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    costPrice: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    barcode: {
        type: String,
        trim: true,
        default: ''
    },
    category: {
        type: String,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Add index for faster searches
StoreProductSchema.index({ name: 'text', barcode: 'text' });

module.exports = mongoose.model('StoreProduct', StoreProductSchema);
