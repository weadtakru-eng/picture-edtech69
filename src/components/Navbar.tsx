import React, { useState } from 'react';
import { 
  Search, 
  UploadCloud, 
  ExternalLink, 
  Bell, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  Clock, 
  DownloadCloud,
  ChevronDown,
  LogIn,
  Database
} from 'lucide-react';
import { AppView, GmailUser } from '../types';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isMobileMockup: boolean;
  setIsMobileMockup: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCreateAlbum: () => void;
  currentUser: GmailUser | null;
  onOpenGmailAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  isMobileMockup,
  setIsMobileMockup,
  searchQuery,
  setSearchQuery,
  onOpenCreateAlbum,
  currentUser,
  onOpenGmailAuth
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        {/* Search Omnibox */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่ออัลบั้ม, กิจกรรม, วันที่, หรือคำสำคัญ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400 text-slate-800"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded-full px-1.5 py-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Firebase Connected Indicator */}
          <div 
            onClick={onOpenGmailAuth}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-medium cursor-pointer hover:bg-amber-100/70 transition-colors shadow-2xs"
            title="เชื่อมต่อกับ Firebase Cloud Firestore: picture edtech เรียบร้อยแล้ว"
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px]">Firebase: <strong className="font-semibold text-slate-900">picture edtech</strong></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </div>

          {/* Mobile Preview Mode Toggle */}
          <button
            onClick={() => setIsMobileMockup(!isMobileMockup)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl border transition-all ${
              isMobileMockup 
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="สลับมุมมองมือถือ / เดสก์ท็อป"
          >
            {isMobileMockup ? (
              <>
                <Monitor className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">มุมมองเดสก์ท็อป</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">ดูมุมมองมือถือ (Mobile View)</span>
              </>
            )}
          </button>

          {/* Open Public Gallery Link */}
          <button
            onClick={() => setCurrentView('album-detail')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>หน้าแกลเลอรีสาธารณะ</span>
          </button>

          {/* Quick Upload Button */}
          <button
            onClick={() => setCurrentView('bulk-upload')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden xs:inline">+ อัปโหลดด่วน</span>
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="การแจ้งเตือน"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 text-sm">การแจ้งเตือนระบบโสตฯ</h4>
                  <span className="text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">3 รายการใหม่</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition-colors flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-medium text-slate-800">สำรองข้อมูล 14,850 รูปเรียบร้อย</p>
                      <p className="text-slate-500 mt-0.5">Cloud Vault ทำการแบ็กอัปอัตโนมัติแล้ว</p>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 20 นาทีที่แล้ว
                      </span>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <DownloadCloud className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-medium text-slate-800">ดาวน์โหลดภาพ SMT-SLT 642 ไฟล์</p>
                      <p className="text-slate-500 mt-0.5">ฝ่ายประชาสัมพันธ์ดาวน์โหลด ZIP ความละเอียด 4K</p>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 2 ชั่วโมงที่แล้ว
                      </span>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-medium text-slate-800">แชร์อัลบั้มวันแม่แห่งชาติ 2569</p>
                      <p className="text-slate-500 mt-0.5">ยอดเข้าชมผ่าน QR Code ทะลุ 3,420 ครั้ง</p>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> เมื่อวานนี้
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User Profile Pill / Gmail Sign-In Button */}
          {currentUser ? (
            <div 
              onClick={onOpenGmailAuth}
              className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
              title="คลิกเพื่อจัดการบัญชี Google / Gmail"
            >
              <div className="relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{currentUser.name}</span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-semibold px-1 rounded border border-blue-200">Gmail</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{currentUser.email}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </div>
          ) : (
            <button
              onClick={onOpenGmailAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200 shadow-2xs active:scale-98 transition-all"
            >
              {/* Google G logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>เข้าสู่ระบบด้วย Gmail</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
