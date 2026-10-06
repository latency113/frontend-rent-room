export type UserRole = 'USER' | 'ADMIN' | 'user' | 'admin';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'pending' | 'approved' | 'rejected';

// 8. Department (แผนก)
export interface Department {
  department_id: number;
  department_name: string;
  user_count?: number;
}

// 1. User (ผู้ใช้งาน)
export interface User {
  user_id?: number;
  id: string;
  first_name?: string;
  last_name?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  department_id?: number | null;
  department: string;
  created_by_admin_id?: number | null;
  branch: string;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
  booking_count?: number;
}

// 4. Equipment (อุปกรณ์)
export interface Equipment {
  equipment_id: number;
  equipment_name: string;
}

// 3. RoomImage (รูปภาพห้องประชุม)
export interface RoomImage {
  image_id: number;
  image_url: string;
  uploaded_at?: string;
  room_id: number;
}

// 5. RoomEquipment (อุปกรณ์ที่มีประจำห้อง)
export interface RoomEquipment {
  room_id: number;
  equipment_id: number;
  default_quantity: number;
  default_quantily?: number;
  equipment?: Equipment;
}

// 2. Room (ห้องประชุม)
export interface Room {
  room_id?: number;
  id: string;
  room_name?: string;
  name: string;
  code: string;
  room_code?: string;
  capacity: number;
  location_detail?: string;
  floor: string;
  description: string;
  image_url: string;
  images?: RoomImage[];
  equipments?: {
    equipment_id: number;
    equipment_name: string;
    default_quantity: number;
  }[];
  equipment: string[];
  status?: number | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoomPayload {
  code: string;
  room_code?: string;
  name: string;
  capacity: number;
  floor?: string;
  description?: string;
  image_url?: string;
  images?: string[];
  equipment?: string[];
  status?: number | string;
  is_active?: boolean;
}

export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// 7. BookingEquipment (อุปกรณ์ที่ขอเพิ่มเติมในการจอง)
export interface BookingEquipment {
  booking_id: number;
  equipment_id: number;
  requested_quantity: number;
  equipment_name?: string;
  equipment?: Equipment;
}

// 6. Booking (การจอง)
export interface Booking {
  booking_id?: number;
  id: string;
  user_id: string | number;
  room_id: string | number;
  title: string;
  booker_name: string;
  department: string;
  branch: string;
  phone: string;
  email: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:mm or ISO
  end_time: string;     // HH:mm or ISO
  attendees_count: number;
  attendee_count?: number;
  approved_by_admin_id?: number | null;
  equipment: string[];
  booking_equipments?: BookingEquipment[];
  status: BookingStatus;
  note?: string;
  created_at?: string;
  updated_at?: string;
  room?: Room;
}

// 9. Report (รายงาน)
export interface Report {
  report_id: number;
  report_date: string;
  report_type: string;
  start_date?: string;
  end_date?: string;
  room_id?: number | null;
  status?: string;
  created_by?: string | number | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ReportFilter {
  start_date?: string;
  end_date?: string;
  room_id?: string;
  status?: BookingStatus | 'All';
  search?: string;
}

export interface ReportSummary {
  totalBookings: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  approvalRatePercentage: number;
  byRoom: {
    roomId: string;
    roomName: string;
    roomCode: string;
    count: number;
    percentage: number;
  }[];
  byDepartment: {
    department: string;
    count: number;
  }[];
  bookings: Booking[];
}
