// ===== TOAST SYSTEM =====
const toastIcons = {
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};
function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-icon">${toastIcons[type]}</div><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div><button class="toast-close" onclick="this.parentElement.classList.add('hiding'); setTimeout(() => this.parentElement.remove(), 400);">×</button><div class="toast-progress" style="animation: toastProgress ${duration}ms linear forwards;"></div>`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 400); } }, duration);
}

// ===== TIMER =====
function gregorianToJalali(gy, gm, gd) {
    var g_d_m, jy, jm, jd, gy2, days;
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    gy2 = (gm > 2) ? (gy + 1) : gy;
    days = 355666 + (365 * gy) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) + (parseInt((gy2 + 399) / 400)) + gd + g_d_m[gm - 1];
    jy = -1595 + (33 * parseInt(days / 12053));
    days %= 12053;
    jy += 4 * parseInt(days / 1461);
    days %= 1461;
    if (days > 365) { jy += parseInt((days - 1) / 365); days = (days - 1) % 365; }
    jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
    jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return [jy, jm, jd];
}
const passingDate = new Date(2026, 5, 2, 8, 0, 0);
function updateTimer() {
    const now = new Date();
    const start = new Date(passingDate);
    const jalaliNow = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const jalaliStart = gregorianToJalali(start.getFullYear(), start.getMonth() + 1, start.getDate());
    let jYears = jalaliNow[0] - jalaliStart[0];
    let jMonths = jalaliNow[1] - jalaliStart[1];
    let jDays = jalaliNow[2] - jalaliStart[2];
    let hours = now.getHours() - start.getHours();
    let minutes = now.getMinutes() - start.getMinutes();
    let seconds = now.getSeconds() - start.getSeconds();
    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours < 0) { hours += 24; jDays--; }
    if (jDays < 0) {
        const prevJalaliMonth = jMonths === 0 ? 12 : jMonths;
        const prevJalaliYear = jMonths === 0 ? jalaliNow[0] - 1 : jalaliNow[0];
        let prevMonthDays;
        if (prevJalaliMonth <= 6) prevMonthDays = 31;
        else if (prevJalaliMonth <= 11) prevMonthDays = 30;
        else prevMonthDays = isJalaliLeap(prevJalaliYear) ? 30 : 29;
        jDays += prevMonthDays; jMonths--;
    }
    if (jMonths < 0) { jMonths += 12; jYears--; }
    document.getElementById('timer-years').innerText = jYears;
    document.getElementById('timer-months').innerText = jMonths;
    document.getElementById('timer-days').innerText = String(jDays).padStart(2, '0');
    document.getElementById('timer-hours').innerText = String(hours).padStart(2, '0');
    document.getElementById('timer-minutes').innerText = String(minutes).padStart(2, '0');
    document.getElementById('timer-seconds').innerText = String(seconds).padStart(2, '0');
}
function isJalaliLeap(jy) { const a = [1, 5, 9, 13, 17, 22, 26, 30]; return a.indexOf(jy % 33) !== -1; }
setInterval(updateTimer, 1000);
updateTimer();

// ===== REVEAL OBSERVER =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== CAROUSEL ENGINE =====
const carousels = {};

function initCarousel(type) {
    const container = document.getElementById(type + 'Carousel');
    const track = document.getElementById(type + 'Track');
    const dotsContainer = document.getElementById(type + 'Dots');
    let slides = track.querySelectorAll('.carousel-slide');
    
    let currentIndex = 0;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;
    let startTime = 0;
    let animationFrame = null;
    let hasDragged = false;
    let isHorizontalSwipe = false;

    function createDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < slides.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => goToSlide(i);
            dotsContainer.appendChild(dot);
        }
    }

    function updateCarousel() {
        track.style.transform = `translateX(${currentIndex * 100}%)`;
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => 
            dot.classList.toggle('active', i === currentIndex)
        );
    }

    function move(direction) {
        currentIndex = Math.max(0, Math.min(currentIndex + direction, slides.length - 1));
        updateCarousel();
    }

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    function calculateTransform(basePosition, dragPercent) {
        let newPosition = basePosition + dragPercent;
        const maxPosition = (slides.length - 1) * 100;
        
        if (newPosition > maxPosition) {
            const overflow = newPosition - maxPosition;
            newPosition = maxPosition + (overflow * 0.25);
        }
        
        if (newPosition < 0) {
            const overflow = -newPosition;
            newPosition = -(overflow * 0.25);
        }
        
        return newPosition;
    }

    function handleStart(e) {
        isDragging = true;
        hasDragged = false;
        isHorizontalSwipe = false;
        startTime = Date.now();
        
        if (e.type.includes('mouse')) {
            startX = e.clientX;
            startY = e.clientY;
        } else {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
        
        currentX = startX;
        track.style.transition = 'none';
        track.style.cursor = 'grabbing';
        
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    }

    function handleMove(e) {
        if (!isDragging) return;
        
        let clientX, clientY;
        if (e.type.includes('mouse')) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        currentX = clientX;
        const diffX = currentX - startX;
        const diffY = clientY - startY;
        
        // تشخیص جهت swipe
        if (!isHorizontalSwipe && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
        }
        
        if (Math.abs(diffX) > 5) {
            hasDragged = true;
        }
        
        // فقط اگر swipe افقی است، transform را اعمال کن
        if (isHorizontalSwipe) {
            const containerWidth = container.offsetWidth;
            const percentMove = (diffX / containerWidth) * 100;
            const basePosition = currentIndex * 100;
            const finalPosition = calculateTransform(basePosition, percentMove);
            
            animationFrame = requestAnimationFrame(() => {
                track.style.transform = `translateX(${finalPosition}%)`;
            });
            
            // جلوگیری از scroll عمودی فقط اگر قابل cancel است
            if (e.type === 'touchmove' && e.cancelable) {
                e.preventDefault();
            }
        }
    }

    function handleEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        
        track.style.transition = '';
        track.style.cursor = '';
        
        if (isHorizontalSwipe) {
            const diff = currentX - startX;
            const timeDiff = Date.now() - startTime;
            const threshold = container.offsetWidth * 0.15;
            const velocity = Math.abs(diff) / timeDiff;
            const isQuickSwipe = velocity > 0.5 && timeDiff < 300;
            
            if (Math.abs(diff) > threshold || isQuickSwipe) {
                if (diff > 0) {
                    move(1);
                } else {
                    move(-1);
                }
            } else {
                updateCarousel();
            }
        } else {
            updateCarousel();
        }
        
        // هیچ preventDefault در اینجا فراخوانی نمی‌شود
        // تا خطای cancelable=false رخ ندهد
    }

    // ===== EVENT LISTENERS =====
    
    track.addEventListener('touchstart', handleStart, { passive: true });
    track.addEventListener('touchmove', handleMove, { passive: false });
    track.addEventListener('touchend', handleEnd, { passive: true });
    track.addEventListener('touchcancel', handleEnd, { passive: true });
    
    track.addEventListener('mousedown', handleStart);
    track.addEventListener('mousemove', handleMove);
    track.addEventListener('mouseup', handleEnd);
    track.addEventListener('mouseleave', handleEnd);
    
    track.querySelectorAll('img').forEach(img => {
        img.addEventListener('dragstart', e => e.preventDefault());
    });

    // جلوگیری از کلیک بعد از drag افقی
    track.addEventListener('click', function(e) {
        if (hasDragged && isHorizontalSwipe) {
            e.preventDefault();
            e.stopPropagation();
            hasDragged = false;
            isHorizontalSwipe = false;
            return false;
        }
    }, true);

    createDots();
    updateCarousel();
    
    carousels[type] = { move, goToSlide, updateSlides: () => {
        slides = track.querySelectorAll('.carousel-slide');
        createDots();
        currentIndex = 0;
        updateCarousel();
    }};
}

function moveCarousel(type, direction) {
    if (carousels[type]) carousels[type].move(direction);
}

initCarousel('video');
initCarousel('photo');

// ===== VIDEO PLAYER =====
const videoModal = document.getElementById('videoPlayerModal');
const videoIframe = document.getElementById('customVideoIframe');
const videoTitleText = document.getElementById('videoTitleText');
let isVideoModalOpen = false;

function openCustomVideoPlayer(videoId, title = 'ویدیو') {
    videoIframe.src = `https://www.aparat.com/video/video/embed/videohash/${videoId}/vt/frame`;
    videoTitleText.innerText = title;
    videoModal.classList.remove('closing'); 
    videoModal.classList.add('active');
    isVideoModalOpen = true; 
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.querySelector('.video-close-btn').focus(), 100);
}

function closeCustomVideoPlayer() {
    if (!isVideoModalOpen) return;
    videoModal.classList.add('closing');
    setTimeout(() => { 
        videoIframe.src = ''; 
        videoModal.classList.remove('active', 'closing'); 
        isVideoModalOpen = false; 
        document.body.style.overflow = ''; 
    }, 300);
}

function handleModalBackdropClick(event) { 
    if (event.target === videoModal) closeCustomVideoPlayer(); 
}

document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape' && isVideoModalOpen) closeCustomVideoPlayer(); 
});

// ===== LIGHTBOX =====
function openLightbox(url) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-content').innerHTML = `<img src="${url}">`;
    lb.classList.add('show'); 
    document.body.style.overflow = 'hidden';
}

function closeLightbox() { 
    document.getElementById('lightbox').classList.remove('show'); 
    document.body.style.overflow = ''; 
}

function handleLightboxBackdropClick(event) { 
    if (event.target.id === 'lightbox') closeLightbox(); 
}

document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape' && document.getElementById('lightbox').classList.contains('show')) closeLightbox(); 
});

/* =========================================================
   Gallery & Videos Dynamic Loader
   ========================================================= */

(function () {
    'use strict';

    const DATA_URL = '/data/data.json';

    const SVG_PLAY = `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>`;
    const SVG_PLAY_LABEL = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    function createVideoSlide(video) {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide video-slide';
        
        // استفاده از flag برای جلوگیری از کلیک بعد از drag
        let slideClicked = false;
        let slideStartX = 0;
        let slideHasMoved = false;
        
        slide.addEventListener('touchstart', (e) => {
            slideStartX = e.touches[0].clientX;
            slideHasMoved = false;
            slideClicked = false;
        }, { passive: true });
        
        slide.addEventListener('touchmove', (e) => {
            if (Math.abs(e.touches[0].clientX - slideStartX) > 10) {
                slideHasMoved = true;
            }
        }, { passive: true });
        
        slide.addEventListener('touchend', () => {
            if (!slideHasMoved) {
                if (typeof openCustomVideoPlayer === 'function') {
                    openCustomVideoPlayer(video.id, video.title);
                }
            }
            slideHasMoved = false;
        });
        
        slide.addEventListener('click', (e) => {
            if (!slideHasMoved) {
                if (typeof openCustomVideoPlayer === 'function') {
                    openCustomVideoPlayer(video.id, video.title);
                }
            }
        });

        slide.innerHTML = `
            <img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}">
            <div class="video-play-overlay">
                <div class="video-play-btn">${SVG_PLAY}</div>
                <div class="video-play-label">
                    ${SVG_PLAY_LABEL}
                    <span>پخش ویدیو</span>
                </div>
            </div>
        `;
        return slide;
    }

    function createPhotoSlide(photo) {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide photo-slide';
        
        let slideStartX = 0;
        let slideHasMoved = false;
        
        slide.addEventListener('touchstart', (e) => {
            slideStartX = e.touches[0].clientX;
            slideHasMoved = false;
        }, { passive: true });
        
        slide.addEventListener('touchmove', (e) => {
            if (Math.abs(e.touches[0].clientX - slideStartX) > 10) {
                slideHasMoved = true;
            }
        }, { passive: true });
        
        slide.addEventListener('touchend', () => {
            if (!slideHasMoved) {
                if (typeof openLightbox === 'function') {
                    openLightbox(photo.src);
                }
            }
            slideHasMoved = false;
        });
        
        slide.addEventListener('click', (e) => {
            if (!slideHasMoved) {
                if (typeof openLightbox === 'function') {
                    openLightbox(photo.src);
                }
            }
        });
        
        slide.innerHTML = `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || 'Gallery')}">`;
        return slide;
    }

    function escapeHtml(str) {
        if (str === undefined || str === null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function loadVideos(videos) {
        const track = document.getElementById('videoTrack');
        if (!track || !Array.isArray(videos)) return;

        track.innerHTML = '';
        const fragment = document.createDocumentFragment();
        videos.forEach(v => fragment.appendChild(createVideoSlide(v)));
        track.appendChild(fragment);

        reinitCarousel('video');
    }

    function loadPhotos(photos) {
        const track = document.getElementById('photoTrack');
        if (!track || !Array.isArray(photos)) return;

        track.innerHTML = '';
        const fragment = document.createDocumentFragment();
        photos.forEach(p => fragment.appendChild(createPhotoSlide(p)));
        track.appendChild(fragment);

        reinitCarousel('photo');
    }

    function reinitCarousel(type) {
        try {
            if (carousels[type] && typeof carousels[type].updateSlides === 'function') {
                carousels[type].updateSlides();
            }
        } catch (e) {
            console.warn('Carousel reinit warning:', e);
        }
    }

    function start() {
        fetch(DATA_URL, { cache: 'no-store' })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok (' + response.status + ')');
                return response.json();
            })
            .then(data => {
                if (data.videos) loadVideos(data.videos);
                if (data.photos) loadPhotos(data.photos);
            })
            .catch(err => {
                console.error('Error loading gallery data:', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();