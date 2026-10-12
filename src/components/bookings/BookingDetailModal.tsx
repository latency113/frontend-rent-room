import React from 'react';
import { createPortal } from 'react-dom';
import { Booking, Room } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatThaiDate, formatThaiDateTime } from '../../utils/date';
import { roomsApi } from '../../api/rooms.api';
import {
  X,
  Calendar,
  Clock,
  Users,
  Building2,
  Phone,
  Mail,
  Briefcase,
  Layers,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  UserCheck
} from 'lucide-react';

import { getEquipmentUnit, getEquipmentThaiName } from '../../utils/equipment';

const roomsCache = new Map<string, Room>();

// Pre-warm rooms cache so room details and room code are instantly available
if (typeof window !== 'undefined') {
  roomsApi.getAll().then(res => {
    if (res.success && res.data) {
      res.data.forEach(r => {
        if (r.id) roomsCache.set(String(r.id), r);
        if (r.room_id) roomsCache.set(String(r.room_id), r);
      });
    }
  }).catch(() => {});
}

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string, title: string) => void;
  onReject?: (id: string, title: string) => void;
  isAdmin?: boolean;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isAdmin = false
}) => {
  if (!isOpen || !booking) return null;

  const roomIdStr = String(booking.room_id || booking.room?.room_id || booking.room?.id || '');
  const [resolvedRoom, setResolvedRoom] = React.useState<Room | null>(() => {
    if (booking.room?.code || booking.room?.room_code) return booking.room;
    if (roomIdStr && roomsCache.has(roomIdStr)) return roomsCache.get(roomIdStr) || null;
    return booking.room || null;
  });

  React.useEffect(() => {
    if (!booking) {
      setResolvedRoom(null);
      return;
    }

    if (booking.room?.code || booking.room?.room_code) {
      setResolvedRoom(booking.room);
      if (roomIdStr) roomsCache.set(roomIdStr, booking.room);
      return;
    }

    if (roomIdStr && roomsCache.has(roomIdStr)) {
      setResolvedRoom(roomsCache.get(roomIdStr) || null);
      return;
    }

    if (roomIdStr) {
      roomsApi.getById(roomIdStr).then(res => {
        if (res.success && res.data) {
          roomsCache.set(roomIdStr, res.data);
          setResolvedRoom(res.data);
        }
      }).catch(() => {});
    }
  }, [booking, roomIdStr]);

  const currentRoom = resolvedRoom || booking.room;
  const roomCodeDisplay = currentRoom?.code || currentRoom?.room_code || '-';

  const bookingIdDisplay = `#BKG-${String(booking.booking_id || booking.id).padStart(4, '0')}`;
  const statusUpper = (booking.status || '').toUpperCase();

  // Equipment list with quantities and units
  const equipmentsList = React.useMemo(() => {
    if (booking.booking_equipments && booking.booking_equipments.length > 0) {
      return booking.booking_equipments.map(be => {
        const name = be.equipment_name || be.equipment?.equipment_name || `อุปกรณ์ #${be.equipment_id}`;
        const qty = be.requested_quantity || 1;
        return {
          name,
          thaiName: getEquipmentThaiName(name),
          quantity: qty,
          unit: getEquipmentUnit(name)
        };
      });
    }

    if (booking.equipment && booking.equipment.length > 0) {
      return booking.equipment.map(name => ({
        name,
        thaiName: getEquipmentThaiName(name),
        quantity: 1,
        unit: getEquipmentUnit(name)
      }));
    }

    return [];
  }, [booking]);

  const totalQuantity = equipmentsList.reduce((sum, item) => sum + item.quantity, 0);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-md max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100/80 dark:border-purple-800 shadow-sm shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700">
                  {bookingIdDisplay}
                </span>
                <StatusBadge status={booking.status} />
              </div>
              <h3 className="text-base sm:text-lg text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                รายละเอียดการจองห้องประชุม
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Meeting Title Card */}
          <div className="p-5 rounded-md bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
              <Calendar size={14} />
              <span>หัวข้อการประชุม</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-snug">
              {booking.title}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Building2 size={14} className="text-purple-500 dark:text-purple-400" />
              <span className="text-purple-900 dark:text-purple-300 font-semibold">
                {currentRoom?.name || currentRoom?.room_name || `ห้องประชุม ${booking.room_id}`}
              </span>
              {(currentRoom?.floor || currentRoom?.location_detail) && (
                <span className="text-slate-400 dark:text-slate-500">• {currentRoom.location_detail || currentRoom.floor}</span>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Date */}
            <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="text-slate-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium mb-1">
                <Calendar size={13} />
                <span>วันที่ใช้งาน</span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatThaiDate(booking.booking_date)}
              </div>
            </div>

            {/* 2. Time */}
            <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="text-slate-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium mb-1">
                <Clock size={13} />
                <span>ช่วงเวลา</span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                {booking.start_time} - {booking.end_time} น.
              </div>
            </div>

            {/* 3. Attendees */}
            <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="text-slate-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium mb-1">
                <Users size={13} />
                <span>ผู้เข้าร่วม</span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                {booking.attendees_count || booking.attendee_count || 1} คน
              </div>
              {(currentRoom?.capacity || booking.room?.capacity) && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  ความจุห้อง {currentRoom?.capacity || booking.room?.capacity} ที่นั่ง
                </div>
              )}
            </div>

            {/* 4. Room Code */}
            <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="text-slate-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium mb-1">
                <Building2 size={13} />
                <span>รหัสห้อง</span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {roomCodeDisplay}
              </div>
              {(currentRoom?.floor || currentRoom?.location_detail) && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {currentRoom.location_detail || currentRoom.floor}
                </div>
              )}
            </div>
          </div>

          {/* Booker & Organization Details */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-md p-5 bg-white dark:bg-slate-900 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck size={14} className="text-purple-600 dark:text-purple-400" />
              <span>ข้อมูลผู้จอง & หน่วยงาน</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-xs">ชื่อ-นามสกุล ผู้จอง</span>
                <span className="text-slate-900 dark:text-slate-100 text-sm mt-0.5 block font-medium">
                  {booking.booker_name || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-xs">สังกัดฝ่าย / แผนก</span>
                <span className="text-slate-900 dark:text-slate-100 text-sm mt-0.5 block font-medium">
                  {booking.department || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-xs">เบอร์โทรศัพท์ติดต่อ</span>
                {booking.phone ? (
                  <a
                    href={`tel:${booking.phone}`}
                    className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 mt-0.5"
                  >
                    <Phone size={13} />
                    <span>{booking.phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">-</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-xs">อีเมลสำหรับแจ้งเตือน</span>
                {booking.email ? (
                  <a
                    href={`mailto:${booking.email}`}
                    className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 mt-0.5"
                  >
                    <Mail size={13} />
                    <span>{booking.email}</span>
                  </a>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">-</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-xs">วันที่ส่งคำขอจอง</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                  {booking.created_at ? formatThaiDateTime(booking.created_at) : '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-xs">สาขา / สำนักงาน</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                  {booking.branch || 'สำนักงานใหญ่'}
                </span>
              </div>
            </div>
          </div>

          {/* Requested Equipment */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-md p-5 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers size={14} className="text-purple-600 dark:text-purple-400" />
                <span>อุปกรณ์ที่ขอใช้งานเพิ่มเติม</span>
              </h4>
              {equipmentsList.length > 0 && (
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800">
                  รวม {totalQuantity} รายการ
                </span>
              )}
            </div>

            {equipmentsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {equipmentsList.map((eq, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-md bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-sm bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800 shadow-2xs">
                        <Check size={14} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium block truncate">
                          {eq.name}
                        </span>
                        {eq.thaiName && eq.thaiName !== eq.name && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {eq.thaiName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs shadow-2xs">
                        <span className="text-purple-400 dark:text-purple-400 font-normal">จำนวน</span>
                        <span className="font-bold">{eq.quantity}</span>
                        <span className="text-purple-500 dark:text-purple-400 font-medium">{eq.unit}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                ไม่มีการขออุปกรณ์เพิ่มเติมสำหรับรายการนี้
              </p>
            )}
          </div>

          {/* Remarks & Notes */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-md p-5 bg-white dark:bg-slate-900">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <FileText size={14} className="text-purple-600 dark:text-purple-400" />
              <span>หมายเหตุ / วัตถุประสงค์</span>
            </h4>
            <div className="p-3.5 rounded-sm bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-700">
              {booking.note && booking.note.trim() ? (
                booking.note
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">ไม่มีหมายเหตุเพิ่มเติม</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            สถานะปัจจุบัน:{' '}
            <span className="text-slate-700 dark:text-slate-200 font-semibold">{booking.status}</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && statusUpper === 'PENDING' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReject?.(booking.id, booking.title);
                  }}
                  className="px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <X size={15} />
                  <span>ปฏิเสธคำขอ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApprove?.(booking.id, booking.title);
                  }}
                  className="px-5 py-2 rounded-sm text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={15} />
                  <span>อนุมัติการจอง</span>
                </button>
              </>
            )}

            {isAdmin && statusUpper === 'APPROVED' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReject?.(booking.id, booking.title);
                }}
                className="px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X size={15} />
                <span>ยกเลิกการอนุมัติ</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
