import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Download, DollarSign, FileText, ChevronDown, ChevronUp, AlertCircle, Search, X } from 'lucide-react';
import { debtAPI } from '../services/debtAPI';
import { customerAPI } from '../services/customerAPI';
import Header from '../components/Header';

const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [debtRes, cusRes] = await Promise.all([
        debtAPI.getAll(),
        customerAPI.getAll(),
      ]);
      setDebts(debtRes.data);
      setCustomers(cusRes.data);
    } catch (err) {
      setError('Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      // Record payment for the first unpaid debt
      await debtAPI.recordPayment(paymentModal.debts[0]._id, {
        paymentAmount: parseFloat(paymentAmount),
      });
      fetchData();
      setPaymentModal(null);
      setPaymentAmount('');
      setError('');
    } catch (err) {
      setError('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const downloadStatement = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    if (!customer) {
      console.error('Customer not found');
      return;
    }

    const customerDebts = debts.filter(
      (d) => d.customerId._id === customerId && d.remainingAmount > 0
    );

    if (customerDebts.length === 0) {
      setError('No outstanding debts for this customer');
      return;
    }

    const totalDebt = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

    const logoPath = new URL('../assets/logo.png', import.meta.url).href;

    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px;">
          <img src="${logoPath}" style="width: 80px; height: 80px; margin-bottom: 15px;" crossorigin="anonymous" />
          <h1 style="color: #0ea5e9; margin: 0; font-size: 32px; font-weight: 800;">POS SYSTEM</h1>
          <h2 style="color: #64748b; margin: 10px 0 0 0; font-size: 20px; font-weight: 600;">Customer Debt Statement</h2>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
          <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${customer.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phone:</td>
              <td style="padding: 8px 0; color: #0f172a;">${customer.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Address:</td>
              <td style="padding: 8px 0; color: #0f172a;">${customer.address || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Credit Limit:</td>
              <td style="padding: 8px 0; color: #0f172a;">Rs ${(customer.creditLimit || 0).toFixed(0)}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Outstanding Debts</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #0ea5e9; color: white;">
              <th style="padding: 12px; text-align: left; border-radius: 6px 0 0 6px;">Transaction ID</th>
              <th style="padding: 12px; text-align: left;">Date</th>
              <th style="padding: 12px; text-align: right;">Total Amount</th>
              <th style="padding: 12px; text-align: right;">Paid</th>
              <th style="padding: 12px; text-align: right; border-radius: 0 6px 6px 0;">Remaining</th>
            </tr>
          </thead>
          <tbody>
            ${customerDebts.map((debt, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : 'white'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; font-family: monospace; font-size: 13px; color: #475569;">${debt.transactionId?.transactionId?.substring(0, 12) || 'N/A'}</td>
                <td style="padding: 12px; color: #475569;">${new Date(debt.createdAt).toLocaleDateString()}</td>
                <td style="padding: 12px; text-align: right; color: #475569;">Rs ${(debt.totalAmount || 0).toFixed(0)}</td>
                <td style="padding: 12px; text-align: right; color: #475569;">Rs ${(debt.paidAmount || 0).toFixed(0)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color: #dc2626;">Rs ${(debt.remainingAmount || 0).toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: right;">
          <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Outstanding Debt</p>
          <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 36px; font-weight: 800;">Rs ${totalDebt.toFixed(0)}</p>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">This is a computer-generated statement</p>
          <p style="margin: 5px 0 0 0;">POS System - Point of Sale Management</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt = {
      margin: 10,
      filename: `debt_statement_${customer.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  };

  // Group debts by customer
  const debtsByCustomer = customers.map((customer) => {
    const customerDebts = debts.filter(
      (d) => d.customerId._id === customer._id && d.remainingAmount > 0
    );
    const totalRemaining = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    return {
      customer,
      debts: customerDebts,
      totalRemaining,
    };
  })
    .filter((item) => item.totalRemaining > 0)
    .filter((item) =>
      item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.phone.includes(searchTerm)
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Header title="Debts" subtitle="Manage customer debts and payments" />

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 animate-slide-up">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-soft flex items-center gap-3 border border-gray-100 dark:border-gray-700">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search customers by name or phone..."
          className="flex-1 outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {loading && debts.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debts...</p>
        </div>
      ) : (
        <div className="mt-6">
          {debtsByCustomer.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-12 text-center border border-gray-100 dark:border-gray-700">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign size={40} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Outstanding Debts!</h3>
              <p className="text-gray-500 dark:text-gray-400">All customers have cleared their debts.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
              {/* Table Header - Hidden on Mobile */}
              <div className="hidden md:block bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="grid grid-cols-12 gap-4 text-white font-semibold text-sm">
                  <div className="col-span-4">Customer</div>
                  <div className="col-span-3">Contact</div>
                  <div className="col-span-2 text-right">Outstanding</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
              </div>

              {/* Customer Rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {debtsByCustomer.map((item) => (
                  <div key={item.customer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {/* Desktop View */}
                    <div className="hidden md:block px-6 py-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Customer Name */}
                        <div className="col-span-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                              {item.customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{item.customer.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.debts.length} transaction{item.debts.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="col-span-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{item.customer.phone}</p>
                          <p className="text-xs text-gray-400 truncate">{item.customer.address}</p>
                        </div>

                        {/* Outstanding Amount */}
                        <div className="col-span-2 text-right">
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">Rs {item.totalRemaining.toFixed(0)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
                        </div>

                        {/* Actions */}
                        <div className="col-span-3 flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPaymentModal({ customer: item.customer, debts: item.debts, totalRemaining: item.totalRemaining })}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm font-medium flex items-center gap-1 active:scale-95"
                          >
                            <DollarSign size={16} />
                            Pay
                          </button>
                          <button
                            onClick={() => downloadStatement(item.customer._id)}
                            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium flex items-center gap-1 active:scale-95"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => setExpandedCustomer(expandedCustomer === item.customer._id ? null : item.customer._id)}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm font-medium flex items-center gap-1 active:scale-95"
                          >
                            {expandedCustomer === item.customer._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {item.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.customer.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{item.customer.phone}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.debts.length} transaction{item.debts.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">Outstanding Debt</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">Rs {item.totalRemaining.toFixed(0)}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setPaymentModal({ customer: item.customer, debts: item.debts, totalRemaining: item.totalRemaining })}
                          className="col-span-2 px-3 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm font-medium flex items-center justify-center gap-1 active:scale-95"
                        >
                          <DollarSign size={16} />
                          Pay
                        </button>
                        <button
                          onClick={() => downloadStatement(item.customer._id)}
                          className="px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Download size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => setExpandedCustomer(expandedCustomer === item.customer._id ? null : item.customer._id)}
                        className="w-full mt-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm font-medium flex items-center justify-center gap-2 active:scale-95"
                      >
                        {expandedCustomer === item.customer._id ? (
                          <>
                            <ChevronUp size={16} />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            View Details
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedCustomer === item.customer._id && (
                      <div className="px-4 sm:px-6 pb-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 animate-slide-up">
                        <div className="pt-4">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <FileText size={16} />
                            Individual Transactions
                          </h4>

                          {/* Desktop Table View */}
                          <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Transaction ID</th>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                  <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Total</th>
                                  <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Paid</th>
                                  <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Remaining</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {item.debts.map((debt) => (
                                  <tr key={debt._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-3">
                                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                        {debt.transactionId?.transactionId?.substring(0, 12) || 'N/A'}...
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                      {new Date(debt.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                      Rs {(debt.totalAmount || 0).toFixed(0)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-medium">
                                      Rs {(debt.paidAmount || 0).toFixed(0)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-bold">
                                      Rs {(debt.remainingAmount || 0).toFixed(0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="sm:hidden space-y-3">
                            {item.debts.map((debt) => (
                              <div key={debt._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction ID</p>
                                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                      {debt.transactionId?.transactionId?.substring(0, 12) || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {new Date(debt.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      Rs {(debt.totalAmount || 0).toFixed(0)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Paid</p>
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                      Rs {(debt.paidAmount || 0).toFixed(0)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                      Rs {(debt.remainingAmount || 0).toFixed(0)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-slide-up">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Record Payment
            </h2>

            <div className="mb-6 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Customer</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-3">{paymentModal.customer.name}</p>
              <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Total Outstanding Debt</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">Rs {paymentModal.totalRemaining.toFixed(0)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{paymentModal.debts.length} transaction{paymentModal.debts.length > 1 ? 's' : ''}</p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bold text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRecordPayment}
                disabled={loading}
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <DollarSign size={18} />
                    Confirm Payment
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setPaymentModal(null);
                  setPaymentAmount('');
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;
