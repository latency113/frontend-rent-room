import React, { useState, useEffect } from 'react';
import { Room } from '../types';
import { UserApprovalTable } from '../components/admin/UserApprovalTable';
import { AdminBookingTable } from '../components/admin/AdminBookingTable';
import { ReportView } from '../components/admin/ReportView';
import { DepartmentManagement } from '../components/admin/DepartmentManagement';
import { RoomCard } from '../components/rooms/RoomCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { roomsApi } from '../api/rooms.api';
import {
  Users,
  CalendarCheck,
  Building,
  BarChart3,
  Plus,
  Shield,
  FolderTree,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export type AdminTab = 'requests' | 'users' | 'rooms' | 'departments' | 'reports';

interface AdminDashboardPageProps {
  defaultTab?: AdminTab;
  rooms?: Room[];
  onOpenCreateRoom?: () => void;
  onOpenEditRoom?: (room: Room) => void;
  onDeleteRoom?: (id: string) => void;
  onOpenBooking?: (room: Room) => void;
  onViewRoomDetail?: (room: Room) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  defaultTab = 'requests',
  rooms: propRooms,
  onOpenCreateRoom,
  onOpenEditRoom,
  onDeleteRoom,
  onOpenBooking,
  onViewRoomDetail
}) => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState?.location?.pathname || '';

  const getTabFromPath = (path: string): AdminTab => {
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/departments')) return 'departments';
    if (path.includes('/admin/rooms')) return 'rooms';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/bookings')) return 'requests';
    return defaultTab;
  };

  const activeTab = getTabFromPath(currentPath);
  const [rooms, setRooms] = useState<Room[]>(propRooms || []);

  const fetchRooms = async () => {
    try {
      const res = await roomsApi.getAll();
      if (res.success && res.data) {
        setRooms(res.data);
      }
    } catch {
      // error
    }
  };

  useEffect(() => {
    if (propRooms && propRooms.length > 0) {
      setRooms(propRooms);
    } else {
      fetchRooms();
    }
  }, [propRooms]);

  const handleOpenCreateRoom = () => {
    if (onOpenCreateRoom) {
      onOpenCreateRoom();
    } else {
      navigate({ to: '/rooms/new' as any });
    }
  };

  const handleOpenEditRoom = (room: Room) => {
    if (onOpenEditRoom) {
      onOpenEditRoom(room);
    } else {
      navigate({
        to: '/rooms/$roomId/edit',
        params: { roomId: String(room.id || room.room_id) }
      });
    }
  };

  const handleOpenBooking = (room: Room) => {
    if (onOpenBooking) {
      onOpenBooking(room);
    } else {
      navigate({
        to: '/booking',
        search: { roomId: String(room.id || room.room_id) } as any
      });
    }
  };

  const handleViewRoomDetail = (room: Room) => {
    if (onViewRoomDetail) {
      onViewRoomDetail(room);
    } else {
      navigate({
        to: '/rooms/$roomId',
        params: { roomId: String(room.id || room.room_id) }
      });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (onDeleteRoom) {
      onDeleteRoom(id);
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

  // Auth protection guard
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 p-8 text-center shadow-xs my-12 animate-fadeIn transition-colors">
        <div className="w-14 h-14 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น หากคุณต้องการใช้งาน กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
        </p>
        <button
          onClick={() => navigate({ to: '/rooms' as any })}
          className="px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>กลับไปยังหน้ารายการห้องประชุม</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Admin Header */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 border border-purple-900/40 shadow-xl shadow-purple-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                ADMINISTRATION PANEL
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              ศูนย์ควบคุมและบริหารระบบจองห้องประชุม
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              จัดการอนุมัติสมาชิก ตรวจสอบคำขอจองห้อง บริหารห้องประชุม โครงสร้างแผนก และระบบรายงานสถิติ
            </p>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs - Separate Page Routes */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          className={`px-4 py-2.5 rounded-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          onClick={() => navigate({ to: '/admin/bookings' as any })}
        >
          <CalendarCheck size={16} />
          <span>รายการคำขอจองห้อง (Bookings)</span>
        </button>

        <button
          className={`px-4 py-2.5 rounded-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          onClick={() => navigate({ to: '/admin/users' as any })}
        >
          <Users size={16} />
          <span>จัดการผู้ใช้งาน (Users)</span>
        </button>

        <button
          className={`px-4 py-2.5 rounded-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'departments'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          onClick={() => navigate({ to: '/admin/departments' as any })}
        >
          <FolderTree size={16} />
          <span>จัดการแผนก (Departments)</span>
        </button>

        <button
          className={`px-4 py-2.5 rounded-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rooms'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          onClick={() => navigate({ to: '/admin/rooms' as any })}
        >
          <Building size={16} />
          <span>จัดการห้องประชุม ({rooms.length})</span>
        </button>

        <button
          className={`px-4 py-2.5 rounded-sm text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          onClick={() => navigate({ to: '/admin/reports' as any })}
        >
          <BarChart3 size={16} />
          <span>ระบบรายงานสถิติ (Reports)</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'requests' && <AdminBookingTable />}

        {activeTab === 'users' && <UserApprovalTable />}

        {activeTab === 'departments' && <DepartmentManagement />}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">รายการห้องประชุมในระบบ</h3>
                <p className="text-xs text-slate-500">
                  เพิ่ม แก้ไขรายละเอียดรูปภาพ ความจุที่นั่ง และอุปกรณ์ประจำห้อง
                </p>
              </div>
              <button
                onClick={handleOpenCreateRoom}
                className="px-4 py-2.5 rounded-sm text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus size={16} />
                <span>เพิ่มห้องประชุมใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
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
          </div>
        )}

        {activeTab === 'reports' && <ReportView rooms={rooms} />}
      </div>
    </div>
  );
};
