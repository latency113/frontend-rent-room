import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../../types';
import { usersApi } from '../../api/users.api';
import { StatusBadge } from '../common/StatusBadge';
import { formatThaiDateTime } from '../../utils/date';
import { Check, X, Trash2, Search, UserCheck, Plus, Edit2, Shield, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { confirmDialog, promptDialog, warningAlert } from '../../utils/dialog';
import { UserFormModal } from './UserFormModal';

export const UserApprovalTable: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll(statusFilter, roleFilter);
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, roleFilter]);

  const handleCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleApprove = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: 'ยืนยันการอนุมัติสมาชิก',
      text: `คุณต้องการอนุมัติบัญชีผู้ใช้ "${name}" เข้าสู่ระบบเพื่อเริ่มใช้งานใช่หรือไม่?`,
      confirmText: 'อนุมัติทันที',
      cancelText: 'ยกเลิก',
      icon: 'question',
    });
    if (!confirmed) return;

    const res = await usersApi.approve(id);
    if (res.success) {
      toast.success(`อนุมัติผู้ใช้งาน "${name}" เรียบร้อยแล้ว`);
      fetchUsers();
    } else {
      toast.error(res.error || 'ไม่สามารถอนุมัติได้');
    }
  };

  const handleReject = async (id: string, name: string) => {
    const reason = await promptDialog({
      title: 'ปฏิเสธการสมัครสมาชิก',
      text: `ระบุเหตุผลในการปฏิเสธบัญชี "${name}" (ระบบจะบันทึกและแจ้งเตือนผู้ใช้):`,
      inputPlaceholder: 'ระบุเหตุผล เช่น ข้อมูลไม่ครบถ้วน...',
      defaultValue: 'ข้อมูลไม่ครบถ้วนหรือไม่ใช่บุคลากรของหน่วยงาน',
      confirmText: 'ปฏิเสธคำขอ',
      cancelText: 'ยกเลิก',
      isDanger: true,
      icon: 'warning',
    });
    if (reason === null) return;

    const res = await usersApi.reject(id, reason);
    if (res.success) {
      toast.success(`ปฏิเสธคำขอสมัครของ "${name}" เรียบร้อย`);
      fetchUsers();
    } else {
      toast.error(res.error || 'ไม่สามารถปฏิเสธได้');
    }
  };

  const handleDelete = async (targetUser: User) => {
    // ตรวจสอบว่าผู้ใช้งานมีรายการจองห้องประชุมหรือไม่
    if (targetUser.booking_count && targetUser.booking_count > 0) {
      await warningAlert(
        'ไม่สามารถลบผู้ใช้งานนี้ได้',
        `ผู้ใช้งาน "${targetUser.name}" มีประวัติหรือรายการจองห้องประชุม (${targetUser.booking_count} รายการ) อยู่ในระบบ จึงไม่สามารถลบบัญชีผู้ใช้ได้ เพื่อรักษาความถูกต้องของข้อมูลการจอง`
      );
      return;
    }

    const confirmed = await confirmDialog({
      title: 'ยืนยันการลบบัญชีผู้ใช้',
      text: `คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${targetUser.name}" ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      confirmText: 'ลบบัญชี',
      cancelText: 'ยกเลิก',
      isDanger: true,
      icon: 'warning',
    });
    if (!confirmed) return;

    const res = await usersApi.delete(targetUser.id);
    if (res.success) {
      toast.success('ลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
      fetchUsers();
    } else {
      await warningAlert(
        'ไม่สามารถลบผู้ใช้งานได้',
        res.error || 'ผู้ใช้งานนี้มีรายการจองห้องประชุมอยู่ในระบบ จึงไม่สามารถลบได้'
      );
    }
  };

  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q);

    return matchSearch;
  });

  const pendingCount = users.filter(u => u.status?.toLowerCase() === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter and Actions Bar */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Status Filter Buttons */}
          <button
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
          >
            ทั้งหมด ({users.length})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('pending')}
            style={pendingCount > 0 && statusFilter !== 'pending' ? { borderColor: '#f59e0b', color: '#b45309' } : {}}
          >
            รออนุมัติ ({pendingCount})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('approved')}
          >
            ✓ อนุมัติแล้ว
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('rejected')}
          >
            ✕ ถูกปฏิเสธ
          </button>

          {/* Role Filter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>บทบาท:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2 py-1 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="all">ทั้งหมด (All Roles)</option>
              <option value="user">ผู้ใช้งานทั่วไป (User)</option>
              <option value="admin">ผู้ดูแลระบบ (Admin)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '0.825rem', height: '34px' }}
              placeholder="ค้นหาชื่อ, อีเมล, แผนก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add User Button */}
          <button
            onClick={handleCreate}
            className="px-3.5 py-1.5 rounded-sm text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ - สกุล</th>
              <th>อีเมล</th>
              <th>แผนก</th>
              <th>เบอร์โทรศัพท์</th>
              <th>บทบาท</th>
              <th>สถานะ</th>
              <th>วันที่สมัคร</th>
              <th style={{ textAlign: 'center' }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                  กำลังโหลดข้อมูลสมาชิก...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  ไม่พบข้อมูลสมาชิกในระบบ
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>ID: {u.id.slice(0, 8)}...</span>
                          {u.booking_count !== undefined && u.booking_count > 0 ? (
                            <span
                              className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 rounded-sm"
                              title={`ผู้ใช้งานนี้มีรายการจองห้องประชุม ${u.booking_count} รายการ`}
                            >
                              จอง {u.booking_count} ครั้ง
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{u.email}</span>
                  </td>
                  <td>
                    <div className="font-medium text-slate-700 dark:text-slate-200">{u.department || '-'}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{u.phone || '-'}</span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        (u.role || '').toLowerCase() === 'admin'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {(u.role || '').toLowerCase() === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={u.status} type="user" />
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {u.created_at ? formatThaiDateTime(u.created_at) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                      {/* Edit Button */}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#6d28d9', borderColor: '#ddd6fe' }}
                        onClick={() => handleEdit(u)}
                        title="แก้ไขข้อมูลผู้ใช้"
                      >
                        <Edit2 size={13} />
                        <span>แก้ไข</span>
                      </button>

                      {/* Approval Buttons for Pending users */}
                      {u.status?.toLowerCase() === 'pending' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleApprove(u.id, u.name)}
                            title="อนุมัติสมาชิก"
                          >
                            <Check size={14} />
                            <span>อนุมัติ</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleReject(u.id, u.name)}
                            title="ปฏิเสธสมาชิก"
                          >
                            <X size={14} />
                            <span>ปฏิเสธ</span>
                          </button>
                        </>
                      )}

                      {/* Delete Button (disabled for own account) */}
                      {String(currentUser?.id) !== String(u.id) && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '4px 8px',
                            color: u.booking_count && u.booking_count > 0 ? '#94a3b8' : '#ef4444',
                            borderColor: u.booking_count && u.booking_count > 0 ? '#e2e8f0' : undefined
                          }}
                          onClick={() => handleDelete(u)}
                          title={
                            u.booking_count && u.booking_count > 0
                              ? `มีประวัติการจอง ${u.booking_count} รายการ (ไม่สามารถลบได้)`
                              : 'ลบสมาชิก'
                          }
                        >
                          <Trash2 size={14} />
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

      {/* User Create / Edit Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        userToEdit={userToEdit}
      />
    </div>
  );
};
