import { apiRequest } from './client';
import { ReportFilter, ReportSummary } from '../types';

export const reportsApi = {
  async getSummary(filters?: ReportFilter) {
    const params = new URLSearchParams();
    if (filters?.room_id && filters.room_id !== 'All') params.append('room_id', filters.room_id);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<ReportSummary>(`/api/reports${qs}`);
  }
};
