// ===== TOAST NOTIFICATION SYSTEM =====
const toastIcons = {
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${toastIcons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.classList.add('hiding'); setTimeout(() => this.parentElement.remove(), 400);">×</button>
        <div class="toast-progress" style="animation: toastProgress ${duration}ms linear forwards;"></div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 400);
        }
    }, duration);
}

// ===== LIST OF QURAN RECITERS (با استفاده از Islamic Network CDN) =====
const quranReciters = [
    {
        id: 'abdulbasit-murattal',
        name: 'عبدالباسط عبدالصمد',
        desc: 'مرتّل - کیفیت 128kbps',
        edition: 'ar.abdulbasitmurattal',
        icon: 'ع'
    },
    {
        id: 'abdulbasit-mujawwad',
        name: 'عبدالباسط عبدالصمد',
        desc: 'مجوّد - کیفیت 128kbps',
        edition: 'ar.abdulbasitmujawwad',
        icon: 'ع'
    },
    {
        id: 'alafasy',
        name: 'مشاری عفاسی',
        desc: 'کیفیت 128kbps',
        edition: 'ar.alafasy',
        icon: 'م'
    },
    {
        id: 'husary',
        name: 'خلیل الحصری',
        desc: 'کیفیت 128kbps',
        edition: 'ar.husary',
        icon: 'خ'
    },
    {
        id: 'sudais',
        name: 'عبدالرحمن السدیس',
        desc: 'کیفیت 128kbps',
        edition: 'ar.abdurrahmaansudais',
        icon: 'س'
    },
    {
        id: 'muaiqly',
        name: 'ماهر المعیقلی',
        desc: 'کیفیت 128kbps',
        edition: 'ar.mahermuaiqly',
        icon: 'م'
    },
    {
        id: 'ghamadi',
        name: 'سعد الغامدی',
        desc: 'کیفیت 128kbps',
        edition: 'ar.saadghamdi',
        icon: 'غ'
    },
    {
        id: 'ayyoub',
        name: 'محمد ایوب',
        desc: 'کیفیت 128kbps',
        edition: 'ar.muhammadayyoub',
        icon: 'م'
    },
    {
        id: 'jibreel',
        name: 'محمد جبریل',
        desc: 'کیفیت 128kbps',
        edition: 'ar.muhammadjibreel',
        icon: 'م'
    },
    {
        id: 'minshawy',
        name: 'منشاوی',
        desc: 'مرتّل - کیفیت 128kbps',
        edition: 'ar.minshawy',
        icon: 'م'
    },
    {
        id: 'shaatree',
        name: 'ابوبکر شاطری',
        desc: 'کیفیت 128kbps',
        edition: 'ar.abubakrishri',
        icon: 'ش'
    },
    {
        id: 'ajamy',
        name: 'احمد عجمی',
        desc: 'کیفیت 128kbps',
        edition: 'ar.ahmedajamy',
        icon: 'ا'
    }
];

// ===== SURAH NAMES =====
const surahNames = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "یس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاریات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "حدید", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحریم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القیامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التکویر", "الانفطار", "المطففین", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "اللیل", "الضحى", "الشرح", "التین", "العلق", "القدر", "البینة", "الزلزلة", "العادیات",
    "القارعة", "التکاثر", "العصر", "الهمزة", "الفیل", "قریش", "الماعون", "الکوثر", " الکافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
];

// ===== QURAN LIST =====
const quranList = surahNames.map((name, i) => ({
    id: i,
    title: `سوره ${name}`,
    num: i + 1
}));

// ===== VARIABLES =====
let qIndex = 0;
let currentReciterIndex = 0;
const qAudio = document.getElementById('quran-audio');
const qPlayIcon = document.getElementById('q-play-icon');
const qPauseIcon = document.getElementById('q-pause-icon');
const qProgress = document.getElementById('q-progress');
const quranDisc = document.getElementById('quranDisc');
let isQPlaying = false;
let isLoading = false;
let hasUserInteracted = false;

// ===== QARI SELECTOR FUNCTIONS =====
function initQariSelector() {
    const qariSelectorBtn = document.getElementById('qariSelectorBtn');
    const qariDropdown = document.getElementById('qariDropdown');
    const qariDropdownList = document.getElementById('qariDropdownList');
    
    // Render qari list
    renderQariList();
    
    // Toggle dropdown
    qariSelectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        qariDropdown.classList.toggle('show');
        qariSelectorBtn.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!qariSelectorBtn.contains(e.target) && !qariDropdown.contains(e.target)) {
            qariDropdown.classList.remove('show');
            qariSelectorBtn.classList.remove('active');
        }
    });
    
    // Load saved reciter from localStorage
    const savedReciterId = localStorage.getItem('selectedReciter');
    if (savedReciterId) {
        const savedIndex = quranReciters.findIndex(r => r.id === savedReciterId);
        if (savedIndex !== -1) {
            currentReciterIndex = savedIndex;
            updateQariDisplay();
        }
    }
}

function renderQariList() {
    const qariDropdownList = document.getElementById('qariDropdownList');
    qariDropdownList.innerHTML = '';
    
    quranReciters.forEach((reciter, index) => {
        const isActive = index === currentReciterIndex;
        const qariItem = document.createElement('div');
        qariItem.className = `qari-item ${isActive ? 'active' : ''}`;
        qariItem.innerHTML = `
            <div class="qari-item-icon">${reciter.icon}</div>
            <div class="qari-item-info">
                <div class="qari-item-name">${reciter.name}</div>
                <div class="qari-item-desc">${reciter.desc}</div>
            </div>
            <svg class="qari-item-check" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 0 010 1.414l-8 8a1 0 01-1.414 0l-4-4a1 0 011.414-1.414L8 12.586l7.293-7.293a1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
        `;
        
        qariItem.addEventListener('click', () => {
            selectReciter(index);
        });
        
        qariDropdownList.appendChild(qariItem);
    });
}

function selectReciter(index) {
    currentReciterIndex = index;
    const reciter = quranReciters[index];
    
    // Save to localStorage
    localStorage.setItem('selectedReciter', reciter.id);
    
    // Update UI
    updateQariDisplay();
    renderQariList();
    
    // Close dropdown
    document.getElementById('qariDropdown').classList.remove('show');
    document.getElementById('qariSelectorBtn').classList.remove('active');
    
    // Reload current surah with new reciter
    if (hasUserInteracted) {
        loadQuran(qIndex);
        const playPromise = qAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                showToast('success', 'قاری تغییر کرد', `تلاوت ${reciter.name} در حال پخش است`, 3000);
            }).catch(err => {
                showToast('warning', 'قاری تغییر کرد', 'برای پخش مجدد کلیک کنید', 3000);
            });
        }
    } else {
        showToast('success', 'قاری تغییر کرد', `${reciter.name} انتخاب شد`, 3000);
    }
}

function updateQariDisplay() {
    const reciter = quranReciters[currentReciterIndex];
    document.getElementById('qariSelectorText').textContent = reciter.name;
    document.getElementById('quran-artist').textContent = `تلاوت: ${reciter.name}`;
}

// ===== تابع به‌روزرسانی شده برای ساخت URL صحیح =====
function getAudioUrl(surahNum) {
    const reciter = quranReciters[currentReciterIndex];
    // استفاده از Islamic Network CDN
    // فرمت: https://cdn.islamic.network/quran/audio-surah/{bitrate}/{edition}/{number}.mp3
    return `https://cdn.islamic.network/quran/audio-surah/128/${reciter.edition}/${surahNum}.mp3`;
}

// ===== QURAN PLAYER FUNCTIONS =====
function setDiscLoading(loading) {
    isLoading = loading;
    if (loading) {
        quranDisc.classList.add('loading');
    } else {
        quranDisc.classList.remove('loading');
    }
}

function loadQuran(index) {
    setDiscLoading(true);
    
    const surahNum = quranList[index].num;
    const url = getAudioUrl(surahNum);
    qAudio.src = url;
    document.getElementById('quran-title').innerText = quranList[index].title;
    renderQuranList();
}

function renderQuranList() {
    const listEl = document.getElementById('quran-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    quranList.forEach((s, idx) => {
        const activeClass = idx === qIndex ? 'active' : '';
        const loadingClass = idx === qIndex && isLoading ? 'loading' : '';
        listEl.innerHTML += `
            <li onclick="playQuran(${idx})" class="quran-item ${activeClass} ${loadingClass}">
                <div class="quran-item-inner">
                    <span class="quran-item-num">${idx+1}</span>
                    <span class="quran-item-name">${s.title}</span>
                </div>
                ${idx === qIndex && isQPlaying && !isLoading ? '<div class="quran-item-dot animate-pulse"></div>' : ''}
            </li>`;
    });
}

function playQuran(index) {
    qIndex = index;
    hasUserInteracted = true;
    loadQuran(qIndex);
    
    const playPromise = qAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isQPlaying = true;
            updateQBtn();
            setDiscLoading(false);
        }).catch(err => {
            console.log('خطا در پخش:', err);
            showToast('error', 'خطا در پخش', 'لطفاً اتصال اینترنت خود را بررسی کنید', 4000);
            setDiscLoading(false);
        });
    }
}

function toggleQuran() {
    if (!hasUserInteracted) {
        playQuran(qIndex);
        return;
    }
    
    if (qAudio.paused) {
        const playPromise = qAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isQPlaying = true;
                updateQBtn();
                renderQuranList();
                setDiscLoading(false);
            }).catch(() => {
                showToast('error', 'خطا در پخش', 'سرور در دسترس نیست', 4000);
            });
        }
    } else {
        qAudio.pause();
        isQPlaying = false;
        updateQBtn();
        renderQuranList();
    }
}

function updateQBtn() {
    if (qPlayIcon && qPauseIcon) {
        qPlayIcon.style.display = isQPlaying ? 'none' : 'block';
        qPauseIcon.style.display = isQPlaying ? 'block' : 'none';
    }
}

function nextQuran() { 
    qIndex = (qIndex + 1) % quranList.length; 
    playQuran(qIndex); 
}

function prevQuran() { 
    qIndex = (qIndex - 1 + quranList.length) % quranList.length; 
    playQuran(qIndex); 
}

qAudio.addEventListener('timeupdate', () => {
    if (qAudio.duration) {
        qProgress.style.width = `${(qAudio.currentTime / qAudio.duration) * 100}%`;
        document.getElementById('q-current').innerText = formatTime(qAudio.currentTime);
        document.getElementById('q-total').innerText = formatTime(qAudio.duration);
    }
});

qAudio.addEventListener('ended', nextQuran);

qAudio.addEventListener('canplay', () => {
    setDiscLoading(false);
});

qAudio.addEventListener('playing', () => {
    setDiscLoading(false);
    isQPlaying = true;
    updateQBtn();
    renderQuranList();
});

qAudio.addEventListener('error', (e) => {
    setDiscLoading(false);
    if (hasUserInteracted && e.target.error && e.target.error.code !== 0) {
        showToast('error', 'خطای سرور', 'فایل صوتی در دسترس نیست', 4000);
    }
});

qAudio.addEventListener('waiting', () => {
    setDiscLoading(true);
});

function seekQuran(e) {
    const rect = document.getElementById('q-progress-bg').getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    if (qAudio.duration) qAudio.currentTime = (offsetX / width) * qAudio.duration;
}

function formatTime(sec) {
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize qari selector
    initQariSelector();
    
    // Initialize quran player
    document.getElementById('quran-title').innerText = quranList[0].title;
    renderQuranList();
    
    // Welcome toast
    setTimeout(() => {
        showToast('info', 'به پخش‌کننده قرآن خوش آمدید', 'قاری مورد نظر خود را انتخاب کنید و روی سوره کلیک کنید', 5000);
    }, 1000);
});
