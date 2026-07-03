const prayerTranslations = { 
    'Imsaak': 'اذان صبح', 
    'Sunrise': 'طلوع آفتاب', 
    'Midday': 'اذان ظهر', 
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

// مدیریت کلیک دکمه وسط
startBtn.addEventListener('click', async () => {
    try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') throw new Error('مجوز چرخش دستگاه داده نشد.');
        }
        
        startBtn.style.opacity = '0';
        setTimeout(() => startBtn.style.display = 'none', 300);
        
        statusText.innerText = "در حال تحلیل موقعیت مکانی شما...";
        
        await initializeSystem();
        
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        
    } catch (error) {
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

// محاسبه زاویه قبله با فرمول ریاضی (دقیق‌تر از API)
function calculateQibla(lat, lng) {
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
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

// دریافت اوقات شرعی از سرور ایرانی
async function getPrayerTimesFromIranAPI(lat, lng) {
    try {
        // استفاده از API آوینی (سرور داخلی ایران)
        const response = await fetch(`https://prayer.aviny.com/api/prayertimes/1`);
        const data = await response.json();
        
        // تبدیل به فرمت مورد نیاز
        return {
            Imsaak: data.Imsaak?.substring(0, 5) || '00:00',
            Sunrise: data.Sunrise?.substring(0, 5) || '00:00',
            Midday: data.Midday?.substring(0, 5) || '00:00',
            Sunset: data.Sunset?.substring(0, 5) || '00:00',
            Maghrib: data.Maghrib?.substring(0, 5) || '00:00'
        };
    } catch (error) {
        console.error('خطا در دریافت اوقات شرعی:', error);
        return null;
    }
}

async function initializeSystem() {
    const loc = await getUserLocation();
    
    if (loc.error) {
        statusText.innerText = loc.message;
        return;
    }

    locationBox.style.display = 'flex';
    cityNameText.innerText = loc.city;
    locationSourceText.innerText = loc.source;
    statusText.innerText = "در حال دریافت داده‌های نجومی...";

    // محاسبه زاویه قبله با فرمول ریاضی
    qiblaDegree = calculateQibla(loc.lat, loc.lng);
    
    // تنظیم اولیه عقربه
    qiblaPointer.style.transform = `rotate(${qiblaDegree}deg)`;
    statusText.innerHTML = `لطفاً گوشی خود را کاملاً افقی و موازی با زمین نگه دارید. (زاویه: ${qiblaDegree.toFixed(1)}°)`;

    // دریافت اوقات شرعی از سرور ایرانی
    const timings = await getPrayerTimesFromIranAPI(loc.lat, loc.lng);
    
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
}

// ✅ تابع اصلاح شده - فقط عقربه حرکت می‌کنه، صفحه ثابت
function handleOrientation(event) {
    let heading = null;
    
    // iOS
    if (event.webkitCompassHeading != null) {
        heading = event.webkitCompassHeading;
    } 
    // Android
    else if (event.alpha != null) {
        heading = 360 - event.alpha;
    }

    if (heading !== null) {
        // ❌ صفحه قطب‌نما ثابت می‌مونه
        // compassDial.style.transform = `rotate(${-heading}deg)`;
        
        // ✅ فقط عقربه قبله حرکت می‌کنه
        let qiblaAngle = qiblaDegree - heading;
        
        // نرمال‌سازی زاویه بین 0 تا 360
        qiblaAngle = ((qiblaAngle % 360) + 360) % 360;
        
        // آپدیت عقربه قبله
        qiblaPointer.style.transform = `rotate(${qiblaAngle}deg)`;
    }
}
