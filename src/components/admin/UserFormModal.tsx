import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Department } from '../../types';
import { usersApi } from '../../api/users.api';
import { departmentsApi } from '../../api/departments.api';
import {
  X,
  UserPlus,
  UserCheck,
  Check,
  RefreshCw,
  Mail,
  Lock,
  Phone,
  User as UserIcon,
  Building2,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToEdit
}) => {
  const isEditMode = !!userToEdit;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [status, setStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED');

  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch departments for selection
  useEffect(() => {
    departmentsApi.getAll().then(res => {
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    }).catch(() => {});
  }, []);

  // Sync state when editing or opening
  useEffect(() => {
    if (userToEdit) {
      const parts = (userToEdit.name || '').trim().split(/\s+/);
      setFirstName(userToEdit.first_name || parts[0] || '');
      setLastName(userToEdit.last_name || parts.slice(1).join(' ') || '');
      setEmail(userToEdit.email || '');
      setPassword(''); // keep blank unless changing
      setPhone(userToEdit.phone || '');
      setDepartmentId(userToEdit.department_id ? String(userToEdit.department_id) : '');
      setRole((userToEdit.role || 'USER').toUpperCase() as any);
      setStatus((userToEdit.status || 'APPROVED').toUpperCase() as any);
      setError('');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setDepartmentId('');
      setRole('USER');
      setStatus('APPROVED');
      setError('');
    }
  }, [userToEdit, isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }
    if (!email.trim()) {
      setError('กรุณาระบุอีเมล');
      return;
    }

    if (!isEditMode && (!password || password.length < 6)) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (isEditMode && password && password.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: role.toUpperCase(),
        department_id: departmentId ? Number(departmentId) : null,
        status: status.toUpperCase()
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      if (isEditMode && userToEdit) {
        const res = await usersApi.update(userToEdit.id, payload);
        if (res.success) {
          toast.success(`อัปเดตข้อมูลผู้ใช้งาน "${payload.name}" สำเร็จ`);
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
          toast.error(res.error || 'ไม่สามารถอัปเดตข้อมูลได้');
        }
      } else {
        const res = await usersApi.create(payload);
        if (res.success) {
          toast.success(`เพิ่มผู้ใช้งาน "${payload.name}" สำเร็จ`);
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'ไม่สามารถสร้างผู้ใช้งานได้');
          toast.error(res.error || 'ไม่สามารถสร้างผู้ใช้งานได้');
        }
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-md max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60 shadow-sm shrink-0">
              {isEditMode ? <UserCheck size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEditMode ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditMode
                  ? 'แก้ไขรายละเอียด สิทธิ์การใช้งาน และสังกัดแผนก'
                  : 'กำหนดข้อมูลบัญชีผู้ใช้งานเพื่อเข้าใช้งานระบบจองห้องประชุม'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs rounded-sm border border-red-200 dark:border-red-900/60">
              {error}
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อจริง <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="เช่น สมชาย"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-sm border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                นามสกุล
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="เช่น ใจดี"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-sm border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              อีเมล (Email) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-sm border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              รหัสผ่าน {isEditMode ? '(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)' : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required={!isEditMode}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditMode ? '•••••••• (ไม่ระบุ = ใช้รหัสผ่านเดิม)' : 'อย่างน้อย 6 ตัวอักษร'}
                className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-sm border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Phone & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-sm border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                สังกัดฝ่าย / แผนก
              </label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-sm border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- ไม่ระบุแผนก --</option>
                  {departments.map((d) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Role and Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                บทบาท (Role)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-sm border transition-all cursor-pointer ${
                    role === 'USER'
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  ผู้ใช้ทั่วไป
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-sm border transition-all cursor-pointer ${
                    role === 'ADMIN'
                      ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  ผู้ดูแลระบบ
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                สถานะบัญชี (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-sm border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="APPROVED">อนุมัติแล้ว (Approved)</option>
                <option value="PENDING">รออนุมัติ (Pending)</option>
                <option value="REJECTED">ถูกปฏิเสธ (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-sm text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>{isEditMode ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้งาน'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
