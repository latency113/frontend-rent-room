const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const API_BASE = rawBase.replace(/\/+$/, '');

export interface UploadResponse {
  success: boolean;
  message?: string;
  urls?: string[];
  url?: string;
  error?: string;
}

export const uploadApi = {
  async uploadImages(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์อัปโหลดได้'
      };
    }
  }
};
