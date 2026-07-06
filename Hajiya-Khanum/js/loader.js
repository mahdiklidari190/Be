/**
 * Header & Footer Auto Loader - نسخه هوشمند با تشخیص خودکار تغییرات
 */
const ComponentLoader = {
    config: {
        header: {
            html: '/Hajiya-Khanum/header.html',
            css: '/Hajiya-Khanum/css/header.css',
            js: '/Hajiya-Khanum/js/header.js'
        },
        footer: {
            html: '/Hajiya-Khanum/footer.html',
            css: '/Hajiya-Khanum/css/footer.css',
            js: '/Hajiya-Khanum/js/header.js'
        }
    },
    
    // تنظیمات کش
    cacheSettings: {
        ttl: 24 * 60 * 60 * 1000, // 24 ساعت
        prefix: 'component_cache_'
    },
    
    // ردیابی منابع لود شده
    loadedResources: new Set(),

    // محاسبه hash ساده از محتوا (برای تشخیص تغییرات)
    async calculateHash(content) {
        // استفاده از SubtleCrypto API برای hash واقعی
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        // fallback: hash ساده اگر SubtleCrypto در دسترس نبود
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    },

    // ساخت cacheKey
    getCacheKey(type) {
        return this.cacheSettings.prefix + type;
    },

    // بررسی و به‌روزرسانی خودکار کش
    async checkAndUpdateCache(type, freshContent) {
        const cacheKey = this.getCacheKey(type);
        const cached = this.getFromCache(cacheKey);
        
        // محاسبه hash محتوای جدید
        const newHash = await this.calculateHash(freshContent);
        
        // اگر کش وجود دارد و hash یکسان است، از کش استفاده کن
        if (cached && cached.hash === newHash) {
            console.log(`✓ ${type} unchanged, using cache`);
            return cached.content;
        }
        
        // اگر hash متفاوت است یا کش وجود ندارد، کش را به‌روز کن
        console.log(`↻ ${type} changed, updating cache`);
        const data = {
            content: freshContent,
            hash: newHash,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to cache:', e);
        }
        
        return freshContent;
    },

    // دریافت از کش
    getFromCache(cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        
        try {
            return JSON.parse(cached);
        } catch (e) {
            return null;
        }
    },

    // لود CSS با جلوگیری از تکرار
    loadCSS(path) {
        return new Promise((resolve, reject) => {
            if (this.loadedResources.has(path)) {
                resolve();
                return;
            }
            
            const existingLink = document.querySelector(`link[href="${path}"]`);
            if (existingLink) {
                this.loadedResources.add(path);
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = () => {
                this.loadedResources.add(path);
                resolve();
            };
            link.onerror = () => reject(new Error(`CSS load error: ${path}`));
            document.head.appendChild(link);
        });
    },

    // لود JS با جلوگیری از تکرار
    loadJS(path) {
        return new Promise((resolve, reject) => {
            if (this.loadedResources.has(path)) {
                resolve();
                return;
            }
            
            const existingScript = document.querySelector(`script[src="${path}"]`);
            if (existingScript) {
                this.loadedResources.add(path);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = path;
            script.defer = true;
            script.onload = () => {
                this.loadedResources.add(path);
                resolve();
            };
            script.onerror = () => reject(new Error(`JS load error: ${path}`));
            document.body.appendChild(script);
        });
    },

    // لود HTML با تشخیص خودکار تغییرات
    async loadHTML(type) {
        const config = this.config[type];
        const cacheKey = this.getCacheKey(type);
        
        try {
            // همیشه از سرور بگیر (با کش مرورگر)
            const response = await fetch(config.html, { 
                cache: 'default'
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const freshContent = await response.text();
            
            // بررسی و به‌روزرسانی خودکار کش بر اساس hash
            const content = await this.checkAndUpdateCache(type, freshContent);
            
            return content;
            
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            
            // اگر خطا داد، از کش استفاده کن (اگر وجود دارد)
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`⚠ Loaded ${type} from cache (offline/error)`);
                return cached.content;
            }
            
            throw error;
        }
    },

    // تزریق کامپوننت
    async injectComponent(type, targetSelector) {
        const config = this.config[type];
        if (!config) return;

        try {
            // لود HTML با تشخیص خودکار تغییرات
            const html = await this.loadHTML(type);
            
            // لود CSS
            await this.loadCSS(config.css);
            
            // تزریق HTML
            const target = document.querySelector(targetSelector) || document.body;
            const position = type === 'header' ? 'afterbegin' : 'beforeend';
            target.insertAdjacentHTML(position, html);
            
            // لود JS
            this.loadJS(config.js).catch(err => 
                console.warn(`JS load warning for ${type}:`, err)
            );
            
        } catch (error) {
            console.error(`Critical error loading ${type}:`, error);
        }
    },

    // مقداردهی اولیه
    async init() {
        const startTime = performance.now();
        
        await Promise.all([
            this.injectComponent('header', 'body'),
            this.injectComponent('footer', 'body')
        ]);
        
        const endTime = performance.now();
        console.log(`✓ Components loaded in ${(endTime - startTime).toFixed(2)}ms`);
    },
    
    // پاک کردن کش
    clearCache() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.cacheSettings.prefix)) {
                localStorage.removeItem(key);
            }
        });
        console.log('✓ Component cache cleared');
    }
};

// مقداردهی اولیه
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ComponentLoader.init());
} else {
    ComponentLoader.init();
}
