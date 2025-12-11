const { generateDebtStatementPDF } = require('./services/pdfService');

const mockCustomer = {
    _id: '123',
    name: 'Test Customer',
    phone: '1234567890',
    totalDebt: 1000
};

const mockDebts = [];
const mockTransactions = [];

console.log('Testing PDF generation...');
generateDebtStatementPDF(mockCustomer, mockDebts, mockTransactions)
    .then(path => console.log('Success:', path))
    .catch(err => console.error('Error:', err));
