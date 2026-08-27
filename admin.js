// IndexedDB Setup
const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('WeddingDB', 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('data')) {
            db.createObjectStore('data');
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

async function saveDB(key, value) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('data', 'readwrite');
        const req = tx.objectStore('data').put(value, key);
        req.onsuccess = resolve;
        req.onerror = reject;
    });
}

async function getDB(key) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('data', 'readonly');
        const req = tx.objectStore('data').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = reject;
    });
}

// Convert File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Default Data Fallbacks (Mirroring script.js)
const DEFAULT_CONFIG = {
    groomName: 'إبراهيم', brideName: 'منه',
    henMennate: 'الخميس ٣ / ٩', hennaLocation: 'في بيت العروسة',
    weddingDay: 'يوم الجمعة', weddingDateArabic: 'الموافق ٤ / ٩',
    weddingTime: 'من ٥ ل ٨ مساءً', venueName: 'قاعة إيزابيلا', venueAddress: 'أمام بنزينة الحصري',
    storyText1: 'في لحظة لم نكن نتوقعها، جمعنا القدر ليبدأ فصل جديد من حياتنا معاً. من أول نظرة إلى هذا اليوم، كانت رحلتنا مليئة بالحب والأمل والأحلام المشتركة.',
    storyText2: 'واليوم، نبدأ حكاية جديدة... ونسعد بمشاركتكم هذه اللحظة.',
    groomNameEn: 'Ibrahim', brideNameEn: 'Menna',
    henMennateEn: 'Thursday, Sept 3', hennaLocationEn: 'At the Bride\'s House',
    weddingDayEn: 'Friday', weddingDateEn: 'September 4',
    weddingTimeEn: '5:00 PM to 8:00 PM', venueNameEn: 'Isabella Hall', venueAddressEn: 'In front of El Hosary Gas Station',
    storyText1En: 'In a moment we never expected, destiny brought us together to start a new chapter in our lives. From the first glance to this day, our journey has been filled with love, hope, and shared dreams.',
    storyText2En: 'Today, we start a new story... and we are delighted to share this moment with you.',
    weddingDate: '2026-09-04T17:00:00',
    googleMapsURL: 'https://maps.google.com/?q=Isabella+Hall'
};

// Authentication
function checkLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    // Default credentials (admin / 1234)
    if (user === 'admin' && pass === '1234') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanelContainer').style.display = 'block';
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// Load existing data
document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanelContainer').style.display = 'block';
    }

    let savedConfig = await getDB('weddingConfig') || {};
    const config = { ...DEFAULT_CONFIG, ...savedConfig };

    const textFields = [
        'groomName', 'brideName', 'henMennate', 'hennaLocation',
        'weddingDay', 'weddingDateArabic', 'weddingTime', 'venueName', 'venueAddress',
        'storyText1', 'storyText2',
        'groomNameEn', 'brideNameEn', 'henMennateEn', 'hennaLocationEn',
        'weddingDayEn', 'weddingDateEn', 'weddingTimeEn', 'venueNameEn', 'venueAddressEn',
        'storyText1En', 'storyText2En', 'googleMapsURL'
    ];

    textFields.forEach(field => {
        if (document.getElementById(field)) {
            document.getElementById(field).value = config[field] || '';
        }
    });

    if (config.weddingDate) {
        document.getElementById('weddingDate').value = config.weddingDate.substring(0, 16);
    }

    const savedImages = await getDB('weddingImages');
    if (savedImages) {
        if (savedImages.hero) document.getElementById('heroPreview').src = savedImages.hero;
        if (savedImages.couple) document.getElementById('couplePreview').src = savedImages.couple;
        if (savedImages.venue) document.getElementById('venuePreview').src = savedImages.venue;
    }

    const savedMusic = await getDB('weddingMusic');
    if (savedMusic) {
        const audio = document.getElementById('musicPreview');
        audio.src = savedMusic;
        audio.style.display = 'block';
    }
});

// Save Function
async function saveAll() {
    const textFields = [
        'groomName', 'brideName', 'henMennate', 'hennaLocation',
        'weddingDay', 'weddingDateArabic', 'weddingTime', 'venueName', 'venueAddress',
        'storyText1', 'storyText2',
        'groomNameEn', 'brideNameEn', 'henMennateEn', 'hennaLocationEn',
        'weddingDayEn', 'weddingDateEn', 'weddingTimeEn', 'venueNameEn', 'venueAddressEn',
        'storyText1En', 'storyText2En', 'googleMapsURL'
    ];
    
    let config = {};
    textFields.forEach(field => {
        if (document.getElementById(field)) {
            config[field] = document.getElementById(field).value.trim();
        }
    });

    const dDate = document.getElementById('weddingDate').value;
    if (dDate) config.weddingDate = dDate;

    await saveDB('weddingConfig', config);

    // Save Images
    let images = await getDB('weddingImages') || {};
    
    const heroFile = document.getElementById('heroImageInput').files[0];
    if (heroFile) images.hero = await fileToBase64(heroFile);

    const coupleFile = document.getElementById('coupleImageInput').files[0];
    if (coupleFile) images.couple = await fileToBase64(coupleFile);

    const venueFile = document.getElementById('venueImageInput').files[0];
    if (venueFile) images.venue = await fileToBase64(venueFile);

    const m1 = document.getElementById('marquee1Input').files[0];
    if (m1) images.marquee1 = await fileToBase64(m1);
    
    const m2 = document.getElementById('marquee2Input').files[0];
    if (m2) images.marquee2 = await fileToBase64(m2);
    
    const m3 = document.getElementById('marquee3Input').files[0];
    if (m3) images.marquee3 = await fileToBase64(m3);

    await saveDB('weddingImages', images);

    // Save Music
    const musicFile = document.getElementById('musicInput').files[0];
    if (musicFile) {
        const musicData = await fileToBase64(musicFile);
        await saveDB('weddingMusic', musicData);
    }

    const toast = document.getElementById('toast');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
