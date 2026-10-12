import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

import { User as UserType, Department } from '../../types';
import { departmentsApi } from '../../api/departments.api';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user?: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [phone, setPhone] = useState('');

  // Fetch departments from database
  useEffect(() => {
    departmentsApi.getAll().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setDepartments(res.data);
        setDepartmentId(res.data[0].department_id);
      }
    }).catch(() => {});
  }, []);

  // Status
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('กำลังเข้าสู่ระบบ...');
    const res = await login(loginEmail.trim().toLowerCase(), loginPassword);
    toast.dismiss(loadingToast);
    setIsLoading(false);

    if (res.success) {
      toast.success('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับครับ!');
      onSuccess(res.user);
    } else {
      setError(res.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      toast.error(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('กรุณาระบุทั้งชื่อจริงและนามสกุล');
      return;
    }

    if (regPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('กำลังส่งคำขอสมัครสมาชิก...');

    const selectedDept = departments.find(d => Number(d.department_id) === Number(departmentId));
    const deptName = selectedDept?.department_name || '';

    const res = await register({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      department_id: departmentId ? Number(departmentId) : (selectedDept ? selectedDept.department_id : null),
      department: deptName,
      branch: 'สำนักงานใหญ่',
      phone: phone.trim()
    });

    toast.dismiss(loadingToast);
    setIsLoading(false);

    if (res.success) {
      setIsRegisterSuccess(true);
      toast.success('สมัครสมาชิกสำเร็จ! กรุณารอผู้ดูแลระบบอนุมัติบัญชี', { duration: 5000 });
    } else {
      setError(res.error || 'สมัครสมาชิกไม่สำเร็จ');
      toast.error(res.error || 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-slate-900 rounded-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors z-10 cursor-pointer"
          title="ปิดหน้าต่าง"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">ระบบจองห้องประชุม</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Meeting Room Booking System</p>
            </div>
          </div>

          {/* Mode Tabs */}
          {!isRegisterSuccess && (
            <div className="flex p-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-md">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                สมัครสมาชิกใหม่
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5 animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  อีเมลผู้ใช้งาน (Email) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="somsak@company.com"
                    style={{ paddingLeft: '44px', height: '46px' }}
                    className="w-full pr-4 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  รหัสผ่าน (Password) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '44px', paddingRight: '44px', height: '46px' }}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showLoginPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{ height: '46px' }}
                className="w-full mt-2 rounded-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
                {!isLoading && <ArrowRight size={16} />}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">ยังไม่มีบัญชีผู้ใช้งาน? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  สมัครสมาชิกใหม่
                </button>
              </div>
            </form>
          )}

          {/* 2. Register Form */}
          {mode === 'register' && (
            isRegisterSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">
                  ส่งคำขอสมัครสมาชิกสำเร็จ!
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว และกำลัง <b>รอผู้ดูแลระบบ (Admin) อนุมัติ</b> เมื่อได้รับการอนุมัติแล้ว คุณจะสามารถเข้าสู่ระบบและเริ่มจองห้องได้ทันที
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterSuccess(false);
                    setMode('login');
                  }}
                  style={{ height: '44px' }}
                  className="w-full px-4 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  ไปที่หน้าเข้าสู่ระบบ
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="p-3 rounded-sm bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <Sparkles size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>หลังสมัครสมาชิก บัญชีจะรอ Admin อนุมัติก่อนจึงจะล็อกอินได้</span>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อจริง (First Name) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="สมศักดิ์"
                        style={{ paddingLeft: '38px', height: '42px' }}
                        className="w-full pr-3 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      นามสกุล (Last Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="มั่งมี"
                      style={{ paddingLeft: '12px', paddingRight: '12px', height: '42px' }}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    อีเมลองค์กร (Email) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="somsak@company.com"
                      style={{ paddingLeft: '38px', height: '42px' }}
                      className="w-full pr-3 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingLeft: '38px', paddingRight: '38px', height: '42px' }}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showRegPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Department & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      แผนก (Department) *
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                      style={{ paddingLeft: '12px', paddingRight: '12px', height: '42px' }}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all cursor-pointer"
                    >
                      {departments.length === 0 ? (
                        <option value="">กำลังโหลดแผนก...</option>
                      ) : (
                        departments.map(d => (
                          <option key={d.department_id} value={d.department_id} className="dark:bg-slate-900 dark:text-slate-100">
                            {d.department_name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      เบอร์โทรศัพท์ (Phone) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08X-XXX-XXXX"
                        style={{ paddingLeft: '38px', height: '42px' }}
                        className="w-full pr-3 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ height: '46px' }}
                  className="w-full mt-3 rounded-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  <span>{isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอสมัครสมาชิก'}</span>
                  {!isLoading && <ArrowRight size={16} />}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">มีบัญชีผู้ใช้อยู่แล้ว? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    เข้าสู่ระบบ
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
