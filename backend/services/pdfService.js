const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper to add centered logo
const addLogo = (doc, width = 50) => {
    const logoPath = path.join(__dirname, '../../frontend/src/assets/logo.png');
    if (fs.existsSync(logoPath)) {
        // A4 width is ~595.28 points. 
        // Use doc.page.width but fallback to 595.28 if something is off.
        const pageWidth = doc.page.width || 595.28;
        const x = (pageWidth - width) / 2;
        doc.image(logoPath, x, doc.y, { width: width });
        doc.moveDown(width / 14); // Adjust spacing based on logo height approximation
    }
};

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
            addLogo(doc, 60);
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
            const doc = new PDFDocument({ margin: 25, size: 'A4', bufferPages: true });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // ========== HEADER ==========
            addLogo(doc, 70);
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
            if (customer.address) doc.text(`Address: ${customer.address}`, margin);
            doc.moveDown(0.5);

            // ========== SUMMARY ==========
            doc.fontSize(11).font('Helvetica-Bold').text('Summary Overview:');
            doc.fontSize(10).font('Helvetica').moveDown(0.3);
            doc.text(`Total Outstanding Debt: Rs ${customer.totalDebt.toFixed(0)}`, margin);

            doc.moveDown(0.8);
            doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            doc.moveDown(0.8);

            // ========== OUTSTANDING DEBTS TABLE ==========
            doc.fontSize(11).font('Helvetica-Bold').text('Outstanding Debts Log:');
            doc.moveDown(0.4);

            if (debts && debts.length > 0) {
                // Table Header
                doc.fontSize(9).font('Helvetica-Bold');
                const colX = { date: 25, amount: 150, paid: 250, remaining: 380 };
                const headerY = doc.y;

                doc.text('Date', colX.date, headerY);
                doc.text('Original Amount', colX.amount, headerY);
                doc.text('Paid Amount', colX.paid, headerY);
                doc.text('Remaining Balance', colX.remaining, headerY);

                doc.moveTo(25, doc.y + 2).lineTo(570, doc.y + 2).stroke();
                doc.moveDown(0.5);

                // Table Rows
                doc.font('Helvetica').fontSize(9);
                debts.forEach((debt) => {
                    // Page Break Logic
                    if (doc.y > 750) {
                        doc.addPage();
                        // Reprint Header
                        doc.fontSize(9).font('Helvetica-Bold');
                        doc.text('Date', colX.date, 30);
                        doc.text('Original Amount', colX.amount, 30);
                        doc.text('Paid Amount', colX.paid, 30);
                        doc.text('Remaining Balance', colX.remaining, 30);
                        doc.moveTo(25, 42).lineTo(570, 42).stroke();
                        doc.moveDown(0.5);
                        doc.font('Helvetica');
                    }

                    const date = new Date(debt.createdAt).toLocaleDateString();
                    doc.text(date, colX.date);
                    doc.text(`Rs ${debt.amount.toFixed(0)}`, colX.amount, doc.y - 12);
                    doc.text(`Rs ${debt.paidAmount.toFixed(0)}`, colX.paid, doc.y - 12);

                    doc.fillColor('#dc2626'); // Red for debt
                    doc.text(`Rs ${debt.remainingAmount.toFixed(0)}`, colX.remaining, doc.y - 12);
                    doc.fillColor('#000000');

                    doc.moveDown(0.35);
                });

                doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            } else {
                doc.fontSize(9).text('No outstanding debts', margin);
            }

            // Footer
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(
                    `Page ${i + 1} of ${pageCount}`,
                    25,
                    doc.page.height - 30,
                    { align: 'center', width: doc.page.width - 50 }
                );
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

// ========== ELEGANT CUSTOMER TRANSACTIONS PDF ==========
const generateCustomerTransactionsPDF = (customer, transactions) => {
    // Use /tmp for Vercel serverless environment
    const tmpDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../reports');
    const fileName = `transactions_${customer._id}_${Date.now()}.pdf`;
    const filePath = path.join(tmpDir, fileName);

    if (process.env.NODE_ENV !== 'production' && !fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 25, size: 'A4', bufferPages: true });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // ========== HEADER ==========
            addLogo(doc, 70);
            doc.fontSize(16).font('Helvetica-Bold').text('TRANSACTION HISTORY', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('Detailed Account Activity', { align: 'center' });
            doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            doc.moveDown(0.8);

            // ========== CUSTOMER INFO ==========
            doc.fontSize(11).font('Helvetica-Bold').text('Customer Information');
            doc.fontSize(10).font('Helvetica').moveDown(0.3);

            const margin = 25;
            doc.text(`Name: ${customer.name}`, margin);
            doc.text(`Phone: ${customer.phone}`, margin);
            if (customer.address) doc.text(`Address: ${customer.address}`, margin);
            doc.moveDown(0.5);

            // ========== SUMMARY ==========
            const totalSpent = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

            doc.fontSize(11).font('Helvetica-Bold').text('Summary Overview:');
            doc.fontSize(10).font('Helvetica').moveDown(0.3);
            doc.text(`Total Transactions: ${transactions.length}`, margin);
            doc.text(`Total Volume: Rs ${totalSpent.toFixed(0)}`, margin);
            doc.text(`Current Outstanding Debt: Rs ${customer.totalDebt ? customer.totalDebt.toFixed(0) : '0'}`, margin);

            doc.moveDown(0.8);
            doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            doc.moveDown(0.8);

            // ========== TRANSACTIONS TABLE ==========
            doc.fontSize(11).font('Helvetica-Bold').text('Transaction Log:');
            doc.moveDown(0.4);

            if (transactions && transactions.length > 0) {
                // Table Header
                doc.fontSize(9).font('Helvetica-Bold');
                const colX = { date: 25, id: 100, method: 200, total: 300, paid: 390, debt: 480 };
                const headerY = doc.y;

                doc.text('Date', colX.date, headerY);
                doc.text('Transaction ID', colX.id, headerY);
                doc.text('Method', colX.method, headerY);
                doc.text('Total', colX.total, headerY, { width: 80, align: 'right' });
                doc.text('Paid', colX.paid, headerY, { width: 80, align: 'right' });
                doc.text('Debt', colX.debt, headerY, { width: 80, align: 'right' });

                doc.moveTo(25, doc.y + 2).lineTo(570, doc.y + 2).stroke();
                doc.moveDown(0.5);

                // Table Rows
                doc.font('Helvetica').fontSize(9);
                transactions.forEach((txn) => {
                    // Page Break Logic
                    if (doc.y > 750) {
                        doc.addPage();
                        // Reprint Header
                        doc.fontSize(9).font('Helvetica-Bold');
                        doc.text('Date', colX.date, 30);
                        doc.text('Transaction ID', colX.id, 30);
                        doc.text('Method', colX.method, 30);
                        doc.text('Total', colX.total, 30, { width: 80, align: 'right' });
                        doc.text('Paid', colX.paid, 30, { width: 80, align: 'right' });
                        doc.text('Debt', colX.debt, 30, { width: 80, align: 'right' });
                        doc.moveTo(25, 42).lineTo(570, 42).stroke();
                        doc.moveDown(0.5);
                        doc.font('Helvetica');
                    }

                    const y = doc.y;
                    doc.fillColor('#000000');
                    doc.text(new Date(txn.createdAt).toLocaleDateString(), colX.date, y);
                    doc.text(txn.transactionId, colX.id, y);
                    doc.text(txn.paymentMethod.toUpperCase(), colX.method, y);
                    doc.text(`Rs ${txn.totalAmount.toFixed(0)}`, colX.total, y, { width: 80, align: 'right' });
                    doc.text(`Rs ${txn.paidAmount.toFixed(0)}`, colX.paid, y, { width: 80, align: 'right' });

                    if (txn.debtAmount > 0) doc.fillColor('#dc2626');
                    doc.text(`Rs ${txn.debtAmount.toFixed(0)}`, colX.debt, y, { width: 80, align: 'right' });

                    doc.fillColor('#000000');
                    doc.moveDown(0.4);
                });

                doc.moveTo(25, doc.y).lineTo(570, doc.y).stroke();
            } else {
                doc.fontSize(9).text('No transactions found', margin);
            }

            // Footer
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(
                    `Page ${i + 1} of ${pageCount}`,
                    25,
                    doc.page.height - 30,
                    { align: 'center', width: doc.page.width - 50 }
                );
            }

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generateReceiptPDF,
    generateDebtStatementPDF,
    generateCustomerTransactionsPDF
};
