import api from './api';

const analyticsAPI = {
    getProfit: () => api.get('/analytics/profit')
};

export default analyticsAPI;
