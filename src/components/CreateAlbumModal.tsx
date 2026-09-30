import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderPlus, 
  Globe, 
  Lock, 
  Image as ImageIcon, 
  Calendar, 
  Sparkles,
  HardDrive,
  Loader2,
  AlertCircle,
  Link2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Album } from '../types';
import { 
  THAI_MONTHS, 
  DEFAULT_ACADEMIC_YEARS, 
  getMonthNumberFromName, 
  isValidGoogleDriveUrl, 
  normalizeGoogleDriveUrl 
} from '../utils/academicYearUtils';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlbum: (newAlbum: Album) => void | Promise<void>;
  albumToEdit?: Album | null;
}

const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80';

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  onCreateAlbum,
  albumToEdit
}) => {
  const [title, setTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('2569');
  const [month, setMonth] = useState('สิงหาคม');
  const [eventDate, setEventDate] = useState('15 สิงหาคม 2569');
  const [driveUrl, setDriveUrl] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState(DEFAULT_COVER_URL);
  const [isPublished, setIsPublished] = useState(true);
  const [category, setCategory] = useState<string>('กิจกรรมโรงเรียน');
  const [location, setLocation] = useState('หอประชุมใหญ่เฉลิมพระเกียรติฯ');
  const [organizer, setOrganizer] = useState('ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์');
  const [photographer, setPhotographer] = useState('ฝ่ายโสตทัศนูปกรณ์');
  
  const [driveUrlError, setDriveUrlError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (albumToEdit) {
      setTitle(albumToEdit.title || '');
      setAcademicYear(albumToEdit.academicYear || '2569');
      setMonth(albumToEdit.month || 'สิงหาคม');
      setEventDate(albumToEdit.eventDate || albumToEdit.date || '');
      setDriveUrl(albumToEdit.driveUrl || '');
      setDescription(albumToEdit.description || '');
      setCoverUrl(albumToEdit.coverUrl || DEFAULT_COVER_URL);
      setIsPublished(albumToEdit.isPublished !== false);
      setCategory(albumToEdit.category || 'กิจกรรมโรงเรียน');
      setLocation(albumToEdit.location || 'หอประชุมใหญ่เฉลิมพระเกียรติฯ');
      setOrganizer(albumToEdit.organizer || 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์');
      setPhotographer(albumToEdit.photographer || 'ฝ่ายโสตทัศนูปกรณ์');
    } else {
      setTitle('');
      setAcademicYear('2569');
      setMonth('สิงหาคม');
      setEventDate('15 สิงหาคม 2569');
      setDriveUrl('');
      setDescription('');
      setCoverUrl(DEFAULT_COVER_URL);
      setIsPublished(true);
      setCategory('กิจกรรมโรงเรียน');
      setLocation('หอประชุมใหญ่เฉลิมพระเกียรติฯ');
      setOrganizer('ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์');
      setPhotographer('ฝ่ายโสตทัศนูปกรณ์');
    }
    setDriveUrlError(null);
  }, [albumToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveUrlError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Validate Google Drive URL
    const trimmedDriveUrl = driveUrl.trim();
    if (!trimmedDriveUrl) {
      setDriveUrlError('กรุณาใส่ลิงก์ Google Drive ที่ถูกต้อง');
      return;
    }

    if (!isValidGoogleDriveUrl(trimmedDriveUrl)) {
      setDriveUrlError('กรุณาใส่ลิงก์ Google Drive ที่ถูกต้อง (เช่น drive.google.com/drive/folders/...)');
      return;
    }

    const safeDriveUrl = normalizeGoogleDriveUrl(trimmedDriveUrl);
    const monthNum = getMonthNumberFromName(month);

    setIsSubmitting(true);
    setStatusText('กำลังบันทึกข้อมูลอัลบั้ม...');

    const albumId = albumToEdit?.id || `album-${Date.now()}`;
    const shareToken = albumToEdit?.shareToken || 'share_' + Math.random().toString(36).substring(2, 10);

    const targetAlbum: Album = {
      ...albumToEdit,
      id: albumId,
      title: trimmedTitle,
      description: description.trim() || 'ประมวลภาพกิจกรรมโรงเรียนราชินีบน จัดเก็บใน Google Drive',
      academicYear: academicYear.trim(),
      month: month,
      monthNumber: monthNum,
      eventDate: eventDate.trim() || `${month} ${academicYear}`,
      driveUrl: safeDriveUrl,
      coverUrl: coverUrl.trim() || DEFAULT_COVER_URL,
      isPublished: isPublished,
      category: category,
      date: eventDate.trim() || `${month} ${academicYear}`,
      photoCount: albumToEdit?.photoCount || 0,
      views: albumToEdit?.views || 1,
      downloads: albumToEdit?.downloads || 0,
      fileSizeTotal: albumToEdit?.fileSizeTotal || 'Google Drive',
      accessLevel: albumToEdit?.accessLevel || 'public',
      isShared: true,
      shareUrl: `${window.location.origin}/#public-album/${shareToken}`,
      shareToken: shareToken,
      location: location,
      organizer: organizer,
      photographer: photographer,
      tags: [category, `ปี ${academicYear}`, month, 'Google Drive'],
      driveFolderId: albumToEdit?.driveFolderId || '',
      updatedAt: new Date().toISOString(),
      createdAt: albumToEdit?.createdAt || new Date().toISOString()
    };

    try {
      await onCreateAlbum(targetAlbum);
      onClose();
    } catch (err: any) {
      console.error('Error saving album:', err);
      setDriveUrlError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกอัลบั้ม');
    } finally {
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {albumToEdit ? 'แก้ไขอัลบั้ม Google Drive' : 'เพิ่มอัลบั้ม Google Drive ใหม่'}
              </h3>
              <p className="text-xs text-slate-400">ระบบจัดหมวดหมู่และแสดงลิงก์อัลบั้มภาพโรงเรียน</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drive Permission Info Badge */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <HardDrive className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">คำแนะนำการตั้งค่าสิทธิ์ Google Drive</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              กรุณาตั้งค่า Share ของ Google Drive ให้ผู้ที่มีลิงก์สามารถดูไฟล์ได้ตามต้องการ (หาก Drive ตั้งเป็น Private ผู้ชมที่ไม่มีสิทธิ์จะไม่สามารถดูได้)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">ชื่ออัลบั้มกิจกรรม *</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="เช่น SMT-SLT กุลสตรีงามสง่า คู่คุณค่าความยั่งยืน 2569"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
            />
          </div>

          {/* Academic Year & Month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">ปีการศึกษา *</label>
              <select
                disabled={isSubmitting}
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-medium"
              >
                {DEFAULT_ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    ปีการศึกษา {yr} {yr === '2569' ? '(ปัจจุบัน)' : ''}
                  </option>
                ))}
                <option value="2567">ปีการศึกษา 2567</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">เดือนที่จัดกิจกรรม *</label>
              <select
                disabled={isSubmitting}
                value={month}
                onChange={(e) => {
                  const newMonth = e.target.value;
                  setMonth(newMonth);
                  // Update eventDate preview if default pattern
                  setEventDate(`${newMonth} ${academicYear}`);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-medium"
              >
                {THAI_MONTHS.map((m) => (
                  <option key={m.number} value={m.name}>
                    {m.number}. {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Google Drive Link */}
          <div>
            <label className="font-semibold text-slate-700 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>ลิงก์ Google Drive (Folder / File / Docs) *</span>
              </span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveUrl}
              onChange={(e) => {
                setDriveUrl(e.target.value);
                if (driveUrlError) setDriveUrlError(null);
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none font-mono text-xs text-slate-800 ${
                driveUrlError ? 'border-rose-400 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            {driveUrlError ? (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{driveUrlError}</span>
              </p>
            ) : (
              <p className="text-slate-400 text-[10px] mt-1">
                รองรับลิงก์โฟลเดอร์ Google Drive, Google Docs หรือไฟล์ Google Drive ที่เปิดแชร์ไว้
              </p>
            )}
          </div>

          {/* Event Date & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">วันที่จัดกิจกรรม</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="เช่น 15 สิงหาคม 2569"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่กิจกรรม</label>
              <select
                disabled={isSubmitting}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-medium"
              >
                <option value="กิจกรรมโรงเรียน">กิจกรรมโรงเรียน</option>
                <option value="กิจกรรมนักเรียน">กิจกรรมนักเรียน</option>
                <option value="กีฬา">กีฬา</option>
                <option value="งานพิธีการ">งานพิธีการ</option>
                <option value="ห้องเรียนพิเศษ">ห้องเรียนพิเศษ (SMT/SLT)</option>
              </select>
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              URL รูปภาพหน้าปกอัลบั้ม (Optional)
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... หรือเว้นว่างเพื่อใช้ภาพหน้าปกเริ่มต้น"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
            />
            {coverUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={coverUrl}
                  alt="Cover Preview"
                  className="w-12 h-8 rounded-lg object-cover border border-slate-200"
                  onError={() => setCoverUrl(DEFAULT_COVER_URL)}
                />
                <span className="text-[10px] text-slate-400">ตัวอย่างรูปหน้าปก</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">คำอธิบายภาพกิจกรรม</label>
            <textarea
              rows={2}
              disabled={isSubmitting}
              placeholder="รายละเอียดสั้นๆ สำหรับผู้เข้าชม..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
            />
          </div>

          {/* Publish / Privacy Status */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPublished ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                  <EyeOff className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">
                  {isPublished ? 'เผยแพร่สู่สาธารณะ (Published)' : 'ซ่อนชั่วคราว (Draft / Hidden)'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isPublished ? 'นักเรียน ผู้ปกครอง และบุคคลทั่วไปสามารถมองเห็นได้' : 'เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้นที่มองเห็น'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {isSubmitting && statusText && (
            <div className="p-3 bg-blue-50 rounded-xl text-blue-700 flex items-center gap-2 text-xs font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>{statusText}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>{albumToEdit ? 'บันทึกการแก้ไข' : 'บันทึกอัลบั้ม Google Drive'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
