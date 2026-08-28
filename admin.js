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

// Check if server API is available
async function isServerAvailable() {
    try {
        const resp = await fetch('/config.json', { method: 'HEAD' });
        return resp.ok || resp.status === 404; // Server is running if we get any HTTP response
    } catch {
        return false;
    }
}

// Upload a file to the server
async function uploadFileToServer(endpoint, file) {
    const resp = await fetch(endpoint, {
        method: 'POST',
        body: file
    });
    if (!resp.ok) throw new Error('Upload failed: ' + resp.statusText);
    return resp.json();
}

// Default Data Fallbacks
const DEFAULT_CONFIG = {
    groomName: 'إبراهيم', brideName: 'منة الله',
    henMennate: 'الخميس ٣ / ٩', hennaLocation: 'في بيت العروسة',
    weddingDay: 'يوم الجمعة', weddingDateArabic: 'الموافق ٤ / ٩',
    weddingTime: 'من ٥ ل ٨ مساءً', venueName: 'قاعة إيزابيلا', venueAddress: 'أمام بنزينة الحصري',
    storyText1: 'في لحظة لم نكن نتوقعها، جمعنا القدر ليبدأ فصل جديد من حياتنا معاً. من أول نظرة إلى هذا اليوم، كانت رحلتنا مليئة بالحب والأمل والأحلام المشتركة.',
    storyText2: 'واليوم، نبدأ حكاية جديدة... ونسعد بمشاركتكم هذه اللحظة.',
    groomNameEn: 'Ibrahim', brideNameEn: 'Menna Allah',
    henMennateEn: 'Thursday, Sept 3', hennaLocationEn: 'At the Bride\'s House',
    weddingDayEn: 'Friday', weddingDateEn: 'September 4',
    weddingTimeEn: '5:00 PM to 8:00 PM', venueNameEn: 'Isabella Hall', venueAddressEn: 'In front of El Hosary Gas Station',
    storyText1En: 'In a moment we never expected, destiny brought us together to start a new chapter in our lives. From the first glance to this day, our journey has been filled with love, hope, and shared dreams.',
    storyText2En: 'Today, we start a new story... and we are delighted to share this moment with you.',
    weddingDate: '2026-09-04T17:00:00',
    googleMapsURL: 'https://maps.app.goo.gl/eGmUGw2Yaa2mb5wZ6'
};

// Authentication
function checkLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    if (user === 'admin' && pass === '156799') {
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

    // Try loading from config.json first, then IndexedDB
    let config = { ...DEFAULT_CONFIG };
    try {
        const resp = await fetch('config.json');
        if (resp.ok) {
            const fileConfig = await resp.json();
            config = { ...DEFAULT_CONFIG, ...fileConfig };
        }
    } catch (e) {
        // Fallback to IndexedDB
        const savedConfig = await getDB('weddingConfig');
        if (savedConfig) {
            config = { ...DEFAULT_CONFIG, ...savedConfig };
        }
    }

    const textFields = [
        'groomName', 'brideName', 'henMennate', 'hennaLocation',
        'weddingDay', 'weddingDateArabic', 'weddingTime', 'venueName', 'venueAddress',
        'storyText1', 'storyText2',
        'groomNameEn', 'brideNameEn', 'henMennateEn', 'hennaLocationEn',
        'weddingDayEn', 'weddingDateEn', 'weddingTimeEn', 'venueNameEn', 'venueAddressEn',
        'storyText1En', 'storyText2En', 'googleMapsURL'
    ];

    textFields.forEach(field => {
        const el = document.getElementById(field);
        if (el) el.value = config[field] || '';
    });

    if (config.weddingDate) {
        document.getElementById('weddingDate').value = config.weddingDate.substring(0, 16);
    }

    // Load image previews from IndexedDB (base64)
    const savedImages = await getDB('weddingImages');
    if (savedImages) {
        if (savedImages.hero) document.getElementById('heroPreview').src = savedImages.hero;
        if (savedImages.couple) document.getElementById('couplePreview').src = savedImages.couple;
        if (savedImages.venue) document.getElementById('venuePreview').src = savedImages.venue;
        if (savedImages.marquee1) {
            const el = document.getElementById('marquee1Preview');
            el.src = savedImages.marquee1;
            el.style.display = 'block';
        }
        if (savedImages.marquee2) {
            const el = document.getElementById('marquee2Preview');
            el.src = savedImages.marquee2;
            el.style.display = 'block';
        }
        if (savedImages.marquee3) {
            const el = document.getElementById('marquee3Preview');
            el.src = savedImages.marquee3;
            el.style.display = 'block';
        }
    }

    const savedMusic = await getDB('weddingMusic');
    if (savedMusic) {
        const audio = document.getElementById('musicPreview');
        audio.src = savedMusic;
        audio.style.display = 'block';
    }

    // Show file previews on selection
    setupImagePreview('heroImageInput', 'heroPreview');
    setupImagePreview('coupleImageInput', 'couplePreview');
    setupImagePreview('venueImageInput', 'venuePreview');
    setupImagePreview('marquee1Input', 'marquee1Preview');
    setupImagePreview('marquee2Input', 'marquee2Preview');
    setupImagePreview('marquee3Input', 'marquee3Preview');
});

function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.addEventListener('change', () => {
        if (input.files[0]) {
            const url = URL.createObjectURL(input.files[0]);
            preview.src = url;
            preview.style.display = 'block';
        }
    });
}

function showToast(message, isError) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Save Function
async function saveAll() {
    const btn = document.getElementById('saveBtn');
    const status = document.getElementById('saveStatus');
    btn.disabled = true;
    btn.textContent = 'جاري الحفظ...';
    status.textContent = '';

    try {
        // Collect text config
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
            const el = document.getElementById(field);
            if (el) config[field] = el.value.trim();
        });

        const dDate = document.getElementById('weddingDate').value;
        if (dDate) config.weddingDate = dDate;

        const serverAvailable = await isServerAvailable();

        // Save config
        if (serverAvailable) {
            await fetch('/api/save-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config, null, 4)
            });
            status.textContent = '✅ تم الحفظ على السيرفر (متاح لكل الأجهزة)';
        }
        // Always save to IndexedDB as well
        await saveDB('weddingConfig', config);

        // Save images
        let images = await getDB('weddingImages') || {};
        const imageMap = {
            heroImageInput: { key: 'hero', serverName: 'hero.jpg' },
            coupleImageInput: { key: 'couple', serverName: 'couple.jpg' },
            venueImageInput: { key: 'venue', serverName: 'venue.jpg' },
            marquee1Input: { key: 'marquee1', serverName: 'gallery-1.jpg' },
            marquee2Input: { key: 'marquee2', serverName: 'gallery-2.jpg' },
            marquee3Input: { key: 'marquee3', serverName: 'gallery-3.jpg' }
        };

        for (const [inputId, info] of Object.entries(imageMap)) {
            const file = document.getElementById(inputId).files[0];
            if (file) {
                // Save to server if available
                if (serverAvailable) {
                    await uploadFileToServer(`/api/save-image/${info.serverName}`, file);
                }
                // Also save to IndexedDB
                images[info.key] = await fileToBase64(file);
            }
        }
        await saveDB('weddingImages', images);

        // Save music
        const musicFile = document.getElementById('musicInput').files[0];
        if (musicFile) {
            if (serverAvailable) {
                await uploadFileToServer('/api/save-music/wedding.mp3', musicFile);
            }
            const musicData = await fileToBase64(musicFile);
            await saveDB('weddingMusic', musicData);
        }

        if (!serverAvailable) {
            status.textContent = '⚠️ السيرفر غير متاح - تم الحفظ محلياً فقط (على هذا الجهاز)';
        }

        showToast('تم الحفظ بنجاح! ✅', false);
    } catch (err) {
        console.error('Save error:', err);
        showToast('حدث خطأ أثناء الحفظ: ' + err.message, true);
        status.textContent = '❌ حدث خطأ';
    } finally {
        btn.disabled = false;
        btn.textContent = 'حفظ التعديلات | Save Changes';
    }
}
