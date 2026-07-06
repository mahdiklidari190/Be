const CONFIG = Object.freeze({
    KAABA_COORDS: Object.freeze({ lat: 21.422487, lng: 39.826206 }),
    PRAYER_TRANSLATIONS: Object.freeze({
        'Fajr': 'اذان صبح',
        'Sunrise': 'طلوع آفتاب',
        'Dhuhr': 'اذان ظهر',
        'Sunset': 'غروب آفتاب',
        'Maghrib': 'اذان مغرب'
    }),
    API_ENDPOINTS: Object.freeze({
        ALADHAN: 'https://api.aladhan.com/v1/timings',
        NOMINATIM: 'https://nominatim.openstreetmap.org/reverse',
        IPAPI: 'https://ipapi.co/json/'
    }),
    ALADHAN_METHOD: 7,
    TIMEOUTS: Object.freeze({
        GEOLOCATION: 10000,
        FETCH: 8000
    }),
    CACHE_KEYS: Object.freeze({
        LOCATION: 'qibla_app_location',
        PRAYER_PREFIX: 'qibla_app_prayers_'
    }),
    CACHE_DURATION_MS: 24 * 60 * 60 * 1000,
    COMPASS: Object.freeze({
        SMOOTHING_FACTOR: 0.15,
        SPIKE_THRESHOLD_DEG: 45,
        HISTORY_SIZE: 5,
        FROZEN_TIMEOUT_MS: 5000
    })
});

const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;
const degToRad = (deg) => deg * (Math.PI / 180);
const radToDeg = (rad) => rad * (180 / Math.PI);

async function retryWithBackoff(fn, retries = 3, baseDelay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const msg = error.message || '';
            if (msg.includes('OFFLINE') || msg.includes('PERMISSION_DENIED') || 
                msg.includes('GPS_DISABLED') || msg.includes('COMPASS_PERMISSION')) {
                throw error;
            }
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, i)));
        }
    }
}

class StorageManager {
    static get(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp > CONFIG.CACHE_DURATION_MS) {
                localStorage.removeItem(key);
                return null;
            }
            return parsed.data;
        } catch {
            return null;
        }
    }

    static set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
        } catch { /* Ignore quota errors */ }
    }
}

class NetworkManager {
    static pendingRequests = new Map();

    static async fetchWithTimeout(url, options = {}, timeoutMs = CONFIG.TIMEOUTS.FETCH) {
        if (!navigator.onLine) {
            throw new Error('OFFLINE');
        }

        if (this.pendingRequests.has(url)) {
            return this.pendingRequests.get(url);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const requestPromise = fetch(url, { ...options, signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .catch((error) => {
                if (error.name === 'AbortError') throw new Error('Request timeout');
                throw error;
            })
            .finally(() => {
                clearTimeout(timeoutId);
                this.pendingRequests.delete(url);
            });

        this.pendingRequests.set(url, requestPromise);
        return requestPromise;
    }
}

class LocationService {
    static async getLocation() {
        const cached = StorageManager.get(CONFIG.CACHE_KEYS.LOCATION);

        try {
            const coords = await retryWithBackoff(() => this.getGPSCoordinates());
            
            if (cached) {
                const distance = this.calculateDistance(cached.lat, cached.lng, coords.lat, coords.lng);
                if (distance < 1) {
                    return { ...coords, city: cached.city, source: 'GPS' };
                }
            }
            
            const city = await retryWithBackoff(() => this.reverseGeocode(coords.lat, coords.lng));
            const result = { ...coords, city, source: 'GPS' };
            StorageManager.set(CONFIG.CACHE_KEYS.LOCATION, result);
            return result;
        } catch (error) {
            if (cached && (error.message === 'GPS_TIMEOUT' || error.message === 'OFFLINE')) {
                return { ...cached, source: 'حافظه پنهان (GPS در دسترس نبود)' };
            }
            
            try {
                const ipData = await retryWithBackoff(() => this.getIPLocation());
                const result = { ...ipData, source: 'IP' };
                StorageManager.set(CONFIG.CACHE_KEYS.LOCATION, result);
                return result;
            } catch (ipError) {
                throw error; 
            }
        }
    }

    static getGPSCoordinates() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error('Geolocation unsupported'));
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    if (err.code === err.PERMISSION_DENIED) {
                        reject(new Error('LOCATION_PERMISSION_DENIED'));
                    } else if (err.code === err.POSITION_UNAVAILABLE) {
                        reject(new Error('GPS_DISABLED'));
                    } else if (err.code === err.TIMEOUT) {
                        reject(new Error('GPS_TIMEOUT'));
                    } else {
                        reject(err);
                    }
                },
                { enableHighAccuracy: true, timeout: CONFIG.TIMEOUTS.GEOLOCATION, maximumAge: 0 }
            );
        });
    }

    static async reverseGeocode(lat, lng) {
        const data = await NetworkManager.fetchWithTimeout(
            `${CONFIG.API_ENDPOINTS.NOMINATIM}?format=json&lat=${lat}&lon=${lng}`
        );
        const addr = data.address || {};
        return addr.city || addr.town || addr.village || addr.county || addr.state || 'مکان نامشخص';
    }

    static async getIPLocation() {
        const data = await NetworkManager.fetchWithTimeout(CONFIG.API_ENDPOINTS.IPAPI);
        return {
            lat: data.latitude,
            lng: data.longitude,
            city: data.city || data.region || 'مکان نامشخص'
        };
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = degToRad(lat2 - lat1);
        const dLon = degToRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

class PrayerTimesService {
    static async getTimes(lat, lng) {
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const cacheKey = `${CONFIG.CACHE_KEYS.PRAYER_PREFIX}${dateKey}`;
        
        const cached = StorageManager.get(cacheKey);
        if (cached) return cached;

        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();

        const url = `${CONFIG.API_ENDPOINTS.ALADHAN}/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=${CONFIG.ALADHAN_METHOD}`;

        const data = await NetworkManager.fetchWithTimeout(url);
        if (data?.code === 200 && data?.data?.timings) {
            const t = data.data.timings;
            const result = {
                Fajr: t.Fajr?.substring(0, 5) || '--:--',
                Sunrise: t.Sunrise?.substring(0, 5) || '--:--',
                Dhuhr: t.Dhuhr?.substring(0, 5) || '--:--',
                Sunset: t.Sunset?.substring(0, 5) || '--:--',
                Maghrib: t.Maghrib?.substring(0, 5) || '--:--'
            };
            StorageManager.set(cacheKey, result);
            return result;
        }
        throw new Error('Invalid API structure');
    }
}

class QiblaCalculator {
    static calculate(lat, lng) {
        const phiK = degToRad(CONFIG.KAABA_COORDS.lat);
        const lambdaK = degToRad(CONFIG.KAABA_COORDS.lng);
        const phi = degToRad(lat);
        const lambda = degToRad(lng);
        const dLambda = lambdaK - lambda;

        const x = Math.sin(dLambda) * Math.cos(phiK);
        const y = Math.cos(phi) * Math.sin(phiK) - Math.sin(phi) * Math.cos(phiK) * Math.cos(dLambda);

        return normalizeAngle(radToDeg(Math.atan2(x, y)));
    }
}

class CompassService {
    constructor() {
        this.heading = 0;
        this.filteredHeading = 0;
        this.lastRawHeading = null;
        this.isAvailable = false;
        this.sensor = null;
        this.listeners = new Set();
        this.animationFrameId = null;
        this.isRunning = false;
        this.history = [];
        this.lastUpdateTime = Date.now();
        this.isFrozen = false;
        this.onCalibrationRequired = null;
        this.onRecovered = null;
        this.orientationHandler = null;
        
        this.handleSensorReading = this.handleSensorReading.bind(this);
        this.handleOrientationEvent = this.handleOrientationEvent.bind(this);
    }

    async initialize() {
        if (await this.tryGenericSensor()) return;
        if (await this.tryDeviceOrientation()) return;
        throw new Error('قطب‌نما در دسترس نیست. لطفاً گوشی خود را به شکل عدد 8 انگلیسی بچرخانید.');
    }

    async tryGenericSensor() {
        if (!('AbsoluteOrientationSensor' in window)) return false;
        try {
            this.sensor = new AbsoluteOrientationSensor({ frequency: 60, referenceFrame: 'screen' });
            this.sensor.addEventListener('reading', this.handleSensorReading);
            
            return new Promise((resolve) => {
                let resolved = false;
                const onFirstReading = () => {
                    if (!resolved) {
                        resolved = true;
                        this.isAvailable = true;
                        resolve(true);
                    }
                };
                this.sensor.addEventListener('reading', onFirstReading, { once: true });
                this.sensor.start();
                
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        this.sensor.stop();
                        this.sensor.removeEventListener('reading', this.handleSensorReading);
                        this.sensor = null;
                        resolve(false);
                    }
                }, 5000); // افزایش زمان به ۵ ثانیه برای اطمینان از راه‌اندازی سنسور
            });
        } catch {
            return false;
        }
    }

    quaternionToHeading(q) {
        const [x, y, z, w] = q;
        // فرمول صحیح برای استخراج محور Y از ماتریس چرخش (ستون دوم ماتریس R)
        const vyX = 2 * (x * y - w * z); // علامت منفی برای w * z اصلاح شد
        const vyY = 1 - 2 * (x * x + z * z);
        return normalizeAngle(radToDeg(Math.atan2(vyX, vyY)));
    }

    handleSensorReading() {
        if (!this.sensor) return;
        const heading = this.quaternionToHeading(this.sensor.quaternion);
        this.updateHeading(heading);
    }

    async tryDeviceOrientation() {
        return new Promise((resolve) => {
            let resolved = false;
            this.orientationHandler = (e) => {
                if (!resolved) {
                    resolved = true;
                    this.isAvailable = true;
                    resolve(true);
                }
                this.handleOrientationEvent(e);
            };

            window.addEventListener('deviceorientationabsolute', this.orientationHandler, true);
            window.addEventListener('deviceorientation', this.orientationHandler, true);

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    window.removeEventListener('deviceorientationabsolute', this.orientationHandler, true);
                    window.removeEventListener('deviceorientation', this.orientationHandler, true);
                    this.orientationHandler = null;
                    resolve(false);
                }
            }, 2000);
        });
    }

    handleOrientationEvent(event) {
        let heading = null;
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
            heading = event.webkitCompassHeading;
        } else if (event.alpha !== null && event.alpha !== undefined) {
            let offset = 0;
            if (screen.orientation && screen.orientation.angle !== undefined) {
                offset = screen.orientation.angle;
            } else if (window.orientation !== undefined) {
                offset = window.orientation;
            }
            heading = normalizeAngle(360 - event.alpha + offset);
        }

        if (heading !== null) {
            this.updateHeading(heading);
        }
    }

    updateHeading(newHeading) {
        this.lastUpdateTime = Date.now();
        
        if (this.isFrozen) {
            this.isFrozen = false;
            if (this.onRecovered) this.onRecovered();
        }

        if (this.lastRawHeading !== null) {
            let diff = Math.abs(newHeading - this.lastRawHeading);
            if (diff > 180) diff = 360 - diff;
            if (diff > CONFIG.COMPASS.SPIKE_THRESHOLD_DEG) return;
        }

        this.history.push(newHeading);
        if (this.history.length > CONFIG.COMPASS.HISTORY_SIZE) this.history.shift();

        let sinSum = 0, cosSum = 0;
        for (const angle of this.history) {
            const rad = degToRad(angle);
            sinSum += Math.sin(rad);
            cosSum += Math.cos(rad);
        }
        let avgHeading = radToDeg(Math.atan2(sinSum, cosSum));
        avgHeading = normalizeAngle(avgHeading);

        let diff = avgHeading - this.filteredHeading;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        this.filteredHeading += diff * CONFIG.COMPASS.SMOOTHING_FACTOR;
        this.filteredHeading = normalizeAngle(this.filteredHeading);
        
        this.lastRawHeading = newHeading;
        this.heading = this.filteredHeading;
    }

    startProcessing() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        if (this.sensor) {
            try {
                this.sensor.start();
            } catch (e) {
                console.error('Failed to restart sensor', e);
            }
        }
        
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        
        this.checkHealth();

        for (const listener of this.listeners) {
            listener(this.heading);
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    checkHealth() {
        if (this.isAvailable && Date.now() - this.lastUpdateTime > CONFIG.COMPASS.FROZEN_TIMEOUT_MS) {
            if (!this.isFrozen) {
                this.isFrozen = true;
                if (this.onCalibrationRequired) {
                    this.onCalibrationRequired();
                }
            }
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.sensor) {
            this.sensor.stop();
        }
    }

    destroy() {
        this.stop();
        if (this.sensor) {
            this.sensor.removeEventListener('reading', this.handleSensorReading);
            this.sensor = null;
        }
        if (this.orientationHandler) {
            window.removeEventListener('deviceorientationabsolute', this.orientationHandler, true);
            window.removeEventListener('deviceorientation', this.orientationHandler, true);
            this.orientationHandler = null;
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }
}

class UIManager {
    constructor() {
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            statusText: document.getElementById('statusText'),
            locationBox: document.getElementById('locationBox'),
            cityNameText: document.getElementById('cityNameText'),
            locationSourceText: document.getElementById('locationSourceText'),
            compassDial: document.getElementById('compassDial'),
            qiblaPointer: document.getElementById('qiblaPointer'),
            prayerTimesGrid: document.getElementById('prayerTimesGrid')
        };
    }

    setStatus(text) {
        if (this.elements.statusText) {
            this.elements.statusText.innerText = text;
        }
    }

    setStatusHTML(html) {
        if (this.elements.statusText) {
            this.elements.statusText.innerHTML = html;
        }
    }

    showLocation(city, source) {
        if (this.elements.locationBox) this.elements.locationBox.style.display = 'flex';
        if (this.elements.cityNameText) this.elements.cityNameText.innerText = city;
        if (this.elements.locationSourceText) this.elements.locationSourceText.innerText = source;
    }

    hideStartButton() {
        if (this.elements.startBtn) {
            this.elements.startBtn.style.opacity = '0';
            setTimeout(() => {
                if (this.elements.startBtn) this.elements.startBtn.style.display = 'none';
            }, 300);
        }
    }

    showStartButton() {
        if (this.elements.startBtn) {
            this.elements.startBtn.style.display = 'flex';
            setTimeout(() => {
                if (this.elements.startBtn) this.elements.startBtn.style.opacity = '1';
            }, 10);
            this.elements.startBtn.innerHTML = 'تلاش<br>مجدد';
        }
    }

    updateCompass(angle) {
        if (this.elements.qiblaPointer) {
            this.elements.qiblaPointer.style.transform = `rotate(${angle}deg)`;
        }
    }

    renderPrayerTimes(times) {
        if (!this.elements.prayerTimesGrid) return;
        this.elements.prayerTimesGrid.innerHTML = '';
        let index = 0;
        for (const key in CONFIG.PRAYER_TRANSLATIONS) {
            if (times[key]) {
                const html = `
                    <div class="glass-card time-card fade-in" style="animation-delay: ${index * 0.1}s">
                        <div class="prayer-name">${CONFIG.PRAYER_TRANSLATIONS[key]}</div>
                        <div class="prayer-time">${times[key]}</div>
                    </div>`;
                this.elements.prayerTimesGrid.insertAdjacentHTML('beforeend', html);
                index++;
            }
        }
    }
}

class App {
    constructor() {
        this.ui = new UIManager();
        this.compass = new CompassService();
        this.qiblaDegree = 0;
        this.isRunning = false;
        this.location = null;
        this.prayerTimesLoaded = false;
        
        this.visibilityHandler = this.handleVisibilityChange.bind(this);
        this.unloadHandler = this.handleUnload.bind(this);
        this.onlineHandler = this.handleOnline.bind(this);
        this.offlineHandler = this.handleOffline.bind(this);
    }

    async init() {
        if (this.ui.elements.startBtn) {
            this.ui.elements.startBtn.addEventListener('click', () => this.start());
        }
        document.addEventListener('visibilitychange', this.visibilityHandler);
        window.addEventListener('pagehide', this.unloadHandler);
        window.addEventListener('online', this.onlineHandler);
        window.addEventListener('offline', this.offlineHandler);
        
        window.addEventListener('unhandledrejection', event => {
            console.error('Unhandled rejection:', event.reason);
            event.preventDefault();
        });
    }

    async start() {
        try {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission !== 'granted') {
                        throw new Error('COMPASS_PERMISSION_DENIED');
                    }
                } catch (e) {
                    if (e.message === 'COMPASS_PERMISSION_DENIED') throw e;
                    throw new Error('خطا در درخواست مجوز قطب‌نما.');
                }
            }

            this.ui.hideStartButton();
            this.ui.setStatus('در حال تحلیل موقعیت مکانی شما...');

            this.location = await LocationService.getLocation();
            this.ui.showLocation(this.location.city, this.location.source);
            
            this.ui.setStatus('در حال دریافت داده‌های نجومی...');
            
            await this.fetchAndRenderPrayerTimes();

            this.qiblaDegree = QiblaCalculator.calculate(this.location.lat, this.location.lng);
            
            this.ui.setStatusHTML(`لطفاً گوشی خود را کاملاً افقی و موازی با زمین نگه دارید. (زاویه قبله: ${this.qiblaDegree.toFixed(1)}°)`);
            
            await this.initCompass();
            
        } catch (error) {
            console.error('Start error:', error);
            const msg = error.message || '';
            if (msg === 'COMPASS_PERMISSION_DENIED') {
                this.ui.setStatus('مجوز چرخش دستگاه داده نشد. لطفاً اجازه دسترسی بدهید و مجدداً تلاش کنید.');
            } else if (msg === 'LOCATION_PERMISSION_DENIED') {
                this.ui.setStatus('دسترسی به موقعیت مکانی رد شد. لطفاً از تنظیمات مرورگر اجازه دسترسی بدهید و مجدداً تلاش کنید.');
            } else if (msg === 'GPS_DISABLED') {
                this.ui.setStatus('سرویس‌های موقعیت‌یاب (GPS) خاموش هستند. لطفاً GPS دستگاه خود را روشن کنید و مجدداً تلاش کنید.');
            } else if (msg === 'OFFLINE') {
                this.ui.setStatus('اتصال اینترنت قطع است. لطفاً اتصال خود را برقرار کنید و مجدداً تلاش کنید.');
            } else {
                this.ui.setStatus(`خطا: ${msg}`);
            }
            this.ui.showStartButton();
        }
    }

    async fetchAndRenderPrayerTimes() {
        try {
            const prayerTimes = await retryWithBackoff(() => PrayerTimesService.getTimes(this.location.lat, this.location.lng));
            this.ui.renderPrayerTimes(prayerTimes);
            this.prayerTimesLoaded = true;
        } catch (error) {
            if (error.message === 'OFFLINE') {
                this.ui.setStatus('اتصال اینترنت قطع شد. اوقات شرعی پس از اتصال به‌روزرسانی می‌شود.');
                this.prayerTimesLoaded = false;
            } else {
                throw error;
            }
        }
    }

    async initCompass() {
        try {
            this.compass.onCalibrationRequired = () => {
                this.ui.setStatus('لطفاً گوشی خود را به شکل عدد 8 انگلیسی در هوا بچرخانید تا قطب‌نما کالیبره شود.');
            };
            
            this.compass.onRecovered = () => {
                this.ui.setStatusHTML(`لطفاً گوشی خود را کاملاً افقی و موازی با زمین نگه دارید. (زاویه قبله: ${this.qiblaDegree.toFixed(1)}°)`);
            };
            
            await this.compass.initialize();
            this.isRunning = true;
            
            this.compass.addListener((heading) => {
                if (!this.isRunning) return;
                let targetAngle = this.qiblaDegree - heading;
                targetAngle = normalizeAngle(targetAngle);
                this.ui.updateCompass(targetAngle);
            });
            
            this.compass.startProcessing();
            
        } catch (error) {
            this.ui.setStatus(error.message);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }

    handleOnline() {
        this.ui.setStatus('اتصال برقرار شد. در حال به‌روزرسانی...');
        if (this.location && !this.prayerTimesLoaded) {
            this.fetchAndRenderPrayerTimes();
        }
    }

    handleOffline() {
        this.ui.setStatus('اتصال اینترنت قطع شد. در انتظار اتصال مجدد...');
    }

    pause() {
        this.isRunning = false;
        if (this.compass) {
            this.compass.stop();
        }
    }

    resume() {
        if (this.compass && this.compass.isAvailable) {
            this.isRunning = true;
            this.compass.startProcessing();
        }
    }

    handleUnload() {
        this.pause();
        if (this.compass) {
            this.compass.destroy();
        }
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        window.removeEventListener('pagehide', this.unloadHandler);
        window.removeEventListener('online', this.onlineHandler);
        window.removeEventListener('offline', this.offlineHandler);
    }
}

const app = new App();
app.init();
