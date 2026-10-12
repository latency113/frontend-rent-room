import React from 'react';
import { Room } from '../../types';
import { Users, MapPin, Calendar, Edit2, Trash2, CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { confirmDialog } from '../../utils/dialog';

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
  onViewDetail?: (room: Room) => void;
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onBook,
  onViewDetail,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-slate-300/80 dark:hover:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden h-full">
      {/* Image Preview with Badges */}
      <div
        className="relative w-full h-48 sm:h-52 bg-slate-900 overflow-hidden cursor-pointer select-none shrink-0"
        onClick={() => onViewDetail?.(room)}
        title="คลิกเพื่อดูรายละเอียดห้องประชุม"
      >
        <img
          src={room.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80'}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />

        {/* Capacity Badge */}
        <div className="absolute top-3.5 right-3.5 bg-slate-900/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
          <Users size={13} className="text-blue-400" />
          <span>สูงสุด {room.capacity} ที่นั่ง</span>
        </div>

        {/* Status Pill */}
        <div className="absolute top-3.5 left-3.5">
          {(room.status !== undefined ? Number(room.status) === 1 : room.is_active) ? (
            <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              พร้อมใช้งาน
            </span>
          ) : (
            <span className="bg-rose-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              ปิดปรับปรุง
            </span>
          )}
        </div>

        {/* Quick View Button on Image Bottom Right */}
        {onViewDetail && (
          <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-sm backdrop-blur-md flex items-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
            <Eye size={13} className="text-blue-600 dark:text-blue-400" />
            <span>ดูข้อมูล</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Code & Location */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800 px-2 py-0.5 rounded-md tracking-wide">
              {room.code || `MR-${room.room_id || room.id}`}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <MapPin size={13} className="text-slate-400 dark:text-slate-500" />
              <span>{room.location_detail || room.floor || 'ชั้น 1'}</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onViewDetail?.(room)}
            className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer line-clamp-1 mb-1.5"
            title={room.name || room.room_name}
          >
            {room.name || room.room_name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {room.description || 'ห้องประชุมมาตรฐาน พร้อมสิ่งอำนวยความสะดวกและเทคโนโลยีสำหรับการประชุมอย่างครบครัน'}
          </p>
        </div>

        <div>
          {/* Equipment Badges */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              อุปกรณ์ประจำห้อง
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[26px]">
              {room.equipments && room.equipments.length > 0 ? (
                room.equipments.slice(0, 3).map((eq) => (
                  <span
                    key={eq.equipment_id}
                    className="text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1"
                  >
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span>{eq.equipment_name}</span>
                  </span>
                ))
              ) : room.equipment && room.equipment.length > 0 ? (
                room.equipment.slice(0, 3).map((name, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1"
                  >
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span>{name}</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">- ไม่มีอุปกรณ์ติดตั้งประจำ -</span>
              )}

              {((room.equipments?.length || room.equipment?.length || 0) > 3) && (
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                  +{(room.equipments?.length || room.equipment?.length || 0) - 3}
                </span>
              )}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            {/* Detail / Admin actions */}
            <div className="flex items-center gap-1">
              {onViewDetail && (
                <button
                  onClick={() => onViewDetail(room)}
                  className="px-2.5 py-1.5 rounded-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="ดูรายละเอียดห้อง"
                >
                  <span>รายละเอียด</span>
                </button>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => onEdit?.(room)}
                    className="p-1.5 rounded-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                    title="แก้ไขข้อมูลห้อง"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: 'ยืนยันการลบห้องประชุม',
                        text: `คุณต้องการลบห้อง "${room.name}" ออกจากระบบใช่หรือไม่?`,
                        confirmText: 'ลบห้องประชุม',
                        cancelText: 'ยกเลิก',
                        isDanger: true,
                        icon: 'warning',
                      });
                      if (ok) {
                        onDelete?.(room.id);
                      }
                    }}
                    className="p-1.5 rounded-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="ลบห้องประชุม"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>

            {/* Book Room Button (Only for regular users) */}
          {(() => {
            if (isAdmin) return null;
            const isAvailable = room.status !== undefined ? Number(room.status) === 1 : room.is_active;
            return (
              <button
                onClick={() => onBook(room)}
                disabled={!isAvailable}
                style={{ minHeight: '36px' }}
                className={`px-3.5 py-2 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAvailable
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Calendar size={14} />
                <span>{isAvailable ? 'จองห้องนี้' : 'ปิดปรับปรุง'}</span>
              </button>
            );
          })()}
          </div>
        </div>
      </div>
    </div>
  );
};

