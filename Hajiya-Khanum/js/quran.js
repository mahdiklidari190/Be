// ===== TOAST NOTIFICATION SYSTEM =====
const toastIcons = {
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
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

// ===== QURAN - 114 Surahs with Multiple Servers =====
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

const quranServers = [
    (i) => `https://server16.mp3quran.net/basit/${String(i).padStart(3, '0')}.mp3`,
    (i) => `https://server17.mp3quran.net/basit/${String(i).padStart(3, '0')}.mp3`,
    (i) => `https://cdn.islamic.network/quran/audio-surah/128/ar.abdulbasitmurattal/${i}.mp3`
];

const quranList = surahNames.map((name, i) => ({
    id: i,
    title: `سوره ${name}`,
    num: i + 1
}));

let qIndex = 0;
const qAudio = document.getElementById('quran-audio');
const qPlayIcon = document.getElementById('q-play-icon');
const qPauseIcon = document.getElementById('q-pause-icon');
const qProgress = document.getElementById('q-progress');
const quranDisc = document.getElementById('quranDisc');
let isQPlaying = false;
let currentServerIndex = 0;
let isLoading = false;
let hasUserInteracted = false;

function setDiscLoading(loading) {
    isLoading = loading;
    if (loading) {
        quranDisc.classList.add('loading');
    } else {
        quranDisc.classList.remove('loading');
    }
}

function loadQuran(index, retry = false) {
    if (!retry) currentServerIndex = 0;
    setDiscLoading(true);
    
    const url = quranServers[currentServerIndex](quranList[index].num);
    qAudio.src = url;
    document.getElementById('quran-title').innerText = quranList[index].title;
    renderQuranList();
}

function renderQuranList() {
    const listEl = document.getElementById('quran-list');
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

function tryNextServer(index) {
    if (currentServerIndex < quranServers.length - 1) {
        currentServerIndex++;
        const newUrl = quranServers[currentServerIndex](quranList[index].num);
        qAudio.src = newUrl;
        return qAudio.play().then(() => {
            showToast('success', 'اتصال برقرار شد', 'سرور جایگزین با موفقیت متصل شد');
            return true;
        }).catch(() => {
            return tryNextServer(index);
        });
    }
    return Promise.resolve(false);
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
        }).catch(err => {
            tryNextServer(index).then(success => {
                if (!success) {
                    showToast('error', 'خطا در اتصال', 'متأسفانه هیچ سروری در دسترس نیست.');
                    setDiscLoading(false);
                }
            });
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
            }).catch(() => {
                tryNextServer(qIndex).then(success => {
                    if (!success) {
                        showToast('error', 'خطا در پخش', 'سرور در دسترس نیست.');
                    }
                });
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
    qPlayIcon.style.display = isQPlaying ? 'none' : 'block';
    qPauseIcon.style.display = isQPlaying ? 'block' : 'none';
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
        tryNextServer(qIndex).then(success => {
            if (!success) {
                showToast('error', 'خطای سرور', 'متأسفانه سرور در دسترس نیست.');
            }
        });
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
document.getElementById('quran-title').innerText = quranList[0].title;
renderQuranList();
