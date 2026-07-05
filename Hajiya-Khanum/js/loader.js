/**
 * Header & Footer Auto Loader - نسخه بهینه شده
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

    // کش برای جلوگیری از fetch تکراری
    _cache: new Map(),

    // بارگذاری CSS با تشخیص تکراری بودن
    loadCSS(path) {
        // اگر قبلاً لود شده، دیگه لود نکن
        if (document.querySelector(`link[href="${path}"]`)) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`خطا در بارگذاری CSS: ${path}`));
            document.head.appendChild(link);
        });
    },

    // بارگذاری JavaScript
    loadJS(path) {
        if (document.querySelector(`script[src="${path}"]`)) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.defer = true; // ✅ اجرا بعد از parse HTML
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`خطا در بارگذاری JS: ${path}`));
            document.body.appendChild(script);
        });
    },

    // بارگذاری HTML با کش
    async loadHTML(path) {
        // استفاده از کش
        if (this._cache.has(path)) {
            return this._cache.get(path);
        }
        try {
            const response = await fetch(path, { 
                cache: 'force-cache' // ✅ استفاده از کش مرورگر
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            this._cache.set(path, html);
            return html;
        } catch (error) {
            throw new Error(`خطا در بارگذاری HTML: ${path} - ${error.message}`);
        }
    },

    // ✅ بارگذاری همه منابع یک کامپوننت به صورت همزمان
    async injectComponent(type, targetSelector) {
        const config = this.config[type];
        if (!config) return;

        try {
            // 🚀 شروع همزمان بارگذاری CSS و HTML
            const [html] = await Promise.all([
                this.loadHTML(config.html),
                this.loadCSS(config.css)
            ]);
            
            // تزریق HTML
            const target = document.querySelector(targetSelector);
            if (target) {
                if (type === 'header') {
                    target.insertAdjacentHTML('afterbegin', html);
                } else if (type === 'footer') {
                    target.insertAdjacentHTML('beforeend', html);
                }
            } else {
                if (type === 'header') {
                    document.body.insertAdjacentHTML('afterbegin', html);
                } else if (type === 'footer') {
                    document.body.insertAdjacentHTML('beforeend', html);
                }
            }
            
            // بارگذاری JS (غیر بحرانی - بعد از نمایش)
            this.loadJS(config.js); // بدون await → non-blocking
            
            console.log(`✅ ${type} با موفقیت بارگذاری شد`);
        } catch (error) {
            console.error(`❌ خطا در بارگذاری ${type}:`, error);
        }
    },

    // 🚀 راه‌اندازی بهینه - بارگذاری همزمان هدر و فوتر
    async init() {
        // بارگذاری همزمان با Promise.all
        await Promise.all([
            this.injectComponent('header', 'body'),
            this.injectComponent('footer', 'body')
        ]);
    }
};

// اجرای زودتر - قبل از DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ComponentLoader.init());
} else {
    // اگر DOM آماده است، مستقیم اجرا کن
    ComponentLoader.init();
}
