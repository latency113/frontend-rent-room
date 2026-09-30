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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} color="#2563eb" />
            <span>ระบบรายงานการจองห้องประชุม</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            สรุปข้อมูลสถิติ ค้นหา และวิเคราะห์การใช้งานห้องประชุมขององค์กร
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#2563eb' }}>
              {report?.totalBookings ?? 0}
            </div>
            <div className="stat-label">การจองทั้งหมด</div>
          </div>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {report?.approvedCount ?? 0}
            </div>
            <div className="stat-label">อนุมัติแล้ว (Approved)</div>
          </div>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              {report?.pendingCount ?? 0}
            </div>
            <div className="stat-label">รออนุมัติ (Pending)</div>
          </div>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#ef4444' }}>
              {report?.rejectedCount ?? 0}
            </div>
            <div className="stat-label">ถูกปฏิเสธ (Rejected)</div>
          </div>
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#6366f1' }}>
              {report?.approvalRatePercentage ?? 100}%
            </div>
            <div className="stat-label">อัตราการอนุมัติ</div>
          </div>
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* By Room Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={18} color="#2563eb" />
            <span>สถิติการใช้งานแยกตามห้องประชุม</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report?.byRoom.map(item => (
              <div key={item.roomId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{item.roomName}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {item.count} ครั้ง ({item.percentage}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
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
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#10b981" />
            <span>สถิติการจองแยกตามแผนก</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report?.byDepartment && report.byDepartment.length > 0 ? (
              report.byDepartment.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.department}</span>
                  <span
                    style={{
                      background: '#e2e8f0',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.775rem',
                      fontWeight: 700
                    }}
                  >
                    {item.count} ครั้ง
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                ไม่มีข้อมูลแผนก
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtered Bookings Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              ตารางรายละเอียดการจองห้องประชุม
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
