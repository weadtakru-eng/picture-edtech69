import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  FolderPlus, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles,
  Camera,
  Layers,
  ChevronRight
} from 'lucide-react';
import { AppView, Album, GmailUser } from '../types';

interface LoginAndStatesViewProps {
  setCurrentView: (view: AppView) => void;
  albums: Album[];
  setSelectedAlbum: (album: Album) => void;
  onOpenCreateAlbum: () => void;
  currentUser: GmailUser | null;
  onOpenGmailAuth: () => void;
}

export const LoginAndStatesView: React.FC<LoginAndStatesViewProps> = ({
  setCurrentView,
  albums,
  setSelectedAlbum,
  onOpenCreateAlbum,
  currentUser,
  onOpenGmailAuth
}) => {
  const [email, setEmail] = useState(currentUser?.email || 'rajinibontv@rajinibon.ac.th');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Private Access PIN
  const [pin, setPin] = useState(['1', '2', '3', '4', '5', '6']);
  const [pinError, setPinError] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const handlePinChange = (idx: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newPin = [...pin];
    newPin[idx] = val;
    setPin(newPin);

    // Auto-focus next input
    if (val && idx < 5) {
      const nextInput = document.getElementById(`pin-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyPin = () => {
    const entered = pin.join('');
    if (entered === '123456') {
      setPinSuccess(true);
      setPinError(false);
      setTimeout(() => {
        const parentsAlbum = albums.find(a => a.id === 'parents-meeting-2569') || albums[0];
        setSelectedAlbum(parentsAlbum);
        setCurrentView('album-detail');
      }, 1000);
    } else {
      setPinError(true);
      setPinSuccess(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">ระบบบริหารจัดการสื่อและประชาสัมพันธ์ (PR & AV MEDIA HUB)</p>
            <p className="text-slate-400 text-[11px]">มาตรฐานความปลอดภัยระดับสถานศึกษา v2.4.0 (ปีการศึกษา 2569)</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors shrink-0 text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับสู่แดชบอร์ด</span>
        </button>
      </div>

      {/* Main Grid: Login Portal (Left) & Private Access PIN (Right) (Image 10) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Login Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">เจ้าหน้าที่โสตทัศนูปกรณ์</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">เข้าสู่ระบบคลังภาพโสตทัศนูปกรณ์</h2>
              <p className="text-xs text-slate-500 mt-0.5">เข้าถึงระบบคลังภาพ จัดการอัลบั้ม และตรวจสอบสถิติการเผยแพร่</p>
            </div>

            {/* Google Single Sign-on */}
            <button
              onClick={onOpenGmailAuth}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:border-blue-300 transition-all active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>ลงชื่อเข้าใช้ด้วยบัญชี Google / Gmail (@rajinibon.ac.th)</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 absolute">หรือเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่</span>
            </div>

            {/* Email & Password Input */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">อีเมลหรือชื่อผู้ใช้</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">รหัสผ่าน</label>
                  <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">ลืมรหัสผ่าน?</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                  <span>จดจำการเข้าสู่ระบบ 30 วัน</span>
                </label>
              </div>

              <button
                onClick={() => setCurrentView('dashboard')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-98 flex items-center justify-center gap-2 text-sm"
              >
                <span>เข้าสู่ระบบคลังสื่อโสตฯ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>ฝ่ายโสตทัศนศึกษา อาคาร 1 ห้อง 114</span>
            <span className="text-blue-600 hover:underline cursor-pointer">แจ้งปัญหาทางเทคนิค</span>
          </div>
        </div>

        {/* Right: Private Access 6-digit PIN Modal (Image 10) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Lock className="w-3 h-3" />
                <span>PRIVATE ACCESS • พื้นที่จำกัดสิทธิ์</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">ยืนยันรหัสผ่านเพื่อเข้าชมอัลบั้ม</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                อัลบั้มนี้ได้รับการคุ้มครองด้วยรหัสผ่านความปลอดภัยตามนโยบาย PDPA
              </p>
            </div>

            {/* Album Target Preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=120&q=80"
                alt=""
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-xs truncate">การประชุมผู้ปกครองภาคเรียนที่ 1/2569</p>
                <p className="text-[11px] text-slate-500">194 รูปภาพ • จำกัดสิทธิ์เฉพาะผู้ปกครองและครู</p>
              </div>
            </div>

            {/* 6-Digit PIN Inputs */}
            <div className="py-2 text-center">
              <label className="text-xs font-semibold text-slate-700 block mb-3">
                กรอกรหัสผ่าน 6 หลัก (ทดสอบใส่: 123456)
              </label>

              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-${idx}`}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center font-bold text-lg sm:text-xl rounded-xl border transition-all focus:outline-none ${
                      pinError 
                        ? 'border-rose-400 bg-rose-50 text-rose-700' 
                        : pinSuccess 
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-200 bg-slate-50 focus:border-blue-600 focus:bg-white text-slate-900'
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-xs text-rose-600 font-semibold mt-2.5 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>รหัสผ่านไม่ถูกต้อง กรุณาติดต่อคุณครูประจำชั้น</span>
                </p>
              )}

              {pinSuccess && (
                <p className="text-xs text-emerald-600 font-semibold mt-2.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ยืนยันรหัสถูกต้อง! กำลังเปิดอัลบั้มภาพ...</span>
                </p>
              )}
            </div>

            <button
              onClick={handleVerifyPin}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>เปิดอัลบั้มภาพ</span>
            </button>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              ภาพถ่ายในอัลบั้มนี้เป็นข้อมูลส่วนบุคคลของนักเรียนและผู้ปกครอง สงวนสิทธิ์สำหรับใช้งานภายในสถานศึกษาเท่านั้น
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: UI STATES & FEEDBACK SHOWCASE (Design System matching Image 10) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">UI STATES & FEEDBACK (Design System Showcase)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">การแสดงผลสถานะต่างๆ ของระบบโสตฯ (ตามแบบ Image 10)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* State 01: Empty State */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center text-center justify-between">
            <div className="w-full text-left mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATE 01</span>
              <h4 className="font-bold text-slate-800 text-xs">สถานะว่างเปล่า (Empty State)</h4>
            </div>

            <div className="py-6">
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 border border-slate-200 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <FolderPlus className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800">ยังไม่มีอัลบั้มภาพกิจกรรม</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                เริ่มต้นสร้างอัลบั้มแรกเพื่อจัดเก็บภาพและแชร์ให้ครู-นักเรียน
              </p>
            </div>

            <button
              onClick={onOpenCreateAlbum}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors shadow-2xs"
            >
              + เริ่มสร้างอัลบั้มแรก
            </button>
          </div>

          {/* State 02: Error / Expired */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center text-center justify-between">
            <div className="w-full text-left mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATE 02</span>
              <h4 className="font-bold text-slate-800 text-xs">ข้อผิดพลาด / หมดอายุ (Error & Expired)</h4>
            </div>

            <div className="py-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800">ไม่พบอัลบั้ม หรือลิงก์หมดอายุแล้ว</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                ลิงก์นี้ถูกระงับการเข้าถึงชั่วคราว หรือหมดระยะเวลาเผยแพร่
              </p>
            </div>

            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs rounded-xl transition-colors shadow-2xs"
            >
              กลับหน้าหลักคลังโสตฯ
            </button>
          </div>

          {/* State 03: Skeleton Loading */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="w-full text-left mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATE 03</span>
              <h4 className="font-bold text-slate-800 text-xs">กำลังโหลดข้อมูล (Skeleton Loading)</h4>
            </div>

            <div className="space-y-3 py-2 animate-pulse">
              <div className="w-full h-24 bg-slate-200 rounded-xl" />
              <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
              <div className="h-2.5 bg-slate-200 rounded-md w-1/2" />
              <div className="flex justify-between pt-1">
                <div className="h-2.5 bg-slate-200 rounded-md w-16" />
                <div className="h-2.5 bg-slate-200 rounded-md w-12" />
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-2">
              Smooth loading transition for low-latency networks
            </div>
          </div>
        </div>

        {/* Live Photo Strip from AV Department */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              ภาพกิจกรรมล่าสุดจากกล้องฝ่ายโสตทัศนูปกรณ์ (2 ชั่วโมงที่แล้ว)
            </span>
            <span className="text-slate-400">อัปเดตแบบเรียลไทม์</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {albums.slice(0, 4).map((a) => (
              <div 
                key={a.id} 
                onClick={() => {
                  setSelectedAlbum(a);
                  setCurrentView('album-detail');
                }}
                className="group relative aspect-16/10 rounded-xl overflow-hidden bg-slate-100 cursor-pointer"
              >
                <img
                  src={a.coverUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 text-white">
                  <span className="text-[11px] font-medium truncate">{a.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
