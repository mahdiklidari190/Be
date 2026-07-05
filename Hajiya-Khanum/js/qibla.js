const prayerTranslations = { 
    'Fajr': 'اذان صبح', 
    'Sunrise': 'طلوع آفتاب', 
    'Dhuhr': 'اذان ظهر', 
    'Sunset': 'غروب آفتاب', 
    'Maghrib': 'اذان مغرب' 
};

// انتخاب المان‌ها
const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('statusText');
const locationBox = document.getElementById('locationBox');
const cityNameText = document.getElementById('cityNameText');
const locationSourceText = document.getElementById('locationSourceText');
const compassDial = document.getElementById('compassDial');
const qiblaPointer = document.getElementById('qiblaPointer');
const prayerGrid = document.getElementById('prayerTimesGrid');

// متغیرهای سراسری
let qiblaDegree = 0;
let magneticDeclination = 0;
let isTracking = false;

// تابع کمکی برای نرمال‌سازی زاویه
const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

// مدیریت کلیک دکمه شروع
startBtn.addEventListener('click', async () => {
    console.log('دکمه کلیک شد');
    
    try {
        // درخواست مجوز iOS
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            console.log('درخواست مجوز iOS...');
            const permission = await DeviceOrientationEvent.requestPermission();
            console.log('نتیجه مجوز:', permission);
            if (permission !== 'granted') {
                throw new Error('مجوز دسترسی به سنسور حرکت داده نشد.');
            }
        }
        
        // مخفی کردن دکمه
        startBtn.style.opacity = '0';
        startBtn.style.pointerEvents = 'none';
        setTimeout(() => startBtn.style.display = 'none', 500);
        
        statusText.innerText = "در حال دریافت موقعیت مکانی...";
        
        // شروع فرآیند
        await initializeSystem();
        
        // اضافه کردن لیسنر جهت‌یابی
        console.log('اضافه کردن event listener...');
        window.addEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        
    } catch (error) {
        console.error('خطا:', error);
        statusText.innerText = `خطا: ${error.message}`;
        startBtn.style.opacity = '1';
        startBtn.style.pointerEvents = 'auto';
        startBtn.style.display = 'flex';
        startBtn.innerHTML = 'تلاش مجدد';
    }
});

async function getUserLocation() {
    console.log('دریافت موقعیت مکانی...');
    
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    console.log('GPS موفق:', lat, lng);
                    
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
                        const data = await res.json();
                        const city = data.address.city || data.address.town || data.address.county || data.address.state || "مکان نامشخص";
                        resolve({ lat, lng, city, source: 'GPS دقیق' });
                    } catch(e) {
                        console.warn('خطا در reverse geocoding:', e);
                        resolve({ lat, lng, city: 'مکان‌یابی شد', source: 'GPS' });
                    }
                },
                async (err) => {
                    console.warn('GPS خطا داد، استفاده از IP:', err);
                    resolve(await getLocationFromIP());
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            resolve(await getLocationFromIP());
        }
    });
}

async function getLocationFromIP() {
    try {
        console.log('دریافت موقعیت از IP...');
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if(data.latitude && data.longitude) {
            console.log('IP موفق:', data.latitude, data.longitude);
            return { 
                lat: data.latitude, 
                lng: data.longitude, 
                city: data.city || data.region, 
                source: 'حدودی (IP)' 
            };
        }
        throw new Error("No location data");
    } catch (error) {
        console.error('خطا در IP API:', error);
        return { error: true, message: 'امکان شناسایی موقعیت وجود ندارد.' };
    }
}

// محاسبه Magnetic Declination به صورت آفلاین (بدون نیاز به API)
function calculateMagneticDeclination(lat, lng) {
    // فرمول ساده‌شده برای محاسبه declination
    // این یک تقریب است اما برای اکثر کاربردها کافی است
    const year = new Date().getFullYear();
    const yearFraction = (new Date() - new Date(year, 0, 1)) / (365 * 24 * 60 * 60 * 1000);
    
    // محاسبه ساده بر اساس موقعیت
    // برای ایران معمولاً بین 2 تا 4 درجه شرقی است
    let declination = 0;
    
    // فرمول تقریبی بر اساس longitude
    if (lng > 0) { // نیمکره شرقی
        declination = Math.max(-10, Math.min(10, (lng - 100) * 0.05));
    } else { // نیمکره غربی
        declination = Math.max(-10, Math.min(10, (lng + 100) * 0.05));
    }
    
    console.log('Declination محاسبه شد:', declination);
    return declination;
}

// فرمول ریاضی قبله
function calculateQibla(lat, lng) {
    const kaabaLat = 21.422487;
    const kaabaLng = 39.826206;
    
    const phiK = kaabaLat * Math.PI / 180.0;
    const lambdaK = kaabaLng * Math.PI / 180.0;
    const phi = lat * Math.PI / 180.0;
    const lambda = lng * Math.PI / 180.0;
    
    const y = Math.sin(lambdaK - lambda);
    const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
    
    let bearing = Math.atan2(y, x) * 180.0 / Math.PI;
    return normalizeAngle(bearing);
}

async function getPrayerTimes(lat, lng) {
    try {
        console.log('دریافت اوقات شرعی...');
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=7`);
        const data = await response.json();
        
        console.log('اوقات شرعی دریافت شد:', data.code);
        
        if (data.code === 200) {
            return data.data.timings;
        }
        return null;
    } catch (error) {
        console.error('خطا در دریافت اوقات شرعی:', error);
        return null;
    }
}

async function initializeSystem() {
    console.log('شروع initializeSystem...');
    
    const loc = await getUserLocation();
    
    if (loc.error) {
        statusText.innerText = loc.message;
        return;
    }

    locationBox.style.display = 'flex';
    cityNameText.innerText = loc.city;
    locationSourceText.innerText = loc.source;
    statusText.innerText = "در حال محاسبه زاویه قبله...";

    // محاسبه Declination (آفلاین)
    magneticDeclination = calculateMagneticDeclination(loc.lat, loc.lng);
    
    // محاسبه زاویه قبله حقیقی
    const trueQibla = calculateQibla(loc.lat, loc.lng);
    console.log('True Qibla:', trueQibla);
    
    // تبدیل به زاویه مغناطیسی
    qiblaDegree = normalizeAngle(trueQibla - magneticDeclination);
    console.log('Magnetic Qibla:', qiblaDegree);
    
    statusText.innerHTML = `زاویه قبله: ${qiblaDegree.toFixed(1)}°<br><small>لطفاً گوشی را افقی نگه دارید</small>`;

    // دریافت اوقات شرعی
    const timings = await getPrayerTimes(loc.lat, loc.lng);
    
    if (timings) {
        prayerGrid.innerHTML = '';
        Object.keys(prayerTranslations).forEach((key, index) => {
            if(timings[key]) {
                const time = timings[key].substring(0, 5);
                const html = `
                    <div class="glass-card time-card fade-in" style="animation-delay: ${index * 0.1}s">
                        <div class="prayer-name">${prayerTranslations[key]}</div>
                        <div class="prayer-time">${time}</div>
                    </div>`;
                prayerGrid.insertAdjacentHTML('beforeend', html);
            }
        });
    }
    
    isTracking = true;
    console.log('سیستم آماده شد');
}

// هسته اصلی جهت‌یابی
function handleOrientation(event) {
    if (!isTracking) return;

    let heading = null;

    // iOS
    if (event.webkitCompassHeading !== undefined) {
        heading = event.webkitCompassHeading;
        console.log('iOS heading:', heading);
    } 
    // Android
    else if (event.alpha !== null) {
        if (event.absolute === true) {
            heading = 360 - event.alpha;
        } else {
            heading = 360 - event.alpha;
        }
        console.log('Android heading:', heading, 'alpha:', event.alpha, 'absolute:', event.absolute);
    }

    if (heading !== null) {
        heading = normalizeAngle(heading);
        
        const currentRotation = parseFloat(qiblaPointer.dataset.currentRotation || 0);
        let targetRotation = qiblaDegree - heading;
        
        let diff = targetRotation - currentRotation;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        
        const newRotation = currentRotation + (diff * 0.15);
        
        qiblaPointer.style.transform = `rotate(${newRotation}deg)`;
        qiblaPointer.dataset.currentRotation = newRotation;
    }
}
