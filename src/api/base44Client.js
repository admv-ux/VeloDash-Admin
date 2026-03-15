import axios from 'axios';

const API_BASE_URL = 'http://localhost:3008/api/v1';
// const API_BASE_URL = 'http://api.velocouriersvc.com/api/v1';
//const API_KEY = 'your-api-key-here';
const API_KEY = '12345';
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

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
        const response = await client.post('/admin/settings', data);
        return response.data;
      },
      async update(id, data) {
        // reuse create as it handles both in backend updateSetting
        const response = await client.post('/admin/settings', data);
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
      async getCountries() {
        const response = await client.get('/waitlist/countries');
        return response.data;
      },
      async addCountry(data) {
        const response = await client.post('/waitlist/countries', data);
        return response.data;
      }
    },
    // Add other entities as needed...
  },
};

