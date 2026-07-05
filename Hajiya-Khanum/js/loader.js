activateCurrentPage() {
    const currentPath = window.location.pathname;
    let currentPage = currentPath.split('/').pop();
    
    // حذف .html یا .php
    currentPage = currentPage.replace(/\.(html|php)$/, '');
    
    // اگر صفحه اصلی است
    if (!currentPage || currentPage === '' || currentPage === 'index') {
        currentPage = 'home';
    }
    
    // پیدا کردن دکمه‌ها
    const allButtons = document.querySelectorAll('.nav-list button[data-page]');
    
    // حذف active از همه
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // فعال کردن دکمه مناسب
    allButtons.forEach(btn => {
        const dataPage = btn.getAttribute('data-page');
        if (dataPage === currentPage) {
            btn.classList.add('active');
        }
    });
}
