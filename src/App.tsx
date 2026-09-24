import React, { useState, useEffect } from 'react';
import { 
  INITIAL_ALBUMS, 
  INITIAL_PHOTOS, 
  INITIAL_UPLOAD_QUEUE, 
  TOP_SHARED_LINKS, 
  RECENT_ACTIVITIES 
} from './data/mockData';
import { Album, Photo, UploadQueueItem, AppView, GmailUser } from './types';
import { 
  subscribeAlbums, 
  subscribePhotos, 
  saveAlbumToFirestore, 
  savePhotoToFirestore, 
  deletePhotoFromFirestore,
  setAlbumCoverPhoto,
  seedInitialDataIfEmpty,
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

const DEFAULT_GMAIL_USER: GmailUser = {
  name: 'Rajinibon TV (งานโสตฯ)',
  email: 'rajinibontv@rajinibon.ac.th',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  role: 'ผู้ดูแลระบบโสตทัศนูปกรณ์ & สื่อโทรทัศน์',
  department: 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์',
  organization: 'โรงเรียนราชินีบน',
  isStaff: true,
  signedInAt: 'วันนี้ 09:30 น.'
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(INITIAL_ALBUMS[0]);
  const [queue, setQueue] = useState<UploadQueueItem[]>(INITIAL_UPLOAD_QUEUE);
  
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

  // Subscribe to real-time Firestore albums & photos (project: picture edtech)
  useEffect(() => {
    seedInitialDataIfEmpty();
    const unsubAlbums = subscribeAlbums((remoteAlbums) => {
      if (remoteAlbums && remoteAlbums.length > 0) {
        setAlbums(remoteAlbums);
      }
    });

    const unsubPhotos = subscribePhotos((remotePhotos) => {
      if (remotePhotos && remotePhotos.length > 0) {
        setPhotos(remotePhotos);
      }
    });

    return () => {
      unsubAlbums();
      unsubPhotos();
    };
  }, []);

  // Selection and Lightbox
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(['p-smt-01', 'p-smt-02', 'p-smt-04', 'p-smt-05']);
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
    if (selectedPhotoIds.length > 0) {
      const photo = photos.find(p => p.id === selectedPhotoIds[0]);
      if (photo) {
        const updatedAlbum = { ...selectedAlbum, coverUrl: photo.url, coverDriveFileId: photo.driveFileId };
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
      setPhotos(prev => prev.filter(p => !idsToDelete.includes(p.id)));
      setSelectedPhotoIds([]);
      for (const pid of idsToDelete) {
        try {
          await deletePhotoFromFirestore(pid, selectedAlbum.id);
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
    const updated = { ...selectedAlbum, photoCount: selectedAlbum.photoCount + count };
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
                topLinks={TOP_SHARED_LINKS}
                recentActivities={RECENT_ACTIVITIES}
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
                topLinks={TOP_SHARED_LINKS}
                recentActivities={RECENT_ACTIVITIES}
                setCurrentView={setCurrentView}
                setSelectedAlbum={setSelectedAlbum}
                onOpenCreateAlbum={() => setIsCreateAlbumOpen(true)}
                searchQuery={searchQuery}
                currentUser={currentUser}
                onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
              />
            )}

            {currentView === 'album-detail' && (
              <AlbumDetailView
                album={selectedAlbum}
                photos={photos}
                onBack={() => setCurrentView('dashboard')}
                setCurrentView={setCurrentView}
                onOpenPhotoLightbox={(p) => setActiveLightboxPhoto(p)}
                selectedPhotoIds={selectedPhotoIds}
                togglePhotoSelection={handleTogglePhotoSelection}
              />
            )}

            {currentView === 'bulk-upload' && (
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
            )}

            {currentView === 'all-photos' && (
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
            )}

            {currentView === 'share-qr' && (
              <ShareQrView
                album={selectedAlbum}
                albums={albums}
                setSelectedAlbum={setSelectedAlbum}
                setCurrentView={setCurrentView}
                currentUser={currentUser}
                onOpenPublicPreview={(token) => setPublicShareToken(token)}
              />
            )}

            {currentView === 'reports' && (
              <DashboardView
                albums={albums}
                topLinks={TOP_SHARED_LINKS}
                recentActivities={RECENT_ACTIVITIES}
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
