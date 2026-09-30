import { apiRequest } from './client';
import { Booking, ReportFilter } from '../types';

export const bookingsApi = {
  async create(bookingData: {
    room_id: string;
    title: string;
    booker_name: string;
    department: string;
    branch: string;
    phone: string;
    email: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    attendees_count: number;
    equipment?: string[];
    equipment_ids?: number[];
    requested_equipments?: { equipment_id: number; requested_quantity: number }[];
    note?: string;
  }) {
    return apiRequest<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  },

  async getAll(filters?: ReportFilter) {
    const params = new URLSearchParams();
    if (filters?.room_id && filters.room_id !== 'All') params.append('room_id', filters.room_id);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<Booking[]>(`/api/bookings${qs}`);
  },

  async getMy() {
    return apiRequest<Booking[]>('/api/bookings/my');
  },

  async getCalendar(roomId?: string, date?: string) {
    const params = new URLSearchParams();
    if (roomId && roomId !== 'All') params.append('room_id', roomId);
    if (date) params.append('date', date);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<Booking[]>(`/api/bookings/calendar${qs}`);
  },

  async getById(id: string) {
    return apiRequest<Booking>(`/api/bookings/${id}`);
  },

  async update(
    id: string,
    data: Partial<Booking> & {
      equipment_ids?: number[];
      requested_equipments?: { equipment_id: number; requested_quantity: number }[];
    }
  ) {
    return apiRequest<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async cancel(id: string, reason?: string) {
    return apiRequest<Booking>(`/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },

  async approve(id: string, note?: string) {
    return apiRequest<Booking>(`/api/bookings/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ note })
    });
  },

  async reject(id: string, reason?: string) {
    return apiRequest<Booking>(`/api/bookings/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  }
};
