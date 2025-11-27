import api from './api';

export const transactionAPI = {
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  downloadReceipt: (id) => api.get(`/transactions/receipt/${id}`, { responseType: 'blob' }),
};
