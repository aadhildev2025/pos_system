import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { BarChart3, TrendingUp, Banknote, AlertCircle } from 'lucide-react';
import { transactionAPI } from '../services/transactionAPI';
import { debtAPI } from '../services/debtAPI';
import Header from '../components/Header';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSales: 0,
    totalPaid: 0,
    pendingDebts: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, debtRes] = await Promise.all([
        transactionAPI.getAll(),
        debtAPI.getAll(),
      ]);

      setTransactions(txRes.data);
      setDebts(debtRes.data);

      // Calculate stats
      const totalTransactions = txRes.data.length;
      const totalSales = txRes.data
        .filter(tx => tx.type !== 'debt_payment')
        .reduce((sum, tx) => sum + tx.totalAmount, 0);
      const totalPaid = txRes.data.reduce((sum, tx) => sum + tx.paidAmount, 0);

      const customersWithDebt = new Set(debtRes.data
        .filter(d => d.remainingAmount > 0)
        .map(d => d.customerId._id)
      ).size;

      setStats({
        totalTransactions,
        totalSales,
        totalPaid,
        pendingDebts: customersWithDebt,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (period) => {
    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filteredTransactions = transactions.filter(
      (tx) => new Date(tx.createdAt) >= startDate
    );

    const totalAmount = filteredTransactions
      .filter(tx => tx.type !== 'debt_payment')
      .reduce((sum, tx) => sum + tx.totalAmount, 0);
    const totalPaidAmount = filteredTransactions.reduce((sum, tx) => sum + tx.paidAmount, 0);
    const totalDebtAmount = filteredTransactions.reduce((sum, tx) => sum + tx.debtAmount, 0);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #1e3a8a;">POS SYSTEM</h1>
        <h2 style="text-align: center; color: #3b82f6;">${period.toUpperCase()} REPORT</h2>
        <p style="text-align: center; color: #666;">Generated: ${new Date().toLocaleString()}</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Transactions</p>
            <p style="font-size: 24px; font-weight: bold; color: #1e40af;">${filteredTransactions.length}</p>
          </div>
          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Sales</p>
            <p style="font-size: 24px; font-weight: bold; color: #15803d;">Rs ${totalAmount.toFixed(0)}</p>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Paid</p>
            <p style="font-size: 24px; font-weight: bold; color: #b45309;">Rs ${totalPaidAmount.toFixed(0)}</p>
          </div>
          <div style="background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Debt</p>
            <p style="font-size: 24px; font-weight: bold; color: #991b1b;">Rs ${totalDebtAmount.toFixed(0)}</p>
          </div>
        </div>

        <h3 style="color: #1e40af; margin-top: 30px; margin-bottom: 15px;">Transaction Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Transaction ID</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Customer</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Paid</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Debt</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map((tx, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'}; border: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd;">${tx.transactionId.substring(0, 12)}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(tx.createdAt).toLocaleDateString()}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${tx.customerId?.name || 'N/A'}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">Rs ${tx.totalAmount.toFixed(0)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">Rs ${tx.paidAmount.toFixed(0)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">Rs ${tx.debtAmount.toFixed(0)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                  <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                    background: ${tx.paymentStatus === 'paid' ? '#dcfce7' : tx.paymentStatus === 'partial' ? '#fef3c7' : '#fee2e2'};
                    color: ${tx.paymentStatus === 'paid' ? '#15803d' : tx.paymentStatus === 'partial' ? '#b45309' : '#991b1b'};">
                    ${tx.paymentStatus.toUpperCase()}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #999; font-size: 12px;">Report Period: ${startDate.toLocaleDateString()} to ${new Date().toLocaleDateString()}</p>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt = {
      margin: 10,
      filename: `report_${period}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Header title="Dashboard" subtitle="System Overview & Analytics" />

      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-5 rounded-xl shadow-lg shadow-blue-500/20 card-hover border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">{stats.totalTransactions}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BarChart3 className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 sm:p-5 rounded-xl shadow-lg shadow-emerald-500/20 card-hover border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Sales</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">Rs. {stats.totalSales.toFixed(0)}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Banknote className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 sm:p-5 rounded-xl shadow-lg shadow-amber-500/20 card-hover border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">Total Paid</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">Rs. {stats.totalPaid.toFixed(0)}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 sm:p-5 rounded-xl shadow-lg shadow-rose-500/20 card-hover border border-rose-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">Pending Debts</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">{stats.pendingDebts}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertCircle className="text-white" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Report Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => generateReport('week')}
              className="btn-primary flex-1 sm:flex-none"
            >
              Week Report
            </button>
            <button
              onClick={() => generateReport('month')}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-soft hover:shadow-lg active:scale-95 flex-1 sm:flex-none"
            >
              Month Report
            </button>
            <button
              onClick={() => generateReport('year')}
              className="bg-gradient-to-r from-secondary-600 to-secondary-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-secondary-700 hover:to-secondary-800 transition-all shadow-soft hover:shadow-lg active:scale-95 flex-1 sm:flex-none"
            >
              Year Report
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <tr>
                    <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold">Transaction ID</th>
                    <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold">Customer</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold">Amount</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold">Paid</th>
                    <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.slice(0, 10).map((tx, index) => (
                    <tr key={tx._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm font-mono text-gray-700 dark:text-gray-300">{tx.transactionId.substring(0, 12)}</td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-white font-medium">{tx.customerId?.name || 'Walk-in'}</td>
                      <td className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Rs {tx.totalAmount.toFixed(0)}</td>
                      <td className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Rs {tx.paidAmount.toFixed(0)}</td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${tx.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : tx.paymentStatus === 'partial'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {tx.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction ID</p>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                        {tx.transactionId.substring(0, 12)}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${tx.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : tx.paymentStatus === 'partial'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {tx.paymentStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Customer</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{tx.customerId?.name || 'Walk-in Customer'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">Rs {tx.totalAmount.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Paid Amount</p>
                      <p className="text-base font-bold text-green-600 dark:text-green-400">Rs {tx.paidAmount.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
