import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Download, DollarSign, FileText, ChevronDown, ChevronUp, AlertCircle, Search, X, Calendar, Bell } from 'lucide-react';
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
  const [dueDate, setDueDate] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDueDateModal, setEditDueDateModal] = useState(null);
  const [showReminders, setShowReminders] = useState(true);

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
        dueDate: dueDate || null,
      });
      fetchData();
      setPaymentModal(null);
      setPaymentAmount('');
      setDueDate('');
      setError('');
    } catch (err) {
      setError('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!editDueDateModal) return;

    try {
      setLoading(true);
      await debtAPI.updateDueDate(editDueDateModal.debtId, editDueDateModal.dueDate);
      fetchData();
      setEditDueDateModal(null);
      setError('');
    } catch (err) {
      setError('Failed to update due date');
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
      (d) => d.customerId && d.customerId._id === customerId && d.remainingAmount > 0
    );

    if (customerDebts.length === 0) {
      setError('No outstanding debts for this customer');
      return;
    }

    const totalDebt = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

    const logoPath = new URL('../assets/logo.png', import.meta.url).href;

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; background: white;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 25px; border-bottom: 3px solid #0ea5e9;">
          <img src="${logoPath}" style="width: 100px; height: 100px; margin: 0 auto 15px auto; display: block;" crossorigin="anonymous" />
          <h1 style="color: #0ea5e9; margin: 0 0 8px 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Sarfan Stores</h1>
          <p style="color: #64748b; margin: 0; font-size: 14px; font-weight: 500;">KK Street, Puttalam</p>
          <p style="color: #64748b; margin: 3px 0 0 0; font-size: 13px;">Tel: +94752255989 / +94723806943</p>
          <div style="margin-top: 20px; padding: 12px 20px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); border-radius: 8px; display: inline-block;">
            <h2 style="color: white; margin: 0; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Customer Debt Statement</h2>
          </div>
          <p style="color: #94a3b8; margin: 12px 0 0 0; font-size: 13px; font-weight: 500;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <!-- Customer Information Card -->
        <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #0ea5e9; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <h3 style="color: #1e293b; margin: 0 0 18px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
            <span style="background: #0ea5e9; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 16px;">👤</span>
            Customer Information
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 140px; font-size: 14px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; margin-right: 8px;"></span>
                Name:
              </td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 700; font-size: 15px;">${customer.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; font-size: 14px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; margin-right: 8px;"></span>
                Phone:
              </td>
              <td style="padding: 10px 0; color: #0f172a; font-size: 14px;">${customer.phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; font-size: 14px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; margin-right: 8px;"></span>
                Address:
              </td>
              <td style="padding: 10px 0; color: #0f172a; font-size: 14px;">${customer.address || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; font-size: 14px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 8px;"></span>
                Credit Limit:
              </td>
              <td style="padding: 10px 0; color: #10b981; font-weight: 700; font-size: 15px;">Rs ${(customer.creditLimit || 0).toFixed(0)}</td>
            </tr>
          </table>
        </div>

        <!-- Outstanding Debts Table -->
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">📋 Outstanding Debts</h3>
        <div style="overflow: hidden; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white;">
                <th style="padding: 14px 12px; text-align: left; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Transaction ID</th>
                <th style="padding: 14px 12px; text-align: left; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
                <th style="padding: 14px 12px; text-align: left; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</th>
                <th style="padding: 14px 12px; text-align: right; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                <th style="padding: 14px 12px; text-align: right; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Paid</th>
                <th style="padding: 14px 12px; text-align: right; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${customerDebts.map((debt, idx) => {
      const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
      const today = new Date();
      const isOverdue = dueDate && dueDate < today;
      const dueDateText = dueDate ? dueDate.toLocaleDateString('en-GB') : 'Not Set';
      const dueDateColor = isOverdue ? '#dc2626' : dueDate ? '#f59e0b' : '#94a3b8';

      return `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 14px 12px; font-family: 'Courier New', monospace; font-size: 12px; color: #475569; font-weight: 600;">#${debt.transactionId?.transactionId?.substring(0, 12) || 'N/A'}</td>
                  <td style="padding: 14px 12px; color: #475569; font-size: 13px;">${new Date(debt.createdAt).toLocaleDateString('en-GB')}</td>
                  <td style="padding: 14px 12px; color: ${dueDateColor}; font-size: 13px; font-weight: 600;">${dueDateText}${isOverdue ? ' ⚠️' : ''}</td>
                  <td style="padding: 14px 12px; text-align: right; color: #0f172a; font-weight: 600; font-size: 14px;">Rs ${(debt.totalAmount || 0).toFixed(0)}</td>
                  <td style="padding: 14px 12px; text-align: right; color: #10b981; font-weight: 600; font-size: 14px;">Rs ${(debt.paidAmount || 0).toFixed(0)}</td>
                  <td style="padding: 14px 12px; text-align: right; font-weight: 700; color: #dc2626; font-size: 15px;">Rs ${(debt.remainingAmount || 0).toFixed(0)}</td>
                </tr>
              `;
    }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Total Outstanding Debt -->
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 3px solid #ef4444; border-radius: 16px; padding: 25px; text-align: center; box-shadow: 0 6px 16px rgba(239, 68, 68, 0.2);">
          <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">⚠️ Total Outstanding Debt</p>
          <p style="margin: 10px 0 0 0; color: #dc2626; font-size: 42px; font-weight: 900; letter-spacing: -1px;">Rs ${totalDebt.toFixed(0)}</p>
          <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 12px; font-weight: 600;">${customerDebts.length} Pending Transaction${customerDebts.length !== 1 ? 's' : ''}</p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 500;">This is a computer-generated statement and does not require a signature.</p>
          <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 600;">Sarfan Stores - Point of Sale Management System</p>
          <p style="margin: 5px 0 0 0; color: #cbd5e1; font-size: 11px;">Printed on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString()}</p>
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

  // Helper function to get due date status
  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', label: 'Overdue', color: 'red', days: Math.abs(diffDays) };
    } else if (diffDays <= 3) {
      return { status: 'due-soon', label: 'Due Soon', color: 'yellow', days: diffDays };
    } else {
      return { status: 'on-track', label: 'On Track', color: 'green', days: diffDays };
    }
  };

  // Group debts by customer
  const debtsByCustomer = customers.map((customer) => {
    const customerDebts = debts.filter(
      (d) => d.customerId && d.customerId._id === customer._id && d.remainingAmount > 0
    );
    const totalRemaining = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

    // Find the earliest due date and its status
    const debtsWithDueDate = customerDebts.filter(d => d.dueDate);
    let earliestDueDate = null;
    let dueDateStatus = null;

    if (debtsWithDueDate.length > 0) {
      earliestDueDate = debtsWithDueDate.reduce((earliest, debt) => {
        return new Date(debt.dueDate) < new Date(earliest.dueDate) ? debt : earliest;
      }).dueDate;
      dueDateStatus = getDueDateStatus(earliestDueDate);
    }

    return {
      customer,
      debts: customerDebts,
      totalRemaining,
      earliestDueDate,
      dueDateStatus,
    };
  })
    .filter((item) => item.totalRemaining > 0)
    .filter((item) =>
      item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.phone.includes(searchTerm)
    );

  // Get debts that need reminders (overdue or due soon)
  const reminderDebts = debtsByCustomer.filter(
    (item) => item.dueDateStatus && (item.dueDateStatus.status === 'overdue' || item.dueDateStatus.status === 'due-soon')
  ).sort((a, b) => {
    // Sort overdue first, then by days
    if (a.dueDateStatus.status === 'overdue' && b.dueDateStatus.status !== 'overdue') return -1;
    if (a.dueDateStatus.status !== 'overdue' && b.dueDateStatus.status === 'overdue') return 1;
    return a.dueDateStatus.days - b.dueDateStatus.days;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Header title="Debts" subtitle="Manage customer debts and payments" />

      {/* Collection Reminders Banner */}
      {showReminders && reminderDebts.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 dark:border-orange-600 p-4 rounded-lg shadow-soft animate-slide-up">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Bell className="text-orange-600 dark:text-orange-400 animate-pulse" size={24} />
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200">
                Collection Reminders ({reminderDebts.length})
              </h3>
            </div>
            <button
              onClick={() => setShowReminders(false)}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reminderDebts.map((item) => (
              <div
                key={item.customer._id}
                className={`p-3 rounded-lg border-2 ${item.dueDateStatus.status === 'overdue'
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                  }`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded-md text-xs font-bold ${item.dueDateStatus.status === 'overdue'
                      ? 'bg-red-600 text-white'
                      : 'bg-yellow-600 text-white'
                      }`}>
                      {item.dueDateStatus.status === 'overdue'
                        ? `${item.dueDateStatus.days}d OVERDUE`
                        : `DUE IN ${item.dueDateStatus.days}d`
                      }
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{item.customer.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{item.customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Amount Due</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      Rs {item.totalRemaining.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                              {item.earliestDueDate && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Calendar size={12} className="text-gray-400" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Due: {new Date(item.earliestDueDate).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => setEditDueDateModal({
                                      debtId: item.debts[0]._id,
                                      dueDate: item.earliestDueDate,
                                      customerName: item.customer.name
                                    })}
                                    className="text-primary-600 hover:text-primary-700 ml-1"
                                    title="Edit due date"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
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
                          {item.earliestDueDate && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${item.dueDateStatus.status === 'overdue'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : item.dueDateStatus.status === 'due-soon'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                }`}>
                                <Calendar size={12} />
                                {new Date(item.earliestDueDate).toLocaleDateString()}
                              </div>
                              <button
                                onClick={() => setEditDueDateModal({
                                  debtId: item.debts[0]._id,
                                  dueDate: item.earliestDueDate,
                                  customerName: item.customer.name
                                })}
                                className="text-primary-600 hover:text-primary-700"
                                title="Edit due date"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          )}
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
                  onWheel={(e) => e.target.blur()}
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

      {/* Edit Due Date Modal */}
      {editDueDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-slide-up">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Edit Due Date
            </h2>

            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Customer</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{editDueDateModal.customerName}</p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Collection Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  value={editDueDateModal.dueDate ? new Date(editDueDateModal.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditDueDateModal({ ...editDueDateModal, dueDate: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpdateDueDate}
                disabled={loading}
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Calendar size={18} />
                    Update Due Date
                  </span>
                )}
              </button>
              <button
                onClick={() => setEditDueDateModal(null)}
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
