/**
 * Header & Footer Auto Loader - نسخه نهایی با تشخیص دقیق صفحه
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

    // ✅ تشخیص صفحه فعال - نسخه بهبود یافته
    activateCurrentPage() {
        const currentPath = window.location.pathname;
        console.log('🔍 مسیر فعلی:', currentPath);
        
        // ✅ استخراج نام صفحه با پوشش همه حالت‌ها
        // حالت‌های مختلف:
        // /Hajiya-Khanum/quran → quran
        // /Hajiya-Khanum/quran/ → quran (trailing slash)
        // /Hajiya-Khanum/quran.html → quran
        // /Hajiya-Khanum/quran.php → quran
        // /Hajiya-Khanum/ → home
        // / → home
        
        let currentPage = currentPath;
        
        // حذف trailing slash اگر وجود دارد
        currentPage = currentPage.replace(/\/$/, '');
        
        // گرفتن آخرین بخش مسیر
        currentPage = currentPage.split('/').pop();
        
        // حذف پسوند فایل (.html, .php, .asp, etc)
        currentPage = currentPage.replace(/\.[^/.]+$/, '');
        
        // اگر صفحه اصلی است
        if (!currentPage || currentPage === '' || currentPage === 'index') {
            currentPage = 'home';
        }
        
        // تبدیل به حروف کوچک برای مقایسه دقیق‌تر
        currentPage = currentPage.toLowerCase().trim();
        
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
            const dataPageLower = dataPage.toLowerCase().trim();
            
            console.log(`  - بررسی دکمه: "${dataPage}" با صفحه: "${currentPage}"`);
            
            if (dataPageLower === currentPage) {
                btn.classList.add('active');
                found = true;
                console.log(`✅ دکمه فعال شد: ${dataPage}`);
            }
        });
        
        if (!found) {
            console.warn(`⚠️ دکمه‌ای برای صفحه "${currentPage}" پیدا نشد!`);
            console.log('💡 مقادیر data-page موجود:', 
                Array.from(allButtons).map(b => b.getAttribute('data-page'))
            );
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
                    const navList = document.querySelector('.nav-list');
                    if (navList) {
                        console.log('👁️ MutationObserver: منو پیدا شد!');
                        obs.disconnect();
                        
                        // صبر کوتاه برای اطمینان از کامل شدن DOM
                        setTimeout(() => {
                            this.activateCurrentPage();
                        }, 100);
                    }
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
            
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
