import React, { useState, useEffect } from 'react';
import { Room, Booking } from '../types';
import { bookingsApi } from '../api/bookings.api';
import { roomsApi } from '../api/rooms.api';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Loader2,
  AlertTriangle,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RoomDetailPageProps {
  room?: Room | null;
  onBack?: () => void;
  onBookRoom?: (room: Room) => void;
}

export const RoomDetailPage: React.FC<RoomDetailPageProps> = ({
  room: propRoom,
  onBack: propBack,
  onBookRoom: propBookRoom
}) => {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { roomId?: string };

  const [room, setRoom] = useState<Room | null>(propRoom || null);
  const [isLoadingRoom, setIsLoadingRoom] = useState<boolean>(!propRoom);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(true);

  // Fetch room if not provided in props
  useEffect(() => {
    if (propRoom) {
      setRoom(propRoom);
      setSelectedImage(propRoom.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80');
      setIsLoadingRoom(false);
      return;
    }

    const roomId = params.roomId;
    if (roomId) {
      setIsLoadingRoom(true);
      roomsApi.getById(roomId).then(res => {
        if (res.success && res.data) {
          setRoom(res.data);
          setSelectedImage(res.data.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80');
        } else {
          toast.error('ไม่พบข้อมูลห้องประชุม');
        }
      }).catch(() => {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องประชุม');
      }).finally(() => {
        setIsLoadingRoom(false);
      });
    }
  }, [propRoom, params.roomId]);

  // Fetch room bookings schedule
  useEffect(() => {
    if (!room) return;
    const fetchRoomSchedule = async () => {
      setIsLoadingBookings(true);
      try {
        const res = await bookingsApi.getAll({ room_id: String(room.room_id || room.id) });
        if (res.success && res.data) {
          const today = new Date().toISOString().split('T')[0];
          const upcoming = res.data.filter(b => (b.booking_date || '') >= today);
          setRoomBookings(upcoming.slice(0, 5));
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchRoomSchedule();
  }, [room]);

  const handleBack = () => {
    if (propBack) {
      propBack();
    } else {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: '/rooms' as any });
      }
    }
  };

  const isRoomAvailable = room
    ? (room.status !== undefined ? Number(room.status) === 1 : (room.is_active !== false))
    : false;
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  const handleBook = () => {
    if (!room) return;
    if (isAdmin) {
      toast.error('ผู้ดูแลระบบ (Admin) ไม่สามารถทำการจองห้องประชุมได้');
      return;
    }
    if (!isRoomAvailable) {
      toast.error('ห้องประชุมนี้อยู่ในสถานะปิดปรับปรุง ไม่สามารถทำการจองได้');
      return;
    }
    if (propBookRoom) {
      propBookRoom(room);
    } else {
      if (!user) {
        toast.error('กรุณาเข้าสู่ระบบก่อนทำการจองห้องประชุม');
        openLogin();
        return;
      }
      navigate({
        to: '/booking',
        search: { roomId: String(room.id || room.room_id) } as any
      });
    }
  };

  if (isLoadingRoom) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">กำลังโหลดรายละเอียดห้องประชุม...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-white rounded-md p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto">
        <Building2 size={36} className="text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">ไม่พบห้องประชุม</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">ห้องประชุมที่ต้องการอาจถูกลบหรือไม่มีอยู่ในระบบ</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded-sm bg-blue-600 text-white font-semibold text-xs cursor-pointer"
        >
          กลับหน้ารายการห้องประชุม
        </button>
      </div>
    );
  }

  // Collect images (support multiple from room.images)
  const allImages = (room.images && room.images.length > 0)
    ? room.images.map(img => img.image_url)
    : [selectedImage || room.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>ย้อนกลับหน้ารายการ</span>
        </button>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Gallery & Images (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Main Large Display Image */}
          <div className="relative aspect-16/10 rounded-md overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md group">
            <img
              src={selectedImage || allImages[0]}
              alt={room.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold shadow-md">
                {room.code}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              {(room.status !== undefined ? Number(room.status) === 1 : room.is_active) ? (
                <span className="px-3 py-1 rounded-md bg-emerald-500/90 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>พร้อมใช้งาน</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-md bg-rose-500/90 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                  <span>ปิดปรับปรุง</span>
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails list if multiple images exist */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`relative w-20 h-14 rounded-md overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    (selectedImage || allImages[0]) === imgUrl
                      ? 'border-blue-600 ring-2 ring-blue-600/20 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Room Summary & Fast Action (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-md p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>ห้องประชุมมาตรฐานสากล</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              {room.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {room.description || 'ห้องประชุมตกแต่งสไตล์โมเดิร์น พร้อมสิ่งอำนวยความสะดวกครบครัน เหมาะสำหรับประชุมทีมและสัมมนา'}
            </p>

            <div className="grid grid-cols-2 gap-3.5 my-6">
              <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">ความจุสูงสุด</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{room.capacity} ที่นั่ง</div>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">สถานที่ตั้ง</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{room.location_detail || room.floor || 'ชั้น 1'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Booking CTA */}
          <div className="space-y-2.5 mt-4">
            {isAdmin ? (
              <div className="w-full py-3.5 px-4 rounded-sm bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-xs sm:text-sm flex items-center justify-center gap-2">
                <Shield size={16} />
                <span>บัญชีผู้ดูแลระบบ (Admin) ไม่สามารถจองห้องประชุมได้</span>
              </div>
            ) : (
              <button
                onClick={handleBook}
                disabled={!isRoomAvailable}
                className={`w-full py-3.5 px-4 rounded-sm font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  isRoomAvailable
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed shadow-none'
                }`}
              >
                {isRoomAvailable ? (
                  <>
                    <Calendar size={18} />
                    <span>ส่งคำขอจองห้องนี้</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} className="text-rose-500" />
                    <span>ห้องปิดปรับปรุง (ไม่สามารถจองได้)</span>
                  </>
                )}
              </button>
            )}

            {!isAdmin && !isRoomAvailable && (
              <div className="p-3 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
                <span>ห้องประชุมนี้อยู่ระหว่างปิดปรับปรุงชั่วคราว จึงไม่สามารถส่งคำขอจองได้</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Equipment List Section (RoomEquipment) */}
      <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              อุปกรณ์ประจำห้องประชุม (Room Equipment)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              อุปกรณ์ที่ติดตั้งและพร้อมใช้งานในห้องนี้ (ข้อมูลจากตาราง RoomEquipment)
            </p>
          </div>
        </div>

        {/* Dynamic Equipments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {room.equipments && room.equipments.length > 0 ? (
            room.equipments.map((eq: any, index: number) => (
              <div
                key={eq.room_equipment_id || eq.equipment_id || index}
                className="p-3.5 rounded-md border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      {eq.equipment_name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      จำนวนติดตั้ง: {eq.quantity ?? eq.default_quantity ?? 1} รายการ
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  มีประจำห้อง
                </span>
              </div>
            ))
          ) : room.equipment && room.equipment.length > 0 ? (
            room.equipment.map((eq, index) => (
              <div
                key={index}
                className="p-3.5 rounded-md border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                      {eq}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">พร้อมใช้งาน</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  มีประจำห้อง
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-full py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
              ไม่มีอุปกรณ์ติดตั้งประจำห้องนี้ (สามารถขอเพิ่มเติมในแบบฟอร์มการจองได้)
            </div>
          )}
        </div>
      </div>

      {/* Schedule / Upcoming Bookings Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ตารางการจองล่าสุดของห้องนี้
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ตรวจสอบช่วงเวลาที่ห้องนี้มีผู้จองแล้วเพื่อหลีกเลี่ยงเวลาซ้ำซ้อน
            </p>
          </div>
        </div>

        {isLoadingBookings ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            กำลังตรวจสอบตารางการจอง...
          </div>
        ) : roomBookings.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/60 dark:bg-slate-800/40 rounded-md border border-dashed border-slate-200 dark:border-slate-700">
            <Sparkles size={24} className="text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              ยังไม่มีการจองในเร็วๆ นี้
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ห้องนี้ว่างพร้อมให้คุณเลือกช่วงเวลาที่ต้องการได้ทันที
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {roomBookings.map((b) => (
              <div
                key={b.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 px-2 rounded-sm transition-colors"
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{b.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ผู้จอง: {b.booker_name} ({b.department})
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-sm">
                  {b.booking_date} | {b.start_time} - {b.end_time} น.
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      (b.status || '').toUpperCase() === 'APPROVED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800'
                    }`}
                  >
                    {(b.status || '').toUpperCase() === 'APPROVED' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
