const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ========== ELEGANT RECEIPT PDF ==========
const generateReceiptPDF = (transaction, customer) => {
    // Use /tmp for Vercel serverless environment
    const tmpDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../receipts');
    const fileName = `receipt_${transaction.transactionId}_${Date.now()}.pdf`;
    const filePath = path.join(tmpDir, fileName);

    // Ensure directory exists (only needed for local dev)
    if (process.env.NODE_ENV !== 'production' && !fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A5', margin: 30 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // ========== HEADER ==========
            doc.fontSize(20).font('Helvetica-Bold').text('POS SYSTEM', { align: 'center' });
            doc.fontSize(12).font('Helvetica').fillColor('#666666').text('Point of Sale Receipt', { align: 'center' });
            doc.moveDown(0.5);
            doc.moveTo(30, doc.y).lineTo(385, doc.y).stroke();
            doc.moveDown(0.8);

            // ========== TRANSACTION INFO ==========
            doc.fontSize(9).fillColor('#888888').font('Helvetica');
            doc.text(`Transaction ID: ${transaction.transactionId}`, 30);
            doc.text(`Date: ${new Date(transaction.createdAt).toLocaleString()}`, 30);
            doc.text(`Payment Method: ${transaction.paymentMethod.toUpperCase()}`, 30);
            doc.moveDown(0.8);

            // ========== CUSTOMER INFO ==========
            doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('Customer Details', 30);
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').fillColor('#333333');
            doc.text(`Name: ${customer.name || 'Walk-in Customer'}`, 30);
            if (customer.phone) {
                doc.text(`Phone: ${customer.phone}`, 30);
            }
            doc.moveDown(0.8);

            // ========== ITEMS SECTION ==========
            doc.moveTo(30, doc.y).lineTo(385, doc.y).stroke();
            doc.moveDown(0.5);

            doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('Items', 30);
            doc.moveDown(0.5);

            // Table Header
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#666666');
            doc.text('Item', 30, doc.y);
            doc.text('Qty', 250, doc.y - 12, { width: 50, align: 'center' });
            doc.text('Price', 300, doc.y - 12, { width: 50, align: 'right' });
            doc.text('Total', 350, doc.y - 12, { width: 65, align: 'right' });
            doc.moveDown(0.3);
            doc.moveTo(30, doc.y).lineTo(385, doc.y).stroke();
            doc.moveDown(0.4);

            // Items List
            doc.fontSize(9).font('Helvetica').fillColor('#000000');
            if (transaction.items && transaction.items.length > 0) {
                transaction.items.forEach((item) => {
                    const productName = typeof item.productId === 'object'
                        ? item.productId.name
                        : 'Product';
                    const price = item.price || 0;
                    const itemTotal = item.quantity * price;

                    const currentY = doc.y;
                    doc.text(productName, 30, currentY, { width: 210 });
                    doc.text(item.quantity.toString(), 250, currentY, { width: 50, align: 'center' });
                    doc.text(`Rs ${price.toFixed(0)}`, 300, currentY, { width: 50, align: 'right' });
                    doc.text(`Rs ${itemTotal.toFixed(0)}`, 350, currentY, { width: 65, align: 'right' });
                    doc.moveDown(0.5);
                });
            }

            doc.moveDown(0.3);
            doc.moveTo(30, doc.y).lineTo(385, doc.y).stroke();
            doc.moveDown(0.5);

            // ========== TOTALS ==========
            const startX = 30;
            const valueX = 320;

            doc.fontSize(10).font('Helvetica');
            doc.fillColor('#333333');
            doc.text('Subtotal:', startX, doc.y);
            doc.text(`Rs ${transaction.totalAmount.toFixed(0)}`, valueX, doc.y - 12, { width: 95, align: 'right' });
            doc.moveDown(0.5);

            doc.text('Paid Amount:', startX, doc.y);
            doc.text(`Rs ${transaction.paidAmount.toFixed(0)}`, valueX, doc.y - 12, { width: 95, align: 'right' });
            doc.moveDown(0.5);

            // Change or Balance Due
            if (transaction.paidAmount > transaction.totalAmount) {
                const change = transaction.paidAmount - transaction.totalAmount;
                doc.fillColor('#16a34a').font('Helvetica-Bold');
                doc.text('Change:', startX, doc.y);
                doc.text(`Rs ${change.toFixed(0)}`, valueX, doc.y - 12, { width: 95, align: 'right' });
                doc.fillColor('#000000').font('Helvetica');
            } else if (transaction.debtAmount > 0) {
                doc.fillColor('#dc2626').font('Helvetica-Bold');
                doc.text('Balance Due:', startX, doc.y);
                doc.text(`Rs ${transaction.debtAmount.toFixed(0)}`, valueX, doc.y - 12, { width: 95, align: 'right' });
                doc.fillColor('#000000').font('Helvetica');
            }

            doc.moveDown(0.5);
            doc.moveTo(30, doc.y).lineTo(385, doc.y).lineWidth(2).stroke();
            doc.lineWidth(1);
            doc.moveDown(0.5);

            // Grand Total
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
            doc.text('TOTAL:', startX, doc.y);
            doc.text(`Rs ${transaction.totalAmount.toFixed(0)}`, valueX, doc.y - 15, { width: 95, align: 'right' });
            doc.moveDown(1);

            // ========== FOOTER ==========
            doc.moveDown(1.5);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Thank you for your business!', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(8).font('Helvetica').fillColor('#999999');
            doc.text('Please keep this receipt for your records', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (err) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};

// ========== ELEGANT DEBT STATEMENT PDF ==========
const generateDebtStatementPDF = (customer, debts, transactions) => {
    // Use /tmp for Vercel serverless environment
    const tmpDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../statements');
    const fileName = `debt_statement_${customer._id}_${Date.now()}.pdf`;
    const filePath = path.join(tmpDir, fileName);

    // Ensure directory exists (only needed for local dev)
    if (process.env.NODE_ENV !== 'production' && !fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 25 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // ========== HEADER ==========
            doc.fontSize(16).font('Helvetica-Bold').text('DEBT STATEMENT', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('Account Summary', { align: 'center' });
            doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            doc.moveDown(0.8);

            // ========== CUSTOMER INFO ==========
            doc.fontSize(11).font('Helvetica-Bold').text('Customer Information');
            doc.fontSize(10).font('Helvetica').moveDown(0.3);

            const margin = 25;
            doc.text(`Name: ${customer.name}`, margin);
            doc.text(`Phone: ${customer.phone}`, margin);
            doc.text(`Total Outstanding Debt: Rs ${customer.totalDebt.toFixed(0)}`, margin);
            doc.moveDown(0.5);

            doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            doc.moveDown(0.8);

            // ========== OUTSTANDING DEBTS ==========
            doc.fontSize(11).font('Helvetica-Bold').text('Outstanding Debts:');
            doc.moveDown(0.4);

            if (debts && debts.length > 0) {
                doc.fontSize(9).font('Helvetica-Bold');
                const colX = { date: 25, amount: 150, paid: 250, remaining: 380 };
                const headerY = doc.y;

                doc.text('Date', colX.date, headerY);
                doc.text('Amount', colX.amount, headerY);
                doc.text('Paid', colX.paid, headerY);
                doc.text('Remaining', colX.remaining, headerY);

                doc.moveTo(25, doc.y + 2).lineTo(570, doc.y + 2).stroke();
                doc.moveDown(0.5);

                doc.font('Helvetica').fontSize(9);
                debts.forEach((debt) => {
                    const date = new Date(debt.createdAt).toLocaleDateString();
                    doc.text(date, colX.date);
                    doc.text(`Rs ${debt.amount.toFixed(0)}`, colX.amount, doc.y - 12);
                    doc.text(`Rs ${debt.paidAmount.toFixed(0)}`, colX.paid, doc.y - 12);
                    doc.text(`Rs ${debt.remainingAmount.toFixed(0)}`, colX.remaining, doc.y - 12);
                    doc.moveDown(0.35);
                });

                doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            } else {
                doc.fontSize(9).text('No outstanding debts', margin);
            }

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (err) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generateReceiptPDF,
    generateDebtStatementPDF
};
