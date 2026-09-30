import { apiRequest } from './client';
import { Department, Equipment } from '../types';

export const departmentsApi = {
  async getAll() {
    return apiRequest<Department[]>('/api/departments');
  },

  async getById(id: number | string) {
    return apiRequest<Department>(`/api/departments/${id}`);
  },

  async create(data: { department_name: string }) {
    return apiRequest<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: number | string, data: { department_name: string }) {
    return apiRequest<Department>(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: number | string) {
    return apiRequest<{ success: boolean; message: string }>(`/api/departments/${id}`, {
      method: 'DELETE'
    });
  }
};

export const equipmentsApi = {
  async getAll() {
    return apiRequest<Equipment[]>('/api/equipments');
  }
};
