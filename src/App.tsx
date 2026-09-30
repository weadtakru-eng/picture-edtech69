import React, { useState, useEffect } from 'react';
import { Album, Photo, UploadQueueItem, AppView, GmailUser, ActivityItem } from './types';
import { 
  subscribeAlbums, 
  subscribePhotos, 
  subscribeActivityLogs,
  saveAlbumToFirestore, 
  savePhotoToFirestore, 
  deletePhotoFromFirestore,
  setAlbumCoverPhoto,
  subscribeAuthState,
  logoutFirebase
} from './services/firebaseService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AlbumDetailView } from './components/AlbumDetailView';
import { BulkUploaderView } from './components/BulkUploaderView';
import { ShareQrView } from './components/ShareQrView';
import { LoginAndStatesView } from './components/LoginAndStatesView';
import { MobileDeviceMockup } from './components/MobileDeviceMockup';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';
import { CreateAlbumModal } from './components/CreateAlbumModal';
import { BatchActionDock } from './components/BatchActionDock';
import { GmailAuthModal } from './components/GmailAuthModal';
import { PublicAlbumView } from './components/PublicAlbumView';
import { OAuthOriginWarningBanner } from './components/OAuthOriginWarningBanner';
import { FolderKanban, PlusCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  
  // Public Viewer Token state
  const [publicShareToken, setPublicShareToken] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#public-album/')) {
      return hash.replace('#public-album/', '');
    }
    return null;
  });

  // Gmail User Auth state backed by Firebase Authentication
  const [currentUser, setCurrentUser] = useState<GmailUser | null>(() => {
    const saved = localStorage.getItem('rajinibon_gmail_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGmailAuthOpen, setIsGmailAuthOpen] = useState(false);

  // Sync with Firebase Auth state in real-time (Single listener pattern)
  useEffect(() => {
    const unsubAuth = subscribeAuthState(
      (user) => {
        setCurrentUser(user);
        if (user) {
          localStorage.setItem('rajinibon_gmail_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('rajinibon_gmail_user');
        }
      },
      (loading) => setIsAuthLoading(loading)
    );

    return () => unsubAuth();
  }, []);

  // UI & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMockup, setIsMobileMockup] = useState(false);
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
  
  // Listen to hash change for Public Album viewing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#public-album/')) {
        setPublicShareToken(hash.replace('#public-album/', ''));
      } else {
        setPublicShareToken(null);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Section 12: Clear demo state from LocalStorage on boot without touching real auth
  useEffect(() => {
    try {
      const demoKeys = ['demo_albums', 'demo_photos', 'demo_stats', 'seed_state', 'mock_user'];
      demoKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      // ignore
    }
  }, []);

  // Subscribe to real-time Firestore albums, photos & activity logs (project: picture edtech)
  useEffect(() => {
    const unsubAlbums = subscribeAlbums((remoteAlbums) => {
      const list = remoteAlbums || [];
      setAlbums(list);
      setSelectedAlbum(prev => {
        if (list.length === 0) return null;
        if (prev && list.some(a => a.id === prev.id)) {
          return list.find(a => a.id === prev.id) || list[0];
        }
        return list[0];
      });
    });

    const unsubPhotos = subscribePhotos((remotePhotos) => {
      setPhotos(remotePhotos || []);
    });

    const unsubLogs = subscribeActivityLogs((remoteLogs) => {
      setRecentActivities(remoteLogs || []);
    });

    return () => {
      unsubAlbums();
      unsubPhotos();
      unsubLogs();
    };
  }, []);

  // Selection and Lightbox
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<Photo | null>(null);

  // Sync user with local storage and auth
  const handleLoginSuccess = (user: GmailUser) => {
    setCurrentUser(user);
    localStorage.setItem('rajinibon_gmail_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    await logoutFirebase();
    setCurrentUser(null);
    localStorage.removeItem('rajinibon_gmail_user');
  };


  // Handlers
  const handleTogglePhotoSelection = (id: string) => {
    setSelectedPhotoIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedPhotoIds([]);
  };

  const handleDownloadSelected = () => {
    alert(`กำลังเตรียมดาวน์โหลดรูปภาพความละเอียดสูง ${selectedPhotoIds.length} ภาพจาก Google Drive...`);
  };

  const handleSetCover = async () => {
    if (selectedPhotoIds.length > 0 && selectedAlbum) {
      const photo = photos.find(p => p.id === selectedPhotoIds[0]);
      if (photo) {
        const updatedAlbum: Album = { ...selectedAlbum, coverUrl: photo.url, coverDriveFileId: photo.driveFileId };
        setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? updatedAlbum : a));
        setSelectedAlbum(updatedAlbum);
        try {
          await setAlbumCoverPhoto(selectedAlbum.id, photo.id, photo.url, photo.driveFileId);
        } catch (e) {
          console.warn('Failed to update album cover in Firestore:', e);
        }
        alert('ตั้งเป็นภาพหน้าปกอัลบั้มและบันทึกสู่ Firestore เรียบร้อยแล้ว');
      }
    }
  };

  const handleMoveAlbum = () => {
    alert('เลือกอัลบั้มปลายทางเพื่อย้ายภาพที่เลือก');
  };

  const handleDeleteSelected = async () => {
    if (confirm(`คุณต้องการลบรูปภาพที่เลือก ${selectedPhotoIds.length} รูปหรือไม่?`)) {
      const idsToDelete = [...selectedPhotoIds];
      const albumId = selectedAlbum?.id;
      setPhotos(prev => prev.filter(p => !idsToDelete.includes(p.id)));
      setSelectedPhotoIds([]);
      for (const pid of idsToDelete) {
        try {
          await deletePhotoFromFirestore(pid, albumId);
        } catch (e) {
          console.warn('Failed to delete photo from Firestore:', e);
        }
      }
    }
  };

  const handleCreateAlbum = async (newAlbum: Album) => {
    setAlbums(prev => [newAlbum, ...prev]);
    setSelectedAlbum(newAlbum);
    setCurrentView('bulk-upload');
    try {
      await saveAlbumToFirestore(newAlbum);
    } catch (e) {
      console.warn('Failed to save new album to Firestore:', e);
    }
  };

  const handlePhotosUploaded = async (count: number) => {
    if (!selectedAlbum) return;
    const updated: Album = { ...selectedAlbum, photoCount: selectedAlbum.photoCount + count };
    setAlbums(prev => prev.map(a => 
      a.id === selectedAlbum.id ? updated : a
    ));
    setSelectedAlbum(updated);
    try {
      await saveAlbumToFirestore(updated);
    } catch (e) {
      console.warn('Failed to update photo count in Firestore:', e);
    }
  };

  // Prev / Next for Lightbox
  const currentPhotoIndex = activeLightboxPhoto 
    ? photos.findIndex(p => p.id === activeLightboxPhoto.id) 
    : -1;
  
  const handlePrevPhoto = currentPhotoIndex > 0 
    ? () => setActiveLightboxPhoto(photos[currentPhotoIndex - 1]) 
    : undefined;
    
  const handleNextPhoto = currentPhotoIndex < photos.length - 1 
    ? () => setActiveLightboxPhoto(photos[currentPhotoIndex + 1]) 
    : undefined;

  // Render Public View if publicShareToken is active (NO LOGIN REQUIRED)
  if (publicShareToken) {
    return (
      <>
        <PublicAlbumView
          shareToken={publicShareToken}
          onBackToApp={() => {
            window.location.hash = '';
            setPublicShareToken(null);
          }}
          onOpenLightbox={(p) => setActiveLightboxPhoto(p)}
        />
        <PhotoLightboxModal
          photo={activeLightboxPhoto}
          onClose={() => setActiveLightboxPhoto(null)}
          onPrev={handlePrevPhoto}
          onNext={handleNextPhoto}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileMockup={isMobileMockup}
        setIsMobileMockup={setIsMobileMockup}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
        currentUser={currentUser}
        onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
      />

      {/* Google OAuth Origin Mismatch Prevention Warning */}
      <OAuthOriginWarningBanner />

      {/* Main Content Area */}
      {isMobileMockup ? (
        <MobileDeviceMockup
          albums={albums}
          photos={photos}
          queue={queue}
          currentAlbum={selectedAlbum}
          onExitMobile={() => setIsMobileMockup(false)}
          onOpenPhotoLightbox={(p) => setActiveLightboxPhoto(p)}
          onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
          currentUser={currentUser}
          onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
        />
      ) : (
        <div className="flex-1 flex">
          {/* Desktop Left Sidebar */}
          <div className="hidden md:block">
            <Sidebar
              currentView={currentView}
              setCurrentView={setCurrentView}
              onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
              currentUser={currentUser}
              onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
            />
          </div>

          {/* Center Main View Canvas */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {currentView === 'dashboard' && (
              <DashboardView
                albums={albums}
                topLinks={[]}
                recentActivities={recentActivities}
                setCurrentView={setCurrentView}
                setSelectedAlbum={setSelectedAlbum}
                onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
                searchQuery={searchQuery}
                currentUser={currentUser}
                onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
              />
            )}

            {currentView === 'albums' && (
              <DashboardView
                albums={albums}
                topLinks={[]}
                recentActivities={recentActivities}
                setCurrentView={setCurrentView}
                setSelectedAlbum={setSelectedAlbum}
                onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
                searchQuery={searchQuery}
                currentUser={currentUser}
                onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
              />
            )}

            {currentView === 'album-detail' && (
              selectedAlbum ? (
                <AlbumDetailView
                  album={selectedAlbum}
                  photos={photos}
                  onBack={() => setCurrentView('dashboard')}
                  setCurrentView={setCurrentView}
                  onOpenPhotoLightbox={(p) => setActiveLightboxPhoto(p)}
                  selectedPhotoIds={selectedPhotoIds}
                  togglePhotoSelection={handleTogglePhotoSelection}
                  currentUser={currentUser}
                />
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 max-w-md mx-auto my-12 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">ยังไม่มีอัลบั้มที่เลือก</h3>
                  <p className="text-xs text-slate-500">กรุณาสร้างอัลบั้มภาพใหม่เพื่อเริ่มใช้งานคลังสื่อโสตทัศนศึกษา</p>
                  <button
                    onClick={() => setIsCreateAlbumOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ สร้างอัลบั้มใหม่</span>
                  </button>
                </div>
              )
            )}

            {currentView === 'bulk-upload' && (
              selectedAlbum ? (
                <BulkUploaderView
                  album={selectedAlbum}
                  albums={albums}
                  queue={queue}
                  setQueue={setQueue}
                  setCurrentView={setCurrentView}
                  onPhotosUploaded={handlePhotosUploaded}
                  currentUser={currentUser}
                  onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
                />
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 max-w-md mx-auto my-12 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">กรุณาเลือกหรือสร้างอัลบั้มก่อนอัปโหลด</h3>
                  <p className="text-xs text-slate-500">สร้างอัลบั้มภาพกิจกรรมใหม่เพื่อนำเข้ารูปภาพจาก Google Drive</p>
                  <button
                    onClick={() => setIsCreateAlbumOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ สร้างอัลบั้มใหม่</span>
                  </button>
                </div>
              )
            )}

            {currentView === 'all-photos' && (
              selectedAlbum ? (
                <AlbumDetailView
                  album={selectedAlbum}
                  photos={photos}
                  onBack={() => setCurrentView('dashboard')}
                  setCurrentView={setCurrentView}
                  onOpenPhotoLightbox={(p) => setActiveLightboxPhoto(p)}
                  selectedPhotoIds={selectedPhotoIds}
                  togglePhotoSelection={handleTogglePhotoSelection}
                  currentUser={currentUser}
                />
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 max-w-md mx-auto my-12 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">ยังไม่มีรูปภาพในคลัง</h3>
                  <p className="text-xs text-slate-500">เริ่มต้นสร้างอัลบั้มแรกและนำเข้ารูปภาพ</p>
                  <button
                    onClick={() => setIsCreateAlbumOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ สร้างอัลบั้มใหม่</span>
                  </button>
                </div>
              )
            )}

            {currentView === 'share-qr' && (
              selectedAlbum ? (
                <ShareQrView
                  album={selectedAlbum}
                  albums={albums}
                  setSelectedAlbum={setSelectedAlbum}
                  setCurrentView={setCurrentView}
                  currentUser={currentUser}
                  onOpenPublicPreview={(token) => setPublicShareToken(token)}
                />
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 max-w-md mx-auto my-12 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">ยังไม่มีอัลบั้มสำหรับแชร์</h3>
                  <p className="text-xs text-slate-500">สร้างอัลบั้มภาพกิจกรรมใหม่ก่อนจึงจะสามารถสร้างลิงก์แชร์และ QR Code ได้</p>
                  <button
                    onClick={() => setIsCreateAlbumOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ สร้างอัลบั้มใหม่</span>
                  </button>
                </div>
              )
            )}

            {currentView === 'reports' && (
              <DashboardView
                albums={albums}
                topLinks={[]}
                recentActivities={recentActivities}
                setCurrentView={setCurrentView}
                setSelectedAlbum={setSelectedAlbum}
                onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
                searchQuery={searchQuery}
                currentUser={currentUser}
                onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
              />
            )}

            {currentView === 'login-states' && (
              <LoginAndStatesView
                setCurrentView={setCurrentView}
                albums={albums}
                setSelectedAlbum={setSelectedAlbum}
                onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
                currentUser={currentUser}
                onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
              />
            )}
          </main>
        </div>
      )}

      {/* Floating Batch Action Dock */}
      {!isMobileMockup && (
        <BatchActionDock
          selectedCount={selectedPhotoIds.length}
          onClearSelection={handleClearSelection}
          onDownloadSelected={handleDownloadSelected}
          onSetCover={handleSetCover}
          onMoveAlbum={handleMoveAlbum}
          onDeleteSelected={handleDeleteSelected}
        />
      )}

      {/* Photo Fullscreen Lightbox Modal */}
      <PhotoLightboxModal
        photo={activeLightboxPhoto}
        onClose={() => setActiveLightboxPhoto(null)}
        onPrev={handlePrevPhoto}
        onNext={handleNextPhoto}
      />

      {/* Create Album Modal */}
      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={() => setIsCreateAlbumOpen(false)}
        onCreateAlbum={handleCreateAlbum}
      />

      {/* Gmail / Google Auth Modal */}
      <GmailAuthModal
        isOpen={isGmailAuthOpen}
        onClose={() => setIsGmailAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
