const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const API_BASE = rawBase.replace(/\/+$/, '');

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string; [key: string]: any }> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || data.message || `Request failed with status ${res.status}`
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Cannot connect to backend server. Make sure backend is running.'
    };
  }
}
