/**
 * Header & Footer Auto Loader - نسخه با کش و بهینه
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
        ttl: 24 * 60 * 60 * 1000, // 24 ساعت به میلی‌ثانیه
        prefix: 'component_cache_'
    },
    
    // ردیابی منابع لود شده برای جلوگیری از تکرار
    loadedResources: new Set(),

    // بررسی اعتبار کش
    isCacheValid(cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return false;
        
        try {
            const data = JSON.parse(cached);
            const now = Date.now();
            return (now - data.timestamp) < this.cacheSettings.ttl;
        } catch (e) {
            return false;
        }
    },

    // دریافت از کش
    getFromCache(cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        
        try {
            const data = JSON.parse(cached);
            return data.content;
        } catch (e) {
            return null;
        }
    },

    // ذخیره در کش
    saveToCache(cacheKey, content) {
        try {
            const data = {
                content: content,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to cache:', e);
        }
    },

    // لود CSS با جلوگیری از تکرار
    loadCSS(path) {
        return new Promise((resolve, reject) => {
            // اگر قبلاً لود شده، رد کن
            if (this.loadedResources.has(path)) {
                resolve();
                return;
            }
            
            // بررسی وجود لینک در DOM
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
            // اگر قبلاً لود شده، رد کن
            if (this.loadedResources.has(path)) {
                resolve();
                return;
            }
            
            // بررسی وجود اسکریپت در DOM
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

    // لود HTML با کش
    async loadHTML(path, cacheKey) {
        // ابتدا از کش بررسی کن
        if (this.isCacheValid(cacheKey)) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }
        
        // اگر کش نامعتبر است، از سرور بگیر
        const response = await fetch(path, { 
            cache: 'default' // از کش مرورگر استفاده کن
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const content = await response.text();
        
        // ذخیره در کش
        this.saveToCache(cacheKey, content);
        
        return content;
    },

    // تزریق کامپوننت
    async injectComponent(type, targetSelector) {
        const config = this.config[type];
        if (!config) return;

        const cacheKey = this.cacheSettings.prefix + type;

        try {
            // لود HTML از کش یا سرور
            const html = await this.loadHTML(config.html, cacheKey);
            
            // لود CSS (با جلوگیری از تکرار)
            await this.loadCSS(config.css);
            
            // تزریق HTML
            const target = document.querySelector(targetSelector) || document.body;
            const position = type === 'header' ? 'afterbegin' : 'beforeend';
            target.insertAdjacentHTML(position, html);
            
            // لود JS (بدون await - در پس‌زمینه اجرا شود)
            this.loadJS(config.js).catch(err => 
                console.warn(`JS load warning for ${type}:`, err)
            );
            
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            
            // اگر خطا داد و کش داریم، از کش استفاده کن
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                const target = document.querySelector(targetSelector) || document.body;
                const position = type === 'header' ? 'afterbegin' : 'beforeend';
                target.insertAdjacentHTML(position, cached);
                console.log(`Loaded ${type} from cache after error`);
            }
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
        console.log(`Components loaded in ${(endTime - startTime).toFixed(2)}ms`);
    },
    
    // پاک کردن کش (برای تست یا آپدیت دستی)
    clearCache() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.cacheSettings.prefix)) {
                localStorage.removeItem(key);
            }
        });
        console.log('Component cache cleared');
    },
    
    // به‌روزرسانی دستی کش
    async updateCache() {
        for (const type of ['header', 'footer']) {
            const config = this.config[type];
            const cacheKey = this.cacheSettings.prefix + type;
            
            try {
                const response = await fetch(config.html, { cache: 'no-store' });
                if (response.ok) {
                    const content = await response.text();
                    this.saveToCache(cacheKey, content);
                    console.log(`Cache updated for ${type}`);
                }
            } catch (e) {
                console.warn(`Failed to update cache for ${type}:`, e);
            }
        }
    }
};

// مقداردهی اولیه
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ComponentLoader.init());
} else {
    ComponentLoader.init();
}
