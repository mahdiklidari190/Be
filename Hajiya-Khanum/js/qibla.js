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
const compassDial = document.getElementById('compassDial'); // اطمینان حاصل کنید این ID در HTML وجود دارد
const qiblaPointer = document.getElementById('qiblaPointer');
const prayerGrid = document.getElementById('prayerTimesGrid');

// متغیرهای سراسری
let qiblaDegree = 0;
let magneticDeclination = 0;
let isTracking = false;
let lastHeading = 0; // برای نرم کردن حرکت (Smoothing)

// تابع کمکی برای نرمال‌سازی زاویه بین 0 تا 360
const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

// تابع کمکی برای محاسبه اختلاف زاویه کوتاه‌ترین مسیر (برای چرخش نرم عقربه)
const getShortestRotation = (current, target) => {
    let diff = target - current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
};

// مدیریت کلیک دکمه شروع
startBtn.addEventListener('click', async () => {
    try {
        // 1. درخواست مجوز iOS (اجباری برای Safari/iOS 13+)
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') throw new Error('مجوز دسترسی به سنسور حرکت داده نشد.');
        }
        
        // مخفی کردن دکمه با انیمیشن
        startBtn.style.opacity = '0';
        startBtn.style.pointerEvents = 'none'; // جلوگیری از کلیک مجدد
        setTimeout(() => startBtn.style.display = 'none', 500);
        
        statusText.innerText = "در حال دریافت موقعیت مکانی دقیق...";
        
        // 2. شروع فرآیند اولیه‌سازی
        await initializeSystem();
        
        // 3. اضافه کردن لیسنر جهت‌یابی (فقط یکی، هوشمند)
        window.addEventListener('deviceorientation', handleOrientation, true);
        
    } catch (error) {
        console.error(error);
        statusText.innerText = `خطا: ${error.message}`;
        startBtn.style.opacity = '1';
        startBtn.style.pointerEvents = 'auto';
        startBtn.innerHTML = 'تلاش مجدد';
    }
});

async function getUserLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    // Reverse Geocoding
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
                        const data = await res.json();
                        const city = data.address.city || data.address.town || data.address.county || data.address.state || "مکان نامشخص";
                        resolve({ lat, lng, city, source: 'GPS دقیق' });
                    } catch(e) {
                        resolve({ lat, lng, city: 'مکان‌یابی شد', source: 'GPS (بدون نام شهر)' });
                    }
                },
                async (err) => {
                    console.warn("GPS failed, falling back to IP", err);
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
        // استفاده از سرویس جایگزین اگر ipapi محدودیت داشت
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if(data.latitude && data.longitude) {
             return { lat: data.latitude, lng: data.longitude, city: data.city || data.region, source: 'حدودی (IP)' };
        }
        throw new Error("No location data");
    } catch (error) {
        return { error: true, message: 'امکان شناسایی موقعیت وجود ندارد. لطفاً GPS را روشن کنید.' };
    }
}

// دریافت Declination از NOAA (دقیق‌ترین منبع)
async function getMagneticDeclination(lat, lng) {
    try {
        const year = new Date().getFullYear();
        // نکته: این API ممکن است CORS داشته باشد. اگر کار نکرد، از کتابخانه magnetic-declination-js استفاده کنید.
        // اینجا فرض می‌کنیم کار می‌کند یا مقدار پیش‌فرض برمی‌گرداند
        const response = await fetch(`https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${lat}&lon1=${lng}&year1=${year}&model=WMM&resultFormat=json`);
        const data = await response.json();
        return parseFloat(data[0]?.declination) || 0;
    } catch (error) {
        console.warn('Declination API Error, using 0', error);
        return 0; 
    }
}

// فرمول ریاضی قبله (Great Circle Bearing)
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
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        
        // Method 7 = University of Tehran (دقیق برای ایران)
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=7&adjustment=1`);
        const data = await response.json();
        
        if (data.code === 200) {
            return data.data.timings;
        }
        return null;
    } catch (error) {
        console.error('Prayer API Error:', error);
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
    statusText.innerText = "در حال محاسبه زاویه مغناطیسی...";

    // 1. دریافت Declination
    magneticDeclination = await getMagneticDeclination(loc.lat, loc.lng);
    
    // 2. محاسبه زاویه قبله حقیقی (True North)
    const trueQibla = calculateQibla(loc.lat, loc.lng);
    
    // 3. تبدیل به زاویه مغناطیسی (چون قطب‌نمای موبایل معمولاً شمال مغناطیسی را نشان می‌دهد مگر اینکه absolute باشد)
    // فرمول: Magnetic Bearing = True Bearing - Declination
    qiblaDegree = normalizeAngle(trueQibla - magneticDeclination);
    
    statusText.innerHTML = `زاویه قبله محاسبه شد.<br><small>لطفاً گوشی را افقی نگه دارید</small>`;

    // 4. دریافت اوقات شرعی
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
}

// هسته اصلی جهت‌یابی
function handleOrientation(event) {
    if (!isTracking) return;

    let heading = null;

    // --- تشخیص پلتفرم و نوع سنسور ---
    
    // 1. iOS (webkitCompassHeading همیشه شمال حقیقی را می‌دهد اگر Location Services روشن باشد)
    if (event.webkitCompassHeading !== undefined) {
        heading = event.webkitCompassHeading;
    } 
    // 2. اندروید و سایرین
    else if (event.alpha !== null) {
        // alpha: زاویه حول محور Z. 
        // در اندروید مدرن، اگر event.absolute == true باشد، یعنی شمال حقیقی است.
        // اگر false باشد، شمال مغناطیسی است.
        
        if (event.absolute === true) {
            // شمال حقیقی (نیاز به اصلاح Declination نداریم چون سیستم عامل انجام داده)
            // اما فرمول استاندارد وب: heading = 360 - alpha
            heading = 360 - event.alpha;
        } else {
            // شمال مغناطیسی (باید Declination را دستی اعمال کنیم)
            // ما qiblaDegree را قبلاً بر اساس مغناطیسی محاسبه کردیم، پس مستقیم مقایسه می‌کنیم
            heading = 360 - event.alpha;
            
            // نکته مهم: در برخی گوشی‌های قدیمی اندروید، alpha ممکن است نسبت به جهت شروع گوشی باشد نه شمال.
            // در این صورت نیاز به کالیبراسیون شکل 8 دارد که در وب قابل اجرا نیست.
            // فرض ما این است که مرورگر مدرن است.
        }
    }

    if (heading !== null) {
        heading = normalizeAngle(heading);
        
        // Smooth Movement (Interpolation) برای جلوگیری از لرزش
        // به جای پرش ناگهانی، به آرامی به سمت زاویه جدید می‌رویم
        const currentRotation = parseFloat(qiblaPointer.dataset.currentRotation || 0);
        
        // محاسبه زاویه نسبی عقربه نسبت به بالای گوشی
        // اگر heading = 0 (شمال) و qibla = 45، عقربه باید 45 درجه بچرخد
        let targetRotation = qiblaDegree - heading;
        
        // نرمال‌سازی برای چرخش کوتاه‌ترین مسیر
        // مثال: اگر از 350 به 10 برویم، نباید 340 درجه بچرخد، باید 20 درجه بچرخد
        let diff = targetRotation - currentRotation;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        
        const newRotation = currentRotation + (diff * 0.1); // ضریب 0.1 سرعت نرم شدن است
        
        qiblaPointer.style.transform = `rotate(${newRotation}deg)`;
        qiblaPointer.dataset.currentRotation = newRotation;
    }
}
