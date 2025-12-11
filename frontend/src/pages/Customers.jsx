import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Users, Plus, X, Search, Filter, Phone, MessageCircle, MapPin, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { customerAPI } from '../services/customerAPI';
import { transactionAPI } from '../services/transactionAPI';
import Header from '../components/Header';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    creditLimit: '',
    initialDebt: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, customer: null });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      whatsappNumber: '',
      address: '',
      creditLimit: '',
      initialDebt: '',
    });
    setEditingId(null);
    setIsModalOpen(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await customerAPI.update(editingId, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerAPI.create(formData);
        toast.success('Customer added successfully');
      }
      fetchCustomers();
      resetForm();
    } catch (err) {
      toast.error('Failed to save customer');
      setError('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setEditingId(customer._id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (customer) => {
    setDeleteModal({ isOpen: true, customer });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.customer) return;

    try {
      await customerAPI.delete(deleteModal.customer._id);
      fetchCustomers();
      setDeleteModal({ isOpen: false, customer: null });
      toast.success('Customer deleted successfully');
    } catch (err) {
      setError('Failed to delete customer');
      toast.error('Failed to delete customer');
      setDeleteModal({ isOpen: false, customer: null });
    }
  };

  const handleDownloadTransactions = async (customer) => {
    try {
      const response = await transactionAPI.downloadCustomerTransactionsPDF(customer._id);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${customer.name}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Transaction history downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download transaction history');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <Header title="Customers" subtitle="Manage customer information" />

      {/* Add Customer Button and Search/Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 sm:justify-end">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-gray-800 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <Filter size={16} />
            <span>{filteredCustomers.length} Customers</span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold">Address</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">Credit Limit</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">Debt</th>
                <th className="px-6 py-4 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-3 font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{customer.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Phone size={14} className="text-gray-400" />
                          {customer.phone}
                        </div>
                        {customer.whatsappNumber && (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <MessageCircle size={14} />
                            {customer.whatsappNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{customer.address || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                      Rs {customer.creditLimit ? customer.creditLimit.toFixed(0) : '0'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${customer.totalDebt > 0 ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                        Rs {customer.totalDebt.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadTransactions(customer)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="Download Transaction History"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {loading && customers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No customers found</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{customer.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <Phone size={14} className="text-gray-400" />
                      {customer.phone}
                    </div>
                    {customer.whatsappNumber && (
                      <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                        <MessageCircle size={14} />
                        {customer.whatsappNumber}
                      </div>
                    )}
                  </div>
                </div>

                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Credit Limit</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Rs {customer.creditLimit ? customer.creditLimit.toFixed(0) : '0'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outstanding Debt</p>
                    <p className={`text-sm font-bold ${customer.totalDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      Rs {customer.totalDebt.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all active:scale-95"
                  >
                    <Edit2 size={16} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDownloadTransactions(customer)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <FileText size={16} />
                    <span className="text-sm font-medium">History</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(customer)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all active:scale-95"
                  >
                    <Trash2 size={16} />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-100 dark:border-gray-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {editingId ? <Edit2 size={20} className="text-primary-600 dark:text-primary-400" /> : <Plus size={20} className="text-primary-600 dark:text-primary-400" />}
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">WhatsApp</label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Full Address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs</span>
                    <input
                      type="number"
                      name="creditLimit"
                      value={formData.creditLimit}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    <span>{editingId ? 'Add Debt' : 'Initial Debt'}</span>
                    <span className="text-[10px] opacity-70 normal-case bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded ml-2">Optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs</span>
                    <input
                      type="number"
                      name="initialDebt"
                      value={formData.initialDebt}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  {editingId && formData.initialDebt && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      This will be added to existing debt
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
              </div>

              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Delete Customer?
              </h3>

              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{deleteModal.customer?.name}</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, customer: null })}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
