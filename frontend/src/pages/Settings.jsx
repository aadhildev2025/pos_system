import React, { useState, useEffect } from 'react';
import { Lock, Save, Key, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import { authAPI } from '../services/authAPI';
import { toast } from 'react-toastify';
import Header from '../components/Header';

const Settings = () => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Debounced password check
    useEffect(() => {
        const verifyPassword = async () => {
            if (!passwordData.currentPassword) {
                setIsCurrentPasswordValid(null);
                return;
            }

            setIsChecking(true);
            try {
                const response = await authAPI.verifyPassword(passwordData.currentPassword);
                setIsCurrentPasswordValid(response.data.isValid);
            } catch (error) {
                console.error("Verification failed", error);
                setIsCurrentPasswordValid(false);
            } finally {
                setIsChecking(false);
            }
        };

        const timer = setTimeout(() => {
            if (passwordData.currentPassword.length > 0) {
                verifyPassword();
            } else {
                setIsCurrentPasswordValid(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [passwordData.currentPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords don't match");
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        if (isCurrentPasswordValid === false) {
            toast.error("Current password is incorrect");
            setLoading(false);
            return;
        }

        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success("Password changed successfully");
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setIsCurrentPasswordValid(null);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <Header title="Settings" subtitle="Security & Preferences" />

            <div className="mt-8 max-w-4xl mx-auto">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50">

                    {/* Premium Header */}
                    <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="relative z-10 flex items-center gap-5 text-white">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
                                <Shield size={28} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Security Settings</h2>
                                <p className="text-primary-100 text-sm mt-1 font-medium opacity-90">Manage your account protection</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 sm:p-12">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Current Password */}
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                    Current Password
                                </label>
                                <div className="relative transition-all duration-300 transform group-hover:-translate-y-0.5">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handleChange}
                                        className={`w-full pl-12 pr-12 py-3.5 bg-gray-50/50 dark:bg-gray-900/50 border rounded-xl focus:ring-4 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium
                                            ${isCurrentPasswordValid === true
                                                ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
                                                : isCurrentPasswordValid === false
                                                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20 group-hover:border-gray-300 dark:group-hover:border-gray-500'
                                            }`}
                                        placeholder="Enter your current password"
                                        required
                                    />

                                    {/* Validation Status */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                        {isChecking ? (
                                            <Loader2 size={20} className="text-primary-500 animate-spin" />
                                        ) : isCurrentPasswordValid === true ? (
                                            <div className="flex items-center gap-2 text-green-500 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-md">Verified</span>
                                                <CheckCircle size={20} className="fill-green-100 dark:fill-green-900/20" />
                                            </div>
                                        ) : isCurrentPasswordValid === false ? (
                                            <div className="flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-md">Incorrect</span>
                                                <XCircle size={20} className="fill-red-100 dark:fill-red-900/20" />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                        New Password
                                    </label>
                                    <div className="relative transition-all duration-300 transform group-hover:-translate-y-0.5">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                            <Key size={20} />
                                        </div>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium group-hover:border-gray-300 dark:group-hover:border-gray-500"
                                            placeholder="Min. 6 characters"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative transition-all duration-300 transform group-hover:-translate-y-0.5">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                            <Key size={20} />
                                        </div>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium group-hover:border-gray-300 dark:group-hover:border-gray-500"
                                            placeholder="Re-enter password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end border-t border-gray-100 dark:border-gray-700 mt-8">
                                <button
                                    type="submit"
                                    disabled={loading || isCurrentPasswordValid === false}
                                    className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3.5 font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <div className="relative flex items-center gap-2">
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                <span>Update Password</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
