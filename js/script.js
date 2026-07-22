// ============================================================================
// 0. HELPER FUNCTIONS FOR DYNAMIC INJECTION
// ============================================================================
function loadCSS(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
    document.head.appendChild(link);
  });
}

function loadJS(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load JS: ${url}`));
    document.body.appendChild(script);
  });
}

// ============================================================================
// 1. HEADER & FOOTER TEMPLATES
// ============================================================================
const headerHTML = `
<nav class="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 shadow-lg z-40 transition-colors duration-500 backdrop-blur-lg">
  <div class="container mx-auto px-4 py-4 flex justify-between items-center">
    <a href="index.html" class="text-xl md:text-2xl font-bold gradient-text">بردیا کلیدری</a>
    
    <!-- Desktop Menu -->
    <div class="hidden md:flex items-center space-x-6 space-x-reverse">
      <div class="flex items-center space-x-4 space-x-reverse">
        <div id="themeToggle" class="theme-toggle-wrapper cursor-pointer" role="switch" aria-label="Toggle dark mode">
          <div class="sun-icon">☀️</div>
          <div class="moon-icon">🌙</div>
          <div class="theme-toggle-slider"></div>
        </div>
      </div>
      <div class="flex space-x-6 space-x-reverse">
        <a href="index.html" class="nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">خانه</a>
        <a href="games.html" class="nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">بازی‌ها</a>
        <a href="projects.html" class="nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">پروژه‌ها</a>
        <a href="tools.html" class="nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">ابزارها</a>
        <a href="articles.html" class="nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium">مقاله‌ها</a>
      </div>
    </div>
    
    <!-- Mobile Menu Button -->
    <button id="mobileMenuBtn" class="md:hidden text-gray-700 dark:text-gray-300 text-2xl focus:outline-none cursor-pointer">
      <i class="fas fa-bars"></i>
    </button>
  </div>
</nav>

<!-- Mobile Backdrop -->
<div id="mobileMenuBackdrop" class="mobile-backdrop md:hidden"></div>

<!-- Mobile Menu Sidebar (Right Side) -->
<div id="mobileMenu" class="mobile-menu md:hidden flex flex-col">
  <div class="flex justify-between items-center p-4 border-b dark:border-gray-700">
    <span class="font-bold text-lg gradient-text">منو</span>
    <button id="mobileMenuClose" class="text-gray-500 hover:text-red-500 text-2xl transition focus:outline-none cursor-pointer">
      <i class="fas fa-times"></i>
    </button>
  </div>
  
  <div class="flex-1 overflow-y-auto py-4 px-4 space-y-2">
    <a href="index.html" class="block nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition py-3 px-4 rounded-lg">خانه</a>
    <a href="games.html" class="block nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition py-3 px-4 rounded-lg">بازی‌ها</a>
    <a href="projects.html" class="block nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition py-3 px-4 rounded-lg">پروژه‌ها</a>
    <a href="tools.html" class="block nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition py-3 px-4 rounded-lg">ابزارها</a>
    <a href="articles.html" class="block nav-link text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition py-3 px-4 rounded-lg">مقاله‌ها</a>
  </div>
  
  <div class="p-4 border-t dark:border-gray-700">
    <div class="flex justify-center">
      <div id="themeToggleMobile" class="theme-toggle-wrapper cursor-pointer" role="switch">
        <div class="sun-icon">☀️</div>
        <div class="moon-icon">🌙</div>
        <div class="theme-toggle-slider"></div>
      </div>
    </div>
  </div>
</div>
`;

// ⚠️ اصلاح حیاتی: اضافه شدن style="display: flex !important;" برای خنثی کردن inline-block در فایل CSS شما
// و اضافه شدن data-i18n برای هماهنگی با سیستم ترجمه شما
const footerHTML = `
<footer class="bg-gray-900 text-white py-8 md:py-12 mt-auto">
  <div class="container mx-auto px-4">
    <div class="flex flex-col items-center space-y-6">
      <div class="flex justify-center space-x-4 space-x-reverse">
        <a href="https://t.me/BK_1ir" target="_blank" rel="noopener noreferrer" class="footer-btn flex items-center justify-center text-white hover:text-indigo-400" style="display: flex !important;" aria-label="Telegram">
          <i class="fab fa-telegram text-xl" aria-hidden="true"></i>
        </a>
        <a href="https://www.linkedin.com/in/bardia-klidari-64a32a30b" target="_blank" rel="noopener noreferrer" class="footer-btn flex items-center justify-center text-white hover:text-indigo-400" style="display: flex !important;" aria-label="LinkedIn">
          <i class="fab fa-linkedin text-xl" aria-hidden="true"></i>
        </a>
        <a href="mailto:unity.tim.ir@gmail.com" class="footer-btn flex items-center justify-center text-white hover:text-indigo-400" style="display: flex !important;" aria-label="Email">
          <i class="fas fa-envelope text-xl" aria-hidden="true"></i>
        </a>
        <a href="tel:09211243320" class="footer-btn flex items-center justify-center text-white hover:text-indigo-400" style="display: flex !important;" aria-label="Phone">
          <i class="fas fa-phone text-xl" aria-hidden="true"></i>
        </a>
      </div>
      <div class="flex flex-wrap justify-center gap-6 text-sm">
        <a href="tel:09211243320" class="flex items-center space-x-2 space-x-reverse hover:text-indigo-400 transition">
          <i class="fas fa-phone" aria-hidden="true"></i><span>09211243320</span>
        </a>
        <a href="mailto:unity.tim.ir@gmail.com" class="flex items-center space-x-2 space-x-reverse hover:text-indigo-400 transition">
          <i class="fas fa-envelope" aria-hidden="true"></i><span>unity.tim.ir@gmail.com</span>
        </a>
      </div>
      <p class="text-gray-400 text-sm text-center" data-i18n="footer.copyright">© 2024 بردیا کلیدری. ساخته شده با عشق و قهوه فراوان ☕</p>
      <p class="text-gray-500 text-xs text-center" data-i18n="footer.availability">Available 24/7 for awesome projects | ارتباط ۲۴ ساعته</p>
    </div>
  </div>
</footer>
`;

// ============================================================================
// 2. INJECTION & INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // ۱. اطمینان از راست‌چین بودن کل صفحه (ضروری برای کارکرد صحیح space-x-reverse)
  document.documentElement.setAttribute('dir', 'rtl');
  document.body.setAttribute('dir', 'rtl');

  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');

  // ۲. تزریق HTML
  if (headerContainer) headerContainer.innerHTML = headerHTML;
  if (footerContainer) {
    footerContainer.innerHTML = footerHTML;
    footerContainer.classList.add('w-full'); // اطمینان از عرض کامل برای کارکرد mt-auto
  }

  try {
    // ۳. تزریق همزمان فایل‌های CSS
    await Promise.all([
      loadCSS('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css'),
      loadCSS('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'),
      loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'),
      loadCSS('/css/style.css') // فایل CSS سفارشی شما
    ]);

    // اعمال فونت به صورت پیش‌فرض
    document.body.style.fontFamily = "'Vazirmatn', sans-serif";

    // ۴. تزریق فایل‌های JS
    await loadJS('https://cdn.jsdelivr.net/npm/typed.js@2.0.12');

    // ۵. راه‌اندازی رابط کاربری
    if (typeof initUI === 'function') {
      initUI();
    }
  } catch (error) {
    console.error('❌ خطا در بارگذاری منابع (CSS/JS):', error);
  }
});

// ============================================================================
// 3. UI & INTERACTION LOGIC
// ============================================================================
function initUI() {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleMobile = document.getElementById('themeToggleMobile');
  const body = document.body;
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  if (isDarkMode) {
    themeToggle?.classList.add('dark');
    themeToggleMobile?.classList.add('dark');
    body.classList.add('dark');
  }

  function toggleTheme() {
    body.classList.toggle('dark');
    themeToggle?.classList.toggle('dark');
    themeToggleMobile?.classList.toggle('dark'); // اصلاح باگ تایپو
    localStorage.setItem('darkMode', body.classList.contains('dark'));
  }

  themeToggle?.addEventListener('click', toggleTheme);
  themeToggleMobile?.addEventListener('click', toggleTheme);

  // Mobile Menu Logic (هماهنگ با کلاس‌های .active در فایل CSS شما)
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');

  function openMobileMenu() {
    mobileMenu.classList.add('active');
    mobileMenuBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // قفل اسکرول
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuBackdrop.classList.remove('active');
    document.body.style.overflow = ''; // آزادسازی اسکرول
  }

  mobileMenuBtn?.addEventListener('click', openMobileMenu);
  mobileMenuClose?.addEventListener('click', closeMobileMenu);
  mobileMenuBackdrop?.addEventListener('click', closeMobileMenu);

  // Scroll Reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

  // Typed.js
  const typedName = document.getElementById('typed-name');
  if (typedName && typeof Typed !== 'undefined') {
    new Typed('#typed-name', {
      strings: ['بردیا کلیدری'],
      typeSpeed: 100,
      showCursor: false
    });
  }

  const typedRole = document.getElementById('typed-role');
  if (typedRole && typeof Typed !== 'undefined') {
    new Typed('#typed-role', {
      strings: ['توسعه‌دهنده فول‌استک | Unity Expert', 'متخصص هوش مصنوعی', 'کارشناس امنیت سایبری'],
      typeSpeed: 80, backSpeed: 50, backDelay: 2000, loop: true, showCursor: true, cursorChar: '|'
    });
  }

  // Contact Form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      if (name.length < 2 || !/^[0-9]{11}$/.test(phone) || message.length < 10) {
        alert('لطفاً اطلاعات را به درستی وارد کنید.');
        return;
      }

      const telegramMsg = `📩 پیام جدید:\n👤 نام: ${name}\n📞 تلفن: ${phone}\n💬 پیام: ${message}`;
      window.open(`https://t.me/BK_1ir?text=${encodeURIComponent(telegramMsg)}`, '_blank');
      contactForm.reset();
      alert('✅ تلگرام باز شد. لطفاً پیام را ارسال کنید.');
    });

    document.getElementById('contactPhone').addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  }
}