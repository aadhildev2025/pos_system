import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Package, Plus, X, Search, AlertTriangle, Warehouse } from 'lucide-react';
import { toast } from 'react-toastify';
import storeProductAPI from '../services/storeProductAPI';
import Header from '../components/Header';

const Store = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        costPrice: '',
        quantity: '',
        barcode: '',
        category: '',
        notes: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });

    const isMobile = window.innerWidth < 640;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await storeProductAPI.getAll();
            setProducts(response.data.data);
        } catch (err) {
            setError('Failed to load store products');
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
            costPrice: '',
            quantity: '',
            barcode: '',
            category: '',
            notes: ''
        });
        setEditingId(null);
        setIsModalOpen(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.costPrice || formData.quantity === '') {
            const msg = 'Name, cost price, and quantity are required';
            if (isMobile) {
                toast.error(msg);
            } else {
                setError(msg);
            }
            return;
        }

        try {
            setLoading(true);
            if (editingId) {
                await storeProductAPI.update(editingId, formData);
                toast.success('Store product updated successfully');
            } else {
                await storeProductAPI.create(formData);
                toast.success('Store product added successfully');
            }
            fetchProducts();
            resetForm();
        } catch (err) {
            const msg = 'Failed to save store product';
            if (isMobile) {
                toast.error(msg);
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            costPrice: product.costPrice,
            quantity: product.quantity,
            barcode: product.barcode || '',
            category: product.category || '',
            notes: product.notes || ''
        });
        setEditingId(product._id);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            await storeProductAPI.delete(deleteModal.product._id);
            toast.success('Store product deleted successfully');
            fetchProducts();
            setDeleteModal({ isOpen: false, product: null });
        } catch (err) {
            toast.error('Failed to delete store product');
        }
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalValue = products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Header title="Store Inventory" subtitle="Manage warehouse products" />

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg border border-blue-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Total Products</p>
                            <p className="text-3xl font-bold text-white mt-1">{products.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Warehouse size={28} className="text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg border border-purple-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-100 font-medium">Total Quantity</p>
                            <p className="text-3xl font-bold text-white mt-1">{totalQuantity}</p>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Package size={28} className="text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg border border-green-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-100 font-medium">Total Value</p>
                            <p className="text-3xl font-bold text-white mt-1">Rs {totalValue.toFixed(0)}</p>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Package size={28} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Add Button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search store products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary px-6 py-3 flex items-center justify-center gap-2 shrink-0">
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            {/* Products Table */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Warehouse size={24} className="text-primary-600 dark:text-primary-400" />
                        Store Products ({filteredProducts.length})
                    </h2>
                </div>

                {loading && products.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading store products...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">No store products found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                                    <tr>
                                        <th className="p-4 text-left text-xs font-semibold">Product Name</th>
                                        <th className="p-4 text-left text-xs font-semibold">Category</th>
                                        <th className="p-4 text-left text-xs font-semibold">Barcode</th>
                                        <th className="p-4 text-right text-xs font-semibold">Cost Price</th>
                                        <th className="p-4 text-right text-xs font-semibold">Quantity</th>
                                        <th className="p-4 text-right text-xs font-semibold">Total Value</th>
                                        <th className="p-4 text-center text-xs font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredProducts.map((product, index) => (
                                        <tr key={product._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                            <td className="p-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{product.category || '-'}</td>
                                            <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-300">{product.barcode || '-'}</td>
                                            <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">Rs {product.costPrice.toFixed(0)}</td>
                                            <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">{product.quantity}</td>
                                            <td className="p-4 text-right font-bold text-primary-600 dark:text-primary-400">Rs {(product.costPrice * product.quantity).toFixed(0)}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(product)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleteModal({ isOpen: true, product })} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden">
                            {filteredProducts.map((product) => (
                                <div key={product._id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, product })} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-gray-500 dark:text-gray-400">Category:</div>
                                        <div className="text-right font-medium text-gray-700 dark:text-gray-300">{product.category || '-'}</div>
                                        <div className="text-gray-500 dark:text-gray-400">Cost Price:</div>
                                        <div className="text-right font-semibold text-gray-900 dark:text-white">Rs {product.costPrice.toFixed(0)}</div>
                                        <div className="text-gray-500 dark:text-gray-400">Quantity:</div>
                                        <div className="text-right font-semibold text-gray-900 dark:text-white">{product.quantity}</div>
                                        <div className="text-gray-500 dark:text-gray-400">Total Value:</div>
                                        <div className="text-right font-bold text-primary-600 dark:text-primary-400">Rs {(product.costPrice * product.quantity).toFixed(0)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
                        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
                            <h3 className="text-xl font-bold">{editingId ? 'Edit' : 'Add'} Store Product</h3>
                            <button onClick={resetForm} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
                                    <AlertTriangle size={20} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter product name" required />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cost Price (Rs) *</label>
                                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} onWheel={(e) => e.target.blur()} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0" min="0" step="0.01" required />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quantity *</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} onWheel={(e) => e.target.blur()} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0" min="0" required />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Barcode</label>
                                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter barcode (optional)" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="E.g., Electronics, Food (optional)" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" placeholder="Storage location or additional notes (optional)"></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 btn-primary px-6 py-3">
                                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Store Product</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to delete <span className="font-bold">{deleteModal.product?.name}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal({ isOpen: false, product: null })} className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;
