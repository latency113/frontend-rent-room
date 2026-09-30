import React, { useState, useEffect } from 'react';
import { Room, Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { bookingsApi } from '../../api/bookings.api';
import { getTodayString } from '../../utils/date';
import { X, Calendar, Clock, Users, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingModalProps {
  room: Room | null;
  allRooms: Room[];
  existingBooking?: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  room: initialRoom,
  allRooms,
  existingBooking,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    String(existingBooking?.room_id || initialRoom?.id || allRooms[0]?.id || '')
  );

  const selectedRoom = allRooms.find(r => r.id === selectedRoomId) || initialRoom;

  const [title, setTitle] = useState(existingBooking?.title || '');
  const [bookerName, setBookerName] = useState(existingBooking?.booker_name || user?.name || '');
  const [department, setDepartment] = useState(existingBooking?.department || user?.department || '');
  const [branch, setBranch] = useState(existingBooking?.branch || user?.branch || 'สำนักงานใหญ่');
  const [phone, setPhone] = useState(existingBooking?.phone || user?.phone || '');
  const [email, setEmail] = useState(existingBooking?.email || user?.email || '');
  const [bookingDate, setBookingDate] = useState(existingBooking?.booking_date || getTodayString());
  const [startTime, setStartTime] = useState(existingBooking?.start_time || '09:00');
  const [endTime, setEndTime] = useState(existingBooking?.end_time || '11:00');
  const [attendeesCount, setAttendeesCount] = useState<number>(existingBooking?.attendees_count || 4);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(existingBooking?.equipment || []);
  const [note, setNote] = useState(existingBooking?.note || '');

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // When room changes, filter selected equipment to only what the room provides
  useEffect(() => {
    if (selectedRoom?.equipment && !existingBooking) {
      // By default select all or preserve matched
      setSelectedEquipment(prev => prev.filter(eq => selectedRoom.equipment.includes(eq)));
    }
  }, [selectedRoom, existingBooking]);

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment(prev =>
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('กรุณาระบุหัวข้อการประชุม');
      return;
    }
    if (!bookerName.trim()) {
      setError('กรุณาระบุชื่อผู้จอง');
      return;
    }
    if (!department.trim()) {
      setError('กรุณาระบุแผนกของผู้จอง');
      return;
    }
    if (!phone.trim()) {
      setError('กรุณาระบุเบอร์โทรศัพท์ติดต่อ');
      return;
    }
    if (!email.trim()) {
      setError('กรุณาระบุอีเมล');
      return;
    }
    if (startTime >= endTime) {
      setError('เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุดเสมอ');
      return;
    }
    if (selectedRoom && attendeesCount > selectedRoom.capacity) {
      setError(`จำนวนผู้เข้าร่วม (${attendeesCount} คน) เกินความจุของห้อง ${selectedRoom.name} (${selectedRoom.capacity} ที่นั่ง)`);
      return;
    }

    setIsSubmitting(true);

    try {
        const matchedEquipments = selectedRoom?.equipments?.filter(eq =>
          selectedEquipment.includes(eq.equipment_name)
        ) || [];
        const equipmentIds = matchedEquipments.map(eq => eq.equipment_id);
        const requestedEquipments = matchedEquipments.map(eq => ({
          equipment_id: eq.equipment_id,
          requested_quantity: 1
        }));

        if (existingBooking) {
          // Update existing booking
          const res = await bookingsApi.update(existingBooking.id, {
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
            equipment: selectedEquipment,
            equipment_ids: equipmentIds.length > 0 ? equipmentIds : undefined,
            requested_equipments: requestedEquipments.length > 0 ? requestedEquipments : undefined,
            note
          });

          if (res.success) {
            toast.success('แก้ไขข้อมูลการจองเรียบร้อยแล้ว');
            onSuccess();
            onClose();
          } else {
            setError(res.error || 'ไม่สามารถแก้ไขการจองได้');
          }
        } else {
          // Create new booking
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
            equipment: selectedEquipment,
            equipment_ids: equipmentIds.length > 0 ? equipmentIds : undefined,
            requested_equipments: requestedEquipments.length > 0 ? requestedEquipments : undefined,
            note
          });

          if (res.success) {
            toast.success('ส่งคำขอจองห้องประชุมเรียบร้อยแล้ว! ระบบได้ส่งข้อมูลให้ Admin ตรวจสอบ', { duration: 5000 });
            onSuccess();
            onClose();
          } else {
            setError(res.error || 'ไม่สามารถทำการจองได้');
          }
        }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {existingBooking ? 'แก้ไขการจองห้องประชุม' : 'แบบฟอร์มขอจองห้องประชุม'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              คำขอจองจะถูกส่งไปยังผู้ดูแลระบบเพื่อตรวจสอบและอนุมัติ
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#b91c1c',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem'
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Room Selector */}
            <div className="form-group">
              <label className="form-label">ห้องประชุมที่ต้องการใช้งาน *</label>
              <select
                className="form-control"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                disabled={!!existingBooking}
              >
                {allRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) - รองรับได้สูงสุด {r.capacity} คน [{r.floor}]
                  </option>
                ))}
              </select>
            </div>

            {/* Title / Objective */}
            <div className="form-group">
              <label className="form-label">หัวข้อการประชุม / วัตถุประสงค์ *</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น ประชุมวางแผนประจำไตรมาส หรือ สัมมนาทีมการตลาด"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Date and Time Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  วันที่จอง *
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={getTodayString()}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  เวลาเริ่มต้น *
                </label>
                <select
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(t => (
                    <option key={t} value={t}>{t} น.</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  เวลาสิ้นสุด *
                </label>
                <select
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map(t => (
                    <option key={t} value={t}>{t} น.</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendees and Booker Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">
                  <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  จำนวนผู้เข้าร่วม (คน) *
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max={selectedRoom?.capacity || 100}
                  value={attendeesCount}
                  onChange={(e) => setAttendeesCount(parseInt(e.target.value, 10) || 1)}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  ความจุสูงสุดของห้องนี้: {selectedRoom?.capacity} คน
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">ชื่อผู้จอง *</label>
                <input
                  type="text"
                  className="form-control"
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">แผนก / ฝ่าย *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น ฝ่ายบุคคล"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="08X-XXX-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">อีเมลผู้จอง (ใช้ส่งแจ้งเตือนผลการจอง) *</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Room Equipment Selection */}
            <div className="form-group">
              <label className="form-label">เลือกอุปกรณ์ประจำห้องที่ต้องการใช้</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                เฉพาะอุปกรณ์ที่ติดตั้งอยู่ประจำห้องประชุมนี้:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {selectedRoom?.equipment && selectedRoom.equipment.length > 0 ? (
                  selectedRoom.equipment.map((eq, i) => {
                    const isChecked = selectedEquipment.includes(eq);
                    return (
                      <label
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}`,
                          background: isChecked ? 'var(--primary-light)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEquipment(eq)}
                        />
                        <span>{eq}</span>
                      </label>
                    );
                  })
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ห้องนี้ไม่มีรายการอุปกรณ์ประจำห้อง
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="ระบุข้อกำหนดเพิ่มเติม เช่น การจัดโต๊ะแบบ U-shape"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Check size={16} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : (existingBooking ? 'บันทึกการแก้ไข' : 'ยืนยันส่งคำขอจอง')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
