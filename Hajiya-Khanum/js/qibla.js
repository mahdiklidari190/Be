const prayerTranslations = { 'Fajr': 'اذان صبح', 'Sunrise': 'طلوع آفتاب', 'Dhuhr': 'اذان ظهر', 'Sunset': 'غروب آفتاب', 'Maghrib': 'اذان مغرب' };
    
    const startBtn = document.getElementById('startBtn');
    const statusText = document.getElementById('statusText');
    const locationBox = document.getElementById('locationBox');
    const cityNameText = document.getElementById('cityNameText');
    const locationSourceText = document.getElementById('locationSourceText');
    const compassDial = document.getElementById('compassDial');
    const qiblaPointer = document.getElementById('qiblaPointer');
    const prayerGrid = document.getElementById('prayerTimesGrid');

    // مدیریت کلیک دکمه وسط
    startBtn.addEventListener('click', async () => {
        try {
            // درخواست مجوز ژیروسکوپ برای iOS
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') throw new Error('مجوز چرخش دستگاه داده نشد.');
            }
            
            // مخفی کردن دکمه پس از کلیک
            startBtn.style.opacity = '0';
            setTimeout(() => startBtn.style.display = 'none', 300);
            
            statusText.innerText = "در حال تحلیل موقعیت مکانی شما...";
            
            await initializeSystem();
            
            // گوش دادن به چرخش گوشی
            window.addEventListener('deviceorientationabsolute', handleOrientation);
            window.addEventListener('deviceorientation', handleOrientation);
            
        } catch (error) {
            statusText.innerText = `خطا: ${error.message}`;
            startBtn.style.opacity = '1';
            startBtn.style.display = 'flex';
            startBtn.innerHTML = 'تلاش<br>مجدد';
        }
    });

    // استخراج لوکیشن با GPS و در صورت رد شدن از IP
    async function getUserLocation() {
        return new Promise(async (resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        try {
                            // دریافت نام شهر
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                            const data = await res.json();
                            const city = data.address.city || data.address.town || data.address.county || data.address.state || "مکان نامشخص";
                            resolve({ lat, lng, city, source: 'دریافت شده از سنسور GPS' });
                        } catch(e) {
                            resolve({ lat, lng, city: 'مکان‌یابی شد', source: 'دریافت شده از سنسور GPS' });
                        }
                    },
                    async () => resolve(await getLocationFromIP()), // در صورت رد GPS سراغ آی‌پی می‌رود
                    { enableHighAccuracy: true, timeout: 7000 }
                );
            } else {
                resolve(await getLocationFromIP());
            }
        });
    }

    // استخراج موقعیت از IP
    async function getLocationFromIP() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return { lat: data.latitude, lng: data.longitude, city: data.city || data.region, source: 'شناسایی شده از طریق IP' };
        } catch (error) {
            return { error: true, message: 'ارتباط با سرور مکان‌یاب برقرار نشد.' };
        }
    }

    // مقداردهی و محاسبه
    async function initializeSystem() {
        const loc = await getUserLocation();
        
        if (loc.error) {
            statusText.innerText = loc.message;
            return;
        }

        // نمایش باکس اطلاعات مکان در پایین
        locationBox.style.display = 'flex';
        cityNameText.innerText = loc.city;
        locationSourceText.innerText = loc.source;
        statusText.innerText = "در حال دریافت داده‌های نجومی...";

        // فراخوانی API های اوقات و قبله
        const [timesRes, qiblaRes] = await Promise.all([
            fetch(`https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lng}&method=8`),
            fetch(`https://api.aladhan.com/v1/qibla/${loc.lat}/${loc.lng}`)
        ]);

        const timesData = await timesRes.json();
        const qiblaData = await qiblaRes.json();

        // تنظیم زاویه عقربه مکه
        const qiblaDegree = qiblaData.data.direction;
        qiblaPointer.style.transform = `rotate(${qiblaDegree}deg)`;
        statusText.innerHTML = `لطفاً گوشی خود را کاملاً افقی و موازی با زمین نگه دارید. (زاویه: ${qiblaDegree.toFixed(1)}°)`;

        // رندر اوقات شرعی
        const timings = timesData.data.timings;
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

    // مدیریت چرخش قطب‌نما
    function handleOrientation(event) {
        let heading = null;
        if (event.webkitCompassHeading != null) {
            heading = event.webkitCompassHeading;
        } else if (event.alpha != null) {
            heading = 360 - event.alpha;
        }

        if (heading !== null) {
            compassDial.style.transform = `rotate(${-heading}deg)`;
        }
    }