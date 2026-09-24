import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  QrCode, 
  Calendar, 
  MapPin, 
  Camera, 
  Users, 
  Image as ImageIcon, 
  Heart, 
  Maximize2, 
  Check, 
  Sparkles,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
  FolderOpen,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Album, Photo, AppView } from '../types';
import { getDownloadUrl } from '../services/googleDriveService';
import { syncPhotosFromDriveFolder } from '../services/firebaseService';

interface AlbumDetailViewProps {
  album: Album;
  photos: Photo[];
  onBack: () => void;
  setCurrentView: (view: AppView) => void;
  onOpenPhotoLightbox: (photo: Photo) => void;
  selectedPhotoIds: string[];
  togglePhotoSelection: (id: string) => void;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
  album,
  photos,
  onBack,
  setCurrentView,
  onOpenPhotoLightbox,
  selectedPhotoIds,
  togglePhotoSelection
}) => {
  const [activeSubcategory, setActiveSubcategory] = useState<string>('ทั้งหมด');
  const [photoSearch, setPhotoSearch] = useState<string>('');
  const [isFavoriteFilter, setIsFavoriteFilter] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'views'>('newest');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleOpenDriveFolder = () => {
    setSyncError(null);
    if (!album.driveFolderId || album.driveFolderId.trim() === '' || album.driveFolderId.startsWith('drive-folder-')) {
      setSyncError('ยังไม่มีโฟลเดอร์ Google Drive สำหรับอัลบั้มนี้');
      return;
    }
    const driveFolderUrl = `https://drive.google.com/drive/folders/${album.driveFolderId}`;
    window.open(driveFolderUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSyncFromDrive = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    setSyncError(null);

    if (!album.driveFolderId || album.driveFolderId.trim() === '' || album.driveFolderId.startsWith('drive-folder-')) {
      setIsSyncing(false);
      setSyncError('ยังไม่มีโฟลเดอร์ Google Drive สำหรับอัลบั้มนี้');
      return;
    }

    try {
      const res = await syncPhotosFromDriveFolder(album);
      setIsSyncing(false);
      if (res.addedCount > 0) {
        setSyncMessage(`ซิงค์รูปภาพสำเร็จ! เพิ่ม ${res.addedCount} รูปภาพใหม่ (รวมทั้งหมด ${res.totalCount} รูป)`);
      } else {
        setSyncMessage(`ข้อมูลเป็นปัจจุบันแล้ว: ตรวจสอบพบ ${res.totalCount} รูปภาพใน Google Drive ครบถ้วน`);
      }
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setIsSyncing(false);
      setSyncError(err.message || 'เกิดข้อผิดพลาดในการซิงค์รูปภาพจาก Google Drive');
      setTimeout(() => setSyncError(null), 5000);
    }
  };

  const subcategories = [
    { name: 'ทั้งหมด', count: 428 },
    { name: 'พิธีเปิด & เวทีใหญ่', count: 86 },
    { name: 'การนำเสนอโครงงาน SMT', count: 142 },
    { name: 'นิทรรศการ SLT', count: 120 },
    { name: 'มอบเกียรติบัตร & ภาพรวม', count: 80 },
  ];

  // Filter photos for this album
  const albumPhotos = useMemo(() => {
    return photos.filter((p) => p.albumId === album.id);
  }, [photos, album.id]);

  const filteredPhotos = useMemo(() => {
    return albumPhotos.filter((p) => {
      const matchCat = activeSubcategory === 'ทั้งหมด' || p.categoryTag === activeSubcategory;
      const matchSearch = photoSearch === '' || 
        p.title.toLowerCase().includes(photoSearch.toLowerCase()) ||
        (p.categoryTag && p.categoryTag.toLowerCase().includes(photoSearch.toLowerCase()));
      const matchFav = !isFavoriteFilter || p.isFavorite;
      return matchCat && matchSearch && matchFav;
    }).sort((a, b) => {
      if (sortOrder === 'views') return b.views - a.views;
      return 0;
    });
  }, [albumPhotos, activeSubcategory, photoSearch, isFavoriteFilter, sortOrder]);

  const handleDownloadZip = () => {
    setDownloadSuccess('กำลังเตรียมไฟล์ ZIP ขนาด 2.45 GB ความละเอียดสูง 4K RAW...');
    setTimeout(() => {
      setDownloadSuccess('เริ่มการดาวน์โหลดชุดภาพความละเอียดสูงแล้ว!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1 font-medium text-slate-600 hover:text-blue-600 transition-colors bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลัก</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-blue-600">SMT & SLT SPECIAL PROGRAM</span>
          <span>/</span>
          <span className="text-slate-400">สาธารณะ (Public Vault)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('share-qr')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-2xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>สแกน QR Code</span>
          </button>
          <button
            onClick={() => setCurrentView('share-qr')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-xl border border-blue-200 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>แชร์อัลบั้มนี้</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card (Image 4 & 12) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              SMT & SLT 2569
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              เผยแพร่สาธารณะ (Public Vault)
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              ความละเอียดสูง 4K RAW
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {album.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {album.description}
          </p>

          {/* Metadata Grid */}
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

          {/* Action Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-bold text-slate-800">{album.photoCount} รูปภาพ</span>
              <span>•</span>
              <span>ยอดเข้าชม {album.views.toLocaleString()} ครั้ง</span>
              <span>•</span>
              <span>ขนาดไฟล์รวม {album.fileSizeTotal}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenDriveFolder}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all active:scale-98"
                title="เปิดโฟลเดอร์ Google Drive ของอัลบั้มนี้ในแท็บใหม่"
              >
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span>เปิด Google Drive</span>
              </button>

              <button
                onClick={handleSyncFromDrive}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 disabled:opacity-50 text-xs sm:text-sm font-semibold rounded-xl transition-all active:scale-98"
                title="ซิงค์รูปภาพที่อัปโหลดไว้ใน Google Drive เข้าสู่แกลเลอรี"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์รูปภาพ'}</span>
              </button>

              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-98 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดทั้งอัลบั้ม (ZIP 2.45 GB)</span>
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4" />
              <span>{syncMessage}</span>
            </div>
          )}

          {syncError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4" />
              <span>{syncError}</span>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4" />
              <span>{downloadSuccess}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subcategory Filter Tabs (Image 4 & 12) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {subcategories.map((sub) => (
              <button
                key={sub.name}
                onClick={() => setActiveSubcategory(sub.name)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  activeSubcategory === sub.name
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{sub.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeSubcategory === sub.name ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {sub.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Search & Sort */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาในอัลบั้ม..."
                value={photoSearch}
                onChange={(e) => setPhotoSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-52"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="newest">ตามลำดับเวลาบันทึก (ใหม่ก่อน)</option>
              <option value="views">ยอดเข้าชมสูงสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photos Grid Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => {
          const isSelected = selectedPhotoIds.includes(photo.id);

          return (
            <div
              key={photo.id}
              className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md ${
                isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Photo Frame */}
              <div 
                onClick={() => onOpenPhotoLightbox(photo)}
                className="relative aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                
                {/* 4K Badge */}
                {photo.is4K && (
                  <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-xs tracking-wider shadow-2xs">
                    4K RAW
                  </span>
                )}

                {/* Selection Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(photo.id);
                  }}
                  className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100'
                  }`}
                  title="เลือกรูปภาพ"
                >
                  <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-70'}`} />
                </button>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
                  <span className="text-[11px] text-white font-medium truncate pointer-events-auto">
                    {photo.dimensions}
                  </span>
                  <div className="flex items-center gap-1 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPhotoLightbox(photo);
                      }}
                      className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-xs transition-colors"
                      title="ขยายดูภาพขนาดเต็ม"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo Metadata Footer */}
              <div className="p-3 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{photo.title}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{photo.fileSize}</span>
                    <span>•</span>
                    <span className="truncate">{photo.categoryTag}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = getDownloadUrl(photo.driveFileId || '', photo.webContentLink) || photo.url;
                      link.download = photo.filename;
                      link.target = '_blank';
                      link.click();
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="ดาวน์โหลดภาพนี้ (Google Drive)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer matching screenshot */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-500">
          แสดง <strong className="text-slate-800">{filteredPhotos.length}</strong> จากทั้งหมด <strong className="text-slate-800">{album.photoCount}</strong> รูปภาพในอัลบั้ม
        </span>

        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center">
            1
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center">
            2
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center">
            3
          </button>
          <span className="px-1 text-slate-400">...</span>
          <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center">
            18
          </button>
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          สงวนลิขสิทธิ์ภาพเพื่อการศึกษาและการประชาสัมพันธ์
        </span>
      </div>
    </div>
  );
};
