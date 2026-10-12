import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, User, Mail, Lock, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RegisterPageProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const DEPARTMENTS = [
  { id: 1, name: 'ฝ่ายบริหารและเทคโนโลยี' },
  { id: 2, name: 'ฝ่ายพัฒนาผลิตภัณฑ์' },
  { id: 3, name: 'ฝ่ายการตลาดและประชาสัมพันธ์' },
  { id: 4, name: 'ฝ่ายบัญชีและการเงิน' }
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>(DEPARTMENTS);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    import('../api/departments.api').then(({ departmentsApi }) => {
      departmentsApi.getAll().then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setDepartments(res.data.map(d => ({ id: d.department_id, name: d.department_name })));
        }
      }).catch(() => {});
    });
  }, []);

  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      const msg = 'กรุณาระบุทั้งชื่อจริงและนามสกุล';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('กำลังส่งคำขอสมัครสมาชิก...');

    const selectedDept = departments.find(d => Number(d.id) === Number(departmentId))?.name || '';

    const res = await register({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim().toLowerCase(),
      password,
      department_id: departmentId,
      department: selectedDept,
      branch: 'สำนักงานใหญ่',
      phone: phone.trim()
    });

    toast.dismiss(loadingToast);
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      toast.success('สมัครสมาชิกสำเร็จ! บัญชีของคุณอยู่ระหว่างรอ Admin อนุมัติ', { duration: 5000 });
    } else {
      const errorMsg = res.error || 'สมัครสมาชิกไม่สำเร็จ';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '30px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--primary-gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '10px'
            }}
          >
            <Building size={26} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>สมัครสมาชิกใหม่</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            กรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งานระบบจองห้องประชุม (รอ Admin อนุมัติ)
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              สมัครสมาชิกสำเร็จ!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว และกำลัง <b>รอผู้ดูแลระบบ (Admin) อนุมัติบัญชี</b><br />
              เมื่อได้รับการอนุมัติแล้ว คุณจะสามารถเข้าสู่ระบบและเริ่มจองห้องประชุมได้ทันที
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onSwitchToLogin}>
              ไปที่หน้าเข้าสู่ระบบ
            </button>
          </div>
        ) : (
          <>
            {/* Notice banner */}
            <div className="p-3 px-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-md text-amber-800 dark:text-amber-300 text-xs mb-4.5 flex items-center gap-2">
              <span>หลังสมัครสมาชิก บัญชีของคุณจะต้องรอการอนุมัติจาก Admin ก่อนจึงจะสามารถล็อกอินได้</span>
            </div>

            {error && (
              <div className="p-3 px-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-md mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* first_name & last_name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ชื่อจริง (First Name) *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      placeholder="เช่น สมศักดิ์"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">นามสกุล (Last Name) *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น มั่งมี"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* email */}
              <div className="form-group">
                <label className="form-label">อีเมลองค์กร (Email) *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="somsak@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* password */}
              <div className="form-group">
                <label className="form-label">รหัสผ่าน (Password อย่างน้อย 6 ตัวอักษร) *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* department (department_id) & phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">แผนก (Department) *</label>
                  <select
                    className="form-control"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                    required
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">เบอร์โทรศัพท์ (Phone) *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      placeholder="08X-XXX-XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอสมัครสมาชิก'}</span>
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>มีบัญชีผู้ใช้อยู่แล้ว? </span>
              <button
                onClick={onSwitchToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
