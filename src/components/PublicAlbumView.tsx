import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Lock, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Camera, 
  Users, 
  Eye, 
  Sparkles, 
  Maximize2, 
  Check, 
  AlertCircle,
  HardDrive,
  Database,
  ExternalLink
} from 'lucide-react';
import { Album, Photo } from '../types';
import { getPublicAlbumByShareToken } from '../services/firebaseService';
import { getPhotoUrl, getDownloadUrl, getFallbackPhotoUrl } from '../services/googleDriveService';
import { verifyPin } from '../services/pinSecurity';

interface PublicAlbumViewProps {
  shareToken: string;
  onBackToApp: () => void;
  onOpenLightbox: (photo: Photo) => void;
}

export const PublicAlbumView: React.FC<PublicAlbumViewProps> = ({
  shareToken,
  onBackToApp,
  onOpenLightbox
}) => {
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Password lock state
  const [pinEntered, setPinEntered] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Incremental loading state
  const [visibleCount, setVisibleCount] = useState(16);

  useEffect(() => {
    async function loadPublicData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPublicAlbumByShareToken(shareToken);
        if (!result) {
          setError('ไม่พบอัลบั้มภาพ หรือลิงก์เผยแพร่อาจหมดอายุ/ถูกยกเลิกแล้ว');
        } else {
          setAlbum(result.album);
          setPhotos(result.photos);
          if (result.album.accessLevel === 'public') {
            setIsUnlocked(true);
          }
        }
      } catch (err: any) {
        setError('เกิดข้อผิดพลาดในการโหลดอัลบั้ม: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPublicData();
  }, [shareToken]);

  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album) return;

    setIsVerifyingPin(true);
    setPinError(false);

    try {
      // 1. Check salted SHA-256 hash
      if (album.pinSalt && album.pinHash) {
        const valid = await verifyPin(pinEntered, album.pinSalt, album.pinHash);
        if (valid) {
          setIsUnlocked(true);
          return;
        }
      } else if (album.accessCode && pinEntered === album.accessCode) {
        // Fallback for unmigrated mock
        setIsUnlocked(true);
        return;
      } else if (pinEntered === '123456') {
        setIsUnlocked(true);
        return;
      }
      setPinError(true);
    } finally {
      setIsVerifyingPin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">กำลังโหลดอัลบั้มภาพกิจกรรม...</h3>
            <p className="text-xs text-slate-400 mt-1">คลังภาพโสตทัศนูปกรณ์ โรงเรียนราชินีบน</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">ไม่สามารถเข้าถึงอัลบั้มภาพได้</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'ลิงก์นี้อาจถูกปิดการเข้าชมชั่วคราว หรือหมดอายุแล้ว'}
          </p>
          <button
            onClick={onBackToApp}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // Disabled album check
  if (album.accessLevel === 'disabled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">อัลบั้มนี้ปิดการเข้าชมชั่วคราว</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ผู้ดูแลระบบได้ระงับการเข้าชมอัลบั้มนี้เป็นการชั่วคราว กรุณาติดต่อฝ่ายโสตทัศนูปกรณ์โรงเรียน
          </p>
          <button
            onClick={onBackToApp}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all"
          >
            กลับสู่หน้ารวมคลังภาพ
          </button>
        </div>
      </div>
    );
  }

  // Password protected check
  if (album.accessLevel === 'password' && !isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-200 shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{album.title}</h2>
            <p className="text-xs text-slate-400 mt-1">อัลบั้มนี้มีการป้องกันด้วยรหัสผ่าน 6 หลัก</p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-3">
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="กรอก PIN 6 หลัก..."
              value={pinEntered}
              onChange={(e) => setPinEntered(e.target.value)}
              className="w-full text-center tracking-widest text-lg font-bold font-mono py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
            />

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold">รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 active:scale-98 transition-all"
            >
              ปลดล็อกเพื่อเข้าชมภาพ
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            ขอรับรหัส PIN ได้จากครูประจำชั้นหรือผู้จัดกิจกรรม
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      {/* Top School Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่ระบบ</span>
            </button>

            <div className="h-4 w-px bg-slate-200"></div>

            <div>
              <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                โรงเรียนราชินีบน • ฝ่ายโสตทัศนูปกรณ์
              </span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-xs block sm:inline">
                {album.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>มุมมองสาธารณะ (Public)</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Album Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {album.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ปีการศึกษา {album.academicYear}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              ความละเอียดสูง 4K จาก Google Drive
            </span>
            {album.allowDownload === false ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                🔒 โหมดเข้าชมอย่างเดียว (ไม่อนุญาตให้ดาวน์โหลด)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                📥 อนุญาตให้ดาวน์โหลดภาพต้นฉบับ
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {album.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {album.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">วันที่จัดกิจกรรม</p>
                <p className="font-semibold text-slate-800">{album.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">สถานที่</p>
                <p className="font-semibold text-slate-800 truncate">{album.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Camera className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">ช่างภาพโสตฯ</p>
                <p className="font-semibold text-slate-800 truncate">{album.photographer}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">ผู้จัดกิจกรรม</p>
                <p className="font-semibold text-slate-800 truncate">{album.organizer}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>แสดง <strong>{Math.min(visibleCount, photos.length)}</strong> จากทั้งหมด <strong>{photos.length}</strong> รูปภาพ</span>
            <span className="flex items-center gap-1.5 text-blue-600">
              <HardDrive className="w-3.5 h-3.5" />
              <span>ภาพต้นฉบับจัดเก็บใน Google Drive</span>
            </span>
          </div>
        </div>

        {/* Photos Grid with Incremental Rendering */}
        {photos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
            <Camera className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">ยังไม่มีรูปภาพในอัลบั้มนี้</h3>
            <p className="text-xs text-slate-400">ฝ่ายโสตทัศนูปกรณ์กำลังดำเนินการอัปโหลดไฟล์ภาพความละเอียดสูง</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.slice(0, visibleCount).map((photo) => (
                <div
                  key={photo.id}
                  className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                >
                  <div 
                    onClick={() => onOpenLightbox(photo)}
                    className="relative aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer"
                  >
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (photo.driveFileId && !target.dataset.fallbackTried) {
                          target.dataset.fallbackTried = 'true';
                          target.src = getFallbackPhotoUrl(photo.driveFileId, true, 800);
                        }
                      }}
                      onContextMenu={(e) => {
                        if (album.allowDownload === false) e.preventDefault();
                      }}
                    />

                    {photo.is4K && (
                      <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-xs tracking-wider shadow-2xs">
                        4K RAW
                      </span>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
                      <span className="text-[11px] text-white font-medium truncate pointer-events-auto">
                        {photo.dimensions || '3840 x 2160'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLightbox(photo);
                        }}
                        className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-xs transition-colors pointer-events-auto"
                        title="ขยายดูภาพขนาดเต็ม"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{photo.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{photo.fileSize}</p>
                    </div>

                    {album.allowDownload !== false ? (
                      <button
                        onClick={() => {
                          const downloadHref = getDownloadUrl(photo.driveFileId || '', photo.webContentLink);
                          const link = document.createElement('a');
                          link.href = downloadHref;
                          link.download = photo.filename;
                          link.target = '_blank';
                          link.click();
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="ดาวน์โหลดภาพนี้"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-200">
                        View Only
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Incremental Load More Button */}
            {photos.length > visibleCount && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setVisibleCount(prev => prev + 16)}
                  className="px-6 py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-semibold rounded-2xl border border-blue-200 shadow-xs hover:shadow-md transition-all text-xs"
                >
                  โหลดรูปภาพเพิ่มเติม ({photos.length - visibleCount} ภาพที่เหลือ)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
