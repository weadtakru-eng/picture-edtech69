import { Album, Photo, UploadQueueItem, ActivityItem, TopSharedLink } from '../types';

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'smt-slt-2569',
    title: 'SMT-SLT กุลสตรีงามสง่า คู่คุณค่าความยั่งยืน ประจำปีการศึกษา 2569',
    academicYear: '2569',
    category: 'ห้องเรียนพิเศษ',
    date: '15 สิงหาคม 2569',
    photoCount: 428,
    views: 2419,
    downloads: 1245,
    fileSizeTotal: '2.45 GB',
    coverUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    accessLevel: 'public',
    isShared: true,
    shareUrl: 'https://album.school.ac.th/a/SMT-2569',
    description: 'ประมวลภาพกิจกรรมการนำเสนอโครงงานวิทยาศาสตร์ คณิตศาสตร์ และเทคโนโลยี ของนักเรียนห้องเรียนพิเศษ โครงการ SMT และ SLT ณ หอประชุมใหญ่เฉลิมพระเกียรติฯ พร้อมพิธีมอบเกียรติบัตรเชิดชูเกียรติแก่นักวิจัยรุ่นเยาว์',
    location: 'หอประชุมใหญ่เฉลิมพระเกียรติฯ',
    organizer: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    photographer: 'ฝ่ายโสตทัศนูปกรณ์และประชาสัมพันธ์',
    tags: ['SMT & SLT SPECIAL PROGRAM', 'วิทยาศาสตร์', 'นิทรรศการ', 'เกียรติบัตร', '4K RAW']
  },
  {
    id: 'mothers-day-2569',
    title: 'กิจกรรมวันแม่แห่งชาติ ประจำปี 2569',
    academicYear: '2569',
    category: 'งานพิธีการ',
    date: '12 สิงหาคม 2569',
    photoCount: 286,
    views: 3420,
    downloads: 890,
    fileSizeTotal: '1.82 GB',
    coverUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    accessLevel: 'public',
    isShared: true,
    shareUrl: 'https://album.school.ac.th/a/MOM-2569',
    description: 'พิธีถวายพระพรชัยมงคลและกิจกรรมมอบมาลัยกรแด่คุณแม่ ประจำปีการศึกษา 2569 ร่วมแสดงความกตัญญูกตเวทิตา',
    location: 'ลานอเนกประสงค์อาคารเรียนรวม',
    organizer: 'งานกิจกรรมพัฒนาผู้เรียนและฝ่ายกิจการนักเรียน',
    photographer: 'นายสุทธิพงศ์ มีสุข (โสตฯ)',
    tags: ['วันแม่แห่งชาติ', 'พิธีการ', 'ความกตัญญู']
  },
  {
    id: 'sports-day-2569',
    title: "การแข่งขันกรีฑาสีสัมพันธ์ 'ราชพฤกษ์เกมส์ 2569'",
    academicYear: '2569',
    category: 'กีฬา',
    date: '25 กรกฎาคม 2569',
    photoCount: 642,
    views: 5890,
    downloads: 1420,
    fileSizeTotal: '3.90 GB',
    coverUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    accessLevel: 'public',
    isShared: true,
    shareUrl: 'https://album.school.ac.th/a/RATCHAPHRUEK-2569',
    description: 'มหกรรมกีฬาและกรีฑาสีภายในโรงเรียน ขบวนพาเหรดเฉลิมพระเกียรติ เชียร์ลีดเดอร์ และการแข่งขันกรีฑารอบชิงชนะเลิศ',
    location: 'สนามกีฬาเฉลิมพระเกียรติฯ',
    organizer: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    photographer: 'ทีมโสตทัศนูปกรณ์และนักเรียนชมรมช่างภาพ',
    tags: ['ราชพฤกษ์เกมส์', 'กีฬาภายใน', 'เชียร์ลีดเดอร์', 'พาเหรด']
  },
  {
    id: 'wai-kru-2569',
    title: 'พิธีไหว้ครู ประจำปีการศึกษา 2569',
    academicYear: '2569',
    category: 'งานพิธีการ',
    date: '13 มิถุนายน 2569',
    photoCount: 315,
    views: 2150,
    downloads: 620,
    fileSizeTotal: '2.10 GB',
    coverUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
    accessLevel: 'public',
    isShared: true,
    shareUrl: 'https://album.school.ac.th/a/WAIKRU-2569',
    description: 'พิธีมอบพานดอกไม้ ธูปเทียน แด่คุณครูอาจารย์ น้อมรำลึกพระคุณและรับมอบทุนการศึกษาแก่นักเรียนเรียนดี',
    location: 'หอประชุมใหญ่เฉลิมพระเกียรติฯ',
    organizer: 'ฝ่ายวิชาการและกิจการนักเรียน',
    photographer: 'ฝ่ายโสตทัศนศึกษา',
    tags: ['พิธีไหว้ครู', 'กตัญญุตา', 'ทุนการศึกษา']
  },
  {
    id: 'parents-meeting-2569',
    title: 'การประชุมผู้ปกครองภาคเรียนที่ 1/2569',
    academicYear: '2569',
    category: 'กิจกรรมโรงเรียน',
    date: '28 พฤษภาคม 2569',
    photoCount: 194,
    views: 890,
    downloads: 310,
    fileSizeTotal: '1.20 GB',
    coverUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    accessLevel: 'password',
    accessCode: '123456',
    isShared: true,
    shareUrl: 'https://album.school.ac.th/a/PARENT-2569-SECURE',
    description: 'การประชุมผู้ปกครองเพื่อชี้แจงนโยบายการเรียนการสอน และระบบดูแลช่วยเหลือนักเรียนรายบุคคล (พื้นที่จำกัดสิทธิ์เฉพาะผู้ปกครอง)',
    location: 'หอประชุมและห้องเรียนประจำชั้น',
    organizer: 'ฝ่ายบริหารงานทั่วไปและงานแนะแนว',
    photographer: 'เจ้าหน้าที่โสตทัศนูปกรณ์',
    tags: ['ประชุมผู้ปกครอง', 'พื้นที่จำกัดสิทธิ์', 'PDPA']
  },
  {
    id: 'music-camp-2569',
    title: 'ค่ายพัฒนาทักษะวิชาการและดนตรีสากล',
    academicYear: '2569',
    category: 'กิจกรรมนักเรียน',
    date: '10 พฤษภาคม 2569',
    photoCount: 210,
    views: 640,
    downloads: 240,
    fileSizeTotal: '1.45 GB',
    coverUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1200&q=80',
    accessLevel: 'public',
    isShared: true,
    shareUrl: 'https://album.school.ac.th/a/MUSIC-CAMP-2569',
    description: 'การเข้าค่ายฝึกซ้อมวงดุริยางค์และวงออร์เคสตราโรงเรียน เตรียมความพร้อมสำหรับการประกวดระดับชาติ',
    location: 'ศูนย์ดนตรีและการแสดง อาคาร 4',
    organizer: 'กลุ่มสาระการเรียนรู้ศิลปะ (ดนตรี)',
    photographer: 'คุณกานดา ภักดีรัตน์',
    tags: ['ดนตรี', 'ค่ายเยาวชน', 'วงดุริยางค์']
  }
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    id: 'p-smt-01',
    albumId: 'smt-slt-2569',
    title: 'SMT_AWARD_01.JPG',
    filename: 'SMT_AWARD_01.JPG',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
    fileSize: '5.4 MB',
    dimensions: '6000x4000',
    is4K: true,
    categoryTag: 'มอบเกียรติบัตร & ภาพรวม',
    views: 842,
    downloads: 312,
    uploadedAt: '15 ส.ค. 2569 14:20',
    photographer: 'คุณกานดา ภักดีรัตน์',
    cameraInfo: {
      model: 'Sony Alpha 7 IV',
      lens: 'FE 24-70mm F2.8 GM II',
      iso: 400,
      aperture: 'f/2.8',
      shutter: '1/250s'
    },
    isFavorite: true
  },
  {
    id: 'p-smt-02',
    albumId: 'smt-slt-2569',
    title: 'LAB_EXP_048.JPG',
    filename: 'LAB_EXP_048.JPG',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
    fileSize: '4.9 MB',
    dimensions: '5472x3648',
    is4K: true,
    categoryTag: 'การนำเสนอโครงงาน SMT',
    views: 654,
    downloads: 240,
    uploadedAt: '15 ส.ค. 2569 14:21',
    photographer: 'คุณกานดา ภักดีรัตน์',
    cameraInfo: {
      model: 'Sony Alpha 7 IV',
      lens: 'FE 50mm F1.2 GM',
      iso: 200,
      aperture: 'f/1.8',
      shutter: '1/500s'
    },
    isFavorite: true
  },
  {
    id: 'p-smt-03',
    albumId: 'smt-slt-2569',
    title: 'TEACHER_CREW_01.JPG',
    filename: 'TEACHER_CREW_01.JPG',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    fileSize: '6.8 MB',
    dimensions: '6240x4160',
    is4K: true,
    categoryTag: 'พิธีเปิด & เวทีใหญ่',
    views: 520,
    downloads: 180,
    uploadedAt: '15 ส.ค. 2569 14:22',
    photographer: 'นายสุทธิพงศ์ มีสุข',
    cameraInfo: {
      model: 'Canon EOS R5',
      lens: 'RF 28-70mm F2L USM',
      iso: 320,
      aperture: 'f/4.0',
      shutter: '1/200s'
    }
  },
  {
    id: 'p-smt-04',
    albumId: 'smt-slt-2569',
    title: 'HYDRO_BOOTH_12.JPG',
    filename: 'HYDRO_BOOTH_12.JPG',
    url: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=600&q=80',
    fileSize: '4.1 MB',
    dimensions: '4800x3200',
    is4K: true,
    categoryTag: 'นิทรรศการ SLT',
    views: 410,
    downloads: 154,
    uploadedAt: '15 ส.ค. 2569 14:23',
    photographer: 'คุณกานดา ภักดีรัตน์',
    cameraInfo: {
      model: 'Sony Alpha 7 IV',
      lens: 'FE 24-70mm F2.8 GM II',
      iso: 250,
      aperture: 'f/2.8',
      shutter: '1/320s'
    },
    isFavorite: true
  },
  {
    id: 'p-smt-05',
    albumId: 'smt-slt-2569',
    title: 'AUDIENCE_VIP_03.JPG',
    filename: 'AUDIENCE_VIP_03.JPG',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    fileSize: '5.7 MB',
    dimensions: '6000x4000',
    is4K: true,
    categoryTag: 'พิธีเปิด & เวทีใหญ่',
    views: 390,
    downloads: 98,
    uploadedAt: '15 ส.ค. 2569 14:24',
    photographer: 'นายสุทธิพงศ์ มีสุข',
    cameraInfo: {
      model: 'Canon EOS R5',
      lens: 'RF 70-200mm F2.8L IS USM',
      iso: 800,
      aperture: 'f/2.8',
      shutter: '1/400s'
    },
    isFavorite: true
  },
  {
    id: 'p-smt-06',
    albumId: 'smt-slt-2569',
    title: 'ROBOTICS_DEMO_08.JPG',
    filename: 'ROBOTICS_DEMO_08.JPG',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
    fileSize: '4.8 MB',
    dimensions: '5184x3456',
    is4K: true,
    categoryTag: 'การนำเสนอโครงงาน SMT',
    views: 478,
    downloads: 165,
    uploadedAt: '15 ส.ค. 2569 14:25',
    photographer: 'คุณกานดา ภักดีรัตน์',
    cameraInfo: {
      model: 'Sony Alpha 7 IV',
      lens: 'FE 35mm F1.4 GM',
      iso: 160,
      aperture: 'f/2.0',
      shutter: '1/640s'
    }
  },
  {
    id: 'p-smt-07',
    albumId: 'smt-slt-2569',
    title: 'GRAD_CONGRATS_15.JPG',
    filename: 'GRAD_CONGRATS_15.JPG',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80',
    fileSize: '6.2 MB',
    dimensions: '6000x4000',
    is4K: true,
    categoryTag: 'มอบเกียรติบัตร & ภาพรวม',
    views: 780,
    downloads: 290,
    uploadedAt: '15 ส.ค. 2569 14:26',
    photographer: 'นายสุทธิพงศ์ มีสุข',
    cameraInfo: {
      model: 'Canon EOS R5',
      lens: 'RF 50mm F1.2L USM',
      iso: 100,
      aperture: 'f/1.4',
      shutter: '1/1000s'
    }
  },
  {
    id: 'p-smt-08',
    albumId: 'smt-slt-2569',
    title: 'CHEMISTRY_FLASK_03.JPG',
    filename: 'CHEMISTRY_FLASK_03.JPG',
    url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80',
    fileSize: '3.9 MB',
    dimensions: '4500x3000',
    is4K: true,
    categoryTag: 'การนำเสนอโครงงาน SMT',
    views: 520,
    downloads: 145,
    uploadedAt: '15 ส.ค. 2569 14:27',
    photographer: 'คุณกานดา ภักดีรัตน์',
    cameraInfo: {
      model: 'Sony Alpha 7 IV',
      lens: 'FE 90mm F2.8 Macro G OSS',
      iso: 200,
      aperture: 'f/2.8',
      shutter: '1/250s'
    }
  }
];

export const INITIAL_UPLOAD_QUEUE: UploadQueueItem[] = [
  {
    id: 'u-1',
    filename: 'SMT_Opening_Ceremony_Stage.JPG',
    fileSize: '12.4 MB',
    progress: 100,
    status: 'completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=300&q=80',
    exifReady: true
  },
  {
    id: 'u-2',
    filename: 'DSC_4901_Stage_Keynote.RAW',
    fileSize: '18.6 MB',
    progress: 74,
    status: 'uploading',
    speed: '21.2 MB/s',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'u-3',
    filename: 'Award_Trophy_Presentation.JPG',
    fileSize: '34.2 MB',
    progress: 42,
    status: 'uploading',
    speed: '17.8 MB/s',
    thumbnailUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'u-4',
    filename: 'Audience_Cheer_Section.RAW',
    fileSize: '9.8 MB',
    progress: 0,
    status: 'failed',
    errorMessage: 'การเชื่อมต่อเครือข่ายขาดหาย',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'u-5',
    filename: 'Exhibition_Booth_Robotics.JPG',
    fileSize: '14.1 MB',
    progress: 0,
    status: 'queued'
  },
  {
    id: 'u-6',
    filename: 'VIP_Guest_Speech_Prof.JPG',
    fileSize: '16.9 MB',
    progress: 0,
    status: 'queued'
  },
  {
    id: 'u-7',
    filename: 'Group_Photo_Student_Committee.JPG',
    fileSize: '28.5 MB',
    progress: 0,
    status: 'queued'
  },
  {
    id: 'u-8',
    filename: 'Atmosphere_Drone_Aerial_4K.DNG',
    fileSize: '22.0 MB',
    progress: 0,
    status: 'queued'
  }
];

export const TOP_SHARED_LINKS: TopSharedLink[] = [
  {
    id: '1',
    rank: 1,
    title: 'ราชพฤกษ์เกมส์ 2569',
    views: 5890,
    downloads: 1420,
    growth: '+24% สัปดาห์นี้',
    isPublic: true
  },
  {
    id: '2',
    rank: 2,
    title: 'วันแม่แห่งชาติ 2569',
    views: 3420,
    downloads: 890,
    growth: '+12% สัปดาห์นี้',
    isPublic: true
  },
  {
    id: '3',
    rank: 3,
    title: 'พิธีไหว้ครู 2569',
    views: 2150,
    downloads: 620,
    growth: 'คงที่',
    isPublic: true
  },
  {
    id: '4',
    rank: 4,
    title: 'SMT-SLT กุลสตรีงามสง่า',
    views: 1245,
    downloads: 310,
    growth: 'อัลบั้มใหม่',
    isPublic: true
  }
];

export const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'upload',
    title: 'อัปโหลดภาพเพิ่มเติม 48 รูป',
    albumTitle: 'อัลบั้ม SMT-SLT กุลสตรีงามสง่า',
    timeAgo: '15 นาทีที่แล้ว',
    user: 'คุณกานดา'
  },
  {
    id: 'act-2',
    type: 'share',
    title: 'สร้างลิงก์แชร์สาธารณะใหม่',
    albumTitle: 'กิจกรรมวันแม่แห่งชาติ 2569 (ความละเอียดสูง 4K)',
    timeAgo: '2 ชั่วโมงที่แล้ว',
    user: 'ครูอภิสิทธิ์'
  },
  {
    id: 'act-3',
    type: 'download',
    title: 'ดาวน์โหลดไฟล์ชุดสื่อประชาสัมพันธ์',
    albumTitle: 'ฝ่ายประชาสัมพันธ์ดาวน์โหลด ZIP (642 ไฟล์)',
    timeAgo: '4 ชั่วโมงที่แล้ว',
    user: 'IP สหวิทยาเขต',
    detail: 'ดาวน์โหลดความเร็ว 1Gbps ผ่านอินทราเน็ตโรงเรียน'
  },
  {
    id: 'act-4',
    type: 'security',
    title: 'เปลี่ยนรหัสผ่านการเข้าถึงอัลบั้ม',
    albumTitle: 'การประชุมผู้ปกครองภาคเรียนที่ 1/2569',
    timeAgo: 'เมื่อวาน 16:40 น.',
    user: 'คุณกานดา'
  },
  {
    id: 'act-5',
    type: 'backup',
    title: 'การสำรองข้อมูลรายวันเสร็จสมบูรณ์',
    albumTitle: 'Cloud Media Vault สำรองข้อมูล 14,850 รูป',
    timeAgo: '03:00 น.',
    user: 'ระบบอัตโนมัติ'
  }
];
