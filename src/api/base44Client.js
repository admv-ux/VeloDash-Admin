import axios from 'axios';

//export const API_BASE_URL = 'http://localhost:3008/api/v1';
//const API_BASE_URL = 'http://localhost:3008/api/v1';
export const API_BASE_URL = 'https://api.velocouriersvc.com/api/v1';

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
      async verify(id, action, rejectionReason) {
        const response = await client.post(`/admin/drivers/${id}/verify`, {
          action,
          rejection_reason: rejectionReason,
        });
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
      async create(data) {
        const response = await client.post('/admin/merchants', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/merchants/${id}`, data);
        return response.data;
      },
      async syncAll() {
        const response = await client.post("/admin/merchants/sync");
        return response.data;
      },
      async updateProfile(id, data) {
        const response = await client.patch(`/admin/merchants/${id}/profile`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/merchants/${id}`);
        return response.status === 204;
      },
    },
    Product: {
      async list(params = {}) {
        const response = await client.get('/admin/products', { params });
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/products', data);
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
    ProductCategory: {
      async list(type) {
        const response = await client.get('/admin/product-categories', { params: { type } });
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/product-categories', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/product-categories/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/product-categories/${id}`);
        return response.status === 204;
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
        const response = await client.put(`/admin/zones/${id}`, data);
        return response.data;
      },
      async patch(id, data) {
        const response = await client.patch(`/admin/zones/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/zones/${id}`);
        return response.status === 204;
      },
    },
    Surge: {
      async updateGlobal(data) {
        const response = await client.post('/admin/surge/global', data);
        return response.data;
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
    VehiclePricing: {
      async list(country) {
        const params = country ? { country } : {};
        const response = await client.get('/admin/vehicle-pricing', { params });
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/vehicle-pricing/${id}`, data);
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
      async updateCountry(id, data) {
        const response = await client.patch(`/waitlist/countries/${id}`, data);
        return response.data;
      },
      async deleteCountry(id) {
        const response = await client.delete(`/waitlist/countries/${id}`);
        return response.status === 204;
      },
      async getCountries(all = false) {
        const response = await client.get('/waitlist/countries', { params: { all } });
        const data = response.data;
        return Array.isArray(data) ? data : (data?.countries || []);
      }
    },
    Staff: {
      async list() {
        const response = await client.get('/admin/staff');
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/staff', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/staff/${id}`, data);
        return response.data;
      },
    },
    Category: {
      async list() {
        const response = await client.get('/admin/categories');
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/categories', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/categories/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/categories/${id}`);
        return response.status === 204;
      },
    },
    AuditLog: {
      async list(sort = '-created_date', limit = 100) {
        const response = await client.get('/admin/audit-logs', { params: { sort, limit } });
        return response.data;
      },
      async clear() {
        const response = await client.delete('/admin/audit-logs');
        return response.status === 204;
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
      async updateRoles(id, roles) {
        const response = await client.put(`/admin/users/${id}/roles`, { roles });
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
      async approvePayout(id) {
        const response = await client.patch(`/admin/payouts/${id}/approve`);
        return response.data;
      },
      async rejectPayout(id, reason = '') {
        const response = await client.patch(`/admin/payouts/${id}/reject`, { reason });
        return response.data;
      },
    },
    Dashboard: {
      async getStats() {
        const response = await client.get('/admin/dashboard');
        return response.data;
      },
      async getReport(params = {}) {
        const response = await client.get('/admin/revenue-report', { params });
        return response.data;
      },
      async getFinancialOverview(params = {}) {
        const response = await client.get('/admin/reports/financial-overview', { params });
        return response.data;
      },
    },
    Service: {
      async listProviders(params = {}) {
        const response = await client.get('/admin/services/providers', { params });
        return response.data;
      },
      async listBookings(params = {}) {
        const response = await client.get('/admin/services/bookings', { params });
        return response.data;
      },
      async getStats() {
        const response = await client.get('/admin/services/stats');
        return response.data;
      },
      async approveProvider(id) {
        const response = await client.patch(`/admin/services/providers/${id}/approve`);
        return response.data;
      },
    },
    Upload: {
      async uploadFile(file, category, phoneNumber) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        if (phoneNumber) {
          formData.append('phoneNumber', phoneNumber);
        }
        const response = await client.post('/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      },
    },
    Promo: {
      async list() {
        const response = await client.get('/admin/promos');
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/promos', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/promos/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/promos/${id}`);
        return response.status === 204;
      },
    },
    Banner: {
      async list() {
        const response = await client.get('/admin/banners');
        return response.data;
      },
      async create(data) {
        const response = await client.post('/admin/banners', data);
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/banners/${id}`, data);
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/banners/${id}`);
        return response.status === 204;
      },
    },
    Notification: {
      async list(sort = '-created_at', limit = 100) {
        const response = await client.get('/admin/notifications', { params: { sort, limit } });
        return response.data;
      },
      async broadcast(data) {
        const response = await client.post('/admin/broadcast-notification', data);
        return response.data;
      },
      async sendPrivate(userId, data) {
        const response = await client.post('/admin/notifications/private', { userId, ...data });
        return response.data;
      },
      async delete(id) {
        const response = await client.delete(`/admin/notifications/${id}`);
        return response.status === 204;
      },
    },
    SupportTicket: {
      async list(sort = '-created_date', limit = 200) {
        const response = await client.get('/admin/support-tickets', { params: { sort, limit } });
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/support-tickets/${id}`, data);
        return response.data;
      },
    },
    Reports: {
      async exportOrders(filters = {}) {
        const response = await client.get('/admin/export-orders', { params: filters });
        return response.data;
      },
    },
    Settings: {
      async list() {
        const response = await client.get('/admin/platform-settings');
        return response.data;
      },
      async update(id, data) {
        const response = await client.patch(`/admin/platform-settings/${id}`, data);
        return response.data;
      },
    },
    Referral: {
      async getStats() {
        const response = await client.get('/admin/referrals/stats');
        return response.data;
      },
      async list(limit = 100) {
        const response = await client.get('/admin/referrals', { params: { limit } });
        return response.data;
      },
      async getCode(userId) {
        const response = await client.get(`/admin/referrals/code/${userId}`);
        return response.data;
      },
      async updateStatus(id, status) {
        const response = await client.patch(`/admin/referrals/${id}`, { status });
        return response.data;
      },
    },
    Broadcast: {
      async list() {
        const response = await client.get('/admin/broadcasts');
        return response.data;
      },
    },
    Leaderboard: {
      async get(type, country) {
        const response = await client.get('/admin/leaderboard', { params: { type, country } });
        return response.data;
      },
    },
    Supabase: {
      async listTables() {
        const response = await client.get('/admin/supabase/tables');
        return response.data;
      },
      async getTableData(tableName, params = {}) {
        const response = await client.get(`/admin/supabase/tables/${tableName}`, { params });
        return response.data;
      },
      async syncRecord(tableName, recordId) {
        // Placeholder for future migration logic
        const response = await client.post(`/admin/supabase/tables/${tableName}/${recordId}/sync`);
        return response.data;
      },
    },
  },
  Setup: {
    async createAdmin(data) {
      const response = await client.post('/setup/create-admin', data);
      return response.data;
    },
  },
};
