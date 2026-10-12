import React, { useState, useEffect } from 'react';
import { Room, Booking, Equipment } from '../types';
import { useAuth } from '../context/AuthContext';
import { bookingsApi } from '../api/bookings.api';
import { getTodayString } from '../utils/date';
import {
  Calendar,
  Clock,
  Users,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Layers,
  FileText,
  Plus,
  Minus,
  Check,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { roomsApi } from '../api/rooms.api';
import { useAuthModal } from '../context/AuthModalContext';

interface BookingPageProps {
  initialRoom?: Room | null;
  allRooms?: Room[];
  editingBooking?: Booking | null;
  onBack?: () => void;
  onSuccess?: () => void;
  onViewRoomDetail?: (room: Room) => void;
}

interface EquipmentSelection {
  equipment_id: number;
  equipment_name: string;
  default_quantity: number;
  selected: boolean;
  requested_quantity: number;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  initialRoom: propInitialRoom,
  allRooms: propAllRooms,
  editingBooking: propEditingBooking,
  onBack,
  onSuccess,
  onViewRoomDetail
}) => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { roomId?: string; bookingId?: string; date?: string };

  const [rooms, setRooms] = useState<Room[]>(propAllRooms || []);
  const [currentEditingBooking, setCurrentEditingBooking] = useState<Booking | null>(propEditingBooking || null);
  const editingBooking = currentEditingBooking || propEditingBooking;

  // Fetch rooms if not provided
  useEffect(() => {
    if (propAllRooms && propAllRooms.length > 0) {
      setRooms(propAllRooms);
    } else {
      roomsApi.getAll().then(res => {
        if (res.success && res.data) {
          setRooms(res.data);
        }
      }).catch(() => { });
    }
  }, [propAllRooms]);

  // Helper to normalize room ID (strip quotes or extra spaces)
  const normalizeId = (id?: any) => (id !== undefined && id !== null ? String(id).replace(/^["']|["']$/g, '').trim() : '');

  // Selected Room
  const initialRoomId = normalizeId(
    propEditingBooking?.room_id ||
    search.roomId ||
    propInitialRoom?.id ||
    propInitialRoom?.room_id ||
    (rooms[0]?.id || '1')
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId);

  useEffect(() => {
    if (search.roomId) {
      setSelectedRoomId(normalizeId(search.roomId));
    }
  }, [search.roomId]);

  const cleanSelectedId = normalizeId(selectedRoomId);
  const selectedRoom = rooms.find(r => normalizeId(r.id) === cleanSelectedId || normalizeId(r.room_id) === cleanSelectedId) || propInitialRoom || rooms[0];

  // Booking Form State
  const [title, setTitle] = useState(propEditingBooking?.title || '');
  const [bookerName, setBookerName] = useState(propEditingBooking?.booker_name || user?.name || '');
  const [department, setDepartment] = useState(propEditingBooking?.department || user?.department || '');
  const [branch, setBranch] = useState(propEditingBooking?.branch || user?.branch || 'สำนักงานใหญ่');
  const [phone, setPhone] = useState(propEditingBooking?.phone || user?.phone || '');
  const [email, setEmail] = useState(propEditingBooking?.email || user?.email || '');
  const [bookingDate, setBookingDate] = useState(propEditingBooking?.booking_date || search.date || getTodayString());
  const [startTime, setStartTime] = useState(propEditingBooking?.start_time || '09:00');
  const [endTime, setEndTime] = useState(propEditingBooking?.end_time || '11:00');
  const [attendeesCount, setAttendeesCount] = useState<number>(propEditingBooking?.attendees_count || propEditingBooking?.attendee_count || 4);
  const [note, setNote] = useState(propEditingBooking?.note || '');

  // If search.bookingId is provided and propEditingBooking is not, fetch it
  useEffect(() => {
    if (propEditingBooking) {
      setCurrentEditingBooking(propEditingBooking);
      return;
    }
    if (search.bookingId) {
      bookingsApi.getMy().then(res => {
        if (res.success && res.data) {
          const found = res.data.find(b => String(b.id) === String(search.bookingId));
          if (found) {
            setCurrentEditingBooking(found);
            setTitle(found.title || '');
            setBookerName(found.booker_name || '');
            setDepartment(found.department || '');
            setBranch(found.branch || 'สำนักงานใหญ่');
            setPhone(found.phone || '');
            setEmail(found.email || '');
            setBookingDate(found.booking_date || getTodayString());
            setStartTime(found.start_time || '09:00');
            setEndTime(found.end_time || '11:00');
            setAttendeesCount(found.attendees_count || found.attendee_count || 4);
            setNote(found.note || '');
            setSelectedRoomId(String(found.room_id));
          }
        }
      }).catch(() => { });
    }
  }, [propEditingBooking, search.bookingId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: '/rooms' as any });
      }
    }
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate({ to: '/my-bookings' as any });
    }
  };

  const handleViewDetail = (targetRoom: Room) => {
    if (onViewRoomDetail) {
      onViewRoomDetail(targetRoom);
    } else {
      navigate({
        to: '/rooms/$roomId',
        params: { roomId: String(targetRoom.id || targetRoom.room_id) }
      });
    }
  };

  // Equipment selections with quantities
  const [equipmentSelections, setEquipmentSelections] = useState<EquipmentSelection[]>([]);

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize and update equipment choices when room changes
  useEffect(() => {
    if (!selectedRoom) return;

    if (selectedRoom.equipments && selectedRoom.equipments.length > 0) {
      // From relational room_equipment
      const initial = selectedRoom.equipments.map(eq => {
        // If editing, check if it was previously requested
        const existingReq = editingBooking?.booking_equipments?.find((be: any) => be.equipment_id === eq.equipment_id);
        const wasSelected = existingReq ? true : (editingBooking?.equipment?.includes(eq.equipment_name) ?? true);
        return {
          equipment_id: eq.equipment_id,
          equipment_name: eq.equipment_name,
          default_quantity: eq.default_quantity || 1,
          selected: wasSelected,
          requested_quantity: existingReq?.requested_quantity || 1
        };
      });
      setEquipmentSelections(initial);
    } else if (selectedRoom.equipment && selectedRoom.equipment.length > 0) {
      // Fallback from equipment string array
      const initial = selectedRoom.equipment.map((name, idx) => ({
        equipment_id: idx + 1,
        equipment_name: name,
        default_quantity: 1,
        selected: editingBooking?.equipment ? editingBooking.equipment.includes(name) : true,
        requested_quantity: 1
      }));
      setEquipmentSelections(initial);
    } else {
      setEquipmentSelections([]);
    }
  }, [selectedRoom, selectedRoomId, editingBooking]);

  const toggleEquipmentSelect = (equipment_id: number) => {
    setEquipmentSelections(prev =>
      prev.map(eq =>
        eq.equipment_id === equipment_id ? { ...eq, selected: !eq.selected } : eq
      )
    );
  };

  const updateQuantity = (equipment_id: number, delta: number) => {
    setEquipmentSelections(prev =>
      prev.map(eq => {
        if (eq.equipment_id === equipment_id) {
          const currentQty = eq.selected ? (eq.requested_quantity || 1) : 0;
          const newQty = Math.max(1, currentQty + delta);
          return { ...eq, requested_quantity: newQty, selected: true };
        }
        return eq;
      })
    );
  };

  const handleQuantityInput = (equipment_id: number, rawVal: string) => {
    if (rawVal === '') {
      setEquipmentSelections(prev =>
        prev.map(eq =>
          eq.equipment_id === equipment_id
            ? { ...eq, requested_quantity: 0, selected: true }
            : eq
        )
      );
      return;
    }
    const val = parseInt(rawVal, 10);
    if (!isNaN(val)) {
      setEquipmentSelections(prev =>
        prev.map(eq =>
          eq.equipment_id === equipment_id
            ? { ...eq, requested_quantity: Math.max(0, val), selected: true }
            : eq
        )
      );
    }
  };

  const handleQuantityBlur = (equipment_id: number) => {
    setEquipmentSelections(prev =>
      prev.map(eq =>
        eq.equipment_id === equipment_id
          ? { ...eq, requested_quantity: Math.max(1, eq.requested_quantity || 1) }
          : eq
      )
    );
  };

  // Room recent bookings schedule
  const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedRoom) return;
    const fetchRoomSchedule = async () => {
      setIsLoadingBookings(true);
      try {
        const roomIdStr = String(selectedRoom.room_id || selectedRoom.id);
        const res = await bookingsApi.getAll({ room_id: roomIdStr });
        if (res.success && res.data) {
          const sorted = [...res.data]
            .filter(b => (b.status || '').toUpperCase() !== 'CANCELLED' && (b.status || '').toUpperCase() !== 'REJECTED')
            .sort((a, b) => {
              const dateA = a.booking_date || '';
              const dateB = b.booking_date || '';
              if (dateA !== dateB) return dateB.localeCompare(dateA);
              return (b.start_time || '').localeCompare(a.start_time || '');
            });
          setRoomBookings(sorted.slice(0, 5));
        } else {
          const calRes = await bookingsApi.getCalendar(roomIdStr);
          if (calRes.success && calRes.data) {
            const sorted = [...calRes.data]
              .filter(b => (b.status || '').toUpperCase() !== 'CANCELLED' && (b.status || '').toUpperCase() !== 'REJECTED')
              .sort((a, b) => {
                const dateA = a.booking_date || '';
                const dateB = b.booking_date || '';
                if (dateA !== dateB) return dateB.localeCompare(dateA);
                return (b.start_time || '').localeCompare(a.start_time || '');
              });
            setRoomBookings(sorted.slice(0, 5));
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchRoomSchedule();
  }, [selectedRoom?.id, selectedRoom?.room_id, selectedRoomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdmin) {
      const msg = 'ผู้ดูแลระบบ (Admin) ไม่สามารถจองห้องประชุมได้ ระบบสงวนสิทธิ์สำหรับผู้ใช้งานทั่วไปเท่านั้น';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!title.trim()) {
      setError('กรุณาระบุหัวข้อการประชุม');
      toast.error('กรุณาระบุหัวข้อการประชุม');
      return;
    }

    const effectiveBookerName = bookerName.trim() || user?.name || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '') || 'ผู้ขอจอง';
    const effectiveDepartment = department.trim() || user?.department || 'ฝ่ายทั่วไป';
    const effectivePhone = phone.trim() || user?.phone || '0800000000';
    const effectiveEmail = email.trim() || user?.email || (user as any)?.username || 'user@example.com';
    const today = getTodayString();
    if (bookingDate < today) {
      const msg = 'ไม่สามารถจองห้องประชุมย้อนหลังได้ กรุณาเลือกวันปัจจุบันหรือวันข้างหน้า';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (bookingDate === today) {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      if (startTime < currentTimeStr) {
        const msg = `ไม่สามารถเลือกเวลาเริ่มต้นที่ผ่านมาแล้ว (${startTime} น.) ได้ (เวลาปัจจุบัน: ${currentTimeStr} น.)`;
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    if (startTime >= endTime) {
      setError('เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุดเสมอ');
      toast.error('เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุดเสมอ');
      return;
    }
    const isSelectedRoomAvailable = selectedRoom
      ? (selectedRoom.status !== undefined ? Number(selectedRoom.status) === 1 : (selectedRoom.is_active !== false))
      : true;

    if (selectedRoom && !isSelectedRoomAvailable) {
      const msg = `ห้องประชุม "${selectedRoom.name || selectedRoom.room_name}" อยู่ในสถานะปิดปรับปรุง ไม่สามารถทำการจองได้`;
      setError(msg);
      toast.error(msg);
      return;
    }

    if (selectedRoom && attendeesCount > selectedRoom.capacity) {
      const msg = `จำนวนผู้เข้าร่วม (${attendeesCount} คน) เกินความจุของห้อง ${selectedRoom.name} (${selectedRoom.capacity} ที่นั่ง)`;
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(editingBooking ? 'กำลังบันทึกการแก้ไข...' : 'กำลังส่งคำขอจองห้องประชุม...');

    // Selected equipments to save
    const selectedList = equipmentSelections.filter(eq => eq.selected);
    const selectedEquipmentNames = selectedList.map(eq => eq.equipment_name);
    const requestedEquipments = selectedList.map(eq => ({
      equipment_id: eq.equipment_id,
      requested_quantity: Math.max(1, eq.requested_quantity || 1)
    }));

    try {
      if (editingBooking) {
        const res = await bookingsApi.update(editingBooking.id, {
          room_id: selectedRoomId,
          title,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          attendees_count: attendeesCount,
          equipment: selectedEquipmentNames,
          note
        });

        toast.dismiss(loadingToast);
        setIsSubmitting(false);

        if (res.success) {
          toast.success('แก้ไขข้อมูลการจองสำเร็จ! กำลังรอผู้ดูแลระบบตรวจสอบอีกครั้ง');
          handleSuccess();
        } else {
          setError(res.error || 'ไม่สามารถแก้ไขข้อมูลได้');
          toast.error(res.error || 'ไม่สามารถแก้ไขข้อมูลได้');
        }
      } else {
        const res = await bookingsApi.create({
          room_id: selectedRoomId,
          title,
          booker_name: effectiveBookerName,
          department: effectiveDepartment,
          branch,
          phone: effectivePhone,
          email: effectiveEmail,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          attendees_count: attendeesCount,
          equipment: selectedEquipmentNames,
          equipment_ids: selectedList.map(e => e.equipment_id),
          requested_equipments: requestedEquipments,
          note
        });

        toast.dismiss(loadingToast);
        setIsSubmitting(false);

        if (res.success) {
          toast.success('ส่งคำขอจองห้องประชุมสำเร็จ! ผู้ดูแลระบบจะทำการตรวจสอบและแจ้งผลทางระบบ', { duration: 5000 });
          handleSuccess();
        } else {
          setError(res.error || 'ไม่สามารถจองห้องประชุมได้');
          toast.error(res.error || 'ไม่สามารถจองห้องประชุมได้');
        }
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs animate-fadeIn my-12">
        <div className="w-16 h-16 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Calendar size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          คุณต้องเข้าสู่ระบบก่อนทำการจองห้องประชุม เพื่อให้สามารถตรวจสอบสถานะและรับการแจ้งเตือนได้
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => openLogin()}
            className="px-5 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            เข้าสู่ระบบทันที
          </button>
          <button
            onClick={handleBack}
            className="px-4 py-2.5 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-md border border-amber-200/80 dark:border-amber-800/60 p-8 sm:p-12 text-center shadow-xs animate-fadeIn my-12">
        <div className="w-16 h-16 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">บัญชีผู้ดูแลระบบ (Admin)</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          ผู้ดูแลระบบไม่สามารถทำการจองห้องประชุมได้ เนื่องจากระบบสงวนสิทธิ์การส่งคำขอจองห้องประชุมสำหรับผู้ใช้งานทั่วไปเท่านั้น
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate({ to: '/admin/bookings' })}
            className="px-5 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            ไปหน้ารายการคำขอจอง (Admin)
          </button>
          <button
            onClick={handleBack}
            className="px-4 py-2.5 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={handleBack}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>ย้อนกลับ</span>
        </button>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          ระบบจองห้องประชุม &gt; <span style={{ color: 'var(--primary)', fontWeight: 600 }}>แบบฟอร์มการจอง</span>
        </div>
      </div>

      {/* Page Title Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '28px 32px',
          color: 'white',
          boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: '8px'
            }}
          >
            {editingBooking ? 'กำลังแก้ไขคำขอจอง' : 'แบบฟอร์มการส่งคำขอจอง'}
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0' }}>
            {editingBooking ? 'แก้ไขคำขอจองห้องประชุม' : 'แบบฟอร์มขอจองห้องประชุม'}
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
            กรอกข้อมูลรายละเอียดการประชุม เลือกระบุอุปกรณ์ประจำห้องที่ต้องการใช้ และส่งคำขอเพื่อรอ Admin อนุมัติ
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Room Selection & Meeting Details */}
          <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. เลือกห้องประชุมและรายละเอียดการใช้งาน
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ห้องประชุม *</label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 outline-none transition-all cursor-pointer font-medium text-slate-900 dark:text-slate-100"
                value={selectedRoom ? String(selectedRoom.id || selectedRoom.room_id) : selectedRoomId}
                onChange={(e) => setSelectedRoomId(normalizeId(e.target.value))}
                required
              >
                {rooms.map((r: Room) => {
                  const isAvailable = r.status !== undefined ? Number(r.status) === 1 : (r.is_active !== false);
                  return (
                    <option key={r.id || r.room_id} value={String(r.id || r.room_id)} disabled={!isAvailable} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {r.name || r.room_name} ({r.code || `MR-${r.room_id || r.id}`}) — ความจุ {r.capacity} ที่นั่ง, {r.location_detail || r.floor || 'ชั้น 1'} {!isAvailable ? ' [ปิดปรับปรุง - ไม่สามารถจองได้]' : ''}
                    </option>
                  );
                })}
              </select>

              {(() => {
                const isAvailable = selectedRoom ? (selectedRoom.status !== undefined ? Number(selectedRoom.status) === 1 : (selectedRoom.is_active !== false)) : true;
                if (!isAvailable) {
                  return (
                    <div className="p-3.5 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 mt-2.5">
                      <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
                      <div>
                        <span className="font-bold">ห้องนี้อยู่ในสถานะปิดปรับปรุง:</span> ไม่สามารถทำรายการจองได้ในขณะนี้ กรุณาเปลี่ยนเป็นห้องประชุมอื่นที่พร้อมใช้งาน
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">หัวข้อการประชุม / วัตถุประสงค์ *</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="เช่น การประชุมวางแผนประจำไตรมาส หรือ สัมมนาเชิงปฏิบัติการ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">วันที่ต้องการจอง *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    min={getTodayString()}
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-100"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">จำนวนผู้เข้าร่วม (คน) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Users size={16} />
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={selectedRoom ? selectedRoom.capacity : 100}
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-100"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                {selectedRoom && attendeesCount > selectedRoom.capacity && (
                  <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">
                    เกินความจุห้อง (ห้องนี้รองรับได้สูงสุด {selectedRoom.capacity} คน)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">เวลาเริ่มต้น *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-100"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">เวลาสิ้นสุด *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-100"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Equipment Selection with Quantity Specification */}
          <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  2. เลือกอุปกรณ์ประจำห้องที่ต้องการใช้ (ระบุจำนวนได้)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ติ๊กเลือกอุปกรณ์ที่ต้องการ พร้อมปรับจำนวนชิ้นได้ตามการใช้งานจริง
                </p>
              </div>
            </div>

            {equipmentSelections.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-md">
                ไม่มีอุปกรณ์ประจำห้องนี้ (สามารถระบุข้อกำหนดเพิ่มเติมด้านล่างได้)
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {equipmentSelections.map((eq) => (
                  <div
                    key={eq.equipment_id}
                    className={`p-3.5 rounded-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${eq.selected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-700/60 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {/* Checkbox & Equipment Name */}
                    <div
                      onClick={() => toggleEquipmentSelect(eq.equipment_id)}
                      className="flex items-center gap-3 cursor-pointer select-none flex-1"
                    >
                      <input
                        type="checkbox"
                        checked={eq.selected}
                        onChange={() => { }}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className={`text-sm font-bold ${eq.selected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {eq.equipment_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          มีประจำห้อง {eq.default_quantity} ชิ้น
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Direct Input */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">จำนวนที่ขอใช้:</span>
                      <div className={`flex items-center bg-white dark:bg-slate-800 border ${eq.selected ? 'border-emerald-300 dark:border-emerald-600/80 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-sm overflow-hidden shadow-xs transition-colors`}>
                        <button
                          type="button"
                          disabled={!eq.selected || (eq.requested_quantity || 1) <= 1}
                          onClick={() => updateQuantity(eq.equipment_id, -1)}
                          className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="ลดจำนวน"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={eq.selected ? (eq.requested_quantity === 0 ? '' : eq.requested_quantity) : 0}
                          onFocus={() => {
                            if (!eq.selected) {
                              setEquipmentSelections(prev =>
                                prev.map(item =>
                                  item.equipment_id === eq.equipment_id
                                    ? { ...item, selected: true, requested_quantity: item.requested_quantity || 1 }
                                    : item
                                )
                              );
                            }
                          }}
                          onChange={(e) => handleQuantityInput(eq.equipment_id, e.target.value)}
                          onBlur={() => handleQuantityBlur(eq.equipment_id)}
                          className="w-14 text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent py-1 border-x border-slate-200 dark:border-slate-700 focus:outline-none focus:bg-emerald-50/50 dark:focus:bg-emerald-950/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title="กรอกจำนวนที่ต้องการ"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(eq.equipment_id, 1)}
                          className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="เพิ่มจำนวน"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">ชิ้น</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: หมายเหตุเพิ่มเติม / ข้อกำหนดพิเศษ (ถ้ามี) */}
          <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. รายละเอียดเพิ่มเติม
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                หมายเหตุเพิ่มเติม / ข้อกำหนดพิเศษ (ถ้ามี)
              </label>
              <textarea
                rows={4}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="เช่น ต้องการจัดโต๊ะแบบ Classroom, ขอสาย HDMI เพิ่มเติม, จัดเตรียมกาแฟรับรอง"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-sm text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            {(() => {
              const isAvailable = selectedRoom ? (selectedRoom.status !== undefined ? Number(selectedRoom.status) === 1 : (selectedRoom.is_active !== false)) : true;
              return (
                <button
                  type="submit"
                  disabled={isSubmitting || !isAvailable}
                  className={`px-6 py-3 rounded-sm text-sm font-bold flex items-center gap-2 transition-all ${
                    isAvailable && !isSubmitting
                      ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>
                    {isSubmitting
                      ? 'กำลังส่งข้อมูล...'
                      : !isAvailable
                      ? 'ห้องปิดปรับปรุง (ไม่สามารถส่งคำขอได้)'
                      : currentEditingBooking
                      ? 'บันทึกการแก้ไข'
                      : 'ส่งคำขอจองห้องประชุม'}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Right Column: Live Booking Summary Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Room Preview Card */}
          {selectedRoom && (
            <div className="bg-white dark:bg-slate-900 rounded-md p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                ห้องประชุมที่เลือก
              </div>

              <div className="relative w-full h-44 rounded-md overflow-hidden bg-slate-900 shadow-inner">
                <img
                  src={selectedRoom.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80'}
                  alt={selectedRoom.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 right-2.5">
                  {(selectedRoom.status !== undefined ? Number(selectedRoom.status) === 1 : selectedRoom.is_active) ? (
                    <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      พร้อมใช้งาน
                    </span>
                  ) : (
                    <span className="bg-rose-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      ปิดปรับปรุง
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedRoom.name || selectedRoom.room_name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-blue-500 dark:text-blue-400" />
                    {selectedRoom.location_detail || selectedRoom.floor || 'ชั้น 1'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-blue-500 dark:text-blue-400" />
                    สูงสุด {selectedRoom.capacity} ที่นั่ง
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleViewDetail(selectedRoom)}
                className="w-full py-2 px-3 rounded-sm text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูรายละเอียดห้องและอุปกรณ์</span>
              </button>
            </div>
          )}

          {/* Room Recent Bookings Schedule */}
          <div className="bg-white dark:bg-slate-900 rounded-md p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    ตารางการจองล่าสุดของห้องนี้
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedRoom?.name || selectedRoom?.room_name || 'ห้องประชุม'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full">
                {roomBookings.length} รายการ
              </span>
            </div>

            {isLoadingBookings ? (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                กำลังตรวจสอบตารางการจอง...
              </div>
            ) : roomBookings.length === 0 ? (
              <div className="py-6 px-3 text-center bg-slate-50/70 dark:bg-slate-800/50 rounded-md border border-dashed border-slate-200 dark:border-slate-700">
                <Sparkles size={20} className="text-emerald-500 dark:text-emerald-400 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  ยังไม่มีการจองในเร็วๆ นี้
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ห้องนี้ว่างพร้อมให้คุณเลือกช่วงเวลาที่ต้องการได้ทันที
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {roomBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80 rounded-md transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{b.title}</div>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${(b.status || '').toUpperCase() === 'APPROVED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                            : (b.status || '').toUpperCase() === 'PENDING'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                      >
                        {(b.status || '').toUpperCase() === 'APPROVED'
                          ? 'อนุมัติแล้ว'
                          : (b.status || '').toUpperCase() === 'PENDING'
                            ? 'รออนุมัติ'
                            : b.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-1.5">
                      <Users size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="line-clamp-1">
                        ผู้จอง: {b.booker_name || 'ไม่ระบุผู้จอง'} {b.department ? `(${b.department})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium text-[11px] mt-1">
                      <Clock size={12} className="text-blue-500 dark:text-blue-400 shrink-0" />
                      <span>{b.booking_date} | {b.start_time} - {b.end_time} น.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-md p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              สรุปคำขอการจอง
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">วันที่:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{bookingDate || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">ช่วงเวลา:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{startTime} - {endTime} น.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">จำนวนผู้ร่วมประชุม:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{attendeesCount} คน</span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-slate-500 dark:text-slate-400 font-medium">อุปกรณ์ที่ขอใช้:</div>
                {equipmentSelections.filter(eq => eq.selected).length === 0 ? (
                  <span className="text-slate-400 dark:text-slate-500 italic block">ไม่ได้เลือกอุปกรณ์เพิ่มเติม</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {equipmentSelections
                      .filter(eq => eq.selected)
                      .map(eq => (
                        <span
                          key={eq.equipment_id}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                        >
                          {eq.equipment_name} ({eq.requested_quantity} ชิ้น)
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-sm bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <p className="leading-relaxed">
                คำขอจองจะถูกส่งไปยัง Admin เพื่ออนุมัติทันที คุณสามารถติดตามผลได้ในหน้า "การจองของฉัน"
              </p>
            </div>
          </div>


        </div>
      </form>
    </div>
  );
};
