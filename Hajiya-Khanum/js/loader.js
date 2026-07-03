/**
 * Header & Footer Auto Loader
 * بارگذاری خودکار هدر و فوتر از فایل‌های جداگانه
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

    // بارگذاری CSS
    loadCSS(path) {
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
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`خطا در بارگذاری JS: ${path}`));
            document.body.appendChild(script);
        });
    },

    // بارگذاری HTML
    async loadHTML(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            throw new Error(`خطا در بارگذاری HTML: ${path} - ${error.message}`);
        }
    },

    // تزریق کامپوننت (هدر یا فوتر)
    async injectComponent(type, targetSelector) {
        const config = this.config[type];
        if (!config) return;

        try {
            // بارگذاری CSS
            await this.loadCSS(config.css);
            
            // بارگذاری HTML
            const html = await this.loadHTML(config.html);
            
            // تزریق HTML در محل مورد نظر
            const target = document.querySelector(targetSelector);
            if (target) {
                if (type === 'header') {
                    target.insertAdjacentHTML('afterbegin', html);
                } else if (type === 'footer') {
                    target.insertAdjacentHTML('beforeend', html);
                }
            } else {
                // اگر target وجود نداشت، به body اضافه کن
                if (type === 'header') {
                    document.body.insertAdjacentHTML('afterbegin', html);
                } else if (type === 'footer') {
                    document.body.insertAdjacentHTML('beforeend', html);
                }
            }
            
            // بارگذاری JS
            await this.loadJS(config.js);
            
            console.log(`✅ ${type} با موفقیت بارگذاری شد`);
        } catch (error) {
            console.error(`❌ خطا در بارگذاری ${type}:`, error);
        }
    },

    // راه‌اندازی اولیه
    async init() {
        await this.injectComponent('header', 'body');
        await this.injectComponent('footer', 'body');
    }
};

// اجرای خودکار هنگام لود صفحه
document.addEventListener('DOMContentLoaded', () => {
    ComponentLoader.init();
});