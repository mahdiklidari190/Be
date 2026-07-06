/**
 * Header & Footer Auto Loader - نسخه بهینه و سریع
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
    
    cacheSettings: {
        prefix: 'component_cache_'
    },
    
    loadedResources: new Set(),

    // محاسبه hash سریع
    calculateHash(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    getCacheKey(type) {
        return this.cacheSettings.prefix + type;
    },

    // بررسی و به‌روزرسانی کش
    checkAndUpdateCache(type, freshContent) {
        const cacheKey = this.getCacheKey(type);
        const cached = this.getFromCache(cacheKey);
        const newHash = this.calculateHash(freshContent);
        
        if (cached && cached.hash === newHash) {
            return { content: cached.content, changed: false };
        }
        
        const data = {
            content: freshContent,
            hash: newHash,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Cache save failed:', e);
        }
        
        return { content: freshContent, changed: true };
    },

    getFromCache(cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        
        try {
            return JSON.parse(cached);
        } catch (e) {
            return null;
        }
    },

    // لود CSS سریع
    loadCSS(path) {
        if (this.loadedResources.has(path)) return Promise.resolve();
        
        const existingLink = document.querySelector(`link[href="${path}"]`);
        if (existingLink) {
            this.loadedResources.add(path);
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = () => {
                this.loadedResources.add(path);
                resolve();
            };
            link.onerror = () => reject(new Error(`CSS error: ${path}`));
            document.head.appendChild(link);
        });
    },

    // لود JS سریع
    loadJS(path) {
        if (this.loadedResources.has(path)) return Promise.resolve();
        
        const existingScript = document.querySelector(`script[src="${path}"]`);
        if (existingScript) {
            this.loadedResources.add(path);
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.defer = true;
            script.onload = () => {
                this.loadedResources.add(path);
                resolve();
            };
            script.onerror = () => reject(new Error(`JS error: ${path}`));
            document.body.appendChild(script);
        });
    },

    // لود HTML با کش
    async loadHTML(type) {
        const config = this.config[type];
        const cacheKey = this.getCacheKey(type);
        
        try {
            const response = await fetch(config.html, { cache: 'default' });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const freshContent = await response.text();
            const result = this.checkAndUpdateCache(type, freshContent);
            
            return result.content;
            
        } catch (error) {
            console.warn(`Fetch ${type} failed, using cache:`, error.message);
            
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached.content;
            }
            
            throw error;
        }
    },

    // تزریق سریع کامپوننت
    async injectComponent(type, targetSelector) {
        const config = this.config[type];
        if (!config) return;

        try {
            // لود CSS اول (برای جلوگیری از FOUC)
            const cssPromise = this.loadCSS(config.css);
            
            // لود HTML
            const html = await this.loadHTML(type);
            
            // صبر برای CSS
            await cssPromise;
            
            // تزریق HTML
            const target = document.querySelector(targetSelector) || document.body;
            const position = type === 'header' ? 'afterbegin' : 'beforeend';
            target.insertAdjacentHTML(position, html);
            
            // لود JS در پس‌زمینه
            this.loadJS(config.js).catch(err => 
                console.warn(`JS warning for ${type}:`, err.message)
            );
            
        } catch (error) {
            console.error(`Critical error loading ${type}:`, error);
        }
    },

    // مقداردهی اولیه سریع
    async init() {
        const startTime = performance.now();
        
        // لود همزمان هدر و فوتر
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
        console.log('✓ Cache cleared');
    }
};

// شروع فوری
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ComponentLoader.init());
} else {
    ComponentLoader.init();
}
