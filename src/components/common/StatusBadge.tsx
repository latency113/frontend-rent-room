import React from 'react';
import { BookingStatus, UserStatus } from '../../types';
import { Clock, CheckCircle2, XCircle, Ban, ShieldCheck, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: BookingStatus | UserStatus | string;
  type?: 'booking' | 'user';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showDot = true 
}) => {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'pending') {
    return (
      <span className="badge badge-pending inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all">
        <Clock size={12} className="text-amber-600 shrink-0" />
        <span className="text-amber-800">รออนุมัติ</span>
      </span>
    );
  }

  if (normalized === 'approved') {
    return (
      <span className="badge badge-approved inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all">
        <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
        <span className="text-emerald-800 truncate">อนุมัติแล้ว</span>
      </span>
    );
  }

  if (normalized === 'rejected') {
    return (
      <span className="badge badge-rejected inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all">
        <XCircle size={12} className="text-rose-600 shrink-0" />
        <span className="text-rose-800">ถูกปฏิเสธ</span>
      </span>
    );
  }

  if (normalized === 'cancelled') {
    return (
      <span className="badge badge-cancelled inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-xs transition-all">
        <Ban size={12} className="text-slate-500 shrink-0" />
        <span className="text-slate-700 truncate">ยกเลิกแล้ว</span>
      </span>
    );
  }

  if (normalized === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
        <ShieldCheck size={12} className="text-purple-600" />
        <span>ผู้ดูแลระบบ</span>
      </span>
    );
  }

  return (
    <span className="badge badge-cancelled inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium">
      {status}
    </span>
  );
};
