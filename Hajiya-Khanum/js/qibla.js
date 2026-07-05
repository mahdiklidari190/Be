const prayerTranslations = { 
    'Fajr': 'اذان صبح', 
    'Sunrise': 'طلوع آفتاب', 
    'Dhuhr': 'اذان ظهر', 
    'Sunset': 'غروب آفتاب', 
    'Maghrib': 'اذان مغرب' 
};

const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('statusText');
const locationBox = document.getElementById('locationBox');
const cityNameText = document.getElementById('cityNameText');
const locationSourceText = document.getElementById('locationSourceText');
const compassDial = document.getElementById('compassDial');
const qiblaPointer = document.getElementById('qiblaPointer');
const prayerGrid = document.getElementById('prayerTimesGrid');

// متغیر سراسری برای ذخیره زاویه قبله
let qiblaDegree = 0;
let magneticDeclination = 0;
let currentRotation = 0; // برای حرکت نرم

// مدیریت کلیک دکمه وسط
startBtn.addEventListener('click', async () => {
    console.log('دکمه کلیک شد');
    
    try {
        // درخواست مجوز برای iOS
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') throw new Error('مجوز چرخش دستگاه داده نشد.');
        }
        
        startBtn.style.opacity = '0';
        setTimeout(() => startBtn.style.display = 'none', 300);
        
        statusText.innerText = "در حال تحلیل موقعیت مکانی شما...";
        
        await initializeSystem();
        
        // اضافه کردن event listener برای جهت‌یابی
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        
        console.log('Event listener اضافه شد');
        
    } catch (error) {
        console.error('خطا:', error);
        statusText.innerText = `خطا: ${error.message}`;
        startBtn.style.opacity = '1';
        startBtn.style.display = 'flex';
        startBtn.innerHTML = 'تلاش<br>مجدد';
    }
});

async function getUserLocation() {
    return new Promise(async (resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        const city = data.address.city || data.address.town || data.address.county || data.address.state || "مکان نامشخص";
                        resolve({ lat, lng, city, source: 'دریافت شده از سنسور GPS' });
                    } catch(e) {
                        resolve({ lat, lng, city: 'مکان‌یابی شد', source: 'دریافت شده از سنسور GPS' });
                    }
                },
                async () => resolve(await getLocationFromIP()),
                { enableHighAccuracy: true, timeout: 7000 }
            );
        } else {
            resolve(await getLocationFromIP());
        }
    });
}

async function getLocationFromIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return { lat: data.latitude, lng: data.longitude, city: data.city || data.region, source: 'شناسایی شده از طریق IP' };
    } catch (error) {
        return { error: true, message: 'ارتباط با سرور مکان‌یاب برقرار نشد.' };
    }
}

// محاسبه انحراف مغناطیسی (بدون نیاز به API)
function getMagneticDeclination(lat, lng) {
    // برای ایران معمولاً بین 2 تا 4 درجه شرقی است
    // این یک تخمین ساده است
    const declination = 3.0; // مقدار ثابت برای ایران
    console.log('Declination:', declination);
    return declination;
}

// محاسبه زاویه قبله با فرمول دقیق‌تر
function calculateQibla(lat, lng) {
    const kaabaLat = 21.422487;
    const kaabaLng = 39.826206;
    
    const lat1 = lat * Math.PI / 180;
    const lng1 = lng * Math.PI / 180;
    const lat2 = kaabaLat * Math.PI / 180;
    const lng2 = kaabaLng * Math.PI / 180;
    
    const dLng = lng2 - lng1;
    
    const x = Math.sin(dLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let bearing = Math.atan2(x, y) * 180 / Math.PI;
    return (bearing + 360) % 360;
}

// دریافت اوقات شرعی از AlAdhan API
async function getPrayerTimes(lat, lng) {
    try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=7`);
        const data = await response.json();
        
        if (data.code === 200) {
            const timings = data.data.timings;
            return {
                Fajr: timings.Fajr.substring(0, 5),
                Sunrise: timings.Sunrise.substring(0, 5),
                Dhuhr: timings.Dhuhr.substring(0, 5),
                Sunset: timings.Sunset.substring(0, 5),
                Maghrib: timings.Maghrib.substring(0, 5)
            };
        }
        return null;
    } catch (error) {
        console.error('خطا در دریافت اوقات شرعی:', error);
        return null;
    }
}

async function initializeSystem() {
    console.log('شروع initializeSystem');
    
    const loc = await getUserLocation();
    
    if (loc.error) {
        statusText.innerText = loc.message;
        return;
    }

    locationBox.style.display = 'flex';
    cityNameText.innerText = loc.city;
    locationSourceText.innerText = loc.source;
    statusText.innerText = "در حال دریافت داده‌های نجومی...";

    // دریافت انحراف مغناطیسی (بدون API)
    magneticDeclination = getMagneticDeclination(loc.lat, loc.lng);
    
    // محاسبه زاویه قبله
    qiblaDegree = calculateQibla(loc.lat, loc.lng);
    console.log('Qibla Degree:', qiblaDegree);
    
    // تنظیم اولیه عقربه
    qiblaPointer.style.transform = `rotate(${qiblaDegree}deg)`;
    currentRotation = qiblaDegree;
    statusText.innerHTML = `لطفاً گوشی خود را کاملاً افقی و موازی با زمین نگه دارید. (زاویه قبله: ${qiblaDegree.toFixed(1)}°)`;

    // دریافت اوقات شرعی
    const timings = await getPrayerTimes(loc.lat, loc.lng);
    
    if (!timings) {
        statusText.innerText = "خطا در دریافت اوقات شرعی";
        return;
    }

    // رندر اوقات شرعی
    prayerGrid.innerHTML = '';
    Object.keys(prayerTranslations).forEach((key, index) => {
        const time = timings[key];
        const html = `
            <div class="glass-card time-card fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="prayer-name">${prayerTranslations[key]}</div>
                <div class="prayer-time">${time}</div>
            </div>`;
        prayerGrid.insertAdjacentHTML('beforeend', html);
    });
    
    console.log('سیستم آماده شد');
}

// تابع جهت‌یابی با حرکت نرم
function handleOrientation(event) {
    let heading = null;
    
    // iOS: webkitCompassHeading شمال واقعی را می‌دهد
    if (event.webkitCompassHeading != null) {
        heading = event.webkitCompassHeading;
    } 
    // Android: alpha نسبت به شمال مغناطیسی است
    else if (event.alpha != null) {
        // اگر absolute باشد، یعنی نسبت به شمال واقعی است
        if (event.absolute) {
            heading = 360 - event.alpha;
        } else {
            // در غیر این صورت، باید declination را اضافه کنیم
            heading = 360 - event.alpha + magneticDeclination;
        }
    }

    if (heading !== null) {
        // نرمال‌سازی heading بین 0 تا 360
        heading = ((heading % 360) + 360) % 360;
        
        // محاسبه زاویه عقربه قبله نسبت به heading فعلی
        let targetAngle = qiblaDegree - heading;
        
        // نرمال‌سازی زاویه بین 0 تا 360
        targetAngle = ((targetAngle % 360) + 360) % 360;
        
        // حرکت نرم (Smooth rotation)
        let diff = targetAngle - currentRotation;
        
        // پیدا کردن کوتاه‌ترین مسیر چرخش
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        
        // حرکت تدریجی (0.15 = سرعت نرم شدن)
        currentRotation += diff * 0.15;
        
        // نرمال‌سازی نهایی
        currentRotation = ((currentRotation % 360) + 360) % 360;
        
        // آپدیت عقربه قبله
        qiblaPointer.style.transform = `rotate(${currentRotation}deg)`;
    }
}
