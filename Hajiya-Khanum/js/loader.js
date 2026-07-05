/**
 * Header & Footer Auto Loader - نسخه بدون کش و بهینه
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

    loadCSS(path) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`CSS load error: ${path}`));
            document.head.appendChild(link);
        });
    },

    loadJS(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`JS load error: ${path}`));
            document.body.appendChild(script);
        });
    },

    async loadHTML(path) {
        const response = await fetch(path, { 
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
    },

    async injectComponent(type, targetSelector) {
        const config = this.config[type];
        if (!config) return;

        try {
            const [html] = await Promise.all([
                this.loadHTML(config.html),
                this.loadCSS(config.css)
            ]);
            
            const target = document.querySelector(targetSelector) || document.body;
            const position = type === 'header' ? 'afterbegin' : 'beforeend';
            target.insertAdjacentHTML(position, html);
            
            this.loadJS(config.js);
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
        }
    },

    async init() {
        await Promise.all([
            this.injectComponent('header', 'body'),
            this.injectComponent('footer', 'body')
        ]);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ComponentLoader.init());
} else {
    ComponentLoader.init();
}
