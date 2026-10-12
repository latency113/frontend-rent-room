import React, { useState, useEffect } from 'react';
import { Booking, Room } from '../types';
import { bookingsApi } from '../api/bookings.api';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatThaiDate } from '../utils/date';
import {
  ClipboardList,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  Users,
  Building2,
  Plus,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { promptDialog } from '../utils/dialog';
import { BookingDetailModal } from '../components/bookings/BookingDetailModal';
import { useNavigate } from '@tanstack/react-router';
import { roomsApi } from '../api/rooms.api';

interface MyBookingsPageProps {
  rooms?: Room[];
  onEditBooking?: (booking: Booking) => void;
  onBookNew?: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  rooms: propRooms,
  onEditBooking,
  onBookNew
}) => {
  const navigate = useNavigate();
  const [, setRooms] = useState<Room[]>(propRooms || []);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'history'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  useEffect(() => {
    if (!propRooms || propRooms.length === 0) {
      roomsApi.getAll().then(res => {
        if (res.success && res.data) {
          setRooms(res.data);
        }
      }).catch(() => {});
    } else {
      setRooms(propRooms);
    }
  }, [propRooms]);

  const handleEditBooking = (b: Booking) => {
    if (onEditBooking) {
      onEditBooking(b);
    } else {
      navigate({
        to: '/booking',
        search: { bookingId: b.id } as any
      });
    }
  };

  const handleBookNew = () => {
    if (onBookNew) {
      onBookNew();
    } else {
      navigate({ to: '/rooms' as any });
    }
  };

  const fetchMyBookings = async () => {
    setIsLoading(true);
    try {
      const res = await bookingsApi.getMy();
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (id: string, title: string) => {
    const reason = await promptDialog({
      title: 'ยกเลิกการจองห้องประชุม',
      text: `ยืนยันการยกเลิกคำขอจอง "${title}"? ระบุเหตุผลในการยกเลิกเพื่อบันทึกประวัติ:`,
      inputPlaceholder: 'ระบุเหตุผล เช่น ยกเลิกการประชุม, เลื่อนกำหนดการ...',
      defaultValue: 'ยกเลิกการประชุม',
      confirmText: 'ยืนยันยกเลิก',
      cancelText: 'ย้อนกลับ',
      isDanger: true,
      icon: 'warning',
    });
    if (reason === null) return;

    try {
      const res = await bookingsApi.cancel(id, reason);
      if (res.success) {
        toast.success('ยกเลิกการจองเรียบร้อยแล้ว');
        fetchMyBookings();
      } else {
        toast.error(res.error || 'ไม่สามารถยกเลิกการจองได้');
      }
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการยกเลิก');
    }
  };

  const filtered = bookings.filter(b => {
    const s = (b.status || '').toUpperCase();
    if (filter === 'pending') return s === 'PENDING';
    if (filter === 'approved') return s === 'APPROVED';
    if (filter === 'history') return s === 'REJECTED' || s === 'CANCELLED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ClipboardList size={22} />
            </div>
            <span>ประวัติและสถานะการจองของฉัน</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ติดตามสถานะคำขอ แก้ไข หรือยกเลิกการจองห้องประชุมของคุณ
          </p>
        </div>

        <button
          onClick={handleBookNew}
          className="px-5 py-2.5 rounded-sm text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={16} />
          <span>จองห้องประชุมใหม่</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
          onClick={() => setFilter('all')}
        >
          ทั้งหมด ({bookings.length})
        </button>
        <button
          className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
          onClick={() => setFilter('pending')}
        >
          รออนุมัติ ({bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING').length})
        </button>
        <button
          className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            filter === 'approved'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
          onClick={() => setFilter('approved')}
        >
          ✓ อนุมัติแล้ว ({bookings.filter(b => (b.status || '').toUpperCase() === 'APPROVED').length})
        </button>
        <button
          className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            filter === 'history'
              ? 'bg-slate-700 dark:bg-slate-800 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
          onClick={() => setFilter('history')}
        >
          ประวัติที่สิ้นสุด / ยกเลิก
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 p-16 text-center text-slate-400 dark:text-slate-500 text-sm">
          กำลังโหลดประวัติการจอง...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">ยังไม่มีรายการจองในหมวดหมู่นี้</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            เลือกห้องประชุมที่ตรงกับความต้องการและส่งคำขอจองได้ทันที
          </p>
          <button
            onClick={handleBookNew}
            className="px-4 py-2 rounded-sm text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            จองห้องประชุมทันที
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(b => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-md p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <StatusBadge status={b.status} />
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {formatThaiDate(b.booking_date)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                  {b.title}
                </h3>

                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1">
                  <Building2 size={13} />
                  <span>{b.room?.name || b.room_id}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-slate-400 dark:text-slate-500" />
                    {b.start_time} - {b.end_time} น.
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-slate-400 dark:text-slate-500" />
                    {b.attendees_count} คน
                  </span>
                </div>

                {((b.booking_equipments && b.booking_equipments.length > 0) || (b.equipment && b.equipment.length > 0)) && (
                  <div className="mb-3">
                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">อุปกรณ์ที่ขอใช้:</div>
                    <div className="flex flex-wrap gap-1">
                      {b.booking_equipments && b.booking_equipments.length > 0 ? (
                        b.booking_equipments.map((eq, i) => (
                          <span key={i} className="text-[10px] font-medium text-slate-700 dark:text-slate-200 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <span>{eq.equipment_name || eq.equipment?.equipment_name}</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">x{eq.requested_quantity || 1}</span>
                          </span>
                        ))
                      ) : (
                        b.equipment.map((eq, i) => (
                          <span key={i} className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {eq}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {b.note && (
                  <div className="p-2.5 rounded-sm bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed border border-slate-100 dark:border-slate-700/60">
                    💬 หมายเหตุ: {b.note}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                {/* View Details */}
                <button
                  onClick={() => setSelectedBookingForDetail(b)}
                  className="px-3 py-1.5 rounded-sm text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="ดูรายละเอียดการจอง"
                >
                  <Eye size={13} />
                  <span>รายละเอียด</span>
                </button>

                {/* User can edit if status is Pending */}
                {(b.status || '').toUpperCase() === 'PENDING' && (
                  <button
                    onClick={() => handleEditBooking(b)}
                    className="px-3 py-1.5 rounded-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>แก้ไข</span>
                  </button>
                )}

                {/* User can cancel if not already cancelled or rejected */}
                {(b.status || '').toUpperCase() !== 'CANCELLED' && (b.status || '').toUpperCase() !== 'REJECTED' && (
                  <button
                    onClick={() => handleCancelBooking(b.id, b.title)}
                    className="px-3 py-1.5 rounded-sm text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>ยกเลิก</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBookingForDetail}
        isOpen={!!selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        isAdmin={false}
      />
    </div>
  );
};
