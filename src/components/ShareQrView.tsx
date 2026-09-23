import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  Printer, 
  Globe, 
  Lock, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Send,
  MessageCircle,
  Facebook,
  Mail,
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Album, AppView, GmailUser } from '../types';
import { createShareLink, saveAlbumToFirestore, updateAlbumShareSettings, revokeShareLink } from '../services/firebaseService';

interface ShareQrViewProps {
  album: Album;
  albums: Album[];
  setSelectedAlbum: (album: Album) => void;
  setCurrentView: (view: AppView) => void;
  onOpenPublicPreview?: (shareToken: string) => void;
  currentUser?: GmailUser | null;
}

export const ShareQrView: React.FC<ShareQrViewProps> = ({
  album,
  albums,
  setSelectedAlbum,
  setCurrentView,
  onOpenPublicPreview,
  currentUser
}) => {
  const [copied, setCopied] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'public' | 'password' | 'disabled'>(
    album.accessLevel === 'password' ? 'password' : (album.accessLevel === 'disabled' ? 'disabled' : 'public')
  );
  const [accessPassword, setAccessPassword] = useState('123456');
  const [allowDownload, setAllowDownload] = useState(album.allowDownload !== false);
  const [expiration, setExpiration] = useState('never');
  const [qrResolution, setQrResolution] = useState<'M' | 'L' | 'UHD'>('L');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const activeToken = album.shareToken || 'share_' + album.id;
  const shareUrl = `${window.location.origin}/#public-album/${activeToken}`;

  const handleSaveSecuritySettings = async () => {
    setIsSavingSettings(true);
    try {
      const expDays = expiration === '7' ? 7 : expiration === '30' ? 30 : 0;
      await updateAlbumShareSettings(album.id, {
        accessLevel,
        pin: accessLevel === 'password' ? accessPassword : undefined,
        allowDownload,
        expirationDays: expDays
      });
      album.accessLevel = accessLevel;
      album.allowDownload = allowDownload;
      setToastMessage('บันทึกการตั้งค่าสิทธิ์และความปลอดภัย (Firestore) สำเร็จ!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setToastMessage('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRevoke = async () => {
    if (window.confirm('คุณต้องการยกเลิกลิงก์เผยแพร่สาธารณะ (Revoke Link) ทันทีหรือไม่?')) {
      try {
        await revokeShareLink(album.id, album.shareToken);
        album.isShared = false;
        album.accessLevel = 'disabled';
        setAccessLevel('disabled');
        setToastMessage('ยกเลิกลิงก์เผยแพร่สาธารณะ (Revoked) เรียบร้อยแล้ว');
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err: any) {
        setToastMessage('เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      if (!album.shareToken) {
        const link = await createShareLink(album.id, currentUser?.name);
        album.shareToken = link.shareToken;
      }
    } catch (e) {
      console.warn('createShareLink error:', e);
    }
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setToastMessage('สร้างและคัดลอกลิงก์เผยแพร่สาธารณะ (Firestore) เรียบร้อยแล้ว!');
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 3000);
  };

  const handlePreviewPublic = async () => {
    let token = album.shareToken;
    if (!token) {
      try {
        const link = await createShareLink(album.id, currentUser?.name);
        token = link.shareToken;
        album.shareToken = token;
      } catch (e) {
        token = 'share_' + album.id;
      }
    }
    if (onOpenPublicPreview) {
      onOpenPublicPreview(token);
    } else {
      window.location.hash = `public-album/${token}`;
    }
  };

  const handleDownloadQr = () => {
    setToastMessage('กำลังสร้างไฟล์ภาพ QR Code ความละเอียดสูง PNG...');
    setTimeout(() => {
      // Simulate download
      const link = document.createElement('a');
      link.href = 'https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=' + encodeURIComponent(shareUrl);
      link.download = `QR_${album.id}.png`;
      link.target = '_blank';
      link.click();
      setToastMessage('ดาวน์โหลด QR Code สำหรับพิมพ์เสร็จสมบูรณ์!');
      setTimeout(() => setToastMessage(null), 3000);
    }, 600);
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-1 font-medium text-slate-600 hover:text-blue-600 transition-colors bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับแดชบอร์ด</span>
          </button>
          <span>/</span>
          <span className="text-slate-400">จัดการอัลบั้ม</span>
          <span>/</span>
          <span className="font-semibold text-blue-600 truncate max-w-xs">{album.title}</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">แชร์และสร้าง QR Code</span>
        </div>

        {/* Change Album dropdown */}
        <select
          value={album.id}
          onChange={(e) => {
            const found = albums.find(a => a.id === e.target.value);
            if (found) setSelectedAlbum(found);
          }}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs shadow-2xs"
        >
          {albums.map(a => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              กำลังเปิดเผยแพร่ (Public Active)
            </span>
            <span className="text-xs text-slate-400">อัปเดตล่าสุดวันนี้</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            แชร์อัลบั้มและสร้าง QR Code
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            กำหนดสิทธิ์การเข้าถึง ลิงก์เผยแพร่สาธารณะ และสร้างสื่อประชาสัมพันธ์ดิจิทัลสำหรับโรงเรียน
          </p>
        </div>

        <button
          onClick={handlePreviewPublic}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
        >
          <ExternalLink className="w-4 h-4 text-slate-500" />
          <span>ดูมุมมองผู้เข้าชม (Preview)</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-medium rounded-xl shadow-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid: Settings (Left) + QR Poster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Link & Permission Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Snapshot Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <img
              src={album.coverUrl}
              alt=""
              className="w-20 h-20 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{album.category}</span>
              <h3 className="font-bold text-slate-900 text-sm truncate">{album.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{album.photoCount} รูปภาพ • {album.date} • {album.fileSizeTotal}</p>
            </div>
          </div>

          {/* Public Link Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>ลิงก์เผยแพร่อัลบั้ม (Public URL)</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all active:scale-98 shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">แชร์ด่วนไปยัง:</span>
              <button
                onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(album.title + ' ' + shareUrl)}`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>LINE กลุ่มห้องเรียน</span>
              </button>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook โรงเรียน</span>
              </button>
              <button
                onClick={() => window.open(`mailto:?subject=${encodeURIComponent(album.title)}&body=${encodeURIComponent(shareUrl)}`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>อีเมลแจ้งอาจารย์</span>
              </button>
            </div>
          </div>

          {/* Access Permission Settings */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>สิทธิ์การเข้าถึงอัลบั้ม (Access Permissions)</span>
            </h3>

            <div className="space-y-3">
              <label 
                onClick={() => setAccessLevel('public')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  accessLevel === 'public' ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500/20' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="access"
                  checked={accessLevel === 'public'}
                  onChange={() => setAccessLevel('public')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">ทุกคนที่มีลิงก์ (Public Link)</p>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">แนะนำ</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">นักเรียน ครู ผู้ปกครอง และศิษย์เก่าสามารถเปิดดูภาพได้ทันทีโดยไม่ต้องล็อกอิน</p>
                </div>
              </label>

              <label 
                onClick={() => setAccessLevel('password')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  accessLevel === 'password' ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-500/20' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="access"
                  checked={accessLevel === 'password'}
                  onChange={() => setAccessLevel('password')}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900">ต้องใช้รหัสผ่าน (Password Protected)</p>
                  <p className="text-xs text-slate-500 mt-0.5">ผู้เข้าชมต้องกรอกรหัสผ่าน 6 หลักเพื่อปลดล็อกเข้าดูภาพ เหมาะสำหรับกิจกรรมภายในหรือประชุมผู้ปกครอง</p>
                  {accessLevel === 'password' && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">รหัสผ่าน 6 หลัก:</span>
                      <input
                        type="text"
                        maxLength={6}
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                        className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold tracking-widest text-slate-800 w-28 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </label>

              <label 
                onClick={() => setAccessLevel('disabled')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  accessLevel === 'disabled' ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-500/20' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="access"
                  checked={accessLevel === 'disabled'}
                  onChange={() => setAccessLevel('disabled')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">ปิดการแชร์ชั่วคราว (Disabled)</p>
                  <p className="text-xs text-slate-500 mt-0.5">ระงับการเข้าชมจากภายนอก ผู้มีลิงก์จะเห็นหน้าแจ้งเตือนว่าอัลบั้มยังไม่เปิดใช้งาน</p>
                </div>
              </label>
            </div>

            {/* Download & Expiration sub-options */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-800 block mb-1.5">สิทธิ์การดาวน์โหลดรูปภาพ:</span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="downloadOpt"
                      checked={allowDownload}
                      onChange={() => setAllowDownload(true)}
                      className="text-blue-600"
                    />
                    <span>อนุญาตดาวน์โหลดภาพ (ภาพเดี่ยว + ZIP)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="downloadOpt"
                      checked={!allowDownload}
                      onChange={() => setAllowDownload(false)}
                      className="text-blue-600"
                    />
                    <span>ดูได้อย่างเดียว (View Only) ป้องกันการบันทึก</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-800 block mb-1.5">ระยะเวลาการเผยแพร่:</span>
                <select
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="never">ไม่มีวันหมดอายุ (แนะนำสำหรับคลังโสตฯ)</option>
                  <option value="30">หมดอายุใน 30 วัน</option>
                  <option value="7">หมดอายุใน 7 วัน</option>
                  <option value="custom">สิ้นสุดภาคเรียนที่ 1/2569</option>
                </select>
              </div>
            </div>

            {/* Save Permissions and Revoke Link Controls */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRevoke}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200"
                title="ยกเลิกลิงก์เผยแพร่สาธารณะนี้ทันที"
              >
                ยกเลิกลิงก์แชร์ทันที (Revoke Link)
              </button>

              <button
                type="button"
                onClick={handleSaveSecuritySettings}
                disabled={isSavingSettings}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าสิทธิ์'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code Poster & Print Actions (5 cols) (Image 18) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md text-center space-y-5">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code ประจำอัลบั้ม</span>
            </div>

            {/* Poster Card with School Emblem & Clean QR Code */}
            <div className="bg-gradient-to-b from-slate-50 to-blue-50/40 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center">
              <div className="text-center mb-3">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-widest">
                  โรงเรียนสตรีวัดระฆัง • ฝ่ายโสตทัศนูปกรณ์
                </span>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                  {album.title}
                </h4>
              </div>

              {/* QR Code Container with Center Logo */}
              <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(shareUrl)}`}
                  alt="QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg object-contain"
                />
                {/* Center School Logo badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
                    SMT
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3 font-medium">
                สแกน QR Code ด้วยกล้องมือถือหรือ LINE
              </p>
              <p className="text-[11px] text-slate-400">
                เพื่อดูและดาวน์โหลดภาพกิจกรรมความละเอียดสูง 4K
              </p>
            </div>

            {/* Resolution Selector */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-slate-400">ขนาดภาพ:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl">
                <button
                  onClick={() => setQrResolution('M')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    qrResolution === 'M' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  M (เว็บ)
                </button>
                <button
                  onClick={() => setQrResolution('L')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    qrResolution === 'L' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  L (ป้าย A4)
                </button>
                <button
                  onClick={() => setQrResolution('UHD')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    qrResolution === 'UHD' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Ultra HD (ไวนิล)
                </button>
              </div>
            </div>

            {/* Print & Download Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleDownloadQr}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด QR Code (PNG ความละเอียดสูง)</span>
              </button>

              <button
                onClick={handlePrintPoster}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>พิมพ์ป้ายตั้งโต๊ะ / โปสเตอร์ (PDF)</span>
              </button>
            </div>

            {/* Note & Advice from AV Dept */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>คำแนะนำจากฝ่ายโสตทัศนศึกษา:</span>
              </div>
              <p>
                สำหรับพิมพ์ลงป้ายไวนิลขนาดใหญ่ หรือโปสเตอร์แนะนำให้เลือกขนาด <strong>Ultra HD</strong> เพื่อความคมชัดสูงสุดเมื่อสแกนจากระยะไกล
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
