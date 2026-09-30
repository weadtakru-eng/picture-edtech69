import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Image as ImageIcon, 
  Share2, 
  Eye, 
  PlusCircle, 
  UploadCloud, 
  ArrowUpRight, 
  Lock, 
  Globe, 
  Calendar, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  SlidersHorizontal,
  Grid, 
  List,
  Sparkles,
  ChevronRight,
  ExternalLink,
  QrCode,
  LogIn,
  FolderOpen,
  Edit3,
  Trash2,
  EyeOff,
  Link2,
  HardDrive
} from 'lucide-react';
import { Album, AppView, TopSharedLink, ActivityItem, GmailUser } from '../types';
import { 
  THAI_MONTHS, 
  DEFAULT_ACADEMIC_YEARS, 
  getMonthNumberFromName, 
  getMonthNameFromNumber,
  openGoogleDrive 
} from '../utils/academicYearUtils';

interface DashboardViewProps {
  albums: Album[];
  topLinks: TopSharedLink[];
  recentActivities: ActivityItem[];
  setCurrentView: (view: AppView) => void;
  setSelectedAlbum: (album: Album) => void;
  onOpenCreateAlbum: () => void;
  onEditAlbum?: (album: Album) => void;
  onDeleteAlbum?: (albumId: string) => void;
  onTogglePublish?: (album: Album) => void;
  searchQuery: string;
  currentUser: GmailUser | null;
  onOpenGmailAuth: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  albums,
  topLinks,
  recentActivities,
  setCurrentView,
  setSelectedAlbum,
  onOpenCreateAlbum,
  onEditAlbum,
  onDeleteAlbum,
  onTogglePublish,
  searchQuery,
  currentUser,
  onOpenGmailAuth
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState<string>('2569');
  const [selectedMonth, setSelectedMonth] = useState<string>('ทุกเดือน');
  const [selectedAccess, setSelectedAccess] = useState<string>('ทั้งหมด');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['ทั้งหมด', 'ห้องเรียนพิเศษ', 'งานพิธีการ', 'กีฬา', 'กิจกรรมโรงเรียน', 'กิจกรรมนักเรียน'];

  // Available academic years from albums + defaults
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>(DEFAULT_ACADEMIC_YEARS);
    albums.forEach(a => {
      if (a.academicYear) yearsSet.add(a.academicYear);
    });
    return Array.from(yearsSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [albums]);

  // Filtered Albums with Public Access Control
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      // Public visitors can only view published albums
      if (!currentUser && album.isPublished === false) {
        return false;
      }

      // Search: ชื่ออัลบั้ม, รายละเอียด, เดือน, ปีการศึกษา
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' || 
        album.title.toLowerCase().includes(q) ||
        (album.description && album.description.toLowerCase().includes(q)) ||
        (album.month && album.month.toLowerCase().includes(q)) ||
        (album.academicYear && album.academicYear.includes(q)) ||
        (album.tags && album.tags.some(t => t.toLowerCase().includes(q)));
      
      const matchCategory = selectedCategory === 'ทั้งหมด' || album.category === selectedCategory;
      const matchYear = selectedYear === 'ทั้งหมด' || album.academicYear === selectedYear;
      
      const albumMonth = album.month || getMonthNameFromNumber(album.monthNumber);
      const matchMonth = selectedMonth === 'ทุกเดือน' || albumMonth === selectedMonth;

      const matchAccess = selectedAccess === 'ทั้งหมด' || 
        (selectedAccess === 'สาธารณะ' && album.accessLevel === 'public') ||
        (selectedAccess === 'ส่วนตัว' && album.accessLevel === 'password');

      return matchSearch && matchCategory && matchYear && matchMonth && matchAccess;
    }).sort((a, b) => {
      // Default Sort: academicYear DESC, monthNumber DESC, eventDate DESC
      const yearA = parseInt(a.academicYear || '0', 10);
      const yearB = parseInt(b.academicYear || '0', 10);
      if (yearB !== yearA) return yearB - yearA;

      const monthA = a.monthNumber || getMonthNumberFromName(a.month || a.date);
      const monthB = b.monthNumber || getMonthNumberFromName(b.month || b.date);
      if (monthB !== monthA) return monthB - monthA;

      return (b.eventDate || b.date || b.createdAt || '').localeCompare(a.eventDate || a.date || a.createdAt || '');
    });
  }, [albums, searchQuery, selectedCategory, selectedYear, selectedMonth, selectedAccess, currentUser]);

  // Group filtered albums by Academic Year -> Month -> Albums
  const groupedAlbums = useMemo(() => {
    const yearMap = new Map<string, Map<string, Album[]>>();

    for (const album of filteredAlbums) {
      const year = album.academicYear || '2569';
      const month = album.month || getMonthNameFromNumber(album.monthNumber);

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map<string, Album[]>());
      }
      const monthMap = yearMap.get(year)!;
      if (!monthMap.has(month)) {
        monthMap.set(month, []);
      }
      monthMap.get(month)!.push(album);
    }

    const sortedYears = Array.from(yearMap.entries()).sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10));

    return sortedYears.map(([year, monthMap]) => {
      const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => {
        const monthNumA = getMonthNumberFromName(a[0]);
        const monthNumB = getMonthNumberFromName(b[0]);
        return monthNumB - monthNumA;
      });
      return {
        year,
        months: sortedMonths.map(([month, albList]) => ({
          month,
          albums: albList
        }))
      };
    });
  }, [filteredAlbums]);

  // Click card action: open Google Drive directly in new tab
  const handleCardClick = (album: Album) => {
    if (album.driveUrl) {
      openGoogleDrive(album.driveUrl, album.driveFolderId);
    } else {
      setSelectedAlbum(album);
      setCurrentView('album-detail');
    }
  };

  const handleOpenAlbumDetail = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAlbum(album);
    setCurrentView('album-detail');
  };

  const handleOpenShare = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAlbum(album);
    setCurrentView('share-qr');
  };

  const handleOpenUpload = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAlbum(album);
    setCurrentView('bulk-upload');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>ระบบจัดเก็บและเชื่อมโยงลิงก์ Google Drive • โรงเรียนราชินีบน</span>
              {currentUser && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/20 px-2 py-0.2 rounded-full border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" />
                  {currentUser.email}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {currentUser ? `สวัสดี ${currentUser.name}` : 'คลังสื่อโสตทัศนูปกรณ์และประชาสัมพันธ์'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              {currentUser 
                ? `${currentUser.department} • ${currentUser.organization} จัดการลิงก์อัลบั้ม Google Drive ความละเอียดสูง 4K RAW และจัดการสิทธิ์เผยแพร่ตามมาตรฐาน PDPA`
                : 'เลือกปีการศึกษาและเดือนที่ต้องการ เพื่อเข้าชมภาพกิจกรรมโรงเรียนความละเอียดสูงผ่าน Google Drive'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentUser ? (
              <>
                <button
                  onClick={() => setCurrentView('bulk-upload')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 transition-all active:scale-98"
                  title="เพิ่มหรืออัปเดตลิงก์ Google Drive สำหรับอัลบั้ม"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>เพิ่มลิงก์ Google Drive</span>
                </button>
                <button
                  onClick={onOpenCreateAlbum}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-semibold rounded-xl backdrop-blur-xs transition-all active:scale-98"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ สร้างอัลบั้มใหม่</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenGmailAuth}
                className="flex items-center gap-2.5 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold rounded-xl shadow-xl transition-all active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>เข้าสู่ระบบเจ้าหน้าที่ (Staff Login)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Stats Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">อัลบั้มทั้งหมด</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{albums.length}</span>
            <span className="text-xs text-slate-500 font-medium">อัลบั้ม</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>3 ปีการศึกษา</span>
            <span className="text-slate-400 font-normal">| เชื่อมโยง Google Drive</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">คลังเก็บภาพหลัก</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">Google Drive</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>เปิดดูภาพต้นฉบับ 4K ได้ทันที</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">การเผยแพร่</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {albums.filter(a => a.isPublished !== false).length}
            </span>
            <span className="text-xs text-slate-500 font-medium">อัลบั้มสาธารณะ</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">รองรับ QR Code</span>
            <span>•</span>
            <span className="text-slate-400">ไม่ต้อง Login</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ยอดการเข้าชม</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {albums.reduce((acc, a) => acc + (a.views || 0), 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">ครั้ง</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>เชื่อมต่อตรง Google Drive</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Albums (Left 2/3) + Widgets (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Albums List / Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter & Search Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>อัลบั้มภาพกิจกรรมโรงเรียน</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {filteredAlbums.length} รายการ
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  จัดเรียงตามปีการศึกษา • เดือน • อัลบั้ม Google Drive
                </p>
              </div>

              {/* View Switcher, Year & Month Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="มุมมองการ์ด"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="มุมมองรายการ"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Year Filter */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ทั้งหมด">ปีการศึกษา ทั้งหมด</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>
                      ปีการศึกษา {yr}
                    </option>
                  ))}
                </select>

                {/* Month Filter */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ทุกเดือน">ทุกเดือน</option>
                  {THAI_MONTHS.map(m => (
                    <option key={m.number} value={m.name}>
                      เดือน {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Chips Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Albums Display with Year -> Month Organization */}
          {groupedAlbums.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">ไม่พบอัลบั้มภาพที่ตรงกับเงื่อนไข</h3>
              <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกปีการศึกษา/เดือนอื่น</p>
              {currentUser && (
                <button
                  onClick={onOpenCreateAlbum}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ สร้างอัลบั้มใหม่</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {groupedAlbums.map(({ year, months }) => (
                <div key={year} className="space-y-4">
                  {/* Academic Year Header Banner */}
                  <div className="flex items-center justify-between bg-slate-100/80 px-4 py-2.5 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <h3 className="font-extrabold text-sm text-slate-900">
                        ปีการศึกษา {year}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-500">
                        ({months.reduce((acc, m) => acc + m.albums.length, 0)} อัลบั้ม)
                      </span>
                    </div>
                  </div>

                  {/* Months in this Year */}
                  {months.map(({ month, albums: monthAlbums }) => (
                    <div key={`${year}-${month}`} className="space-y-3 pl-2 sm:pl-3 border-l-2 border-blue-200/70">
                      {/* Month Header */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                          {month}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {monthAlbums.length} อัลบั้ม
                        </span>
                      </div>

                      {/* View Mode Grid */}
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {monthAlbums.map((album) => (
                            <div
                              key={album.id}
                              onClick={() => handleCardClick(album)}
                              className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
                            >
                              {/* Image Cover Frame */}
                              <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                                <img
                                  src={album.coverUrl}
                                  alt={album.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                {/* Top Badges */}
                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs">
                                    {album.category}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    {album.isPublished === false && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800/90 text-amber-300 backdrop-blur-xs">
                                        <EyeOff className="w-3 h-3" />
                                        <span>ซ่อน</span>
                                      </span>
                                    )}

                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-xs ${
                                      album.accessLevel === 'public'
                                        ? 'bg-emerald-500/90 text-white'
                                        : 'bg-amber-500/90 text-white'
                                    }`}>
                                      {album.accessLevel === 'public' ? (
                                        <>
                                          <Globe className="w-3 h-3" />
                                          <span>สาธารณะ</span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-3 h-3" />
                                          <span>รหัสผ่าน</span>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Bottom overlay in image: Google Drive indicator */}
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                                  <span className="flex items-center gap-1 font-medium text-[11px] bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                                    <FolderOpen className="w-3 h-3 text-blue-300" />
                                    <span>Google Drive</span>
                                  </span>
                                  <span className="text-[11px] text-slate-200 font-normal">
                                    ปี {album.academicYear}
                                  </span>
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                                    <Calendar className="w-3 h-3 text-blue-600" />
                                    <span>{album.eventDate || album.date}</span>
                                  </div>
                                  <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {album.title}
                                  </h3>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                    {album.description}
                                  </p>
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                  {/* Open Google Drive button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGoogleDrive(album.driveUrl, album.driveFolderId);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors"
                                    title="เปิด Google Drive ในแท็บใหม่"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    <span>ดูอัลบั้ม</span>
                                    <ExternalLink className="w-3 h-3 ml-0.5" />
                                  </button>

                                  {/* Quick Action Icons */}
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    {/* Admin Controls */}
                                    {currentUser && onEditAlbum && (
                                      <button
                                        onClick={() => onEditAlbum(album)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="แก้ไขอัลบั้ม / เปลี่ยนลิงก์"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    )}

                                    {currentUser && onTogglePublish && (
                                      <button
                                        onClick={() => onTogglePublish(album)}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                          album.isPublished === false
                                            ? 'text-amber-500 hover:bg-amber-50'
                                            : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                                        }`}
                                        title={album.isPublished === false ? 'แสดงอัลบั้ม (Publish)' : 'ซ่อนอัลบั้ม (Unpublish)'}
                                      >
                                        {album.isPublished === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                    )}

                                    {currentUser && onDeleteAlbum && (
                                      <button
                                        onClick={() => onDeleteAlbum(album.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="ลบอัลบั้ม"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}

                                    <button
                                      onClick={(e) => handleOpenShare(album, e)}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="แชร์ลิงก์ / QR Code"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={(e) => handleOpenAlbumDetail(album, e)}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                      title="รายละเอียดอัลบั้ม"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Table / List View */
                        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">ชื่ออัลบั้ม</th>
                                <th className="py-3 px-3 hidden sm:table-cell">หมวดหมู่</th>
                                <th className="py-3 px-3 hidden md:table-cell">วันที่</th>
                                <th className="py-3 px-3">Google Drive</th>
                                <th className="py-3 px-3 hidden sm:table-cell">สิทธิ์</th>
                                <th className="py-3 px-4 text-right">การจัดการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {monthAlbums.map((album) => (
                                <tr
                                  key={album.id}
                                  onClick={() => handleCardClick(album)}
                                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={album.coverUrl}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 truncate max-w-xs">{album.title}</p>
                                        <p className="text-[11px] text-slate-400">
                                          ปี {album.academicYear} • {album.month || 'สิงหาคม'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 hidden sm:table-cell text-slate-600">
                                    {album.category}
                                  </td>
                                  <td className="py-3 px-3 hidden md:table-cell text-slate-500 whitespace-nowrap">
                                    {album.eventDate || album.date}
                                  </td>
                                  <td className="py-3 px-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openGoogleDrive(album.driveUrl, album.driveFolderId);
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline"
                                    >
                                      <FolderOpen className="w-3.5 h-3.5" />
                                      <span>เปิด Drive</span>
                                    </button>
                                  </td>
                                  <td className="py-3 px-3 hidden sm:table-cell">
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                      album.accessLevel === 'public'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {album.accessLevel === 'public' ? 'สาธารณะ' : 'รหัสผ่าน'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      {currentUser && onEditAlbum && (
                                        <button
                                          onClick={() => onEditAlbum(album)}
                                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                                          title="แก้ไข"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => handleOpenShare(album, e)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                                        title="แชร์ลิงก์ / QR Code"
                                      >
                                        <Share2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => handleOpenAlbumDetail(album, e)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                                        title="เปิดดูอัลบั้ม"
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Widgets & Sidebar Insights */}
        <div className="space-y-6">
          {/* Top Shared Links Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>ลิงก์ที่มีผู้เข้าชมสูงสุด</span>
              </h3>
              <span className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer">
                ดูทั้งหมด
              </span>
            </div>

            <div className="space-y-3">
              {topLinks.map((link) => (
                <div 
                  key={link.id} 
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-100 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      link.rank === 1 ? 'bg-amber-400 text-white' :
                      link.rank === 2 ? 'bg-slate-300 text-slate-700' :
                      link.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {link.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{link.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{link.views.toLocaleString()} วิว</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">{link.growth}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const found = albums.find(a => a.title.includes(link.title));
                      if (found) {
                        setSelectedAlbum(found);
                        setCurrentView('share-qr');
                      } else {
                        setCurrentView('share-qr');
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shrink-0"
                    title="สร้าง QR Code และแชร์"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCurrentView('share-qr')}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>จัดการลิงก์และ QR Code ทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>กิจกรรมโสตทัศน์ล่าสุด</span>
            </h3>

            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {recentActivities.slice(0, 4).map((act) => (
                <div key={act.id} className="relative text-xs">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                  <p className="font-semibold text-slate-800">{act.title}</p>
                  <p className="text-slate-500 text-[11px] truncate mt-0.5">{act.albumTitle}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {act.timeAgo} • โดย {act.user}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Media Vault & Google Drive Card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs">สถานะ Google Drive Storage</h4>
                <p className="text-[10px] text-blue-200">พร้อมใช้งาน • Google Workspace for Education</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ไฟล์ภาพต้นฉบับ 4K RAW จัดเก็บปลอดภัยบน Google Drive ของโรงเรียนราชินีบน เข้าชมได้สะดวกรวดเร็วตามมาตรฐาน PDPA
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setCurrentView('login-states')}
                className="w-full py-1.5 bg-white/15 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors text-center"
              >
                ดูนโยบายสิทธิ์ PDPA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
