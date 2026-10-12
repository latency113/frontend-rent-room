import React from 'react';
import { BookingStatus, UserStatus } from '../../types';
import { Clock, CheckCircle2, XCircle, Ban, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: BookingStatus | UserStatus | string;
  type?: 'booking' | 'user';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status
}) => {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'pending') {
    return (
      <span className="badge badge-pending inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all dark:bg-amber-950/50 dark:border-amber-800/60">
        <Clock size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-amber-800 dark:text-amber-300">รออนุมัติ</span>
      </span>
    );
  }

  if (normalized === 'approved') {
    return (
      <span className="badge badge-approved inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all dark:bg-emerald-950/50 dark:border-emerald-800/60">
        <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-emerald-800 dark:text-emerald-300 truncate">อนุมัติแล้ว</span>
      </span>
    );
  }

  if (normalized === 'rejected') {
    return (
      <span className="badge badge-rejected inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all dark:bg-rose-950/50 dark:border-rose-800/60">
        <XCircle size={12} className="text-rose-600 dark:text-rose-400 shrink-0" />
        <span className="text-rose-800 dark:text-rose-300">ถูกปฏิเสธ</span>
      </span>
    );
  }

  if (normalized === 'cancelled') {
    return (
      <span className="badge badge-cancelled inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all dark:bg-slate-800/70 dark:border-slate-700/80">
        <Ban size={12} className="text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="text-slate-700 dark:text-slate-300 truncate">ยกเลิกแล้ว</span>
      </span>
    );
  }

  if (normalized === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 shadow-xs">
        <ShieldCheck size={12} className="text-purple-600 dark:text-purple-400" />
        <span>ผู้ดูแลระบบ</span>
      </span>
    );
  }

  return (
    <span className="badge badge-cancelled inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium dark:bg-slate-800 dark:text-slate-300">
      {status}
    </span>
  );
};
