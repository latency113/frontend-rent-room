import React, { useState, useEffect } from 'react';
import { Room, Booking } from '../../types';
import { bookingsApi } from '../../api/bookings.api';
import { StatusBadge } from '../common/StatusBadge';
import { formatThaiDate, getTodayString } from '../../utils/date';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Users
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { roomsApi } from '../../api/rooms.api';
import { useTheme } from '../../context/ThemeContext';

interface RoomCalendarProps {
  rooms?: Room[];
  onOpenBooking?: (room?: Room, defaultDate?: string) => void;
}

export const RoomCalendar: React.FC<RoomCalendarProps> = ({ rooms: propRooms, onOpenBooking }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>(propRooms || []);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayString());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('All');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const handleOpenBooking = (room?: Room, defaultDate?: string) => {
    const today = getTodayString();
    const targetDate = defaultDate && defaultDate >= today ? defaultDate : today;
    if (onOpenBooking) {
      onOpenBooking(room, targetDate);
    } else {
      navigate({
        to: '/booking',
        search: {
          roomId: room ? String(room.id || room.room_id) : undefined,
          date: targetDate
        } as any
      });
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await bookingsApi.getCalendar(selectedRoomId);
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedRoomId]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getTodayString());
  };

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Bookings grouped by date
  const bookingsByDate: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    if (!bookingsByDate[b.booking_date]) {
      bookingsByDate[b.booking_date] = [];
    }
    bookingsByDate[b.booking_date].push(b);
  });

  const selectedDayBookings = (bookingsByDate[selectedDateStr] || []).sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );

  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Filter and Controls Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={prevMonth} title="เดือนก่อนหน้า">
              <ChevronLeft size={18} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={goToToday}>
              วันนี้
            </button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={nextMonth} title="เดือนถัดไป">
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            {monthNamesThai[month]} {year + 543}
          </h2>
        </div>

        {/* Room Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              กรองตามห้อง:
            </span>
            <select
              className="form-control"
              style={{ width: '220px', padding: '6px 12px', fontSize: '0.85rem' }}
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              <option value="All">ทุกห้องประชุม</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenBooking(rooms.find(r => r.id === selectedRoomId), selectedDateStr)}
          >
            <Plus size={16} />
            <span>จองห้องประชุม</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid + Daily Schedule Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: '24px' }}>
        {/* Calendar View */}
        <div className="card" style={{ padding: '20px' }}>
          {/* Day of Week Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => (
              <div
                key={d}
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: i === 0 ? '#ef4444' : i === 6 ? '#2563eb' : 'var(--text-secondary)',
                  padding: '8px 0'
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: '94px', background: isDark ? '#0b0f19' : '#fafafa', borderRadius: 'var(--radius-sm)' }} />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === getTodayString();
              const isPast = dateStr < getTodayString();
              const dayBookings = bookingsByDate[dateStr] || [];

              const sortedBookings = [...dayBookings].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
              const approvedBookings = sortedBookings.filter(b => (b.status || '').toLowerCase() === 'approved');
              const pendingBookings = sortedBookings.filter(b => (b.status || '').toLowerCase() === 'pending');
              const hasApproved = approvedBookings.length > 0;
              const hasPending = pendingBookings.length > 0;
              const hasBookings = sortedBookings.length > 0;

              // Styles based on booking status, selected, today, or past date
              let cellBorder = '1px solid var(--border-color)';
              let cellBg = isDark ? '#111827' : 'white';
              let numColor = 'var(--text-primary)';

              if (isPast) {
                // Past days: grey tone
                cellBorder = isSelected ? '2px solid #64748b' : hasBookings ? (isDark ? '1px solid #334155' : '1px solid #cbd5e1') : (isDark ? '1px solid #1e293b' : '1px solid #e2e8f0');
                cellBg = isSelected ? (isDark ? '#1e293b' : '#e2e8f0') : hasBookings ? (isDark ? '#161f30' : '#f1f5f9') : (isDark ? '#0d131f' : '#f8fafc');
                numColor = hasBookings ? (isDark ? '#94a3b8' : '#475569') : '#64748b';
              } else if (hasApproved) {
                // Booked and approved: vibrant emerald highlight
                cellBorder = isSelected ? '2px solid #059669' : (isDark ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #86efac');
                cellBg = isSelected ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0') : (isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4');
                numColor = isDark ? '#6ee7b7' : '#065f46';
              } else if (hasPending) {
                // Pending booking: warm amber highlight
                cellBorder = isSelected ? '2px solid #d97706' : (isDark ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1.5px solid #fde68a');
                cellBg = isSelected ? (isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a') : (isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb');
                numColor = isDark ? '#fcd34d' : '#92400e';
              } else if (isToday) {
                // Today without bookings: blue highlight
                cellBorder = isSelected ? '2px solid var(--primary)' : (isDark ? '1.5px solid #3b82f6' : '1.5px solid #93c5fd');
                cellBg = isSelected ? 'var(--primary-light)' : (isDark ? 'rgba(37, 99, 235, 0.15)' : '#f0f9ff');
                numColor = isDark ? '#93c5fd' : '#1d4ed8';
              } else if (isSelected) {
                // Selected future day
                cellBorder = '2px solid var(--primary)';
                cellBg = 'var(--primary-light)';
                numColor = 'var(--primary)';
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  title={
                    hasBookings
                      ? `${formatThaiDate(dateStr)}\n` + sortedBookings.map(b => `${b.start_time} - ${b.end_time} น. (${b.title || 'การจอง'}) [${b.status}]`).join('\n')
                      : isPast
                      ? `${formatThaiDate(dateStr)} (วันที่ผ่านมาแล้ว)`
                      : formatThaiDate(dateStr)
                  }
                  style={{
                    minHeight: '94px',
                    padding: '8px 7px',
                    borderRadius: 'var(--radius-md)',
                    border: cellBorder,
                    background: cellBg,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    opacity: isPast && !isSelected ? 0.88 : 1
                  }}
                >
                  {/* Top row: Day number and badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: isSelected || isToday || hasBookings ? 700 : 500,
                          color: numColor
                        }}
                      >
                        {dayNum}
                      </span>
                      {hasApproved && !isPast && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'inline-block'
                          }}
                          title="มีการจองแล้ว"
                        />
                      )}
                    </div>

                    {isToday && (
                      <span style={{ fontSize: '0.625rem', background: '#3b82f6', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                        วันนี้
                      </span>
                    )}
                    {isPast && !isToday && (
                      <span style={{ fontSize: '0.58rem', color: '#94a3b8', background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>
                        ผ่านมาแล้ว
                      </span>
                    )}
                  </div>

                  {/* Booking Time Slots */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {sortedBookings.slice(0, 2).map((b, idx) => {
                      const isAppr = (b.status || '').toLowerCase() === 'approved';
                      const isPend = (b.status || '').toLowerCase() === 'pending';

                      let tagBg = '#f1f5f9';
                      let tagColor = '#475569';
                      let tagBorder = '#cbd5e1';
                      let dotBg = '#94a3b8';

                      if (!isPast) {
                        if (isAppr) {
                          tagBg = '#ecfdf5';
                          tagColor = '#065f46';
                          tagBorder = '#a7f3d0';
                          dotBg = '#10b981';
                        } else if (isPend) {
                          tagBg = '#fffbeb';
                          tagColor = '#92400e';
                          tagBorder = '#fde68a';
                          dotBg = '#f59e0b';
                        }
                      }

                      return (
                        <div
                          key={b.id || idx}
                          title={`${b.start_time} - ${b.end_time} น. (${b.title || 'การจอง'})`}
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 600,
                            background: tagBg,
                            color: tagColor,
                            border: `1px solid ${tagBorder}`,
                            padding: '2px 4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            lineHeight: 1.2
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: dotBg,
                              flexShrink: 0
                            }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
                            {b.start_time} - {b.end_time}
                          </span>
                        </div>
                      );
                    })}

                    {sortedBookings.length > 2 && (
                      <div
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          color: isPast ? '#94a3b8' : '#059669',
                          textAlign: 'center',
                          background: isPast ? 'rgba(0,0,0,0.04)' : '#dcfce7',
                          padding: '1px 3px',
                          borderRadius: '3px',
                          lineHeight: 1.2
                        }}
                      >
                        +อีก {sortedBookings.length - 2} ช่วงเวลา
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.775rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f0fdf4', border: '1.5px solid #86efac' }}></span>
              <span style={{ fontWeight: 600, color: '#065f46' }}>มีห้องถูกจองแล้ว (แสดงเวลาในช่อง)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fffbeb', border: '1.5px solid #fde68a' }}></span>
              <span style={{ fontWeight: 600, color: '#92400e' }}>รอการอนุมัติ (Pending)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary-light)', border: '2px solid var(--primary)' }}></span>
              <span>วันที่เลือกดู</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}></span>
              <span style={{ color: '#64748b' }}>วันที่ผ่านมาแล้ว (สีเทา)</span>
            </div>
          </div>
        </div>

        {/* Selected Day Schedule Details */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                กำหนดการใช้งานห้องประชุม
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2px 0 0' }}>
                {formatThaiDate(selectedDateStr)}
              </h3>
            </div>
            {selectedDateStr >= getTodayString() ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenBooking(rooms.find(r => r.id === selectedRoomId), selectedDateStr)}
              >
                <Plus size={14} />
                <span>จองวันนี้</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium px-2.5 py-1 bg-slate-100 rounded-sm border border-slate-200">
                วันที่ผ่านมาแล้ว
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              กำลังโหลดข้อมูล...
            </div>
          ) : selectedDayBookings.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                background: isDark ? '#111827' : '#f8fafc',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <CalendarIcon size={36} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>ยังไม่มีรายการจองในวันนี้</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                ห้องประชุมทุกห้องว่าง สามารถเลือกจองเวลาใดก็ได้
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '480px' }}>
              {selectedDayBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: isDark
                      ? (b.status === 'Approved' ? 'rgba(16, 185, 129, 0.12)' : b.status === 'Pending' ? 'rgba(245, 158, 11, 0.12)' : '#1e293b')
                      : (b.status === 'Approved' ? '#f0fdf4' : b.status === 'Pending' ? '#fffbeb' : '#fafafa'),
                    borderLeft: `4px solid ${b.status === 'Approved' ? '#10b981' : b.status === 'Pending' ? '#f59e0b' : '#94a3b8'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                      <Clock size={14} color="#2563eb" />
                      <span>{b.start_time} - {b.end_time} น.</span>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {b.title}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {b.room?.name || b.room_id}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{b.booker_name} ({b.department})</span>
                    <span><Users size={12} style={{ display: 'inline', marginRight: '2px' }} />{b.attendees_count} คน</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
