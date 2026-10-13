import React, { useState, useEffect } from 'react';
import { Room, ReportSummary, BookingStatus } from '../../types';
import { reportsApi } from '../../api/reports.api';
import { StatusBadge } from '../common/StatusBadge';
import { formatThaiDate } from '../../utils/date';
import { exportBookingsToCSV } from '../../utils/export';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  TrendingUp,
  Building,
  Users
} from 'lucide-react';

interface ReportViewProps {
  rooms: Room[];
}

export const ReportView: React.FC<ReportViewProps> = ({ rooms }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await reportsApi.getSummary({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        room_id: selectedRoomId,
        status: selectedStatus,
        search: searchTerm || undefined
      });

      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedRoomId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const handleExportCSV = () => {
    if (report?.bookings) {
      exportBookingsToCSV(report.bookings, `meeting_room_report_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Export Controls */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white m-0">
            <FileText size={24} className="text-blue-600 dark:text-blue-400" />
            <span>ระบบรายงานการจองห้องประชุม</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            สรุปข้อมูลสถิติ ค้นหา และวิเคราะห์การใช้งานห้องประชุมขององค์กร
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value text-blue-600 dark:text-blue-400">
              {report?.totalBookings ?? 0}
            </div>
            <div className="stat-label">การจองทั้งหมด</div>
          </div>
          <div className="stat-icon bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value text-emerald-600 dark:text-emerald-400">
              {report?.approvedCount ?? 0}
            </div>
            <div className="stat-label">อนุมัติแล้ว (Approved)</div>
          </div>
          <div className="stat-icon bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value text-amber-500 dark:text-amber-400">
              {report?.pendingCount ?? 0}
            </div>
            <div className="stat-label">รออนุมัติ (Pending)</div>
          </div>
          <div className="stat-icon bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value text-red-600 dark:text-red-400">
              {report?.rejectedCount ?? 0}
            </div>
            <div className="stat-label">ถูกปฏิเสธ (Rejected)</div>
          </div>
          <div className="stat-icon bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <XCircle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value text-indigo-600 dark:text-indigo-400">
              {report?.approvalRatePercentage ?? 100}%
            </div>
            <div className="stat-label">อัตราการอนุมัติ</div>
          </div>
          <div className="stat-icon bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card p-5">
        <div className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
          <Filter size={16} />
          <span>ตัวกรองและเงื่อนไขรายงาน</span>
        </div>

        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">ตั้งแต่วันที่</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">ถึงวันที่</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">ห้องประชุม</label>
              <select
                className="form-control"
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

            <div>
              <label className="form-label">สถานะการจอง</label>
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
              >
                <option value="All">ทุกสถานะ</option>
                <option value="Approved">อนุมัติแล้ว (Approved)</option>
                <option value="Pending">รออนุมัติ (Pending)</option>
                <option value="Rejected">ถูกปฏิเสธ (Rejected)</option>
                <option value="Cancelled">ยกเลิกแล้ว (Cancelled)</option>
              </select>
            </div>

            <div>
              <label className="form-label">ค้นหาคำสำคัญ</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ชื่อผู้จอง, แผนก, หัวข้อ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  ค้นหา
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Visual Analytics Grid: By Room & By Department */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* By Room Breakdown */}
        <div className="card p-5">
          <h3 className="text-base font-bold mb-3.5 flex items-center gap-2 text-slate-900 dark:text-white">
            <Building size={18} className="text-blue-600 dark:text-blue-400" />
            <span>สถิติการใช้งานแยกตามห้องประชุม</span>
          </h3>

          <div className="flex flex-col gap-3">
            {report?.byRoom.map(item => (
              <div key={item.roomId}>
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.roomName}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.count} ครั้ง ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${item.percentage}%`,
                      height: '100%',
                      background: 'var(--primary-gradient)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Department Breakdown */}
        <div className="card p-5">
          <h3 className="text-base font-bold mb-3.5 flex items-center gap-2 text-slate-900 dark:text-white">
            <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span>สถิติการจองแยกตามแผนก</span>
          </h3>

          <div className="flex flex-col gap-2.5">
            {report?.byDepartment && report.byDepartment.length > 0 ? (
              report.byDepartment.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-md"
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.department}</span>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full text-xs font-bold">
                    {item.count} ครั้ง
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm text-center py-5">
                ไม่มีข้อมูลแผนก
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtered Bookings Table */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              ตารางรายละเอียดการจองห้องประชุม
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              แสดงผลทั้งหมด {report?.bookings.length ?? 0} รายการ
            </span>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>วันที่จอง</th>
                <th>เวลา</th>
                <th>ห้องประชุม</th>
                <th>หัวข้อการประชุม</th>
                <th>ผู้จอง / แผนก</th>
                <th>จำนวนคน</th>
                <th>สถานะ</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                    กำลังประมวลผลรายงาน...
                  </td>
                </tr>
              ) : !report?.bookings || report.bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    ไม่พบรายการจองตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                report.bookings.map((b, idx) => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{formatThaiDate(b.booking_date)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{b.start_time} - {b.end_time} น.</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {b.room?.name || b.room_id}
                    </td>
                    <td>{b.title}</td>
                    <td>
                      <div>{b.booker_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {b.department} • {b.phone}
                      </div>
                    </td>
                    <td>{b.attendees_count} คน</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {b.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
