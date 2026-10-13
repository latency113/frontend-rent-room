import React, { useState, useEffect, useMemo } from 'react';
import { Booking, BookingStatus } from '../../types';
import { bookingsApi } from '../../api/bookings.api';
import { StatusBadge } from '../common/StatusBadge';
import { formatThaiDate, getTodayString } from '../../utils/date';
import {
  Check,
  X,
  Search,
  Clock,
  Users,
  Eye,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BookingDetailModal } from '../bookings/BookingDetailModal';
import { promptDialog } from '../../utils/dialog';

export const AdminBookingTable: React.FC = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('All');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Fetch all bookings without status filter so status counts remain accurate across all tabs
      const res = await bookingsApi.getAll();
      if (res.success && res.data) {
        setAllBookings(res.data);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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

  // 1. Filter by Date (if selectedDate is set)
  const dateFilteredBookings = useMemo(() => {
    if (!selectedDate) return allBookings;
    return allBookings.filter(b => {
      const bDate = b.booking_date || (b.start_time ? b.start_time.split('T')[0] : '');
      return bDate === selectedDate;
    });
  }, [allBookings, selectedDate]);

  // 2. Compute status counts based on current date selection
  const counts = useMemo(() => {
    return {
      all: dateFilteredBookings.length,
      pending: dateFilteredBookings.filter(b => b.status?.toUpperCase() === 'PENDING').length,
      approved: dateFilteredBookings.filter(b => b.status?.toUpperCase() === 'APPROVED').length,
      rejected: dateFilteredBookings.filter(b => b.status?.toUpperCase() === 'REJECTED').length,
      cancelled: dateFilteredBookings.filter(b => b.status?.toUpperCase() === 'CANCELLED').length,
    };
  }, [dateFilteredBookings]);

  // Total pending across all dates (to notify admin if there are pending requests on other dates)
  const totalPendingAllDates = useMemo(() => {
    return allBookings.filter(b => b.status?.toUpperCase() === 'PENDING').length;
  }, [allBookings]);

  // 3. Filter by Status Tab
  const statusFilteredBookings = useMemo(() => {
    if (statusFilter === 'All') return dateFilteredBookings;
    return dateFilteredBookings.filter(b => b.status?.toUpperCase() === statusFilter.toUpperCase());
  }, [dateFilteredBookings, statusFilter]);

  // 4. Filter by Search Query
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return statusFilteredBookings;
    const q = searchTerm.toLowerCase().trim();
    return statusFilteredBookings.filter(b => {
      return (
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.booker_name && b.booker_name.toLowerCase().includes(q)) ||
        (b.department && b.department.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.room?.name && b.room.name.toLowerCase().includes(q)) ||
        (b.room?.room_name && b.room.room_name.toLowerCase().includes(q)) ||
        (b.room?.room_code && b.room.room_code.toLowerCase().includes(q))
      );
    });
  }, [statusFilteredBookings, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, statusFilter, searchTerm, pageSize]);

  // 5. Pagination calculation
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Notice banner if there are pending bookings on other dates */}
      {selectedDate && totalPendingAllDates > counts.pending && (
        <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              มีคำขอรอตรวจสอบในวันอื่นอีก <strong>{totalPendingAllDates - counts.pending}</strong> รายการ
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedDate('');
              setStatusFilter('Pending');
            }}
            className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer shrink-0 ml-2"
          >
            ดูคำขอรอตรวจสอบทั้งหมด ({totalPendingAllDates})
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card p-4 sm:p-5 flex flex-col gap-4">
        {/* Row 1: Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm cursor-pointer ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('All')}
            >
              ทั้งหมด ({counts.all})
            </button>
            <button
              type="button"
              className={`btn btn-sm cursor-pointer ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Pending')}
              style={counts.pending > 0 && statusFilter !== 'Pending' ? { borderColor: '#f59e0b', color: '#b45309' } : {}}
            >
              <span className="flex items-center gap-1.5">
                <span>รอตรวจสอบ ({counts.pending})</span>
                {counts.pending > 0 && statusFilter !== 'Pending' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </span>
            </button>
            <button
              type="button"
              className={`btn btn-sm cursor-pointer ${statusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Approved')}
            >
              ✓ อนุมัติแล้ว ({counts.approved})
            </button>
            <button
              type="button"
              className={`btn btn-sm cursor-pointer ${statusFilter === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Rejected')}
            >
              ✕ ถูกปฏิเสธ ({counts.rejected})
            </button>
            <button
              type="button"
              className={`btn btn-sm cursor-pointer ${statusFilter === 'Cancelled' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Cancelled')}
            >
              - ยกเลิกแล้ว ({counts.cancelled})
            </button>
          </div>

          {/* Quick info if date filter active */}
          {selectedDate && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-sm border border-slate-200 dark:border-slate-700">
              <Calendar size={13} className="text-purple-600 dark:text-purple-400" />
              <span>วันที่: <strong className="text-slate-800 dark:text-slate-200">{formatThaiDate(selectedDate)}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 ml-1 cursor-pointer"
                title="ล้างตัวกรองวันที่"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Date Selector & Search Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          {/* Left: Date Quick Toggles & Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              <Calendar size={14} className="text-purple-600 dark:text-purple-400" />
              <span>เลือกวันที่:</span>
            </div>

            <div className="inline-flex items-center p-0.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  !selectedDate
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                ทุกวัน
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayString())}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedDate === getTodayString()
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                วันนี้
              </button>
            </div>

            {/* Custom Styled Date Input */}
            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs sm:text-sm h-9 px-3 bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors cursor-pointer shadow-2xs"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="ml-1.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="ล้างวันที่"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right: Modern Search Input with Guaranteed Spacing */}
          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              className="w-full h-9 pl-10 pr-9 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
              placeholder="ค้นหาหัวข้อ, ผู้จอง, แผนก, ห้อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X size={14} />
              </button>
            )}
          </div>
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
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }}>
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-semibold">ไม่พบรายการจองห้องประชุมตามเงื่อนไขที่เลือก</p>
                    {(selectedDate || statusFilter !== 'All' || searchTerm) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate('');
                          setStatusFilter('All');
                          setSearchTerm('');
                        }}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer font-medium"
                      >
                        ล้างตัวกรองทั้งหมด (แสดงทั้งหมด {allBookings.length} รายการ)
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBookings.map((b) => (
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
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px' }}>
                    <span className="line-clamp-2" title={b.note || '-'}>{b.note || '-'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedBookingForDetail(b)}
                        title="ดูรายละเอียดการจอง"
                      >
                        <Eye size={13} />
                        <span>รายละเอียด</span>
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

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className="card p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {/* Left: Summary & Custom Page Size selector */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              แสดงรายการที่{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              -{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                {Math.min(currentPage * pageSize, totalItems)}
              </strong>{' '}
              จากทั้งหมด{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-semibold">{totalItems}</strong> รายการ
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">แสดงหน้าละ:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors cursor-pointer shadow-2xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Modern Page navigation buttons */}
          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              title="หน้าแรก"
            >
              <ChevronsLeft size={15} />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              title="หน้าก่อนหน้า"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const hasGap = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {hasGap && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-purple-600 text-white shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 shadow-2xs'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              title="หน้าถัดไป"
            >
              <ChevronRight size={15} />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              title="หน้าสุดท้าย"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}

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