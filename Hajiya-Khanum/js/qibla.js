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
        if (cached) return { ...cached, source: 'حافظه پنهان' };

        try {
            const coords = await this.getGPSCoordinates();
            const city = await this.reverseGeocode(coords.lat, coords.lng);
            const result = { ...coords, city, source: 'GPS' };
            StorageManager.set(CONFIG.CACHE_KEYS.LOCATION, result);
            return result;
        } catch (error) {
            console.warn('GPS failed, falling back to IP:', error.message);
            try {
                const ipData = await this.getIPLocation();
                const result = { ...ipData, source: 'IP' };
                StorageManager.set(CONFIG.CACHE_KEYS.LOCATION, result);
                return result;
            } catch (ipError) {
                throw new Error('مکان‌یابی ناموفق بود.');
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
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: CONFIG.TIMEOUTS.GEOLOCATION, maximumAge: 0 }
            );
        });
    }

    static async reverseGeocode(lat, lng) {
        try {
            const data = await NetworkManager.fetchWithTimeout(
                `${CONFIG.API_ENDPOINTS.NOMINATIM}?format=json&lat=${lat}&lon=${lng}`
            );
            const addr = data.address || {};
            return addr.city || addr.town || addr.village || addr.county || addr.state || 'مکان نامشخص';
        } catch {
            return 'مکان‌یابی شد';
        }
    }

    static async getIPLocation() {
        const data = await NetworkManager.fetchWithTimeout(CONFIG.API_ENDPOINTS.IPAPI);
        return {
            lat: data.latitude,
            lng: data.longitude,
            city: data.city || data.region || 'مکان نامشخص'
        };
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

        try {
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
        } catch (error) {
            console.error('Prayer times fetch failed:', error);
            throw new Error('خطا در دریافت اوقات شرعی');
        }
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
                        this.sensor = null;
                        resolve(false);
                    }
                }, 2000);
            });
        } catch {
            return false;
        }
    }

    quaternionToHeading(q) {
        const [x, y, z, w] = q;
        const vyX = 2 * (x * y + w * z);
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
            const handler = (e) => {
                if (!resolved) {
                    resolved = true;
                    this.isAvailable = true;
                    resolve(true);
                }
                this.handleOrientationEvent(e);
            };

            window.addEventListener('deviceorientationabsolute', handler, true);
            window.addEventListener('deviceorientation', handler, true);

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    window.removeEventListener('deviceorientationabsolute', handler, true);
                    window.removeEventListener('deviceorientation', handler, true);
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
            heading = normalizeAngle(360 - event.alpha);
        }

        if (heading !== null) {
            this.updateHeading(heading);
        }
    }

    updateHeading(newHeading) {
        this.lastUpdateTime = Date.now();
        this.isFrozen = false;

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
        this.visibilityHandler = this.handleVisibilityChange.bind(this);
        this.unloadHandler = this.handleUnload.bind(this);
    }

    async init() {
        if (this.ui.elements.startBtn) {
            this.ui.elements.startBtn.addEventListener('click', () => this.start());
        }
        document.addEventListener('visibilitychange', this.visibilityHandler);
        window.addEventListener('pagehide', this.unloadHandler);
        
        window.addEventListener('unhandledrejection', event => {
            console.error('Unhandled rejection:', event.reason);
            event.preventDefault();
        });
    }

    async start() {
        try {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('مجوز چرخش دستگاه داده نشد.');
                }
            }

            this.ui.hideStartButton();
            this.ui.setStatus('در حال تحلیل موقعیت مکانی شما...');

            const location = await LocationService.getLocation();
            this.ui.showLocation(location.city, location.source);
            
            this.ui.setStatus('در حال دریافت داده‌های نجومی...');
            
            const prayerTimes = await PrayerTimesService.getTimes(location.lat, location.lng);

            this.qiblaDegree = QiblaCalculator.calculate(location.lat, location.lng);
            
            this.ui.setStatusHTML(`لطفاً گوشی خود را کاملاً افقی و موازی با زمین نگه دارید. (زاویه قبله: ${this.qiblaDegree.toFixed(1)}°)`);
            
            this.ui.renderPrayerTimes(prayerTimes);

            await this.initCompass();
            
        } catch (error) {
            console.error('Start error:', error);
            this.ui.setStatus(`خطا: ${error.message}`);
            this.ui.showStartButton();
        }
    }

    async initCompass() {
        try {
            this.compass.onCalibrationRequired = () => {
                this.ui.setStatus('لطفاً گوشی خود را به شکل عدد 8 انگلیسی در هوا بچرخانید تا قطب‌نما کالیبره شود.');
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
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        window.removeEventListener('pagehide', this.unloadHandler);
    }
}

const app = new App();
app.init();
