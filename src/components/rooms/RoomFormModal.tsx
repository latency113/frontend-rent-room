import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Room } from '../../types';
import { roomsApi } from '../../api/rooms.api';
import { uploadApi } from '../../api/upload.api';
import { STANDARD_EQUIPMENT } from '../../utils/equipment';
import { 
  X, 
  Check, 
  AlertCircle, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Star, 
  Sparkles, 
  MoveUp,
  Layers,
  UploadCloud,
  Loader2,
  FolderOpen,
  Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RoomFormModalProps {
  room?: Room | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Preset samples if user wants quick test images
const PRESET_SAMPLE_IMAGES = [
  { label: 'ห้องกระจกโมเดิร์น', url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องประชุมผู้บริหาร', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องสัมมนาขนาดใหญ่', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องเวิร์กช็อป', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องประชุมขนาดเล็ก', url: 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?auto=format&fit=crop&w=1200&q=80' },
];

export const RoomFormModal: React.FC<RoomFormModalProps> = ({ room, onClose, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState(room?.code || '');
  const [name, setName] = useState(room?.name || '');
  const [capacity, setCapacity] = useState<number>(room?.capacity || 20);
  const [floor, setFloor] = useState(room?.floor || 'ชั้น 1');
  const [description, setDescription] = useState(room?.description || '');

  // Initialize images from room.images array, fallback to room.image_url
  const initialImages: string[] = (room?.images && room.images.length > 0)
    ? room.images.map(img => img.image_url)
    : (room?.image_url ? [room.image_url] : [PRESET_SAMPLE_IMAGES[0].url]);

  const [images, setImages] = useState<string[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [isActive, setIsActive] = useState<boolean>(
    room?.status !== undefined ? Number(room.status) === 1 : (room?.is_active !== undefined ? room.is_active : true)
  );
  const [equipment, setEquipment] = useState<string[]>(room?.equipment || ['Projector', 'Whiteboard']);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleEquipment = (eq: string) => {
    setEquipment(prev =>
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  const handleFileUpload = async (files: File[]) => {
    const validImageFiles = files.filter(f => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      toast.error('กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้น');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`กำลังอัปโหลดรูปภาพ ${validImageFiles.length} รูป...`);

    try {
      const res = await uploadApi.uploadImages(validImageFiles);
      if (res.success && res.urls && res.urls.length > 0) {
        setImages(prev => [...prev, ...res.urls!]);
        toast.success(`อัปโหลดรูปภาพเรียบร้อย (${res.urls.length} รูป)`, { id: toastId });
      } else {
        toast.error(res.error || 'ไม่สามารถอัปโหลดรูปภาพได้', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddImage = (urlToAdd?: string) => {
    const url = (urlToAdd || newImageUrl).trim();
    if (!url) {
      toast.error('กรุณาระบุ URL รูปภาพ');
      return;
    }
    if (images.includes(url)) {
      toast.error('มีรูปภาพนี้ในรายการแล้ว');
      return;
    }
    setImages(prev => [...prev, url]);
    if (!urlToAdd) setNewImageUrl('');
    toast.success('เพิ่มรูปภาพในรายการแล้ว');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length <= 1) {
      toast.error('ห้องประชุมต้องมีรูปภาพอย่างน้อย 1 รูป');
      return;
    }
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    setImages(prev => {
      const selected = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      return [selected, ...rest];
    });
    toast.success('ตั้งเป็นรูปภาพหลัก (Cover) เรียบร้อย');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim() || !name.trim()) {
      setError('กรุณากรอกรหัสห้องและชื่อห้องประชุม');
      return;
    }
    if (capacity <= 0) {
      setError('ความจุห้องต้องมากกว่า 0');
      return;
    }
    if (images.length === 0) {
      setError('กรุณาระบุรูปภาพห้องประชุมอย่างน้อย 1 รูป');
      return;
    }

    setIsSubmitting(true);
    const roomPayload = {
      code,
      name,
      capacity,
      floor,
      description,
      image_url: images[0] || '',
      images,
      status: isActive ? 1 : 0,
      is_active: isActive,
      equipment
    };

    try {
      if (room) {
        const res = await roomsApi.update(room.id, roomPayload);
        if (res.success) {
          toast.success('แก้ไขข้อมูลห้องประชุมเรียบร้อยแล้ว');
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'ไม่สามารถแก้ไขห้องประชุมได้');
        }
      } else {
        const res = await roomsApi.create(roomPayload);
        if (res.success) {
          toast.success('เพิ่มห้องประชุมเรียบร้อยแล้ว');
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'ไม่สามารถเพิ่มห้องประชุมได้');
        }
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {room ? '✏️ แก้ไขห้องประชุม' : '✨ เพิ่มห้องประชุมใหม่'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการข้อมูลห้องประชุม อัปโหลดรูปภาพแกลเลอรี และอุปกรณ์อำนวยความสะดวก
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">รหัสห้อง (Code) *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="เช่น MR-101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ชื่อห้องประชุม *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="เช่น Sapphire Conference Hall"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ความจุสูงสุด (คน) *</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ชั้น / ตำแหน่ง</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="เช่น ชั้น 3 อาคาร B"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">คำอธิบายห้องประชุม</label>
              <textarea
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                rows={2}
                placeholder="ระบุรายละเอียด เช่น เหมาะสำหรับการประชุมขนาดเล็ก การนำเสนองาน หรือระดมสมอง..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* ========================================================= */}
            {/* Multi-Image Upload Area (อัปโหลดไฟล์จริง)                */}
            {/* ========================================================= */}
            <div className="space-y-3 p-4 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UploadCloud size={16} className="text-purple-600 dark:text-purple-400" />
                    <span>อัปโหลดรูปภาพห้องประชุม ({images.length} รูป)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    เลือกและอัปโหลดไฟล์รูปภาพจริงจากอุปกรณ์ โดยรูปแรกจะเป็นภาพหน้าปกหลัก (Cover)
                  </p>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileUpload(Array.from(e.dataTransfer.files));
                  }
                }}
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/40'
                    : 'border-purple-200 dark:border-purple-800/60 hover:border-purple-500 bg-white dark:bg-slate-800/90 hover:bg-purple-50/40 dark:hover:bg-slate-800'
                } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />

                <div className="w-11 h-11 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                  {isUploading ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={24} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isUploading ? 'กำลังอัปโหลดไฟล์...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือ ลากไฟล์มาวางที่นี่'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">รองรับไฟล์ PNG, JPG, WEBP (เลือกได้หลายไฟล์)</p>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-sm bg-purple-600 text-white font-semibold text-xs shadow-xs pointer-events-none flex items-center gap-1.5"
                >
                  <FolderOpen size={13} />
                  <span>เลือกรูปภาพ</span>
                </button>
              </div>

              {/* Optional URL Toggle */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-purple-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <LinkIcon size={12} />
                  <span>{showUrlInput ? 'ซ่อนการระบุด้วย URL' : '+ หรือระบุรูปภาพด้วย URL'}</span>
                </button>

                {showUrlInput && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 focus:border-purple-600 rounded-sm outline-none"
                      placeholder="วาง URL รูปภาพที่นี่..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddImage()}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-sm text-xs font-semibold"
                    >
                      เพิ่ม
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {images.map((imgUrl, index) => {
                  const isPrimary = index === 0;
                  return (
                    <div
                      key={index}
                      className={`relative group rounded-md overflow-hidden border bg-white dark:bg-slate-800 shadow-xs transition-all ${
                        isPrimary
                          ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <img
                          src={imgUrl}
                          alt={`รูปที่ ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=400&q=80';
                          }}
                        />

                        {isPrimary ? (
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-sm bg-purple-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Star size={10} className="fill-amber-300 text-amber-300" />
                            <span>รูปหลัก</span>
                          </div>
                        ) : (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-sm bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-medium">
                            #{index + 1}
                          </div>
                        )}

                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(index)}
                              className="p-1 rounded-sm bg-white/95 dark:bg-slate-800/95 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
                              title="ตั้งเป็นรูปภาพหลัก"
                            >
                              <MoveUp size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 rounded-sm bg-white/95 dark:bg-slate-800/95 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
                            title="ลบรูปภาพนี้"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-[110px] font-mono">{imgUrl}</span>
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(index)}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold cursor-pointer shrink-0 ml-1"
                          >
                            รูปหลัก
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">อุปกรณ์ประจำห้อง</label>
              <div className="grid grid-cols-2 gap-2">
                {STANDARD_EQUIPMENT.map(eq => {
                  const isChecked = equipment.includes(eq);
                  return (
                    <label
                      key={eq}
                      className={`flex items-center gap-2 p-2 rounded-sm border text-xs font-medium cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEquipment(eq)}
                        className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 dark:border-slate-600"
                      />
                      <span>{eq}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">เปิดให้จองใช้งาน (Active)</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              className="px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 rounded-sm text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              <Check size={15} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : (room ? 'บันทึกการแก้ไข' : 'เพิ่มห้องประชุม')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
