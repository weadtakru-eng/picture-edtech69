import React, { useState } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen, 
  Database, 
  HardDrive, 
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  Link2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Search,
  Eye,
  Info
} from 'lucide-react';
import { Album, AppView, GmailUser } from '../types';
import { saveAlbumToFirestore, logActivity } from '../services/firebaseService';
import { 
  isValidGoogleDriveUrl, 
  normalizeGoogleDriveUrl, 
  openGoogleDrive,
  THAI_MONTHS,
  DEFAULT_ACADEMIC_YEARS,
  getMonthNumberFromName
} from '../utils/academicYearUtils';

interface BulkUploaderViewProps {
  album: Album;
  albums: Album[];
  queue?: any[];
  setQueue?: any;
  setCurrentView: (view: AppView) => void;
  onPhotosUploaded?: (count: number) => void;
  currentUser?: GmailUser | null;
  onOpenGmailAuth?: () => void;
}

export const BulkUploaderView: React.FC<BulkUploaderViewProps> = ({
  album,
  albums,
  setCurrentView,
  currentUser,
  onOpenGmailAuth
}) => {
  const [selectedAlbumId, setSelectedAlbumId] = useState(album.id);
  const [inputDriveUrl, setInputDriveUrl] = useState(album.driveUrl || '');
  const [inputCoverUrl, setInputCoverUrl] = useState(album.coverUrl || '');
  const [inputAcademicYear, setInputAcademicYear] = useState(album.academicYear || '2569');
  const [inputMonth, setInputMonth] = useState(album.month || 'สิงหาคม');
  const [inputTitle, setInputTitle] = useState(album.title || '');
  
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedAlbumId, setCopiedAlbumId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const currentSelectedAlbum = albums.find(a => a.id === selectedAlbumId) || album;

  const handleSelectAlbum = (alb: Album) => {
    setSelectedAlbumId(alb.id);
    setInputDriveUrl(alb.driveUrl || '');
    setInputCoverUrl(alb.coverUrl || '');
    setInputAcademicYear(alb.academicYear || '2569');
    setInputMonth(alb.month || 'สิงหาคม');
    setInputTitle(alb.title || '');
    setUrlError(null);
    setSaveSuccessMessage(null);
  };

  const handleSaveDriveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    setSaveSuccessMessage(null);

    const trimmedUrl = inputDriveUrl.trim();
    if (!trimmedUrl) {
      setUrlError('กรุณาใส่ลิงก์ Google Drive ที่ถูกต้อง');
      return;
    }

    if (!isValidGoogleDriveUrl(trimmedUrl)) {
      setUrlError('กรุณาใส่ลิงก์ Google Drive ที่ถูกต้อง (เช่น drive.google.com/drive/folders/...)');
      return;
    }

    const safeUrl = normalizeGoogleDriveUrl(trimmedUrl);
    const monthNum = getMonthNumberFromName(inputMonth);

    setIsSaving(true);
    try {
      const updatedAlbum: Album = {
        ...currentSelectedAlbum,
        title: inputTitle.trim() || currentSelectedAlbum.title,
        driveUrl: safeUrl,
        coverUrl: inputCoverUrl.trim() || currentSelectedAlbum.coverUrl,
        academicYear: inputAcademicYear.trim() || currentSelectedAlbum.academicYear,
        month: inputMonth,
        monthNumber: monthNum,
        updatedAt: new Date().toISOString()
      };

      await saveAlbumToFirestore(updatedAlbum);

      await logActivity({
        id: 'act-' + Date.now(),
        type: 'upload',
        title: `อัปเดตลิงก์ Google Drive สำหรับ ${updatedAlbum.title}`,
        albumTitle: updatedAlbum.title,
        albumId: updatedAlbum.id,
        user: currentUser?.name || 'ฝ่ายโสตทัศนูปกรณ์',
        timeAgo: 'เมื่อสักครู่',
        timestamp: new Date().toISOString()
      });

      setSaveSuccessMessage('บันทึกและอัปเดตลิงก์ Google Drive สำเร็จเรียบร้อยแล้ว!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      setUrlError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกลิงก์ Google Drive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAlbumId(id);
      setTimeout(() => setCopiedAlbumId(null), 2500);
    });
  };

  const filteredAlbumList = albums.filter((a) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.academicYear && a.academicYear.includes(q)) ||
      (a.month && a.month.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-1 font-medium text-slate-600 hover:text-blue-600 transition-colors bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลัก</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-700">เพิ่มลิงก์ Google Drive</span>
          <span>/</span>
          <span className="text-blue-600 font-medium">{currentSelectedAlbum.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {currentSelectedAlbum.driveUrl && (
            <button
              onClick={() => openGoogleDrive(currentSelectedAlbum.driveUrl, currentSelectedAlbum.driveFolderId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-xl border border-blue-200 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>เปิด Google Drive ของอัลบั้มนี้</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <HardDrive className="w-3.5 h-3.5 text-blue-300" />
            <span>ระบบจัดเก็บและเชื่อมโยงลิงก์ Google Drive • School Media Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            เพิ่ม / จัดการลิงก์ Google Drive
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            เว็บไซต์นี้ไม่เก็บไฟล์รูปภาพเอง โดยไฟล์ภาพต้นฉบับความละเอียดสูงจัดเก็บอยู่ใน Google Drive 
            เจ้าหน้าที่สามารถนำลิงก์โฟลเดอร์ Google Drive มาบันทึกเพื่อแสดงผลและจัดหมวดหมู่ตามปีการศึกษาและเดือนได้ทันที
          </p>
        </div>
      </div>

      {/* 3 Steps Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h4 className="font-bold text-slate-800 text-xs">อัปโหลดลง Google Drive</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            สร้างโฟลเดอร์ใน Google Drive ของโรงเรียน และอัปโหลดไฟล์รูปภาพกิจกรรมความละเอียดสูง 4K RAW
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h4 className="font-bold text-slate-800 text-xs">ตั้งค่าแชร์ลิงก์</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            คลิกแชร์โฟลเดอร์ใน Google Drive และเลือก <strong>"ทุกคนที่มีลิงก์มีสิทธิ์ดู"</strong>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h4 className="font-bold text-slate-800 text-xs">วางลิงก์และบันทึก</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            คัดลอกลิงก์มาวางในช่องด้านล่าง แล้วกดบันทึกเพื่อให้ผู้ปกครองและนักเรียนเข้าชมได้ทันที
          </p>
        </div>
      </div>

      {/* Main Grid: Form + Album Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">บันทึกลิงก์ Google Drive</h3>
              <p className="text-xs text-slate-400">อัลบั้ม: <strong className="text-slate-800">{currentSelectedAlbum.title}</strong></p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              ปี {currentSelectedAlbum.academicYear} • {currentSelectedAlbum.month || 'สิงหาคม'}
            </span>
          </div>

          {/* Drive Warning message */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">ข้อแนะนำสำหรับผู้ดูแลระบบ</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                กรุณาตั้งค่า Share ของ Google Drive ให้ผู้ที่มีลิงก์สามารถดูไฟล์ได้ตามต้องการ (หาก Drive ตั้งเป็น Private ผู้ชมที่ไม่มีสิทธิ์จะไม่สามารถดูได้ ซึ่งเป็นสิทธิ์ของ Google Drive)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDriveLink} className="space-y-4 text-xs">
            {/* Album Title */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">ชื่ออัลบั้มกิจกรรม</label>
              <input
                type="text"
                required
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            {/* Google Drive Link Input */}
            <div>
              <label className="font-semibold text-slate-700 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>ลิงก์ Google Drive (Folder / File / Docs) *</span>
                </span>
                {currentSelectedAlbum.driveUrl && (
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    มีลิงก์เดิมอยู่แล้ว
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder="https://drive.google.com/drive/folders/..."
                value={inputDriveUrl}
                onChange={(e) => {
                  setInputDriveUrl(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none font-mono text-xs text-slate-800 ${
                  urlError ? 'border-rose-400 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:ring-1 focus:ring-blue-500'
                }`}
              />
              {urlError && (
                <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{urlError}</span>
                </p>
              )}
            </div>

            {/* Academic Year & Month */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ปีการศึกษา</label>
                <select
                  value={inputAcademicYear}
                  onChange={(e) => setInputAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-medium"
                >
                  {DEFAULT_ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      ปีการศึกษา {yr}
                    </option>
                  ))}
                  <option value="2567">ปีการศึกษา 2567</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">เดือนที่จัดกิจกรรม</label>
                <select
                  value={inputMonth}
                  onChange={(e) => setInputMonth(e.target.value)}
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

            {/* Cover URL */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">URL รูปภาพหน้าปกอัลบั้ม (Cover URL)</label>
              <input
                type="text"
                placeholder="https://..."
                value={inputCoverUrl}
                onChange={(e) => setInputCoverUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 text-xs"
              />
            </div>

            {saveSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {currentSelectedAlbum.driveUrl ? (
                <button
                  type="button"
                  onClick={() => openGoogleDrive(currentSelectedAlbum.driveUrl, currentSelectedAlbum.driveFolderId)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>ทดสอบเปิดลิงก์</span>
                </button>
              ) : <div />}

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกลิงก์ Google Drive'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Album List Selector */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">เลือกอัลบั้ม</h3>
            <span className="text-xs text-slate-400">{albums.length} อัลบั้ม</span>
          </div>

          {/* Search in selector */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาอัลบั้ม..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Album items list */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredAlbumList.map((alb) => {
              const isSelected = alb.id === selectedAlbumId;
              const hasLink = !!alb.driveUrl;
              return (
                <div
                  key={alb.id}
                  onClick={() => handleSelectAlbum(alb)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300 shadow-2xs'
                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={alb.coverUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-xs truncate">{alb.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ปี {alb.academicYear} • {alb.month || 'สิงหาคม'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {hasLink ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> ลิงก์ Drive แล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                            ยังไม่มีลิงก์
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
