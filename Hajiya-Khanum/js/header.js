function toggleMenu() {
    document.querySelector('.hamburger').classList.toggle('active');
    document.getElementById('navList').classList.toggle('active');
}

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-list button').forEach(b => b.classList.remove('active-tab'));
    if (btn) btn.classList.add('active-tab');
    document.querySelector('.hamburger').classList.remove('active');
    document.getElementById('navList').classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// تشخیص صفحه فعال و اضافه کردن کلاس active-tab
(function() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    let currentPage = 'home';
    
    if (filename === 'quran.html') currentPage = 'quran';
    else if (filename === 'hafez.html') currentPage = 'hafez';
    else if (filename === 'salavat.html') currentPage = 'salavat';
    else if (filename === 'dua.html') currentPage = 'dua'; 
    else if (filename === 'qibla.html') currentPage = 'qibla';
    else if (filename === 'home.html' || filename === 'index.html' || filename === '') currentPage = 'home';
    
    const activeButton = document.querySelector(`.nav-list button[data-page="${currentPage}"]`);
    if (activeButton) {
        activeButton.classList.add('active-tab');
    }
})();