import React, { useState, useRef, useEffect } from 'react';
import { Room } from '../types';
import { roomsApi } from '../api/rooms.api';
import { uploadApi } from '../api/upload.api';
import { STANDARD_EQUIPMENT } from '../utils/equipment';
import { 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Star, 
  Sparkles, 
  MoveUp, 
  Layers, 
  Building2, 
  Users, 
  MapPin, 
  Save, 
  Eye, 
  UploadCloud, 
  Loader2, 
  FolderOpen, 
  Link as LinkIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from '@tanstack/react-router';

interface RoomFormPageProps {
  room?: Room | null;
  onBack?: () => void;
  onSuccess?: () => void;
}

// Preset samples if user wants quick test images
const PRESET_SAMPLE_IMAGES = [
  { label: 'ห้องกระจกโมเดิร์น', url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องประชุมผู้บริหาร', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องสัมมนาขนาดใหญ่', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องเวิร์กช็อป', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80' },
  { label: 'ห้องประชุมขนาดเล็ก', url: 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?auto=format&fit=crop&w=1200&q=80' },
];

export const RoomFormPage: React.FC<RoomFormPageProps> = ({ room: propRoom, onBack, onSuccess }) => {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { roomId?: string };
  const [currentRoom, setCurrentRoom] = useState<Room | null>(propRoom || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState(propRoom?.code || '');
  const [name, setName] = useState(propRoom?.name || '');
  const [capacity, setCapacity] = useState<number>(propRoom?.capacity || 20);
  const [floor, setFloor] = useState(propRoom?.floor || 'ชั้น 1');
  const [description, setDescription] = useState(propRoom?.description || '');

  // Initialize images from room.images array, fallback to room.image_url
  const initialImages: string[] = (propRoom?.images && propRoom.images.length > 0)
    ? propRoom.images.map(img => img.image_url)
    : (propRoom?.image_url ? [propRoom.image_url] : [PRESET_SAMPLE_IMAGES[0].url]);

  const [images, setImages] = useState<string[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [isActive, setIsActive] = useState<boolean>(
    propRoom?.status !== undefined ? Number(propRoom.status) === 1 : (propRoom?.is_active !== undefined ? propRoom.is_active : true)
  );
  const [equipment, setEquipment] = useState<string[]>(propRoom?.equipment || ['Projector', 'Whiteboard']);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If roomId in URL and room not supplied via props, fetch from API
  useEffect(() => {
    if (propRoom) {
      setCurrentRoom(propRoom);
      return;
    }
    if (params.roomId) {
      roomsApi.getById(params.roomId).then(res => {
        if (res.success && res.data) {
          const r = res.data;
          setCurrentRoom(r);
          setCode(r.code || '');
          setName(r.name || '');
          setCapacity(r.capacity || 20);
          setFloor(r.floor || 'ชั้น 1');
          setDescription(r.description || '');
          setIsActive(r.status !== undefined ? Number(r.status) === 1 : (r.is_active !== undefined ? r.is_active : true));
          if (r.equipment && r.equipment.length > 0) setEquipment(r.equipment);
          if (r.images && r.images.length > 0) {
            setImages(r.images.map(img => img.image_url));
          } else if (r.image_url) {
            setImages([r.image_url]);
          }
        }
      }).catch(() => {});
    }
  }, [propRoom, params.roomId]);

  const isEditing = !!currentRoom;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: '/admin' as any });
      }
    }
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    handleBack();
  };

  const toggleEquipment = (eq: string) => {
    setEquipment(prev =>
      prev.includes(eq) ? prev.filter(item => item !== eq) : [...prev, eq]
    );
  };

  /**
   * Handle real file uploads (single or multiple)
   */
  const handleFileUpload = async (files: File[]) => {
    const validImageFiles = files.filter(f => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      toast.error('กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้น (เช่น JPG, PNG, WEBP, GIF)');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`กำลังอัปโหลดรูปภาพ ${validImageFiles.length} รูป...`);

    try {
      const res = await uploadApi.uploadImages(validImageFiles);
      if (res.success && res.urls && res.urls.length > 0) {
        setImages(prev => [...prev, ...res.urls!]);
        toast.success(`อัปโหลดรูปภาพเรียบร้อยแล้ว (${res.urls.length} รูป)`, { id: toastId });
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
    toast.success('เพิ่มรูปภาพในแกลเลอรีแล้ว');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length <= 1) {
      toast.error('ห้องประชุมต้องมีรูปภาพอย่างน้อย 1 รูป');
      return;
    }
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success('ลบรูปภาพแล้ว');
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
      setError('ความจุห้องต้องมากกว่า 0 คน');
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
      if (currentRoom) {
        const res = await roomsApi.update(currentRoom.id, roomPayload);
        if (res.success) {
          toast.success('แก้ไขข้อมูลห้องประชุมเรียบร้อยแล้ว');
          handleSuccess();
        } else {
          setError(res.error || 'ไม่สามารถแก้ไขห้องประชุมได้');
        }
      } else {
        const res = await roomsApi.create(roomPayload);
        if (res.success) {
          toast.success('เพิ่มห้องประชุมใหม่สำเร็จแล้ว');
          handleSuccess();
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

  const coverImage = images[0] || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-sm bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="ย้อนกลับ"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold hidden sm:inline">ย้อนกลับ</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>จัดการห้องประชุม</span>
              <span>/</span>
              <span className="text-purple-600 font-semibold">{isEditing ? 'แก้ไขห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <span>{isEditing ? `แก้ไขข้อมูล: ${currentRoom?.name || ''}` : '✨ เพิ่มห้องประชุมใหม่'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-sm text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="px-5 py-2 rounded-sm text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <Save size={16} />
            <span>{isSubmitting ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'บันทึกห้องประชุมใหม่')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm flex items-center gap-2.5 animate-shake">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form (8 Cols) vs Live Preview (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Body (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: ข้อมูลทั่วไป */}
            <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">ข้อมูลพื้นฐานของห้องประชุม</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ระบุรหัสห้อง ชื่อห้อง ขนาดความจุ และสถานที่ตั้ง</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    รหัสห้อง (Code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="เช่น MR-101"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ชื่อห้องประชุม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="เช่น Sapphire Conference Hall หรือ ห้องประชุมแก้วเจ้าจอม"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ความจุสูงสุด (คน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ชั้น / สถานที่ตั้ง</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="เช่น ชั้น 3 อาคารอำนวยการ"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">คำอธิบายรายละเอียดห้อง</label>
                <textarea
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  rows={3}
                  placeholder="ระบุจุดเด่น บรรยากาศ หรือวัตถุประสงค์ที่เหมาะสม เช่น ห้องประชุมระดับพรีเมียม วิวมุมกว้าง เหมาะสำหรับการประชุมบอร์ดบริหาร..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">เปิดให้จองใช้งาน (Active)</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">หากปิดการใช้งาน ห้องนี้จะไม่ปรากฏให้ผู้ใช้ทั่วไปกดจองในระบบ</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Card 2: อัปโหลดรูปภาพห้องประชุมหลายรูป (File Upload & Drag-and-Drop) */}
            <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <UploadCloud size={20} className="text-purple-600 dark:text-purple-400" />
                      <span>อัปโหลดรูปภาพห้องประชุม ({images.length} รูป)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      อัปโหลดไฟล์รูปภาพจริงจากเครื่องคอมพิวเตอร์ของคุณ (เลือกได้หลายรูป) โดยรูปแรกจะเป็นภาพหน้าปกหลัก (Cover)
                    </p>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Upload Area */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileUpload(Array.from(e.dataTransfer.files));
                  }
                }}
                className={`relative border-2 border-dashed rounded-md p-7 sm:p-9 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 scale-[1.01] shadow-inner'
                    : 'border-purple-200 dark:border-purple-900/60 hover:border-purple-500 dark:hover:border-purple-400 bg-gradient-to-b from-purple-50/30 to-slate-50/50 dark:from-purple-950/20 dark:to-slate-900/40 hover:bg-purple-50/60 dark:hover:bg-purple-950/40'
                } ${isUploading ? 'opacity-75 pointer-events-none' : ''}`}
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

                <div className="w-14 h-14 rounded-md bg-white dark:bg-slate-800 shadow-md border border-purple-100 dark:border-slate-700 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  {isUploading ? (
                    <Loader2 size={28} className="animate-spin text-purple-600 dark:text-purple-400" />
                  ) : (
                    <UploadCloud size={30} className="text-purple-600 dark:text-purple-400" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isUploading ? 'กำลังอัปโหลดรูปภาพเข้าสู่ระบบ กรุณารอสักครู่...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือ ลากไฟล์มาวางที่นี่'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    รองรับไฟล์ JPG, PNG, WEBP, GIF (สามารถเลือกและอัปโหลดพร้อมกันได้หลายรูป)
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-1 px-4 py-2 rounded-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-500/25 flex items-center gap-1.5 transition-all pointer-events-none"
                >
                  <FolderOpen size={14} />
                  <span>เลือกไฟล์รูปภาพจากอุปกรณ์</span>
                </button>
              </div>

              {/* Optional: Add via URL or sample preset */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-1.5 cursor-pointer hover:underline"
                >
                  <LinkIcon size={13} />
                  <span>{showUrlInput ? 'ซ่อนการระบุด้วย URL' : '+ หรือระบุรูปภาพด้วยลิงก์ URL / ตัวอย่าง HD'}</span>
                </button>

                {showUrlInput && (
                  <div className="mt-3 p-4 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3 animate-fadeIn">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-purple-600 rounded-sm focus:ring-2 focus:ring-purple-600/10 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="วาง URL รูปภาพที่นี่ (เช่น https://images.unsplash.com/...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImage();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddImage()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        <Plus size={14} />
                        <span>เพิ่ม</span>
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-500" /> ตัวอย่าง:
                      </span>
                      {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddImage(preset.url)}
                          className="text-[11px] px-2.5 py-1 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery Cards */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-between">
                  <span>รูปภาพทั้งหมดที่เลือกไว้ ({images.length} รูป)</span>
                  <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">รูปแรกซ้ายสุด = ภาพหน้าปก</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                        {/* Image Thumbnail Preview */}
                        <div className="w-full h-32 bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                          <img
                            src={imgUrl}
                            alt={`รูปที่ ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=400&q=80';
                            }}
                          />

                          {/* Primary Badge */}
                          {isPrimary ? (
                            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-sm bg-purple-600/90 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                              <Star size={12} className="fill-amber-300 text-amber-300" />
                              <span>รูปหลัก (Cover)</span>
                            </div>
                          ) : (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-sm bg-slate-900/60 backdrop-blur-xs text-white text-xs font-medium">
                              #{index + 1}
                            </div>
                          )}

                          {/* Action Buttons Overlay */}
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(index)}
                                className="p-1.5 rounded-sm bg-white/95 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-200 shadow-sm transition-colors cursor-pointer"
                                title="เลื่อนขึ้นเป็นรูปภาพหลัก"
                              >
                                <MoveUp size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="p-1.5 rounded-sm bg-white/95 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-200 shadow-sm transition-colors cursor-pointer"
                              title="ลบรูปภาพนี้"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[130px] font-mono text-[11px]">{imgUrl}</span>
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(index)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold cursor-pointer shrink-0 ml-1 text-xs"
                            >
                              ตั้งเป็นรูปหลัก
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: อุปกรณ์ประจำห้อง */}
            <div className="bg-white dark:bg-slate-900 rounded-md p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">อุปกรณ์ประจำห้องประชุม</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">เลือกอุปกรณ์และสิ่งอำนวยความสะดวกที่มีพร้อมใช้งานในห้องนี้</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STANDARD_EQUIPMENT.map(eq => {
                  const isChecked = equipment.includes(eq);
                  return (
                    <label
                      key={eq}
                      className={`flex items-center justify-between p-3.5 rounded-sm border text-sm font-semibold cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEquipment(eq)}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                        <span>{eq}</span>
                      </div>
                      {isChecked && <Check size={16} className="text-purple-600 dark:text-purple-400" />}
                    </label>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Live Preview Sidebar (4 Cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-md p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Eye size={15} className="text-purple-600 dark:text-purple-400" />
              <span>ตัวอย่างการแสดงผล (Live Preview)</span>
            </div>

            {/* Mock RoomCard */}
            <div className="bg-slate-50/70 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
                <img
                  src={coverImage}
                  alt={name || 'ตัวอย่างห้อง'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                  <Building2 size={12} className="text-purple-400" />
                  <span>{code || 'MR-XXX'}</span>
                </div>
                {isActive ? (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-xs">
                    พร้อมใช้งาน
                  </div>
                ) : (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-500/90 text-white text-[10px] font-bold shadow-xs">
                    ปิดปรับปรุง
                  </div>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                    <ImageIcon size={10} />
                    <span>{images.length} รูป</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{name || 'ชื่อห้องประชุม'}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Users size={13} className="text-purple-600 dark:text-purple-400" />
                      <span>{capacity} คน</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-purple-600 dark:text-purple-400" />
                      <span>{floor || 'ชั้น 1'}</span>
                    </span>
                  </div>
                </div>

                {description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )}

                {equipment.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">อุปกรณ์ประจำห้อง:</div>
                    <div className="flex flex-wrap gap-1">
                      {equipment.map(eq => (
                        <span key={eq} className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/70 dark:border-purple-800">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions inside Preview */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="w-full py-3 rounded-sm text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <Save size={16} />
                <span>{isSubmitting ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'บันทึกห้องประชุมใหม่')}</span>
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2.5 rounded-sm text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-center"
              >
                ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
