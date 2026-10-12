import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../types';
import { bookingsApi } from '../../api/bookings.api';
import { StatusBadge } from '../common/StatusBadge';
import { formatThaiDate } from '../../utils/date';
import { Check, X, Search, Clock, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { BookingDetailModal } from '../bookings/BookingDetailModal';
import { promptDialog } from '../../utils/dialog';

export const AdminBookingTable: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await bookingsApi.getAll({
        status: statusFilter
      });
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
    fetchBookings();
  }, [statusFilter]);

  const handleApprove = async (id: string, title: string) => {
    const note = await promptDialog({
      title: 'อนุมัติการจองห้องประชุม',
      text: `ยืนยันการอนุมัติคำขอ "${title}" พร้อมระบุหมายเหตุการจัดเตรียม (ถ้ามี):`,
      inputPlaceholder: 'เช่น จัดเตรียมห้องเรียบร้อย, ไมโครโฟนพร้อมใช้งาน...',
      defaultValue: 'อนุมัติเรียบร้อย ได้จัดเตรียมห้องไว้พร้อมแล้ว',
      confirmText: 'อนุมัติคำขอ',
      cancelText: 'ยกเลิก',
      icon: 'question',
    });
    if (note === null) return;

    const res = await bookingsApi.approve(id, note);
    if (res.success) {
      toast.success('อนุมัติการจองเรียบร้อยแล้ว! ระบบได้ส่งอีเมลแจ้งเตือนไปยังผู้จองแล้ว');
      fetchBookings();
    } else {
      toast.error(res.error || 'ไม่สามารถอนุมัติได้');
    }
  };

  const handleReject = async (id: string, title: string) => {
    const reason = await promptDialog({
      title: 'ไม่อนุมัติคำขอจองห้องประชุม',
      text: `ระบุเหตุผลที่ไม่อนุมัติคำขอ "${title}" เพื่อแจ้งเตือนทางอีเมลไปยังผู้จอง:`,
      inputPlaceholder: 'ระบุเหตุผล เช่น ติดภารกิจด่วน, อุปกรณ์อยู่ระหว่างซ่อมแซม...',
      defaultValue: 'ห้องติดภารกิจด่วนของผู้บริหาร หรือ อุปกรณ์ซ่อมแซม',
      confirmText: 'ปฏิเสธคำขอ',
      cancelText: 'ยกเลิก',
      isDanger: true,
      icon: 'warning',
    });
    if (reason === null) return;

    const res = await bookingsApi.reject(id, reason);
    if (res.success) {
      toast.success('ปฏิเสธการจองเรียบร้อย! ระบบได้ส่งอีเมลแจ้งเตือนไปยังผู้จองแล้ว');
      fetchBookings();
    } else {
      toast.error(res.error || 'ไม่สามารถปฏิเสธได้');
    }
  };

  const filtered = bookings.filter(b => {
    const q = searchTerm.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.booker_name.toLowerCase().includes(q) ||
      b.department.toLowerCase().includes(q) ||
      (b.room?.name && b.room.name.toLowerCase().includes(q))
    );
  });

  const pendingCount = bookings.filter(b => b.status?.toUpperCase() === 'PENDING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('All')}
          >
            ทั้งหมด ({bookings.length})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('Pending')}
            style={pendingCount > 0 && statusFilter !== 'Pending' ? { borderColor: '#f59e0b', color: '#b45309' } : {}}
          >
          รอตรวจสอบ ({pendingCount})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('Approved')}
          >
            ✓ อนุมัติแล้ว
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('Rejected')}
          >
            ✕ ถูกปฏิเสธ
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'Cancelled' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('Cancelled')}
          >
            - ยกเลิกแล้ว
          </button>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
            placeholder="ค้นหาหัวข้อ, ผู้จอง, ห้อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>หัวข้อการประชุม / ห้อง</th>
              <th>วันที่ & เวลา</th>
              <th>ผู้จอง / แผนก</th>
              <th>ผู้เข้าร่วม</th>
              <th>อุปกรณ์ที่ขอใช้</th>
              <th>สถานะ</th>
              <th>หมายเหตุ</th>
              <th style={{ textAlign: 'center' }}>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                  กำลังโหลดรายการจอง...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  ไม่พบรายการจองห้องประชุม
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                  <td>
                    <div
                      onClick={() => setSelectedBookingForDetail(b)}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="คลิกเพื่อดูรายละเอียด"
                    >
                      <span>{b.title}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {b.room?.name || b.room_id}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatThaiDate(b.booking_date)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {b.start_time} - {b.end_time} น.
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.booker_name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {b.department} • {b.phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <Users size={14} color="#64748b" />
                      <span className='truncate'>{b.attendees_count} คน</span>
                    </div>
                  </td>
                  <td className='truncate'>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '220px' }}>
                      {b.booking_equipments && b.booking_equipments.length > 0 ? (
                        b.booking_equipments.map((eq, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                          >
                            <span>{eq.equipment_name || eq.equipment?.equipment_name}</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1 rounded">
                              x{eq.requested_quantity || 1}
                            </span>
                          </span>
                        ))
                      ) : b.equipment && b.equipment.length > 0 ? (
                        b.equipment.map((eq, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                          >
                            <span>{eq}</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1 rounded">x1</span>
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </div>
                  </td>
                  <td className='truncate'>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '160px' }}>
                    {b.note || '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                      {/* View Details Button */}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedBookingForDetail(b)}
                        title="ดูรายละเอียดการจอง"
                      >
                        <Eye size={14} />
                        <span className='truncate'>รายละเอียด</span>
                      </button>

                      {b.status?.toUpperCase() === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleApprove(b.id, b.title)}
                            title="อนุมัติคำขอจอง"
                          >
                            <Check size={14} />
                            <span>อนุมัติ</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleReject(b.id, b.title)}
                            title="ปฏิเสธคำขอจอง"
                          >
                            <X size={14} />
                            <span>ปฏิเสธ</span>
                          </button>
                        </>
                      )}
                      {b.status?.toUpperCase() === 'APPROVED' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                          onClick={() => handleReject(b.id, b.title)}
                          title="ยกเลิกการอนุมัติ"
                        >
                          ยกเลิกอนุมัติ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBookingForDetail}
        isOpen={!!selectedBookingForDetail}
        onClose={() => setSelectedBookingForDetail(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isAdmin={true}
      />
    </div>
  );
};
