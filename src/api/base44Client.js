import axios from 'axios';

//const API_BASE_URL = 'http://localhost:3008/api/v1';
const API_BASE_URL = 'http://api.velocouriersvc.com/api/v1';
const API_KEY = 'your-api-key-here';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});




// Helper to extract error messages from axios response
export const getErrorMessage = (error) => {
  const data = error.response?.data;
  if (data) {
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (typeof data === 'object') return JSON.stringify(data);
  }
  return error.message || "An unexpected error occurred";
};

// Interceptor to add the user's phone number and location scope to every request
client.interceptors.request.use((config) => {
  const phone = localStorage.getItem('admin_phone');
  if (phone) {
    config.headers['x-user-phone'] = phone;
  }

  const countryScope = localStorage.getItem('v_country_scope');
  const cityScope = localStorage.getItem('v_city_scope');

  if (countryScope && countryScope !== 'All') {
    config.headers['x-country-scope'] = countryScope;
  }
  if (cityScope && cityScope !== 'All') {
    config.headers['x-city-scope'] = cityScope;
  }

  return config;
});

export const base44 = {
  auth: {
    async requestOtp(phoneNumber) {
      const response = await client.post('/auth/request-otp', { phoneNumber });
      return response.data;
    },
    async verifyOtp(phoneNumber, code) {
      const response = await client.post('/auth/verify-otp', { phoneNumber, code });
      return response.data;
    },
    async me() {
      const response = await client.get('/auth/me');
      return response.data;
    },
    async logout() {
      localStorage.removeItem('admin_phone');
      return true;
    },
  },
  entities: {
    Driver: {
      async list() {
        const response = await client.get('/admin/drivers');
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/drivers', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/drivers/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/drivers/${id}`);
        return response.status === 204;
      },
    },
    Rider: {
      async list() {
        const response = await client.get('/admin/users'); // Mapping riders to users for now
        return response.data;
      },
    },
    Merchant: {
      async list() {
        const response = await client.get('/admin/merchants');
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/merchants/${id}`, data);
        return response.data;
      },
      async updateProfile(id, data) {
        const response = await client.patch(`/admin/merchants/${id}/profile`, data);
        return response.data;
      },
    },
    Product: {
      async list(params = {}) {
        const response = await client.get('/admin/products', { params });
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/products/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/products/${id}`);
        return response.status === 200;
      },
    },
    Order: {
      async list() {
        const response = await client.get('/admin/rides');
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/rides/${id}`, data);
        return response.data;
      },
    },
    Zone: {
      async list() {
        const response = await client.get('/admin/zones');
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/zones', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/zones/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/zones/${id}`);
        return response.status === 204;
      },
    },
    PlatformSettings: {
      async list() {
        const response = await client.get('/admin/settings');
        return response.data;
      },
      async create(data) {
        // usually settings are created per country
        const response = await client.post('/admin/settings', data);
        return response.data;
      },
      async update(country, data) {
        const response = await client.put(`/admin/settings/${country}`, data);
        return response.data;
      },
    },
    PlatformWithdrawal: {
      async list() {
        const response = await client.get('/admin/withdrawals');
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/withdrawals', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/withdrawals/${id}`, data);
        return response.data;
      },
    },
    Waitlist: {
      async list() {
        const response = await client.get('/waitlist/entries');
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/waitlist/entries/${id}`);
        return response.status === 204;
      },
      async addCountry(data) {
        const response = await client.post('/waitlist/countries', data);
        return response.data;
      },
      async getCountries() {
        const response = await client.get('/waitlist/countries');
        return response.data;
      }
    },
    Staff: {
      async list() {
        const response = await client.get('/admin/staff');
        return response.data;
      },
      async update(data) {
        const response = await client.post('/admin/staff/update', data);
        return response.data;
      },
    },
    AuditLog: {
      async list(sort = '-created_date', limit = 100) {
        const response = await client.get('/admin/audit-logs', { params: { sort, limit } });
        return response.data;
      },
    },
    Simulate: {
      async createRide(data) {
        const response = await client.post('/admin/simulate/ride', data);
        return response.data;
      },
      async advanceRide(rideId) {
        const response = await client.patch(`/admin/simulate/ride/${rideId}/advance`);
        return response.data;
      },
    },
    Users: {
      async list() {
        const response = await client.get('/admin/users');
        return response.data;
      },
    },
    Drivers: {
      async list() {
        const response = await client.get('/admin/drivers');
        return response.data;
      },
    },
    Finance: {
      async listWallets(params = {}) {
        const response = await client.get('/admin/wallets', { params });
        return response.data;
      },
      async getTransactions(userId, params = {}) {
        const response = await client.get(`/admin/wallets/${userId}/transactions`, { params });
        return response.data;
      },
      async listAllTransactions(params = {}) {
        const response = await client.get('/admin/transactions', { params });
        return response.data;
      },
      async creditWallet(userId, data) {
        const response = await client.post(`/admin/credit-wallet/${userId}`, data);
        return response.data;
      },
      async debitWallet(userId, data) {
        const response = await client.post(`/admin/debit-wallet/${userId}`, data);
        return response.data;
      },
    },
    // Add other entities as needed...
  },
  Setup: {
    async createAdmin(data) {
      const response = await client.post('/setup/create-admin', data);
      return response.data;
    },
  },
};

