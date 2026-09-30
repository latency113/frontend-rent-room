import { apiRequest } from './client';
import { AppNotification } from '../types';

export const notificationsApi = {
  async getAll() {
    return apiRequest<AppNotification[]>('/api/notifications');
  },

  async markAsRead(id: string) {
    return apiRequest(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  async markAllAsRead() {
    return apiRequest('/api/notifications/read-all', {
      method: 'PATCH'
    });
  }
};
