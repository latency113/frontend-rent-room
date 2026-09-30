import { apiRequest } from './client';
import { User } from '../types';

export const usersApi = {
  async getAll(status?: string, role?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (role && role !== 'all') params.append('role', role);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<User[]>(`/api/users${qs}`);
  },

  async create(data: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    password?: string;
    phone?: string;
    role?: string;
    department_id?: number | null;
    status?: string;
  }) {
    return apiRequest<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async approve(id: string) {
    return apiRequest<User>(`/api/users/${id}/approve`, {
      method: 'PATCH'
    });
  },

  async reject(id: string, reason?: string) {
    return apiRequest<User>(`/api/users/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },

  async update(id: string, data: Partial<User>) {
    return apiRequest<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return apiRequest(`/api/users/${id}`, {
      method: 'DELETE'
    });
  }
};
