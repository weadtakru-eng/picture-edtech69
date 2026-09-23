import React from 'react';
import { 
  X, 
  Download, 
  Heart, 
  Camera, 
  Calendar, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Layers 
} from 'lucide-react';
import { Photo } from '../types';
import { getDownloadUrl, getFallbackPhotoUrl } from '../services/googleDriveService';

interface PhotoLightboxModalProps {
  photo: Photo | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  allowDownload?: boolean;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photo,
  onClose,
  onPrev,
  onNext,
  allowDownload = true
}) => {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        title="ปิดหน้าต่าง"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Nav Arrows */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="ภาพก่อนหน้า"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="ภาพถัดไป"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Container */}
      <div className="relative max-w-5xl w-full max-h-[92vh] flex flex-col md:flex-row bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
        {/* Photo Canvas */}
        <div className="flex-1 bg-black/80 flex items-center justify-center p-4 min-h-[360px] md:min-h-[540px]">
          <img
            src={photo.url}
            alt={photo.title}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg select-none"
            referrerPolicy="no-referrer"
            draggable={false}
            onError={(e) => {
              const target = e.currentTarget;
              if (photo.driveFileId && !target.dataset.fallbackTried) {
                target.dataset.fallbackTried = 'true';
                target.src = getFallbackPhotoUrl(photo.driveFileId, false);
              }
            }}
            onContextMenu={(e) => {
              if (allowDownload === false) e.preventDefault();
            }}
          />
        </div>

        {/* Details Sidebar */}
        <div className="w-full md:w-80 bg-slate-900 text-white p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 space-y-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                  4K RAW
                </span>
                <span className="text-xs text-slate-400">{photo.categoryTag}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1.5 break-all">{photo.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{photo.fileSize} • {photo.dimensions}</p>
            </div>

            {/* EXIF Data */}
            {photo.cameraInfo && (
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                  <Camera className="w-4 h-4" />
                  <span>ข้อมูล EXIF จากกล้อง</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <p>กล้อง: <strong>{photo.cameraInfo.model}</strong></p>
                  <p>เลนส์: <strong>{photo.cameraInfo.lens}</strong></p>
                  <div className="flex gap-3 text-slate-400 pt-1">
                    <span>ISO {photo.cameraInfo.iso}</span>
                    <span>{photo.cameraInfo.aperture}</span>
                    <span>{photo.cameraInfo.shutter}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional info */}
            <div className="text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>บันทึกเมื่อ: {photo.uploadedAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>ยอดเข้าชม: {photo.views} ครั้ง • ดาวน์โหลด: {photo.downloads} ครั้ง</span>
              </div>
              <p className="text-[11px] text-slate-400">ช่างภาพ: <strong>{photo.photographer}</strong></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            {allowDownload ? (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = getDownloadUrl(photo.driveFileId || '', photo.webContentLink) || photo.url;
                  link.download = photo.filename;
                  link.target = '_blank';
                  link.click();
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดภาพความละเอียดสูง</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-800/80 rounded-xl text-center border border-slate-700/60">
                <span className="text-xs text-amber-300 font-semibold block">
                  🔒 ไม่อนุญาตให้ดาวน์โหลด
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  อัลบั้มนี้เปิดให้เข้าชมอย่างเดียว (View Only)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
