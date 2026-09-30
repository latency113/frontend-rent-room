import { apiRequest } from './client';
import { User } from '../types';

export const authApi = {
  async register(data: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    password: string;
    department_id?: number | null;
    department?: string;
    branch?: string;
    phone?: string;
  }) {
    return apiRequest<{ message: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(email: string, password: string) {
    return apiRequest<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async getMe() {
    return apiRequest<{ user: User }>('/api/auth/me');
  }
};
