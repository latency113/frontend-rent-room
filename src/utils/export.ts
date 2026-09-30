import { Booking } from '../types';
import toast from 'react-hot-toast';

export function exportBookingsToCSV(bookings: Booking[], filename: string = 'booking_report.csv') {
  if (!bookings || bookings.length === 0) {
    toast.error('ไม่มีข้อมูลสำหรับการส่งออก');
    return;
  }

  const headers = [
    'ลำดับ',
    'หัวข้อการประชุม',
    'ห้องประชุม',
    'ผู้จอง',
    'แผนก',
    'เบอร์โทรศัพท์',
    'อีเมล',
    'วันที่จอง',
    'เวลาเริ่มต้น',
    'เวลาสิ้นสุด',
    'จำนวนผู้เข้าร่วม (คน)',
    'อุปกรณ์ที่ขอใช้',
    'สถานะ',
    'หมายเหตุ'
  ];

  const rows = bookings.map((b, idx) => [
    idx + 1,
    `"${(b.title || '').replace(/"/g, '""')}"`,
    `"${(b.room?.name || String(b.room_id || '')).replace(/"/g, '""')}"`,
    `"${(b.booker_name || '').replace(/"/g, '""')}"`,
    `"${(b.department || '').replace(/"/g, '""')}"`,
    `"${(b.phone || '').replace(/"/g, '""')}"`,
    `"${(b.email || '').replace(/"/g, '""')}"`,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.attendees_count,
    `"${(b.equipment || []).join(', ').replace(/"/g, '""')}"`,
    b.status,
    `"${(b.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
