import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import analyticsAPI from '../services/analyticsAPI';
import Header from '../components/Header';

const ProfitLoss = () => {
    const [profitData, setProfitData] = useState({
        today: { profit: 0, margin: 0, revenue: 0, cogs: 0, transactions: 0 },
        week: { profit: 0, margin: 0, revenue: 0, cogs: 0, transactions: 0 },
        month: { profit: 0, margin: 0, revenue: 0, cogs: 0, transactions: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfitData();
    }, []);

    const fetchProfitData = async () => {
        try {
            setLoading(true);
            const response = await analyticsAPI.getProfit();
            if (response.data && response.data.data) {
                setProfitData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching profit data:', error);
        } finally {
            setLoading(false);
        }
    };

    const ProfitCard = ({ title, data, icon: Icon, gradient, iconBg, textColor }) => (
        <div className={`glass p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 ${gradient}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${iconBg}`}>
                        <Icon size={24} className={textColor} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{data.transactions} transactions</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Profit */}
                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net Profit</p>
                            <p className={`text-3xl font-bold ${data.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                Rs {data.profit.toFixed(0)}
                            </p>
                        </div>
                        {data.profit >= 0 ? (
                            <TrendingUp size={32} className="text-green-500" />
                        ) : (
                            <TrendingDown size={32} className="text-red-500" />
                        )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${data.margin >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {data.margin.toFixed(1)}% Margin
                        </span>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Revenue</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Rs {data.revenue.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">COGS</span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Rs {data.cogs.toFixed(0)}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const ComparisonTable = () => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 size={24} />
                    Detailed Breakdown
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Period</th>
                            <th className="p-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Transactions</th>
                            <th className="p-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                            <th className="p-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">COGS</th>
                            <th className="p-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Profit</th>
                            <th className="p-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {[
                            { label: 'Today', data: profitData.today, icon: '📅' },
                            { label: 'This Week', data: profitData.week, icon: '📊' },
                            { label: 'This Month', data: profitData.month, icon: '📈' }
                        ].map((period, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="p-4 font-semibold text-gray-900 dark:text-white">
                                    <span className="flex items-center gap-2">
                                        <span>{period.icon}</span>
                                        {period.label}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{period.data.transactions}</td>
                                <td className="p-4 text-right font-semibold text-blue-600 dark:text-blue-400">Rs {period.data.revenue.toFixed(0)}</td>
                                <td className="p-4 text-right font-semibold text-orange-600 dark:text-orange-400">Rs {period.data.cogs.toFixed(0)}</td>
                                <td className={`p-4 text-right font-bold ${period.data.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    Rs {period.data.profit.toFixed(0)}
                                </td>
                                <td className={`p-4 text-right font-bold ${period.data.margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {period.data.margin.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <Header title="Profit & Loss" subtitle="Financial Performance Analytics" />
                <button
                    onClick={fetchProfitData}
                    className="btn-primary px-4 py-2 flex items-center gap-2"
                    disabled={loading}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading profit data...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Profit Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <ProfitCard
                            title="Today's Performance"
                            data={profitData.today}
                            icon={Calendar}
                            gradient="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                            iconBg="bg-green-100 dark:bg-green-800/50"
                            textColor="text-green-600 dark:text-green-400"
                        />
                        <ProfitCard
                            title="Weekly Performance"
                            data={profitData.week}
                            icon={ShoppingCart}
                            gradient="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
                            iconBg="bg-blue-100 dark:bg-blue-800/50"
                            textColor="text-blue-600 dark:text-blue-400"
                        />
                        <ProfitCard
                            title="Monthly Performance"
                            data={profitData.month}
                            icon={BarChart3}
                            gradient="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                            iconBg="bg-purple-100 dark:bg-purple-800/50"
                            textColor="text-purple-600 dark:text-purple-400"
                        />
                    </div>

                    {/* Comparison Table */}
                    <ComparisonTable />

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="glass p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                                Revenue
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Total amount collected from sales. Only includes actual payments received, excluding unpaid debts.
                            </p>
                        </div>

                        <div className="glass p-6 rounded-xl border border-orange-100 dark:border-orange-800/30 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <ShoppingCart size={20} className="text-orange-600 dark:text-orange-400" />
                                COGS
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Cost of Goods Sold - the total cost of products sold, calculated from product cost prices.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfitLoss;
