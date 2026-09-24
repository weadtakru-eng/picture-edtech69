import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  PlusCircle, 
  Image as ImageIcon, 
  Share2, 
  UploadCloud, 
  BarChart3, 
  Lock, 
  LogOut, 
  HardDrive,
  Camera,
  Layers,
  LogIn
} from 'lucide-react';
import { AppView, GmailUser } from '../types';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  onOpenCreateAlbum: () => void;
  currentUser: GmailUser | null;
  onOpenGmailAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onOpenCreateAlbum,
  currentUser,
  onOpenGmailAuth
}) => {
  const navItems = [
    { id: 'dashboard' as AppView, label: 'แดชบอร์ด', icon: LayoutDashboard, badge: undefined },
    { id: 'albums' as AppView, label: 'อัลบั้มทั้งหมด', icon: FolderKanban, badge: '48' },
    { id: 'album-detail' as AppView, label: 'แกลเลอรีสาธารณะ', icon: Layers, badge: 'แนะนำ' },
    { id: 'bulk-upload' as AppView, label: 'อัปโหลดรูปจำนวนมาก', icon: UploadCloud, badge: 'ด่วน' },
    { id: 'all-photos' as AppView, label: 'รูปภาพทั้งหมด', icon: ImageIcon, badge: '14.8k' },
    { id: 'share-qr' as AppView, label: 'แชร์และสร้าง QR Code', icon: Share2, badge: undefined },
    { id: 'reports' as AppView, label: 'รายงานและสถิติ', icon: BarChart3, badge: undefined },
    { id: 'login-states' as AppView, label: 'จำกัดสิทธิ์ / ล็อกอิน', icon: Lock, badge: 'PDPA' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-white tracking-tight">อัลบั้มโสต</span>
            <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-400/20">
              VAULT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 tracking-wider uppercase font-medium">
            School Media Vault
          </p>
        </div>
      </div>

      {/* Quick Action: New Album */}
      <div className="p-4 pb-2">
        <button
          onClick={onOpenCreateAlbum}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ สร้างอัลบั้มใหม่</span>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          เมนูหลัก
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage Quota Card */}
      <div className="p-4 mx-3 mb-3 bg-slate-800/60 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1.5 text-slate-400 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            คลังข้อมูลโสตฯ
          </span>
          <span className="text-white font-semibold">21%</span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1.5">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[21%] rounded-full" />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>ใช้ 42.6 GB</span>
          <span>เต็ม 200 GB</span>
        </div>
      </div>

      {/* User Profile Card / Gmail Sign-In */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/90">
        {currentUser ? (
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={onOpenGmailAuth}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <UserAvatar
                src={currentUser.avatarUrl || currentUser.photoURL}
                name={currentUser.name}
                email={currentUser.email}
                className="w-9 h-9 rounded-xl ring-1 ring-slate-700"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-blue-400 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button 
              onClick={onOpenGmailAuth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title="สลับบัญชี Google / ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenGmailAuth}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-600/30"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบด้วย Gmail</span>
          </button>
        )}
      </div>
    </aside>
  );
};
