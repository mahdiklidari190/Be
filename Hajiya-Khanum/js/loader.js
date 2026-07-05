/**
 * Header & Footer Auto Loader - نسخه نهایی با MutationObserver
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

    _cache: new Map(),

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

    // ✅ تشخیص صفحه فعال
    activateCurrentPage() {
        const currentPath = window.location.pathname;
        console.log('🔍 مسیر فعلی:', currentPath);
        
        // استخراج نام صفحه
        let currentPage = currentPath.split('/').pop();
        currentPage = currentPage.replace(/\.(html|php)$/, '');
        
        // اگر صفحه اصلی است
        if (!currentPage || currentPage === '' || currentPage === 'index') {
            currentPage = 'home';
        }
        
        console.log('📄 نام صفحه استخراج شده:', currentPage);
        
        // پیدا کردن همه دکمه‌های منو
        const allButtons = document.querySelectorAll('.nav-list button[data-page]');
        console.log('🔘 تعداد دکمه‌های پیدا شده:', allButtons.length);
        
        if (allButtons.length === 0) {
            console.warn('⚠️ هیچ دکمه‌ای با data-page پیدا نشد!');
            return;
        }
        
        // حذف active از همه
        allButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // فعال کردن دکمه مناسب
        let found = false;
        allButtons.forEach(btn => {
            const dataPage = btn.getAttribute('data-page');
            console.log(`  - بررسی دکمه: ${dataPage}`);
            
            if (dataPage === currentPage) {
                btn.classList.add('active');
                found = true;
                console.log(`✅ دکمه فعال شد: ${dataPage}`);
            }
        });
        
        if (!found) {
            console.warn(`⚠️ دکمه‌ای برای صفحه "${currentPage}" پیدا نشد!`);
        }
    },

    // ✅ بارگذاری کامپوننت
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
            
            console.log(`✅ ${type} HTML تزریق شد`);
            
            // ✅ استفاده از MutationObserver برای تشخیص دقیق
            if (type === 'header') {
                const observer = new MutationObserver((mutations, obs) => {
                    // بررسی اینکه آیا منو اضافه شده است
                    const navList = document.querySelector('.nav-list');
                    if (navList) {
                        console.log('👁️ MutationObserver: منو پیدا شد!');
                        obs.disconnect(); // توقف observer
                        
                        // کمی صبر کن تا header.js هم لود شود
                        setTimeout(() => {
                            this.activateCurrentPage();
                        }, 50);
                    }
                });
                
                // شروع مشاهده تغییرات DOM
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
            
            // بارگذاری JS
            await this.loadJS(config.js);
            
            console.log(`✅ ${type} با موفقیت بارگذاری شد`);
        } catch (error) {
            console.error(`❌ خطا در بارگذاری ${type}:`, error);
        }
    },

    async init() {
        await Promise.all([
            this.injectComponent('header', 'body'),
            this.injectComponent('footer', 'body')
        ]);
    }
};

// اجرا
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ComponentLoader.init());
} else {
    ComponentLoader.init();
}
