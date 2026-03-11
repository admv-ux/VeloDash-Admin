import axios from 'axios';

const API_BASE_URL = 'http://localhost:3008/api/v1';
const API_KEY = '12345';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the user's phone number to every request
client.interceptors.request.use((config) => {
  const phone = localStorage.getItem('admin_phone');
  if (phone) {
    config.headers['x-user-phone'] = phone;
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

