import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Department } from '../../types';
import { departmentsApi } from '../../api/departments.api';
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  FolderTree
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/dialog';

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptNameInput, setDeptNameInput] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await departmentsApi.getAll();
      if (res.success && res.data) {
        setDepartments(res.data);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลแผนกได้');
      }
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลแผนก');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filtered departments based on search
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const term = searchTerm.toLowerCase().trim();
    return departments.filter(
      d =>
        d.department_name.toLowerCase().includes(term) ||
        String(d.department_id).includes(term)
    );
  }, [departments, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = departments.length;
    const withUsers = departments.filter(d => (d.user_count || 0) > 0).length;
    const totalUsers = departments.reduce((acc, curr) => acc + (curr.user_count || 0), 0);
    return { total, withUsers, totalUsers };
  }, [departments]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedDept(null);
    setDeptNameInput('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dept: Department) => {
    setModalMode('edit');
    setSelectedDept(dept);
    setDeptNameInput(dept.department_name);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Save (Create / Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = deptNameInput.trim();
    if (!trimmed) {
      setModalError('กรุณากรอกชื่อแผนก');
      return;
    }
    if (trimmed.length < 2) {
      setModalError('ชื่อแผนกต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
      return;
    }
    if (trimmed.length > 100) {
      setModalError('ชื่อแผนกต้องมีความยาวไม่เกิน 100 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (modalMode === 'create') {
        const res = await departmentsApi.create({ department_name: trimmed });
        if (res.success) {
          toast.success(`เพิ่มแผนก "${trimmed}" เรียบร้อยแล้ว`);
          setIsModalOpen(false);
          fetchDepartments();
        } else {
          setModalError(res.error || 'ไม่สามารถเพิ่มแผนกได้');
        }
      } else if (modalMode === 'edit' && selectedDept) {
        const res = await departmentsApi.update(selectedDept.department_id, {
          department_name: trimmed
        });
        if (res.success) {
          toast.success(`แก้ไขข้อมูลแผนกเป็น "${trimmed}" เรียบร้อย`);
          setIsModalOpen(false);
          fetchDepartments();
        } else {
          setModalError(res.error || 'ไม่สามารถแก้ไขข้อมูลแผนกได้');
        }
      }
    } catch (err: any) {
      setModalError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (dept: Department) => {
    const userCount = dept.user_count || 0;
    const warningText =
      userCount > 0
        ? `แผนกนี้มีสมาชิกอยู่ ${userCount} คน หากลบ สมาชิกในแผนกนี้จะถูกปรับเป็นไม่มีแผนก คุณแน่ใจหรือไม่ว่าต้องการลบแผนก "${dept.department_name}"?`
        : `คุณต้องการลบแผนก "${dept.department_name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`;

    const confirmed = await confirmDialog({
      title: 'ยืนยันการลบแผนก',
      text: warningText,
      confirmText: 'ยืนยันลบแผนก',
      cancelText: 'ยกเลิก',
      isDanger: true,
      icon: 'warning'
    });

    if (!confirmed) return;

    try {
      const res = await departmentsApi.delete(dept.department_id);
      if (res.success) {
        toast.success(res.message || `ลบแผนก "${dept.department_name}" เรียบร้อยแล้ว`);
        fetchDepartments();
      } else {
        toast.error(res.error || 'ไม่สามารถลบแผนกได้');
      }
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาดในการลบแผนก');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Departments */}
        <div className="bg-white dark:bg-slate-900 rounded-md p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                จำนวนแผนกทั้งหมด
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.total}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">แผนก</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100/80 dark:border-purple-800/60">
              <FolderTree size={24} />
            </div>
          </div>
          <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>พร้อมใช้งานสำหรับการสมัครสมาชิก & จัดสรรห้อง</span>
          </div>
        </div>

        {/* Card 2: Departments with Users */}
        <div className="bg-white dark:bg-slate-900 rounded-md p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                แผนกที่มีบุคลากร
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.withUsers}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">จาก {stats.total} แผนก</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/80 dark:border-blue-800/60">
              <Building2 size={24} />
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
            <Users size={13} />
            <span>มีผู้ใช้งานสังกัดอยู่ในระบบ</span>
          </div>
        </div>

        {/* Card 3: Total Users */}
        <div className="bg-white dark:bg-slate-900 rounded-md p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                สมาชิกรวมทุกแผนก
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.totalUsers}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">คน</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100/80 dark:border-emerald-800/60">
              <UserCheck size={24} />
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>บุคลากรที่ลงทะเบียนในหน่วยงาน</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header & Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="text-purple-600 dark:text-purple-400" size={20} />
              <span>การจัดการโครงสร้างแผนก / หน่วยงาน</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เพิ่ม ลบ และแก้ไขรายชื่อฝ่าย/แผนกภายในองค์กร สำหรับใช้จัดกลุ่มสมาชิกและการจองห้อง
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อแผนก หรือ ID..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchDepartments}
              disabled={isLoading}
              title="รีเฟรชข้อมูล"
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* Add New Department Button */}
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-sm text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>เพิ่มแผนกใหม่</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-purple-600" size={28} />
            <p className="text-sm font-medium">กำลังโหลดข้อมูลแผนก...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-md bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
              <FolderTree size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              {searchTerm ? 'ไม่พบแผนกที่ค้นหา' : 'ยังไม่มีข้อมูลแผนกในระบบ'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchTerm
                ? `ไม่พบผลลัพธ์สำหรับคำค้น "${searchTerm}" ลองตรวจสอบคำสะกดอีกครั้ง`
                : 'เริ่มต้นสร้างแผนกแรกเพื่อใช้จัดกลุ่มสมาชิกและการจองห้องประชุม'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 rounded-sm text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                ล้างการค้นหา
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 rounded-sm text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                <span>เพิ่มแผนกใหม่</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-20">รหัส</th>
                  <th className="py-3.5 px-4 sm:px-6">ชื่อฝ่าย / แผนก</th>
                  <th className="py-3.5 px-4 sm:px-6 w-44">จำนวนบุคลากร</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right w-36">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDepartments.map(dept => {
                  const userCount = dept.user_count || 0;
                  return (
                    <tr
                      key={dept.department_id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* ID Badge */}
                      <td className="py-4 px-4 sm:px-6 font-mono text-slate-500 dark:text-slate-400 font-bold">
                        <span className="px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[11px]">
                          #{String(dept.department_id).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Department Name */}
                      <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100/60 dark:border-purple-800/60 group-hover:scale-105 transition-transform">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <span className="text-slate-900 dark:text-white font-bold block text-sm">
                              {dept.department_name}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                              หน่วยงานภายในองค์กร
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User Count */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/60">
                          <Users size={13} className="text-blue-500 dark:text-blue-400" />
                          <span>
                            {userCount} <span className="font-normal text-blue-600 dark:text-blue-400">คน</span>
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(dept)}
                            title="แก้ไขชื่อแผนก"
                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-sm transition-all cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dept)}
                            title="ลบแผนก"
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-sm transition-all cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-6">
          <span>
            แสดงผล {filteredDepartments.length} จากทั้งหมด {departments.length} แผนก
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500">
            ระบบอัปเดตแบบ Realtime เชื่อมโยงกับฐานข้อมูล Supabase
          </span>
        </div>
      </div>

      {/* Modal Dialog for Create/Edit */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-md max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60">
                {modalMode === 'create' ? <Plus size={24} /> : <Edit2 size={22} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === 'create' ? 'เพิ่มแผนกใหม่' : 'แก้ไขข้อมูลแผนก'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {modalMode === 'create'
                    ? 'สร้างแผนกใหม่สำหรับจัดสรรบุคลากรและการใช้งานระบบ'
                    : `กำลังแก้ไขแผนก: #${selectedDept?.department_id}`}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {modalError && (
              <div className="mb-4 p-3 rounded-sm bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500 dark:text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ชื่อฝ่าย / แผนก <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={deptNameInput}
                  onChange={e => {
                    setDeptNameInput(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  placeholder="เช่น ฝ่ายบริหารและเทคโนโลยี, ฝ่ายบุคคล..."
                  maxLength={100}
                  className="w-full px-4 py-2.5 text-sm rounded-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/30 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                  <span>ความยาวอย่างน้อย 2 ตัวอักษร</span>
                  <span>{deptNameInput.length} / 100</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-sm text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !deptNameInput.trim()}
                  className="px-5 py-2.5 rounded-sm text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>{modalMode === 'create' ? 'บันทึกแผนก' : 'บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
