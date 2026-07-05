/**
 * Header & Footer Auto Loader - نسخه بهینه شده با تشخیص صفحه فعال
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
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`خطا در بارگذاری JS: ${path}`));
            document.body.appendChild(script);
        });
    },

    // بارگذاری HTML با کش
    async loadHTML(path) {
        if (this._cache.has(path)) {
            return this._cache.get(path);
        }
        try {
            const response = await fetch(path, { 
                cache: 'force-cache'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            this._cache.set(path, html);
            return html;
        } catch (error) {
            throw new Error(`خطا در بارگذاری HTML: ${path} - ${error.message}`);
        }
    },

    // ✅ تشخیص صفحه فعال و فعال کردن دکمه مربوطه
    activateCurrentPage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        // حذف کلاس active از همه دکمه‌ها
        const allNavLinks = document.querySelectorAll('.nav-link, .header-link, [data-page]');
        allNavLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // پیدا کردن لینک فعال
        const activeLinks = document.querySelectorAll('.nav-link, .header-link, [data-page]');
        activeLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            const dataPage = link.getAttribute('data-page') || '';
            
            // بررسی تطابق با صفحه فعلی
            if (href.includes(currentPage) || 
                dataPage === currentPage || 
                (currentPage === 'index.html' && (href === '/' || href === '/index.html' || dataPage === 'index.html'))) {
                link.classList.add('active');
            }
        });
        
        console.log(`✅ صفحه فعال: ${currentPage}`);
    },

    // ✅ بارگذاری همه منابع یک کامپوننت به صورت همزمان
    async injectComponent(type, targetSelector) {
        const config = this.config[type];
        if (!config) return;

        try {
            const [html] = await Promise.all([
                this.loadHTML(config.html),
                this.loadCSS(config.css)
            ]);
            
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
            
            this.loadJS(config.js);
            
            // ✅ اگر هدر لود شد، صفحه فعال را تشخیص بده
            if (type === 'header') {
                // کمی صبر کن تا DOM کامل شود
                setTimeout(() => {
                    this.activateCurrentPage();
                }, 100);
            }
            
            console.log(`✅ ${type} با موفقیت بارگذاری شد`);
        } catch (error) {
            console.error(`❌ خطا در بارگذاری ${type}:`, error);
        }
    },

    // 🚀 راه‌اندازی بهینه
    async init() {
        await Promise.all([
            this.injectComponent('header', 'body'),
            this.injectComponent('footer', 'body')
        ]);
    }
};

// اجرای زودتر
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ComponentLoader.init());
} else {
    ComponentLoader.init();
}
