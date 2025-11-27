import api from './api';

export const debtAPI = {
  getAll: () => api.get('/debts'),
  getByCustomer: (customerId) => api.get(`/debts/customer/${customerId}`),
  recordPayment: (debtId, data) => api.put(`/debts/${debtId}`, data),
  downloadStatement: (customerId) => api.get(`/debts/statement/${customerId}`, { responseType: 'blob' }),
};
