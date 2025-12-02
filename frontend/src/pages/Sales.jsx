import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Download, ShoppingCart, Plus, Minus, Trash2, Search, AlertCircle, CreditCard, Banknote } from 'lucide-react';
import { transactionAPI } from '../services/transactionAPI';
import { customerAPI } from '../services/customerAPI';
import { productAPI } from '../services/productAPI';
import Header from '../components/Header';

const Sales = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cusRes, prodRes] = await Promise.all([
        customerAPI.getAll(),
        productAPI.getAll(),
      ]);
      setCustomers(cusRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const triggerError = (message) => {
    setError(message);
    setToast({ show: true, message, type: 'error' });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      triggerError('Product is out of stock!');
      return;
    }

    const existingItem = cartItems.find((item) => item.productId === product._id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        triggerError('Not enough stock available!');
        return;
      }
      setCartItems(
        cartItems.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product._id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          maxQuantity: product.quantity
        },
      ]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cartItems.find(i => i.productId === productId);
    if (newQuantity > item.maxQuantity) {
      triggerError(`Only ${item.maxQuantity} items in stock`);
      return;
    }

    if (newQuantity <= 0) {
      setCartItems(cartItems.filter((item) => item.productId !== productId));
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  const handleCustomAdd = () => {
    if (!customAmount || parseFloat(customAmount) <= 0) {
      triggerError('Please enter a valid amount');
      return;
    }

    const customItem = {
      _id: `custom-${Date.now()}`,
      name: 'Custom Item',
      price: parseFloat(customAmount),
      quantity: 999999, // High stock for custom items
      isCustom: true
    };

    addToCart(customItem);
    setCustomAmount('');
    setToast({ show: true, message: 'Custom item added to cart', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const debtAmount = Math.max(0, totalAmount - (paidAmount ? parseFloat(paidAmount) : 0));

  // Get selected customer object
  const selectedCustomerObj = customers.find(c => c._id === selectedCustomer);
  const customerCreditBalance = selectedCustomerObj ? selectedCustomerObj.creditLimit - selectedCustomerObj.totalDebt : 0;

  const handleCheckout = async () => {
    // Validate cart
    if (cartItems.length === 0) {
      triggerError('Please add items to cart');
      return;
    }

    // Credit payment validation
    if (paymentMethod === 'credit') {
      if (!selectedCustomer) {
        triggerError('Credit sales require a registered customer. Please select a customer.');
        return;
      }

      // Check if customer has enough credit
      const customerDebt = totalAmount; // For credit, entire amount is debt
      if (customerCreditBalance < customerDebt) {
        triggerError(`Insufficient credit balance. Available: Rs ${customerCreditBalance.toFixed(0)}, Required: Rs ${customerDebt.toFixed(0)}`);
        return;
      }
    }

    // For cash, paid amount validation
    if (paymentMethod === 'cash' && (paidAmount === '' || parseFloat(paidAmount) < 0)) {
      triggerError('Please enter a valid paid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const transactionData = {
        customerId: selectedCustomer || null,
        items: cartItems.map((item) => ({
          productId: item.isCustom ? undefined : item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
        paidAmount: paymentMethod === 'credit' ? 0 : parseFloat(paidAmount),
        paymentMethod,
      };

      const response = await transactionAPI.create(transactionData);
      setReceiptData(response.data);
      setCartItems([]);
      setPaidAmount('');
      setSelectedCustomer('');
      setPaymentMethod('cash');

      // Refresh products to get updated stock
      const prodRes = await productAPI.getAll();
      setProducts(prodRes.data);

      // Refresh customers to get updated debt
      const cusRes = await customerAPI.getAll();
      setCustomers(cusRes.data);

    } catch (err) {
      console.error("Checkout Error:", err);
      triggerError(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!receiptData) return;

    const logoPath = new URL('../assets/logo.png', import.meta.url).href;

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Inter', sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px;">
          <img src="${logoPath}" style="width: 60px; height: 60px; margin-bottom: 10px;" crossorigin="anonymous" />
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">POS SYSTEM</h1>
          <p style="margin: 5px 0 0; color: #64748b; font-size: 12px;">Receipt #${receiptData.transactionId}</p>
          <p style="margin: 2px 0 0; color: #94a3b8; font-size: 12px;">${new Date(receiptData.createdAt).toLocaleString()}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #64748b;">Customer:</span>
            <span style="font-weight: 600; color: #0f172a;">${receiptData.customerId?.name || 'Walk-in Customer'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #64748b;">Payment:</span>
            <span style="font-weight: 600; color: #0f172a; text-transform: capitalize;">${receiptData.paymentMethod}</span>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Items Purchased</p>
          ${receiptData.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <div style="flex: 1;">
                <span style="display: block; color: #0f172a; font-weight: 500;">${item.productId?.name || 'Unknown Item'}</span>
                <span style="font-size: 11px; color: #64748b;">${item.quantity} x Rs ${item.price.toFixed(0)}</span>
              </div>
              <span style="font-weight: 600; color: #0f172a;">Rs ${(item.quantity * item.price).toFixed(0)}</span>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 2px dashed #e2e8f0; padding-top: 15px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #64748b;">
            <span>Subtotal</span>
            <span>Rs ${receiptData.totalAmount.toFixed(0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 18px; font-weight: 800; color: #0f172a;">
            <span>Total</span>
            <span>Rs ${receiptData.totalAmount.toFixed(0)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #64748b;">
            <span>Paid Amount</span>
            <span>Rs ${receiptData.paidAmount.toFixed(0)}</span>
          </div>

          ${receiptData.paidAmount > receiptData.totalAmount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #16a34a; font-weight: 600;">
              <span>Change</span>
              <span>Rs ${(receiptData.paidAmount - receiptData.totalAmount).toFixed(0)}</span>
            </div>
          ` : ''}

          ${receiptData.debtAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #dc2626; font-weight: 600;">
              <span>Balance Due</span>
              <span>Rs ${receiptData.debtAmount.toFixed(0)}</span>
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
      filename: `receipt_${receiptData.transactionId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Header title="Sales" subtitle="Record new sales transactions" />

      {/* Toast Notification - Bottom Center */}
      {toast.show && (
        <div key={Date.now()} className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up ${toast.type === 'error' ? 'md:hidden' : ''}`}>
          <div className={`
            px-6 py-4 rounded-xl shadow-2xl backdrop-blur-lg border-2 flex items-center gap-3 min-w-[280px] max-w-[90vw]
            ${toast.type === 'error'
              ? 'bg-red-500/95 border-red-400 text-white'
              : 'bg-green-500/95 border-green-400 text-white'
            }
          `}>
            <AlertCircle size={24} className="flex-shrink-0" />
            <p className="font-semibold text-sm sm:text-base">{toast.message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="hidden md:flex mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg items-center gap-2 animate-slide-up">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {error}
        </div>
      )}

      {receiptData ? (
        // Receipt Popup - Mobile Responsive
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="text-center mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent mb-2">
                Receipt
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Point of Sale Transaction</p>
            </div>

            <div className="space-y-4 mb-8">
              {/* Transaction ID */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm font-medium">Transaction ID</span>
                <span className="font-mono text-sm font-bold text-gray-800 bg-gray-50 px-3 py-1 rounded">
                  {receiptData.transactionId}
                </span>
              </div>

              {/* Customer */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm font-medium">Customer</span>
                <span className="font-semibold text-gray-800">
                  {receiptData.customerId?.name || 'Walk-in Customer'}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm font-medium">Payment Method</span>
                <span className="font-semibold text-gray-800 capitalize bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs">
                  {receiptData.paymentMethod}
                </span>
              </div>

              {/* Date */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm font-medium">Date</span>
                <span className="font-medium text-gray-600 text-sm">
                  {new Date(receiptData.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Items Section */}
              <div className="border-b border-gray-200 pb-4 pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Items Purchased</p>
                <div className="space-y-3">
                  {receiptData.items.map((item) => (
                    <div key={item._id} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.productId?.name || 'Unknown Product'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.quantity} × Rs {item.price.toFixed(0)} = Rs {(item.quantity * item.price).toFixed(0)}
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 ml-3">
                        Rs {(item.quantity * item.price).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl space-y-3 border border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">Rs {receiptData.totalAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Paid Amount</span>
                  <span className="font-semibold">Rs {receiptData.paidAmount.toFixed(0)}</span>
                </div>

                {receiptData.paidAmount > receiptData.totalAmount && (
                  <div className="flex justify-between text-sm text-green-600 font-bold pt-2 border-t border-gray-200">
                    <span>Change</span>
                    <span>Rs {(receiptData.paidAmount - receiptData.totalAmount).toFixed(0)}</span>
                  </div>
                )}

                {receiptData.debtAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 font-bold pt-2 border-t border-gray-200">
                    <span>Balance Due</span>
                    <span>Rs {receiptData.debtAmount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-300">
                  <span>TOTAL</span>
                  <span>Rs {receiptData.totalAmount.toFixed(0)}</span>
                </div>

                {/* Payment Status Badge */}
                {receiptData.paymentStatus && (
                  <div className="text-center pt-2">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                      ${receiptData.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        receiptData.paymentStatus === 'partial' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'}`}>
                      {receiptData.paymentStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Debt Summary (if applicable) */}
              {receiptData.customerId && receiptData.debtAmount > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Account Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Previous Balance:</span>
                      <span className="font-semibold text-gray-900">
                        Rs {((receiptData.customerId.totalDebt || 0) - (receiptData.debtAmount || 0)).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">This Transaction:</span>
                      <span className="font-semibold text-red-600">
                        Rs {receiptData.debtAmount.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-red-200">
                      <span className="text-red-700">Total Outstanding:</span>
                      <span className="text-red-700">
                        Rs {receiptData.customerId.totalDebt.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={downloadReceipt}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
              >
                <Download size={18} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Add Custom Amount */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-primary-600 dark:text-primary-400" />
                Quick Add Amount
              </h2>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bold text-gray-900 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                  />
                </div>
                <button
                  onClick={handleCustomAdd}
                  className="btn-primary px-6 py-3 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={20} />
                  Add
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-soft flex items-center gap-3 border border-gray-100 dark:border-gray-700">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                className="flex-1 outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-soft card-hover border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                <ShoppingCart size={24} className="text-primary-600 dark:text-primary-400" />
                Select Products
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    className={`
                      text-left p-4 border rounded-xl transition-all duration-200 group relative overflow-hidden
                      ${product.quantity <= 0
                        ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-1">{product.name}</h3>
                        <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold px-2 py-1 rounded-full">
                          Rs {product.price.toFixed(0)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{product.supplier}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${product.quantity > 10 ? 'bg-green-500' : product.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        <span className={`${product.quantity <= 5 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-soft sticky top-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">Current Sale</h2>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Customer (Optional for Cash)</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cart Items ({cartItems.length})</label>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Cart is empty</p>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.productId} className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-between group">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rs {item.price.toFixed(0)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-600 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-500 rounded shadow-sm text-gray-600 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-500 rounded shadow-sm text-gray-600 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>Rs {totalAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold text-primary-700">
                  <span>Total</span>
                  <span>Rs {totalAmount.toFixed(0)}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`
                        py-3 rounded-lg text-sm font-medium capitalize transition-all flex items-center justify-center gap-2
                        ${paymentMethod === 'cash'
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-2 border-primary-500 dark:border-primary-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      <Banknote size={18} />
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('credit')}
                      className={`
                        py-3 rounded-lg text-sm font-medium capitalize transition-all flex items-center justify-center gap-2
                        ${paymentMethod === 'credit'
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-2 border-primary-500 dark:border-primary-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      <CreditCard size={18} />
                      Credit
                    </button>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount Paid</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs</span>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                    {debtAmount > 0 && paidAmount && (
                      <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Balance Due: Rs {debtAmount.toFixed(0)}
                      </p>
                    )}
                    {paidAmount && parseFloat(paidAmount) > totalAmount && (
                      <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                        <AlertCircle size={14} />
                        Change to Return: Rs {(parseFloat(paidAmount) - totalAmount).toFixed(0)}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'credit' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    {selectedCustomer ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Credit Limit:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">Rs {selectedCustomerObj?.creditLimit.toFixed(0) || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current Debt:</span>
                          <span className="font-semibold text-red-600">Rs {selectedCustomerObj?.totalDebt.toFixed(0) || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-800">
                          <span className="font-bold text-gray-700 dark:text-gray-300">Available Credit:</span>
                          <span className={`font-bold ${customerCreditBalance >= totalAmount ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            Rs {customerCreditBalance.toFixed(0)}
                          </span>
                        </div>
                        {totalAmount > customerCreditBalance && (
                          <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Insufficient credit balance!
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <AlertCircle size={16} className="text-blue-500" />
                        Please select a registered customer for credit sales
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || cartItems.length === 0}
                className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  'Complete Sale'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
