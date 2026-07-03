// ===== SALAVAT COUNTER =====
let salavatCount = parseInt(localStorage.getItem('ultraSalavat')) || 0;
const salavatNumEl = document.getElementById('salavat-number');

// نمایش عدد اولیه
if (salavatNumEl) {
    salavatNumEl.innerText = salavatCount.toLocaleString('fa-IR');
}

function addSalavat(event) {
    // افزایش شمارنده
    salavatCount++;
    localStorage.setItem('ultraSalavat', salavatCount);
    
    // به‌روزرسانی نمایش با فرمت فارسی
    if (salavatNumEl) {
        salavatNumEl.innerText = salavatCount.toLocaleString('fa-IR');
        
        // افکت پالس
        salavatNumEl.classList.remove('pulse');
        void salavatNumEl.offsetWidth;
        salavatNumEl.classList.add('pulse');
    }
    
    // افکت ذرات
    const btn = document.getElementById('salavat-btn');
    const rect = btn.getBoundingClientRect();
    
    // محاسبه موقعیت کلیک
    let x, y;
    if (event.touches && event.touches.length > 0) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        x = event.changedTouches[0].clientX - rect.left;
        y = event.changedTouches[0].clientY - rect.top;
    } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    }
    
    // ساخت ذرات
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        createParticle(btn, x, y, i);
    }
    
    // افکت موج
    createRipple(btn);
    
    // ویبره (اگر پشتیبانی شود)
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

function createParticle(container, x, y, index) {
    const particle = document.createElement('div');
    particle.className = 'salavat-particle';
    
    const size = Math.random() * 8 + 6;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    
    // جهت تصادفی
    const angle = (index / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 80 + Math.random() * 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    particle.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    container.appendChild(particle);
    
    // شروع انیمیشن
    requestAnimationFrame(() => {
        particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        particle.style.opacity = '0';
    });
    
    // حذف ذره
    setTimeout(() => particle.remove(), 800);
}

function createRipple(container) {
    let ripple = container.querySelector('.salavat-celebration');
    if (!ripple) {
        ripple = document.createElement('div');
        ripple.className = 'salavat-celebration';
        container.appendChild(ripple);
    }
    
    ripple.classList.remove('active');
    void ripple.offsetWidth;
    ripple.classList.add('active');
    
    setTimeout(() => ripple.classList.remove('active'), 1000);
}

// ===== CONFIRMATION MODAL =====
let isConfirmModalOpen = false;

function showResetConfirmModal() {
    if (isConfirmModalOpen) return;
    
    const modal = document.getElementById('salavatConfirmModal');
    if (!modal) {
        // ساخت modal اگر وجود ندارد
        createConfirmModal();
        setTimeout(showResetConfirmModal, 100);
        return;
    }
    
    modal.classList.remove('closing');
    modal.classList.add('active');
    isConfirmModalOpen = true;
    document.body.style.overflow = 'hidden';
    
    // فوکوس روی دکمه لغو
    setTimeout(() => {
        const cancelBtn = modal.querySelector('.salavat-confirm-btn.cancel');
        if (cancelBtn) cancelBtn.focus();
    }, 100);
}

function closeResetConfirmModal() {
    if (!isConfirmModalOpen) return;
    
    const modal = document.getElementById('salavatConfirmModal');
    modal.classList.add('closing');
    
    setTimeout(() => {
        modal.classList.remove('active', 'closing');
        isConfirmModalOpen = false;
        document.body.style.overflow = '';
    }, 300);
}

function createConfirmModal() {
    const modal = document.createElement('div');
    modal.id = 'salavatConfirmModal';
    modal.className = 'salavat-confirm-modal';
    modal.onclick = handleConfirmBackdropClick;
    
    modal.innerHTML = `
        <div class="salavat-confirm-box">
            <div class="salavat-confirm-header">
                <div class="salavat-confirm-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 class="salavat-confirm-title">بازنشانی شمارنده</h3>
                <p class="salavat-confirm-message">آیا مطمئن هستید که می‌خواهید شمارنده صلوات را صفر کنید؟</p>
            </div>
            
            <div class="salavat-confirm-body">
                <div class="salavat-confirm-warning">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>این عمل قابل بازگشت نیست و تمام صلوات‌های شمارش شده پاک خواهند شد.</p>
                </div>
            </div>
            
            <div class="salavat-confirm-actions">
                <button class="salavat-confirm-btn cancel" onclick="closeResetConfirmModal()">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    <span>لغو</span>
                </button>
                <button class="salavat-confirm-btn confirm" onclick="confirmResetSalavat()">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <span>بله، بازنشانی کن</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function handleConfirmBackdropClick(event) {
    if (event.target.id === 'salavatConfirmModal') {
        closeResetConfirmModal();
    }
}

function confirmResetSalavat() {
    salavatCount = 0;
    localStorage.setItem('ultraSalavat', '0');
    
    if (salavatNumEl) {
        salavatNumEl.innerText = '۰';
        salavatNumEl.classList.remove('pulse');
        void salavatNumEl.offsetWidth;
        salavatNumEl.classList.add('pulse');
    }
    
    closeResetConfirmModal();
    
    // نمایش پیام موفقیت
    setTimeout(() => {
        if (typeof showToast === 'function') {
            showToast('success', 'شمارنده بازنشانی شد', 'صلوات‌های شما از نو شروع شد');
        }
    }, 300);
}

function resetSalavat() {
    showResetConfirmModal();
}

// راه‌اندازی دکمه
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('salavat-btn');
    if (btn) {
        btn.addEventListener('click', addSalavat);
    }
    
    // ساخت modal در هنگام لود
    createConfirmModal();
});

// کلید Escape برای بستن modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isConfirmModalOpen) {
        closeResetConfirmModal();
    }
});