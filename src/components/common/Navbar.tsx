import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  Calendar,
  Building2,
  ClipboardList,
  Shield,
  Bell,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { formatThaiDateTime } from '../../utils/date';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenBooking?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab: propTab,
  setCurrentTab: propSetCurrentTab,
  onOpenLogin: propOpenLogin,
  onOpenRegister: propOpenRegister
}) => {
  const { user, logout } = useAuth();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();

  // Try to get TanStack Router state safely
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (tab: string, path: string) => {
    if (propSetCurrentTab) {
      propSetCurrentTab(tab);
    }
    navigate({ to: path as any });
  };

  const handleLoginClick = () => {
    if (propOpenLogin) propOpenLogin();
    else openLogin();
  };

  const handleRegisterClick = () => {
    if (propOpenRegister) propOpenRegister();
    else openRegister();
  };

  // Determine active tab
  const isActive = (tab: string) => {
    if (propTab) return propTab === tab;
    if (tab === 'admin') return pathname.startsWith('/admin');
    if (tab === 'calendar') return pathname.startsWith('/calendar');
    if (tab === 'rooms') return pathname === '/' || pathname.startsWith('/rooms');
    if (tab === 'my-bookings') return pathname.startsWith('/my-bookings');
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          onClick={() => handleNav(isAdmin ? 'admin' : 'rooms', isAdmin ? '/admin/bookings' : '/rooms')}
        >
          <div className={`w-10 h-10 rounded-md ${
            isAdmin
              ? 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-500 shadow-purple-500/25'
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 shadow-blue-500/20'
          } text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
            {isAdmin ? <Shield size={22} className="stroke-[2.2]" /> : <Building2 size={22} className="stroke-[2.2]" />}
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>ระบบจองห้องประชุม</span>
              {isAdmin ? (
                <span className="px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 rounded-md">
                  ADMIN PORTAL
                </span>
              ) : (
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 rounded-md">
                  ผู้ใช้งาน
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {isAdmin ? 'ศูนย์บริหารและจัดการระบบ' : 'Meeting Room Booking'}
            </p>
          </div>
        </div>

        {/* Navigation Links - Completely separated for Admin vs User */}
        <nav className="hidden md:flex items-center gap-1.5">
          {isAdmin ? (
            <>
              <button
                className={`px-3.5 py-2 rounded-sm text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive('admin')
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-600/30'
                    : 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-800 dark:hover:text-purple-200'
                }`}
                onClick={() => handleNav('admin', '/admin/bookings')}
              >
                <Shield size={16} />
                <span>แดชบอร์ดจัดการระบบ</span>
              </button>

              <button
                className={`px-3.5 py-2 rounded-sm text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive('calendar')
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-purple-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
                onClick={() => handleNav('calendar', '/calendar')}
              >
                <Calendar size={16} />
                <span>ปฏิทินการจองทั้งหมด</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={`px-3.5 py-2 rounded-sm text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive('rooms')
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20 dark:ring-blue-500/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
                onClick={() => handleNav('rooms', '/rooms')}
              >
                <Building2 size={16} />
                <span>ห้องประชุม</span>
              </button>

              <button
                className={`px-3.5 py-2 rounded-sm text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive('calendar')
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20 dark:ring-blue-500/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
                onClick={() => handleNav('calendar', '/calendar')}
              >
                <Calendar size={16} />
                <span>ปฏิทินจองห้อง</span>
              </button>

              {user && (
                <button
                  className={`px-3.5 py-2 rounded-sm text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive('my-bookings')
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20 dark:ring-blue-500/40'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                  }`}
                  onClick={() => handleNav('my-bookings', '/my-bookings')}
                >
                  <ClipboardList size={16} />
                  <span>การจองของฉัน</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* User Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle (Visible for everyone) */}
          <ThemeToggle />

          {user ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2.5 rounded-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  title="การแจ้งเตือน"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-white dark:bg-slate-900 rounded-md shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 animate-scaleIn">
                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">การแจ้งเตือน</span>
                        {unreadCount > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full">
                            {unreadCount} ใหม่
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                        >
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                          ไม่มีการแจ้งเตือนใหม่ในขณะนี้
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                              n.is_read ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/40 dark:bg-blue-950/30'
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 ${n.type.includes('approved') ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {n.type.includes('approved') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                                {formatThaiDateTime(n.created_at)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Badge */}
              <div
                className={`flex items-center gap-2.5 pl-1 pr-3 py-1 bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-md ${
                  isAdmin ? 'cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/60 dark:hover:bg-purple-950/40 transition-all' : ''
                }`}
                onClick={() => isAdmin && handleNav('admin', '/admin/bookings')}
                title={isAdmin ? 'คลิกเพื่อไปที่แดชบอร์ดผู้ดูแลระบบ' : undefined}
              >
                <div className={`w-8 h-8 rounded-sm ${
                  isAdmin
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/25'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20'
                } text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight max-w-[120px] truncate">
                    {user.name}
                  </div>
                  <div className={`text-[10px] ${
                    isAdmin ? 'text-purple-700 dark:text-purple-300 font-semibold' : 'text-slate-500 dark:text-slate-400 font-medium'
                  }`}>
                    {isAdmin ? 'ผู้ดูแลระบบ (Admin)' : (user.department || 'สมาชิก')}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoginClick}
                className="px-3.5 py-2 rounded-sm text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <User size={15} />
                <span>เข้าสู่ระบบ</span>
              </button>
              <button
                onClick={handleRegisterClick}
                className="px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>สมัครสมาชิก</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
