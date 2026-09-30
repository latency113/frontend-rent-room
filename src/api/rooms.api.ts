import { apiRequest } from './client';
import { Room, CreateRoomPayload } from '../types';

export const roomsApi = {
  async getAll(activeOnly: boolean = false) {
    const query = activeOnly ? '?activeOnly=true' : '';
    return apiRequest<Room[]>(`/api/rooms${query}`);
  },

  async getById(id: string) {
    return apiRequest<Room>(`/api/rooms/${id}`);
  },

  async create(room: CreateRoomPayload) {
    return apiRequest<Room>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(room)
    });
  },

  async update(id: string, room: Partial<CreateRoomPayload>) {
    return apiRequest<Room>(`/api/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(room)
    });
  },

  async delete(id: string) {
    return apiRequest(`/api/rooms/${id}`, {
      method: 'DELETE'
    });
  }
};
