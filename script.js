// ═══════════════════════════════════════════════════════════════
// WEDDING CONFIGURATION (DEFAULT FALLBACK)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
    // Arabic Config
    groomName: 'محمد',
    brideName: 'ندى',
    
    // Henna
    hennaDate: 'الخميس ٣ / ٩',
    hennaLocation: 'في بيت العروسة',
    
    // Wedding
    weddingDay: 'يوم الجمعة',
    weddingDateArabic: 'الموافق ٤ / ٩',
    weddingTime: 'من ٥ ل ٨ مساءً',
    venueName: 'قاعة إيزابيلا',
    venueAddress: 'أمام بنزينة الحصري',
    
    storyText1: 'في لحظة لم نكن نتوقعها، جمعنا القدر ليبدأ فصل جديد من حياتنا معاً. من أول نظرة إلى هذا اليوم، كانت رحلتنا مليئة بالحب والأمل والأحلام المشتركة.',
    storyText2: 'واليوم، نبدأ حكاية جديدة... ونسعد بمشاركتكم هذه اللحظة.',
    
    // English Config
    groomNameEn: 'Mohamed',
    brideNameEn: 'Nada',
    
    // Henna En
    hennaDateEn: 'Thursday, Sept 3',
    hennaLocationEn: 'At the Bride\'s House',
    
    // Wedding En
    weddingDayEn: 'Friday',
    weddingDateEn: 'September 4',
    weddingTimeEn: '5:00 PM to 8:00 PM',
    venueNameEn: 'Isabella Hall',
    venueAddressEn: 'In front of El Hosary Gas Station',
    
    storyText1En: 'In a moment we never expected, destiny brought us together to start a new chapter in our lives. From the first glance to this day, our journey has been filled with love, hope, and shared dreams.',
    storyText2En: 'Today, we start a new story... and we are delighted to share this moment with you.',

    // General Config
    weddingDate: '2026-09-04T17:00:00',
    googleMapsURL: 'https://maps.google.com/?q=Isabella+Hall',
};

let WEDDING_CONFIG = { ...DEFAULT_CONFIG };

// ═══════════════════════════════════════════════════════════════
// MULTILINGUAL (i18n) DICTIONARY
// ═══════════════════════════════════════════════════════════════
const i18n = {
    "opening-subtitle": { ar: "يسعدنا أن نشارككم فرحتنا", en: "We are delighted to share our joy with you" },
    "open-btn": { ar: "افتح الدعوة", en: "Open Invitation" },
    "hero-subtitle": { ar: "دعوة زفاف", en: "Wedding Invitation" },
    "details-title": { ar: "تفاصيل الحفل", en: "Event Details" },
    "henna-title": { ar: "يوم الحنة", en: "Henna Day" },
    "wedding-title": { ar: "حفل الزفاف", en: "Wedding Day" },
    "map-btn": { ar: "موقع حفل الزفاف على الخريطة", en: "Wedding Location on Map" },
    "countdown-title": { ar: "العد التنازلي للزفاف", en: "Countdown to Wedding" },
    "days": { ar: "يوم", en: "Days" },
    "hours": { ar: "ساعة", en: "Hours" },
    "minutes": { ar: "دقيقة", en: "Minutes" },
    "seconds": { ar: "ثانية", en: "Seconds" },
    "countdown-complete": { ar: "اليوم هو يوم فرحتنا", en: "Today is our special day!" },
    "story-title": { ar: "قصتنا", en: "Our Story" },
    "venue-title": { ar: "مكان الزفاف", en: "Wedding Venue" },
    "venue-btn": { ar: "افتح الموقع", en: "Open Location" },
    "footer-msg": { ar: "بكل الحب ننتظركم لنشارككم أجمل لحظاتنا", en: "With love, we wait to share our most beautiful moments with you" },
    "footer-copy": { ar: "صُنع بكل حب 💛", en: "Made with love 💛" }
};

let currentLang = localStorage.getItem('weddingLang') || 'ar';

window.toggleLanguage = function() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('weddingLang', currentLang);
    applyLanguage();
}

function applyLanguage() {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = i18n[key][currentLang];
            } else {
                el.textContent = i18n[key][currentLang];
            }
        }
    });
    
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.textContent = currentLang === 'ar' ? 'English' : 'عربي';
    }
    
    applyConfigToHTML();
}

// ═══════════════════════════════════════════════════════════════
// DATABASE INTEGRATION (IndexedDB)
// ═══════════════════════════════════════════════════════════════
const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('WeddingDB', 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore('data');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

async function getDB(key) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('data', 'readonly');
        const req = tx.objectStore('data').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = reject;
    });
}

// ═══════════════════════════════════════════════════════════════
// APPLICATION INITIALIZATION
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const savedConfig = await getDB('weddingConfig');
        const savedImages = await getDB('weddingImages');
        const savedMusic = await getDB('weddingMusic');
        
        if (savedConfig) {
            // Fix cached 2025 date to 2026 so countdown works
            if (savedConfig.weddingDate === '2025-09-04T17:00:00' || savedConfig.weddingDate === '2025-08-15T20:00:00') {
                savedConfig.weddingDate = '2026-09-04T17:00:00';
            }
            WEDDING_CONFIG = { ...DEFAULT_CONFIG, ...savedConfig };
        }
        if (savedImages) applyImagesToHTML(savedImages);
        if (savedMusic) {
            const audioEl = document.getElementById('bgMusic');
            if (audioEl) audioEl.src = savedMusic;
        }
    } catch (err) {
        console.warn("Could not load from IndexedDB. Using defaults.", err);
    }
    initWeddingApp();
});

function initWeddingApp() {
    applyLanguage(); // This calls applyConfigToHTML
    initOpeningScreen();
    initMusicControl();
    initScrollAnimations();
    initSmoothScroll();
    initHeroParallax();
}

// ═══════════════════════════════════════════════════════════════
// APPLY CONFIGURATION & IMAGES TO HTML
// ═══════════════════════════════════════════════════════════════
function applyImagesToHTML(images) {
    if (images.hero) document.getElementById('hero').style.backgroundImage = `url('${images.hero}')`;
    if (images.couple) {
        const coupleImg = document.querySelector('.story-image');
        if (coupleImg) coupleImg.src = images.couple;
    }
    if (images.venue) document.getElementById('venue').style.backgroundImage = `url('${images.venue}')`;
}

function applyConfigToHTML() {
    const isAr = currentLang === 'ar';
    const groom = isAr ? WEDDING_CONFIG.groomName : WEDDING_CONFIG.groomNameEn;
    const bride = isAr ? WEDDING_CONFIG.brideName : WEDDING_CONFIG.brideNameEn;
    
    // Henna
    const hDate = isAr ? WEDDING_CONFIG.hennaDate : WEDDING_CONFIG.hennaDateEn;
    const hLoc = isAr ? WEDDING_CONFIG.hennaLocation : WEDDING_CONFIG.hennaLocationEn;
    
    // Wedding
    const day = isAr ? WEDDING_CONFIG.weddingDay : WEDDING_CONFIG.weddingDayEn;
    const date = isAr ? WEDDING_CONFIG.weddingDateArabic : WEDDING_CONFIG.weddingDateEn;
    const time = isAr ? WEDDING_CONFIG.weddingTime : WEDDING_CONFIG.weddingTimeEn;
    const vName = isAr ? WEDDING_CONFIG.venueName : WEDDING_CONFIG.venueNameEn;
    const vAddress = isAr ? WEDDING_CONFIG.venueAddress : WEDDING_CONFIG.venueAddressEn;
    
    // Story
    const story1 = isAr ? WEDDING_CONFIG.storyText1 : WEDDING_CONFIG.storyText1En;
    const story2 = isAr ? WEDDING_CONFIG.storyText2 : WEDDING_CONFIG.storyText2En;

    const fullDateLine = `${day} ${date}`;

    // Names
    document.querySelectorAll('.groom-name').forEach(el => el.textContent = groom);
    document.querySelectorAll('.bride-name').forEach(el => el.textContent = bride);
    
    // Hero
    const heroDateEl = document.querySelector('.hero-date');
    if (heroDateEl) heroDateEl.textContent = fullDateLine;

    // Events Section
    document.querySelectorAll('.henna-date-text').forEach(el => el.textContent = hDate);
    document.querySelectorAll('.henna-location-text').forEach(el => el.textContent = hLoc);
    
    document.querySelectorAll('.wedding-date-text').forEach(el => el.textContent = fullDateLine);
    document.querySelectorAll('.wedding-time-text').forEach(el => el.textContent = time);
    document.querySelectorAll('.wedding-venue-text').forEach(el => el.textContent = `${vName} - ${vAddress}`);

    // Bottom Venue Section
    document.querySelectorAll('.venue-title-text').forEach(el => el.textContent = vName);
    document.querySelectorAll('.venue-address-text').forEach(el => el.textContent = vAddress);
    
    const venueDatetimeEl = document.querySelector('.venue-datetime');
    if (venueDatetimeEl) venueDatetimeEl.textContent = `${fullDateLine} - ${time}`;

    // Maps
    document.querySelectorAll('.map-link').forEach(el => {
        el.href = WEDDING_CONFIG.googleMapsURL;
    });

    // Story
    const storyParagraphs = document.querySelectorAll('.story-text p');
    if (storyParagraphs.length >= 2) {
        if (story1) storyParagraphs[0].textContent = story1;
        if (story2) storyParagraphs[1].textContent = story2;
    }
}

// ═══════════════════════════════════════════════════════════════
// OPENING SCREEN
// ═══════════════════════════════════════════════════════════════
function initOpeningScreen() {
    const openingScreen = document.getElementById('openingScreen');
    const openBtn = document.getElementById('openBtn');
    const mainContent = document.getElementById('mainContent');
    const bgMusic = document.getElementById('bgMusic');
    const musicControl = document.getElementById('musicControl');

    if (!openingScreen || !openBtn || !mainContent) return;

    if (musicControl) {
        musicControl.style.display = 'none';
    }

    openBtn.addEventListener('click', () => {
        openingScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        // Retrigger animations on main content load for better effect
        setTimeout(() => {
            initScrollAnimations();
        }, 100);

        if (musicControl) {
            musicControl.style.display = 'flex';
        }
        if (bgMusic) {
            bgMusic.play().then(() => {
                if (musicControl) musicControl.classList.add('playing');
            }).catch(err => {
                console.warn('Music autoplay blocked:', err.message);
            });
        }
        initCountdown();
    });
}

// ═══════════════════════════════════════════════════════════════
// MUSIC CONTROL
// ═══════════════════════════════════════════════════════════════
function initMusicControl() {
    const musicControl = document.getElementById('musicControl');
    const bgMusic = document.getElementById('bgMusic');

    if (!musicControl || !bgMusic) return;

    musicControl.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play();
            musicControl.classList.add('playing');
        } else {
            bgMusic.pause();
            musicControl.classList.remove('playing');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// COUNTDOWN TIMER
// ═══════════════════════════════════════════════════════════════
function initCountdown() {
    let cDate = new Date(WEDDING_CONFIG.weddingDate);
    // If date is invalid or in the past (by more than a day), automatically push it to next year so the user sees a working timer.
    if (isNaN(cDate.getTime()) || cDate.getTime() < new Date().getTime() - 86400000) {
        cDate.setFullYear(new Date().getFullYear() + 1);
    }
    
    const countDownDate = cDate.getTime();
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const gridEl = document.querySelector('.countdown-grid');
    const completeEl = document.getElementById('countdownComplete');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    let timerInterval;

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        if (distance < 0) {
            if (timerInterval) clearInterval(timerInterval);
            if (gridEl) gridEl.style.display = 'none';
            if (completeEl) completeEl.style.display = 'block';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.textContent = days < 10 ? '0' + days : days;
        hoursEl.textContent = hours < 10 ? '0' + hours : hours;
        minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
        secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// ═══════════════════════════════════════════════════════════════
// SCROLL ANIMATIONS (Intersection Observer)
// ═══════════════════════════════════════════════════════════════
function initScrollAnimations() {
    // Collect all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-up, .fade-right, .fade-left, .scale-up');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after revealing to animate only once
                // observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.15, // Trigger a bit later for a smoother feel
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL FOR ANCHOR LINKS
// ═══════════════════════════════════════════════════════════════
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// HERO PARALLAX (Desktop Only)
// ═══════════════════════════════════════════════════════════════
function initHeroParallax() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) return;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                heroSection.style.backgroundPositionY = `${scrolled * 0.4}px`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}
