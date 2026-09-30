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
  Check
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
      }).catch(() => {});
    }
  }, [propAllRooms]);

  // Selected Room
  const initialRoomId = String(
    propEditingBooking?.room_id ||
    search.roomId ||
    propInitialRoom?.id ||
    propInitialRoom?.room_id ||
    (rooms[0]?.id || '1')
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId);

  useEffect(() => {
    if (search.roomId) {
      setSelectedRoomId(String(search.roomId));
    }
  }, [search.roomId]);

  const selectedRoom = rooms.find(r => String(r.id) === selectedRoomId || String(r.room_id) === selectedRoomId) || propInitialRoom || rooms[0];

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
      }).catch(() => {});
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
  }, [selectedRoomId, editingBooking]);

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
          const newQty = Math.max(1, eq.requested_quantity + delta);
          return { ...eq, requested_quantity: newQty, selected: true };
        }
        return eq;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('กรุณาระบุหัวข้อการประชุม');
      toast.error('กรุณาระบุหัวข้อการประชุม');
      return;
    }
    if (!bookerName.trim()) {
      setError('กรุณาระบุชื่อผู้จอง');
      toast.error('กรุณาระบุชื่อผู้จอง');
      return;
    }
    if (!department.trim()) {
      setError('กรุณาระบุแผนกของผู้จอง');
      toast.error('กรุณาระบุแผนกของผู้จอง');
      return;
    }
    if (!phone.trim()) {
      setError('กรุณาระบุเบอร์โทรศัพท์ติดต่อ');
      toast.error('กรุณาระบุเบอร์โทรศัพท์ติดต่อ');
      return;
    }
    if (!email.trim()) {
      setError('กรุณาระบุอีเมล');
      toast.error('กรุณาระบุอีเมล');
      return;
    }
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
      requested_quantity: eq.requested_quantity
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
          booker_name: bookerName,
          department,
          branch,
          phone,
          email,
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
      <div className="max-w-lg mx-auto bg-white rounded-md border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs animate-fadeIn my-12">
        <div className="w-16 h-16 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Calendar size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
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
            className="px-4 py-2.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
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

        {selectedRoom && (
          <button
            type="button"
            className="px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-blue-950 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            onClick={() => handleViewDetail(selectedRoom)}
          >
            <span>ดูข้อมูลห้องนี้</span>
          </button>
        )}
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
          <div className="bg-white rounded-md p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                1. เลือกห้องประชุมและรายละเอียดการใช้งาน
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ห้องประชุม *</label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all cursor-pointer font-medium"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                required
              >
                {rooms.map((r: Room) => (
                  <option key={r.id || r.room_id} value={String(r.id || r.room_id)}>
                    {r.name || r.room_name} ({r.code || `MR-${r.room_id || r.id}`}) — ความจุ {r.capacity} ที่นั่ง, {r.location_detail || r.floor || 'ชั้น 1'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">หัวข้อการประชุม / วัตถุประสงค์ *</label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                placeholder="เช่น การประชุมวางแผนประจำไตรมาส หรือ สัมมนาเชิงปฏิบัติการ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">วันที่ต้องการจอง *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    min={getTodayString()}
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">จำนวนผู้เข้าร่วม (คน) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users size={16} />
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={selectedRoom ? selectedRoom.capacity : 100}
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                {selectedRoom && attendeesCount > selectedRoom.capacity && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    เกินความจุห้อง (ห้องนี้รองรับได้สูงสุด {selectedRoom.capacity} คน)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">เวลาเริ่มต้น *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">เวลาสิ้นสุด *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    style={{ paddingLeft: '42px', height: '44px' }}
                    className="w-full pr-3.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Equipment Selection with Quantity Specification */}
          <div className="bg-white rounded-md p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. เลือกอุปกรณ์ประจำห้องที่ต้องการใช้ (ระบุจำนวนได้)
                </h2>
                <p className="text-xs text-slate-500">
                  ติ๊กเลือกอุปกรณ์ที่ต้องการ พร้อมปรับจำนวนชิ้นได้ตามการใช้งานจริง
                </p>
              </div>
            </div>

            {equipmentSelections.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-md">
                ไม่มีอุปกรณ์ประจำห้องนี้ (สามารถระบุข้อกำหนดเพิ่มเติมด้านล่างได้)
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {equipmentSelections.map((eq) => (
                  <div
                    key={eq.equipment_id}
                    className={`p-3.5 rounded-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      eq.selected
                        ? 'bg-emerald-50/60 border-emerald-300/80 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-50'
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
                        onChange={() => {}}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className={`text-sm font-bold ${eq.selected ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {eq.equipment_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          มีประจำห้อง {eq.default_quantity} ชิ้น
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs text-slate-500 font-medium">จำนวนที่ขอใช้:</span>
                      <div className="flex items-center bg-white border border-slate-200 rounded-sm overflow-hidden shadow-xs">
                        <button
                          type="button"
                          disabled={!eq.selected || eq.requested_quantity <= 1}
                          onClick={() => updateQuantity(eq.equipment_id, -1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800 min-w-[28px] text-center">
                          {eq.selected ? eq.requested_quantity : 0}
                        </span>
                        <button
                          type="button"
                          disabled={!eq.selected}
                          onClick={() => updateQuantity(eq.equipment_id, 1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="text-xs text-slate-500">ชิ้น</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Booker Information & Note */}
          <div className="bg-white rounded-md p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                3. ข้อมูลผู้ขอจองและการติดต่อ
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อผู้จอง *</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">แผนก / ฝ่าย *</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">เบอร์โทรศัพท์ติดต่อ *</label>
                <input
                  type="tel"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">อีเมลองค์กร *</label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">หมายเหตุเพิ่มเติม / ข้อกำหนดพิเศษ (ถ้ามี)</label>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-sm focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
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
              className="px-5 py-2.5 rounded-sm text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-sm text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : currentEditingBooking ? 'บันทึกการแก้ไข' : 'ส่งคำขอจองห้องประชุม'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Booking Summary Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Room Preview Card */}
          {selectedRoom && (
            <div className="bg-white rounded-md p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ห้องประชุมที่เลือก
              </div>

              <div className="relative w-full h-44 rounded-md overflow-hidden bg-slate-900 shadow-inner">
                <img
                  src={selectedRoom.image_url || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80'}
                  alt={selectedRoom.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedRoom.name || selectedRoom.room_name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-blue-500" />
                    {selectedRoom.location_detail || selectedRoom.floor || 'ชั้น 1'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-blue-500" />
                    สูงสุด {selectedRoom.capacity} ที่นั่ง
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleViewDetail(selectedRoom)}
                className="w-full py-2 px-3 rounded-sm text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ดูรายละเอียดห้องและอุปกรณ์</span>
              </button>
            </div>
          )}

          {/* Booking Summary Card */}
          <div className="bg-white rounded-md p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              สรุปคำขอการจอง
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">วันที่:</span>
                <span className="font-bold text-slate-800">{bookingDate || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ช่วงเวลา:</span>
                <span className="font-bold text-slate-800">{startTime} - {endTime} น.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">จำนวนผู้ร่วมประชุม:</span>
                <span className="font-bold text-slate-800">{attendeesCount} คน</span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium">อุปกรณ์ที่ขอใช้:</div>
                {equipmentSelections.filter(eq => eq.selected).length === 0 ? (
                  <span className="text-slate-400 italic block">ไม่ได้เลือกอุปกรณ์เพิ่มเติม</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {equipmentSelections
                      .filter(eq => eq.selected)
                      .map(eq => (
                        <span
                          key={eq.equipment_id}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          {eq.equipment_name} ({eq.requested_quantity} ชิ้น)
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-sm bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
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
