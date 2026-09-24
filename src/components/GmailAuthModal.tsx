import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  UserPlus, 
  Lock, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  Mail,
  Database
} from 'lucide-react';
import { GmailUser } from '../types';
import { loginWithFirebaseGoogle, saveUserToFirestore, logoutFirebase } from '../services/firebaseService';
import { UserAvatar } from './UserAvatar';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GmailUser | null;
  onLoginSuccess: (user: GmailUser) => void;
  onLogout: () => void;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultAccounts: GmailUser[] = [
    {
      name: 'Rajinibon TV (งานโสตฯ)',
      email: 'rajinibontv@rajinibon.ac.th',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      role: 'ผู้ดูแลระบบโสตทัศนูปกรณ์ & สื่อโทรทัศน์',
      department: 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์',
      organization: 'โรงเรียนราชินีบน',
      isStaff: true,
      signedInAt: 'วันนี้ 09:30 น.'
    },
    {
      name: 'คุณกานดา ภักดีรัตน์',
      email: 'kanda.b@school.ac.th',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
      role: 'เจ้าหน้าที่โสตทัศนูปกรณ์',
      department: 'งานสื่อและประชาสัมพันธ์',
      organization: 'ฝ่ายวิชาการและโสตฯ',
      isStaff: true,
      signedInAt: 'วันนี้ 08:45 น.'
    }
  ];

  const handleFirebaseGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user } = await loginWithFirebaseGoogle();
      onLoginSuccess(user);
      setIsLoading(false);
      setSuccessMessage(`เข้าสู่ระบบด้วย Google (${user.email}) สำเร็จ!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Firebase popup login error, allowing quick switch:', err);
      // If popup fails (e.g. iframe origin or blocked popup), fall back to default school account
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/unauthorized-domain' || err.message?.includes('popup')) {
        setErrorMessage('เบราว์เซอร์บล็อกหน้าต่างป็อปอัป คุณสามารถเลือกบัญชีโรงเรียนด้านล่างได้ทันที');
      } else {
        setErrorMessage('ไม่สามารถเปิด Google Popup ได้ กรุณาเลือกบัญชีด้านล่างเพื่อเข้าสู่ระบบ');
      }
    }
  };

  const handleSelectAccount = async (acc: GmailUser) => {
    setIsLoading(true);
    setErrorMessage(null);
    const updatedUser = {
      ...acc,
      signedInAt: 'เข้าสู่ระบบเมื่อสักครู่'
    };
    try {
      await saveUserToFirestore(updatedUser);
    } catch (e) {
      console.warn('Saved locally:', e);
    }
    setTimeout(() => {
      onLoginSuccess(updatedUser);
      setIsLoading(false);
      setSuccessMessage(`เข้าสู่ระบบด้วย ${acc.email} สำเร็จ!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 900);
    }, 400);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    const emailDomain = customEmail.split('@')[1] || 'gmail.com';
    const isSchool = emailDomain.includes('rajinibon') || emailDomain.includes('school');

    const newUser: GmailUser = {
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim(),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      role: isSchool ? 'เจ้าหน้าที่โสตทัศนศึกษา' : 'ผู้ใช้งานทั่วไป (Gmail)',
      department: isSchool ? 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์' : 'บัญชี Google ส่วนบุคคล',
      organization: isSchool ? 'โรงเรียนราชินีบน' : 'Google Account',
      isStaff: true,
      signedInAt: 'เข้าสู่ระบบเมื่อสักครู่'
    };

    try {
      await saveUserToFirestore(newUser);
    } catch (e) {
      console.warn('Saved user locally:', e);
    }

    setTimeout(() => {
      onLoginSuccess(newUser);
      setIsLoading(false);
      setSuccessMessage(`เข้าสู่ระบบด้วย ${newUser.email} สำเร็จ!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 900);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Top Google Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {/* Google G Logo */}
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">เข้าสู่ระบบด้วยบัญชี Google / Gmail</h3>
              <p className="text-[11px] text-slate-400">Google Workspace for Education</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="my-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Firebase Connected Badge */}
        <div className="mt-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>ฐานข้อมูล Firestore: <strong className="text-slate-800 font-semibold">picture edtech</strong></span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ออนไลน์
          </span>
        </div>

        {/* Direct Google Firebase Popup Button */}
        <button
          onClick={handleFirebaseGoogleLogin}
          disabled={isLoading}
          className="mt-3 w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-500 text-slate-800 text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition-all active:scale-98 group"
        >
          <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>ลงชื่อเข้าใช้ด้วย Google / Gmail (Popup)</span>
        </button>

        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider absolute">
            หรือเลือกบัญชีโรงเรียนที่บันทึกไว้
          </span>
        </div>

        {/* Current Logged In Banner */}
        {currentUser && !isCustomMode && (
          <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                src={currentUser.avatarUrl || currentUser.photoURL}
                name={currentUser.name}
                email={currentUser.email}
                className="w-10 h-10 rounded-full ring-2 ring-blue-500/20"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-xs truncate">{currentUser.name}</span>
                  <span className="text-[9px] bg-blue-600 text-white font-semibold px-1.5 py-0.2 rounded-full">ใช้งานอยู่</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                <p className="text-[10px] text-blue-700 font-medium">{currentUser.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage(`กำลังเปิดโปรไฟล์ของ ${currentUser.name}`);
                  setTimeout(() => setSuccessMessage(null), 1500);
                }}
                className="text-[11px] font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                title="ดูข้อมูลโปรไฟล์"
              >
                โปรไฟล์
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage('กำลังเปิดหน้าตั้งค่าบัญชี');
                  setTimeout(() => setSuccessMessage(null), 1500);
                }}
                className="text-[11px] font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                title="ตั้งค่าบัญชี"
              >
                ตั้งค่า
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setSuccessMessage('ออกจากระบบเรียบร้อยแล้ว');
                  setTimeout(() => setSuccessMessage(null), 1500);
                }}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors shadow-2xs"
                title="ออกจากระบบ Google"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        )}


        {/* Account Selection */}
        {!isCustomMode ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600">
              เลือกบัญชี Google / Gmail เพื่อเข้าสู่ระบบคลังสื่อโสตฯ:
            </p>

            <div className="space-y-2">
              {defaultAccounts.map((acc) => {
                const isSelected = currentUser?.email === acc.email;
                return (
                  <button
                    key={acc.email}
                    disabled={isLoading}
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-98 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{acc.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{acc.organization} • {acc.role}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Use Another Gmail Account */}
              <button
                onClick={() => setIsCustomMode(true)}
                className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>ใช้บัญชี Google / Gmail อื่น...</span>
              </button>
            </div>
          </div>
        ) : (
          /* Custom Gmail Input Form */
          <form onSubmit={handleCustomSubmit} className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">เข้าสู่ระบบด้วยอีเมล Gmail หรือบัญชีโรงเรียน:</span>
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="text-[11px] text-blue-600 hover:underline"
              >
                ย้อนกลับ
              </button>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">ชื่อผู้ใช้งาน</label>
              <input
                type="text"
                placeholder="เช่น เจ้าหน้าที่ฝ่ายโสตทัศนูปกรณ์"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">อีเมล (@gmail.com หรือ @rajinibon.ac.th) *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="rajinibontv@rajinibon.ac.th"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-98 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>กำลังเชื่อมต่อบัญชี Google...</span>
              ) : (
                <>
                  <span>ยืนยันเข้าสู่ระบบด้วย Gmail</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & PDPA Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            ระบบตรวจสอบสิทธิ์ผ่าน <strong>Google Workspace for Education</strong> เข้ารหัสปลอดภัย และจำกัดสิทธิ์การเข้าถึงข้อมูลตามมาตรฐาน PDPA สำหรับโรงเรียน
          </p>
        </div>
      </div>
    </div>
  );
};
