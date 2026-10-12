import React, { useState, useEffect } from 'react';
import { Room } from '../types';
import { RoomCard } from '../components/rooms/RoomCard';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { roomsApi } from '../api/rooms.api';
import { STANDARD_EQUIPMENT } from '../utils/equipment';
import { useNavigate } from '@tanstack/react-router';
import { Search, Plus, SlidersHorizontal, Building2, Sparkles, Filter, Check, Shield, ArrowRight, LayoutDashboard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoomsPageProps {
  rooms?: Room[];
  onOpenBooking?: (room: Room) => void;
  onViewRoomDetail?: (room: Room) => void;
  onOpenCreateRoom?: () => void;
  onOpenEditRoom?: (room: Room) => void;
  onDeleteRoom?: (id: string) => void;
  onNavigateToAdmin?: () => void;
}

export const RoomsPage: React.FC<RoomsPageProps> = ({
  rooms: propRooms,
  onOpenBooking: propOpenBooking,
  onViewRoomDetail: propViewRoomDetail,
  onOpenCreateRoom: propOpenCreateRoom,
  onOpenEditRoom: propOpenEditRoom,
  onDeleteRoom: propDeleteRoom,
  onNavigateToAdmin: propNavigateToAdmin
}) => {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>(propRooms || []);
  const [isLoading, setIsLoading] = useState<boolean>(!propRooms || propRooms.length === 0);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await roomsApi.getAll();
      if (res.success && res.data) {
        setRooms(res.data);
      }
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propRooms && propRooms.length > 0) {
      setRooms(propRooms);
      setIsLoading(false);
    } else {
      fetchRooms();
    }
  }, [propRooms]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [capacityFilter, setCapacityFilter] = useState<string>('All');

  // Navigation handlers with TanStack Router fallback
  const handleOpenBooking = (room: Room) => {
    if (propOpenBooking) {
      propOpenBooking(room);
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

  const handleViewRoomDetail = (room: Room) => {
    if (propViewRoomDetail) {
      propViewRoomDetail(room);
    } else {
      navigate({
        to: '/rooms/$roomId',
        params: { roomId: String(room.id || room.room_id) }
      });
    }
  };

  const handleOpenCreateRoom = () => {
    if (propOpenCreateRoom) {
      propOpenCreateRoom();
    } else {
      navigate({ to: '/rooms/new' as any });
    }
  };

  const handleOpenEditRoom = (room: Room) => {
    if (propOpenEditRoom) {
      propOpenEditRoom(room);
    } else {
      navigate({
        to: '/rooms/$roomId/edit',
        params: { roomId: String(room.id || room.room_id) }
      });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (propDeleteRoom) {
      propDeleteRoom(id);
    } else {
      try {
        const res = await roomsApi.delete(id);
        if (res.success) {
          toast.success('ลบห้องประชุมเรียบร้อยแล้ว');
          fetchRooms();
        } else {
          toast.error(res.error || 'ไม่สามารถลบห้องประชุมได้');
        }
      } catch {
        toast.error('เกิดข้อผิดพลาดในการลบห้องประชุม');
      }
    }
  };

  const handleNavigateToAdmin = () => {
    if (propNavigateToAdmin) {
      propNavigateToAdmin();
    } else {
      navigate({ to: '/admin' as any });
    }
  };

  const filteredRooms = rooms.filter(room => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      room.name.toLowerCase().includes(q) || room.code.toLowerCase().includes(q)

    const matchesEquipment =
      selectedEquipment === 'All' ||
      (room.equipment && room.equipment.includes(selectedEquipment)) ||
      (room.equipments && room.equipments.some(e => e.equipment_name === selectedEquipment));

    let matchesCapacity = true;
    if (capacityFilter === 'small') matchesCapacity = room.capacity <= 12;
    else if (capacityFilter === 'medium') matchesCapacity = room.capacity > 12 && room.capacity <= 30;
    else if (capacityFilter === 'large') matchesCapacity = room.capacity > 30;

    return matchesSearch && matchesEquipment && matchesCapacity;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Admin Mode Quick Access Bar */}
      {isAdmin && (
        <div className="p-4 bg-gradient-to-r from-purple-900/95 via-indigo-950 to-slate-900 border border-purple-500/30 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-purple-950/20 text-white animate-scaleIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30 shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>โหมดผู้ดูแลระบบ (Admin Mode)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-full">ACTIVE</span>
              </div>
              <p className="text-xs text-purple-200/80">คุณสามารถจัดการห้องประชุม, อนุมัติผู้ใช้งาน และอนุมัติคำขอจองห้องได้ทันที</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              onClick={handleNavigateToAdmin}
              className="px-4 py-2.5 rounded-sm bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LayoutDashboard size={14} />
              <span>ไปที่แดชบอร์ด Admin</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={handleOpenCreateRoom}
              className="px-4 py-2.5 rounded-sm bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} className="text-purple-600" />
              <span>เพิ่มห้องใหม่</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-8 sm:p-12 shadow-xl shadow-blue-900/10 border border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-semibold">
              <Sparkles size={13} className="text-blue-300" />
              <span>ระบบบริหารจัดการและจองห้องประชุมอัจฉริยะ</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              ค้นหาและจองห้องประชุม <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200 bg-clip-text text-transparent">
                ที่ตอบโจทย์ทีมของคุณ
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              ตรวจสอบสถานะห้อง ความจุ อุปกรณ์ประจำห้อง และส่งคำขอจองได้สะดวกรวดเร็วในหน้าเดียว พร้อมระบบแจ้งเตือนแบบเรียลไทม์
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenCreateRoom}
              className="self-start md:self-center px-5 py-3 rounded-sm bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={18} className="text-blue-600" />
              <span>เพิ่มห้องประชุมใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-md p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-8 transition-colors">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            style={{ paddingLeft: '44px', height: '44px' }}
            className="w-full pr-4 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="ค้นหาชื่อห้อง, รหัสห้อง เช่น MR-101, Sapphire..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Capacity Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/90 px-3 py-2 rounded-sm border border-slate-200/80 dark:border-slate-700">
            <SlidersHorizontal size={15} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">ความจุ:</span>
            <select
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              value={capacityFilter}
              onChange={e => setCapacityFilter(e.target.value)}
            >
              <option value="All" className="dark:bg-slate-900 dark:text-slate-100">ทุกขนาด</option>
              <option value="small" className="dark:bg-slate-900 dark:text-slate-100">เล็ก (1 - 12 ที่นั่ง)</option>
              <option value="medium" className="dark:bg-slate-900 dark:text-slate-100">กลาง (13 - 30 ที่นั่ง)</option>
              <option value="large" className="dark:bg-slate-900 dark:text-slate-100">ใหญ่ (&gt; 30 ที่นั่ง)</option>
            </select>
          </div>

          {/* Equipment Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/90 px-3 py-2 rounded-sm border border-slate-200/80 dark:border-slate-700">
            <Filter size={15} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">อุปกรณ์:</span>
            <select
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              value={selectedEquipment}
              onChange={e => setSelectedEquipment(e.target.value)}
            >
              <option value="All" className="dark:bg-slate-900 dark:text-slate-100">อุปกรณ์ทั้งหมด</option>
              {STANDARD_EQUIPMENT.map(eq => (
                <option key={eq} value={eq} className="dark:bg-slate-900 dark:text-slate-100">{eq}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">กำลังโหลดข้อมูลห้องประชุม...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">ไม่พบห้องประชุมที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองอุปกรณ์และขนาดห้องใหม่
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedEquipment('All');
              setCapacityFilter('All');
            }}
            className="px-4 py-2 rounded-sm text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onBook={handleOpenBooking}
              onViewDetail={handleViewRoomDetail}
              onEdit={handleOpenEditRoom}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>
      )}
    </div>
  );
};
