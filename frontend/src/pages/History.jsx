import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Search, History as HistoryIcon, Filter, Calendar, CreditCard, Banknote, Download } from 'lucide-react';
import { transactionAPI } from '../services/transactionAPI';
import Header from '../components/Header';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    searchId: '',
    searchCustomer: '',
    searchDate: '',
    statusFilter: 'all',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll();
      setTransactions(response.data);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    if (filters.searchId) {
      filtered = filtered.filter((tx) =>
        tx.transactionId.toLowerCase().includes(filters.searchId.toLowerCase())
      );
    }

    if (filters.searchCustomer) {
      filtered = filtered.filter((tx) =>
        tx.customerId?.name?.toLowerCase().includes(filters.searchCustomer.toLowerCase())
      );
    }

    if (filters.searchDate) {
      filtered = filtered.filter((tx) =>
        new Date(tx.createdAt).toLocaleDateString() === new Date(filters.searchDate).toLocaleDateString()
      );
    }

    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter((tx) => tx.paymentStatus === filters.statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const downloadReceipt = (transaction) => {
    const logoPath = new URL('../assets/logo.png', import.meta.url).href;

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Inter', sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px;">
          <img src="${logoPath}" style="width: 80px; height: 80px; margin: 0 auto 10px auto; display: block;" crossorigin="anonymous" />
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Sarfan Stores</h1>
          <p style="margin: 5px 0 0; color: #64748b; font-size: 12px;">KK Street, Puttalam</p>
          <p style="margin: 2px 0 0; color: #64748b; font-size: 11px;">Tel: +94752255989 / +94723806943</p>
          <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px; font-weight: 600;">Receipt #${transaction.transactionId}</p>
          <p style="margin: 2px 0 0; color: #94a3b8; font-size: 11px;">${new Date(transaction.createdAt).toLocaleString()}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #64748b;">Customer:</span>
            <span style="font-weight: 600; color: #0f172a;">${transaction.customerId?.name || 'Walk-in Customer'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #64748b;">Payment:</span>
            <span style="font-weight: 600; color: #0f172a; text-transform: capitalize;">${transaction.paymentMethod}</span>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Items Purchased</p>
          ${transaction.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <div style="flex: 1;">
                <span style="display: block; color: #0f172a; font-weight: 500;">${item.productId?.name || item.productName || 'Unknown Item'}</span>
                <span style="font-size: 11px; color: #64748b;">${item.quantity} x Rs ${item.price.toFixed(0)}</span>
              </div>
              <span style="font-weight: 600; color: #0f172a;">Rs ${(item.quantity * item.price).toFixed(0)}</span>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 2px dashed #e2e8f0; padding-top: 15px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #64748b;">
            <span>Subtotal</span>
            <span>Rs ${transaction.totalAmount.toFixed(0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 18px; font-weight: 800; color: #0f172a;">
            <span>Total</span>
            <span>Rs ${transaction.totalAmount.toFixed(0)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #64748b;">
            <span>Paid Amount</span>
            <span>Rs ${transaction.paidAmount.toFixed(0)}</span>
          </div>

          ${transaction.paidAmount > transaction.totalAmount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #16a34a; font-weight: 600;">
              <span>Change</span>
              <span>Rs ${(transaction.paidAmount - transaction.totalAmount).toFixed(0)}</span>
            </div>
          ` : ''}

          ${transaction.debtAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #dc2626; font-weight: 600;">
              <span>Balance Due</span>
              <span>Rs ${transaction.debtAmount.toFixed(0)}</span>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">Thank you for your business!</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `receipt_${transaction.transactionId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Header title="Transaction History" subtitle="View all transactions" />

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Search size={20} className="text-primary-600 dark:text-primary-400" />
          Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search by Transaction ID"
            value={filters.searchId}
            onChange={(e) => handleFilterChange('searchId', e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Search by Customer"
            value={filters.searchCustomer}
            onChange={(e) => handleFilterChange('searchCustomer', e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <input
            type="date"
            value={filters.searchDate}
            onChange={(e) => handleFilterChange('searchDate', e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            value={filters.statusFilter}
            onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Transactions */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HistoryIcon size={20} className="text-primary-600 dark:text-primary-400" />
            All Transactions ({filteredTransactions.length})
          </h2>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <HistoryIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <tr>
                    <th className="p-3 sm:p-4 text-left text-xs font-semibold">Transaction ID</th>
                    <th className="p-3 sm:p-4 text-left text-xs font-semibold">Date</th>
                    <th className="p-3 sm:p-4 text-left text-xs font-semibold">Customer</th>
                    <th className="p-3 sm:p-4 text-right text-xs font-semibold">Amount</th>
                    <th className="p-3 sm:p-4 text-right text-xs font-semibold">Paid</th>
                    <th className="p-3 sm:p-4 text-right text-xs font-semibold">Debt</th>
                    <th className="p-3 sm:p-4 text-left text-xs font-semibold">Method</th>
                    <th className="p-3 sm:p-4 text-center text-xs font-semibold">Status</th>
                    <th className="p-3 sm:p-4 text-center text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.map((tx, index) => (
                    <tr key={tx._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                      <td className="p-3 sm:p-4">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                          {tx.transactionId.substring(0, 12)}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-sm text-gray-600 dark:text-gray-300">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 sm:p-4 text-sm font-medium text-gray-900 dark:text-white">{tx.customerId?.name || 'Walk-in'}</td>
                      <td className="p-3 sm:p-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Rs {tx.totalAmount.toFixed(0)}</td>
                      <td className="p-3 sm:p-4 text-right text-sm font-semibold text-green-600 dark:text-green-400">Rs {tx.paidAmount.toFixed(0)}</td>
                      <td className="p-3 sm:p-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">Rs {tx.debtAmount.toFixed(0)}</td>
                      <td className="p-3 sm:p-4 text-sm capitalize text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          {tx.paymentMethod === 'cash' ? <Banknote size={14} /> : <CreditCard size={14} />}
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                          ${tx.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            tx.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {tx.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <button
                          onClick={() => downloadReceipt(tx)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="Download Receipt"
                        >
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {filteredTransactions.map((tx) => (
                <div key={tx._id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                        #{tx.transactionId.substring(0, 8)}
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white mt-1">{tx.customerId?.name || 'Walk-in'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                      ${tx.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        tx.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {tx.paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <div className="text-gray-500 dark:text-gray-400">Date</div>
                    <div className="text-right font-medium text-gray-700 dark:text-gray-300">{new Date(tx.createdAt).toLocaleDateString()}</div>

                    <div className="text-gray-500 dark:text-gray-400">Total Amount</div>
                    <div className="text-right font-bold text-gray-900 dark:text-white">Rs {tx.totalAmount.toFixed(0)}</div>

                    <div className="text-gray-500 dark:text-gray-400">Paid</div>
                    <div className="text-right font-medium text-green-600 dark:text-green-400">Rs {tx.paidAmount.toFixed(0)}</div>

                    <div className="text-gray-500 dark:text-gray-400">Debt</div>
                    <div className="text-right font-medium text-red-600 dark:text-red-400">Rs {tx.debtAmount.toFixed(0)}</div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 capitalize">
                      {tx.paymentMethod === 'cash' ? <Banknote size={12} /> : <CreditCard size={12} />}
                      {tx.paymentMethod}
                    </span>
                    <button
                      onClick={() => downloadReceipt(tx)}
                      className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Download size={14} />
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
