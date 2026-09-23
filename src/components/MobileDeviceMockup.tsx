import React, { useState } from 'react';
import { 
  Home, 
  FolderKanban, 
  Image as ImageIcon, 
  Share2, 
  User, 
  UploadCloud, 
  Camera, 
  QrCode, 
  BarChart3, 
  Link2, 
  ArrowLeft, 
  Download, 
  Check, 
  Plus, 
  Search, 
  Bell, 
  ChevronRight,
  HardDrive,
  Globe,
  Lock,
  ExternalLink,
  LogIn
} from 'lucide-react';
import { Album, Photo, UploadQueueItem, AppView, GmailUser } from '../types';

interface MobileDeviceMockupProps {
  albums: Album[];
  photos: Photo[];
  queue: UploadQueueItem[];
  currentAlbum: Album;
  onExitMobile: () => void;
  onOpenPhotoLightbox: (photo: Photo) => void;
  onOpenCreateAlbum: () => void;
  currentUser: GmailUser | null;
  onOpenGmailAuth: () => void;
}

export const MobileDeviceMockup: React.FC<MobileDeviceMockupProps> = ({
  albums,
  photos,
  queue,
  currentAlbum,
  onExitMobile,
  onOpenPhotoLightbox,
  onOpenCreateAlbum,
  currentUser,
  onOpenGmailAuth
}) => {
  const [mobileTab, setMobileTab] = useState<'home' | 'albums' | 'upload' | 'gallery' | 'profile'>('home');
  const [activeAlbum, setActiveAlbum] = useState<Album>(currentAlbum);

  const albumPhotos = photos.filter(p => p.albumId === activeAlbum.id);

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-6 bg-slate-900/90 min-h-[calc(100vh-80px)]">
      {/* Top Banner Control */}
      <div className="mb-4 flex items-center justify-between w-full max-w-sm px-2 text-white">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold">มุมมองมือถือ (Mobile Responsive Preview)</span>
        </div>
        <button
          onClick={onExitMobile}
          className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700"
        >
          กลับมุมมองเดสก์ท็อป ✕
        </button>
      </div>

      {/* Phone Hardware Mockup Frame */}
      <div className="relative w-full max-w-[390px] h-[780px] bg-black rounded-[48px] p-3 shadow-2xl ring-1 ring-slate-700/80 overflow-hidden flex flex-col">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2" />
          <div className="w-2 h-2 rounded-full bg-blue-900/60" />
        </div>

        {/* Status Bar */}
        <div className="pt-2 px-6 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-800 bg-white select-none z-40 rounded-t-[36px]">
          <span>09:41</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Screen Viewport */}
        <div className="flex-1 bg-[#F8FAFC] overflow-y-auto relative no-scrollbar flex flex-col">
          {/* SCREEN 1: Mobile Home Dashboard (Image 24) */}
          {mobileTab === 'home' && (
            <div className="p-4 space-y-4 pb-20">
              {/* Header */}
              <div className="flex items-center justify-between pt-1">
                {currentUser ? (
                  <div 
                    onClick={onOpenGmailAuth}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <img
                      src={currentUser.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400">ยินดีต้อนรับ (Gmail)</p>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[170px]">{currentUser.name}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={onOpenGmailAuth}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>เข้าสู่ระบบ Gmail</span>
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
              </div>

              {/* Storage Quota Mini Card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl text-white shadow-xs">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-blue-200 text-[11px]">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    พื้นที่คลังภาพโสตฯ
                  </span>
                  <span className="font-bold">42.6 GB / 100 GB</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full w-[42%] rounded-full" />
                </div>
              </div>

              {/* 4 Stats Chips */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-medium">อัลบั้มทั้งหมด</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{albums.length} อัลบั้ม</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-medium">รูปภาพในคลัง</span>
                  <p className="text-lg font-bold text-blue-600 mt-0.5">14,850 รูป</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-medium">ลิงก์แชร์</span>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">32 ลิงก์</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-medium">ยอดเข้าชม</span>
                  <p className="text-lg font-bold text-indigo-600 mt-0.5">89.4k ครั้ง</p>
                </div>
              </div>

              {/* Quick Circular Action Tools (Image 24) */}
              <div>
                <span className="text-xs font-bold text-slate-800 mb-2 block">เครื่องมือด่วน</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <button
                    onClick={() => setMobileTab('upload')}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs active:scale-95 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700">อัปโหลดภาพ</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://album.school.ac.th/a/SMT-2569');
                      alert('คัดลอกลิงก์เรียบร้อยแล้ว');
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs active:scale-95 transition-transform">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700">คัดลอกลิงก์</span>
                  </button>

                  <button
                    onClick={() => setMobileTab('gallery')}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs active:scale-95 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700">QR กิจกรรม</span>
                  </button>

                  <button
                    onClick={() => setMobileTab('albums')}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-200/60 shadow-2xs active:scale-95 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700">สถิติระบบ</span>
                  </button>
                </div>
              </div>

              {/* Recent Albums List (Image 24) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">อัลบั้มล่าสุด</span>
                  <button onClick={() => setMobileTab('albums')} className="text-[11px] text-blue-600 font-medium">ดูทั้งหมด</button>
                </div>

                {albums.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setActiveAlbum(a);
                      setMobileTab('gallery');
                    }}
                    className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3 active:bg-slate-50 transition-colors"
                  >
                    <img
                      src={a.coverUrl}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-blue-600 uppercase">{a.category}</span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{a.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{a.photoCount} รูปภาพ • {a.date}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 2: Mobile Public Gallery (Image 22) */}
          {mobileTab === 'gallery' && (
            <div className="p-4 space-y-4 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMobileTab('home')}
                  className="p-1.5 bg-white rounded-xl border border-slate-200 text-slate-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{activeAlbum.title}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeAlbum.shareUrl);
                    alert('คัดลอกลิงก์แชร์แล้ว');
                  }}
                  className="p-1.5 bg-white rounded-xl border border-slate-200 text-blue-600"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Mini Hero Header */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {activeAlbum.category}
                </span>
                <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
                  {activeAlbum.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeAlbum.date} • {activeAlbum.photoCount} ภาพ • 4K RAW
                </p>
                <button
                  onClick={() => alert('กำลังดาวน์โหลด ZIP 2.45 GB...')}
                  className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดทั้งอัลบั้ม (ZIP)</span>
                </button>
              </div>

              {/* 2-Column Photo Grid (Image 22) */}
              <div className="grid grid-cols-2 gap-2">
                {albumPhotos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onOpenPhotoLightbox(p)}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer"
                  >
                    <img
                      src={p.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-1.5 left-1.5 px-1 py-0.2 rounded text-[8px] font-bold bg-blue-600/90 text-white">
                      4K
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 3: Mobile Bulk Uploader (Image 20) */}
          {mobileTab === 'upload' && (
            <div className="p-4 space-y-4 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMobileTab('home')}
                  className="p-1.5 bg-white rounded-xl border border-slate-200 text-slate-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800">อัปโหลดรูปภาพผ่านมือถือ</span>
                <span className="w-6" />
              </div>

              {/* Mobile Camera Direct Button */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => alert('เปิดกล้องถ่ายภาพมือถือ')}
                  className="p-4 bg-blue-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-98 transition-transform shadow-xs"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-bold">ถ่ายภาพทันที</span>
                </button>

                <button 
                  onClick={() => alert('เลือกรูปจากคลังภาพในเครื่อง')}
                  className="p-4 bg-white border border-slate-200 text-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-98 transition-transform shadow-2xs"
                >
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                  <span className="text-xs font-bold">เลือกจากคลังภาพ</span>
                </button>
              </div>

              {/* Progress Summary */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800">กำลังอัปโหลด...</span>
                  <span className="font-bold text-blue-600">72%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-[72%] rounded-full" />
                </div>
                <p className="text-[10px] text-slate-400">อัปโหลดเสร็จแล้ว 8 จาก 11 รูปภาพ</p>
              </div>

              {/* Queue Items */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">รายการไฟล์</span>
                {queue.slice(0, 4).map((q) => (
                  <div key={q.id} className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        {q.thumbnailUrl && <img src={q.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[11px] font-medium text-slate-800 truncate">{q.filename}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      q.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      q.status === 'uploading' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {q.status === 'completed' ? 'สำเร็จ' : q.status === 'uploading' ? '74%' : 'รอคิว'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 4: Mobile All Albums */}
          {mobileTab === 'albums' && (
            <div className="p-4 space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button onClick={() => setMobileTab('home')} className="p-1.5 bg-white rounded-xl border border-slate-200">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800">อัลบั้มทั้งหมด ({albums.length})</span>
                <button onClick={onOpenCreateAlbum} className="text-xs font-bold text-blue-600">+ สร้าง</button>
              </div>

              {albums.map((a) => (
                <div
                  key={a.id}
                  onClick={() => {
                    setActiveAlbum(a);
                    setMobileTab('gallery');
                  }}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs"
                >
                  <img src={a.coverUrl} alt="" className="w-full h-28 object-cover" />
                  <div className="p-3">
                    <span className="text-[9px] font-bold text-blue-600 uppercase">{a.category}</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">{a.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.photoCount} รูป • {a.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SCREEN 5: Mobile Profile */}
          {mobileTab === 'profile' && (
            <div className="p-4 space-y-4 pb-20 text-center">
              {currentUser ? (
                <>
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-blue-500/20"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500">{currentUser.role}</p>
                    <p className="text-[11px] text-blue-600 font-medium mt-1">{currentUser.email}</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">สังกัด / หน่วยงาน</span>
                      <span className="text-slate-800 font-bold">{currentUser.organization}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">ประเภทการล็อกอิน</span>
                      <span className="text-blue-600 font-bold">Google / Gmail</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">นโยบายข้อมูล</span>
                      <span className="text-blue-600 font-bold">PDPA สถานศึกษา</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">เข้าสู่ระบบเมื่อ</span>
                      <span className="text-slate-700 font-medium">{currentUser.signedInAt}</span>
                    </div>
                  </div>

                  <button
                    onClick={onOpenGmailAuth}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    จัดการบัญชี Google / สลับบัญชี
                  </button>
                </>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <LogIn className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">ยังไม่ได้เข้าสู่ระบบ</h3>
                  <p className="text-xs text-slate-500">เข้าสู่ระบบด้วยบัญชี Google / Gmail เพื่อจัดการคลังภาพ</p>
                  <button
                    onClick={onOpenGmailAuth}
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md"
                  >
                    เข้าสู่ระบบด้วย Gmail
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Floating Action Button (+ สร้างอัลบั้ม) on Mobile */}
          <button
            onClick={onOpenCreateAlbum}
            className="absolute right-4 bottom-20 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform z-30"
            title="สร้างอัลบั้มใหม่"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Bottom Navigation Bar (Image 24) */}
          <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 flex items-center justify-around z-40 rounded-b-[36px]">
            <button
              onClick={() => setMobileTab('home')}
              className={`flex flex-col items-center gap-1 ${mobileTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px] font-medium">หน้าหลัก</span>
            </button>

            <button
              onClick={() => setMobileTab('albums')}
              className={`flex flex-col items-center gap-1 ${mobileTab === 'albums' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <FolderKanban className="w-4 h-4" />
              <span className="text-[10px] font-medium">อัลบั้ม</span>
            </button>

            <button
              onClick={() => setMobileTab('upload')}
              className={`flex flex-col items-center gap-1 ${mobileTab === 'upload' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <UploadCloud className="w-4 h-4" />
              <span className="text-[10px] font-medium">อัปโหลด</span>
            </button>

            <button
              onClick={() => setMobileTab('gallery')}
              className={`flex flex-col items-center gap-1 ${mobileTab === 'gallery' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-medium">แกลเลอรี</span>
            </button>

            <button
              onClick={() => setMobileTab('profile')}
              className={`flex flex-col items-center gap-1 ${mobileTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <User className="w-4 h-4" />
              <span className="text-[10px] font-medium">โปรไฟล์</span>
            </button>
          </nav>
        </div>

        {/* Bottom Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-50 pointer-events-none" />
      </div>
    </div>
  );
};
