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

// ===== DUA - ۳۷ قطعه دعا و زیارت با صدای استاد محسن فرهمند =====
const duaNames = [
    "دعای اللهم اعرفنی",
    "دعای عهد",
    "دعای اللهم اصلح",
    "دعای بعد از زیارت امام رضا علیه السلام",
    "الهی عظم البلاء",
    "دعای فرج",
    "دعای جوشن صغیر",
    "دعای ندبه",
    "دعای نور",
    "دعای روز عید غدیر",
    "دعای روز مباهله",
    "دعای صباح",
    "دعای سحر",
    "دعای سمات",
    "دعای سریع الاجابه",
    "دعای توسل",
    "استغاثه به امام زمان علیه السلام",
    "مناجات مسجد کوفه",
    "صلوات امام کاظم علیه السلام",
    "صلوات امام زمان علیه السلام",
    "صلوات امام صادق علیه السلام",
    "زیارت ائمه بقیع",
    "زیارت ائمه سر من رای",
    "زیارت آل یاسین",
    "زیارت امین الله",
    "زیارت امیرالمومنین ع در روز یکشنبه",
    "زیارت امام هادی علیه السلام",
    "زیارت امام عسکری علیه السلام",
    "زیارت امام جواد علیه السلام",
    "زیارت امام کاظم علیه السلام",
    "زیارت امام رضا علیه السلام",
    "اللهم بلغ",
    "زیارت جامعه کبیره",
    "زیارت مادر امام زمان علیه السلام",
    "آیت الکرسی",
    "زیارت عاشورا",
    "صنمی قریش"
];

// تابع ساخت URL هر قطعه
const duaServers = [
    (i) => `https://www.omid-varan.ir/sounds/Farahmand/omidvaran-farahmand-${i}.mp3`
];

const duaList = duaNames.map((name, i) => ({
    id: i,
    title: name,
    num: i + 1
}));

let dIndex = 0;
const dAudio = document.getElementById('dua-audio');
const dPlayIcon = document.getElementById('d-play-icon');
const dPauseIcon = document.getElementById('d-pause-icon');
const dProgress = document.getElementById('d-progress');
const duaDisc = document.getElementById('duaDisc');
let isDPlaying = false;
let currentServerIndex = 0;
let isLoading = false;
let hasUserInteracted = false;

function setDiscLoading(loading) {
    isLoading = loading;
    if (loading) {
        duaDisc.classList.add('loading');
    } else {
        duaDisc.classList.remove('loading');
    }
}

function loadDua(index, retry = false) {
    if (!retry) currentServerIndex = 0;
    setDiscLoading(true);
    
    const url = duaServers[currentServerIndex](duaList[index].num);
    dAudio.src = url;
    document.getElementById('dua-title').innerText = duaList[index].title;
    renderDuaList();
}

function renderDuaList() {
    const listEl = document.getElementById('dua-list');
    listEl.innerHTML = '';
    duaList.forEach((d, idx) => {
        const activeClass = idx === dIndex ? 'active' : '';
        const loadingClass = idx === dIndex && isLoading ? 'loading' : '';
        listEl.innerHTML += `
            <li onclick="playDua(${idx})" class="quran-item ${activeClass} ${loadingClass}">
                <div class="quran-item-inner">
                    <span class="quran-item-num">${idx+1}</span>
                    <span class="quran-item-name">${d.title}</span>
                </div>
                ${idx === dIndex && isDPlaying && !isLoading ? '<div class="quran-item-dot animate-pulse"></div>' : ''}
            </li>`;
    });
}

function tryNextServer(index) {
    if (currentServerIndex < duaServers.length - 1) {
        currentServerIndex++;
        const newUrl = duaServers[currentServerIndex](duaList[index].num);
        dAudio.src = newUrl;
        return dAudio.play().then(() => {
            showToast('success', 'اتصال برقرار شد', 'سرور جایگزین با موفقیت متصل شد');
            return true;
        }).catch(() => {
            return tryNextServer(index);
        });
    }
    return Promise.resolve(false);
}

function playDua(index) {
    dIndex = index;
    hasUserInteracted = true;
    loadDua(dIndex);
    
    const playPromise = dAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isDPlaying = true;
            updateDBtn();
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

function toggleDua() {
    if (!hasUserInteracted) {
        playDua(dIndex);
        return;
    }
    
    if (dAudio.paused) {
        const playPromise = dAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isDPlaying = true;
                updateDBtn();
                renderDuaList();
            }).catch(() => {
                tryNextServer(dIndex).then(success => {
                    if (!success) {
                        showToast('error', 'خطا در پخش', 'سرور در دسترس نیست.');
                    }
                });
            });
        }
    } else {
        dAudio.pause();
        isDPlaying = false;
        updateDBtn();
        renderDuaList();
    }
}

function updateDBtn() {
    dPlayIcon.style.display = isDPlaying ? 'none' : 'block';
    dPauseIcon.style.display = isDPlaying ? 'block' : 'none';
}

function nextDua() { 
    dIndex = (dIndex + 1) % duaList.length; 
    playDua(dIndex); 
}

function prevDua() { 
    dIndex = (dIndex - 1 + duaList.length) % duaList.length; 
    playDua(dIndex); 
}

dAudio.addEventListener('timeupdate', () => {
    if (dAudio.duration) {
        dProgress.style.width = `${(dAudio.currentTime / dAudio.duration) * 100}%`;
        document.getElementById('d-current').innerText = formatTime(dAudio.currentTime);
        document.getElementById('d-total').innerText = formatTime(dAudio.duration);
    }
});

dAudio.addEventListener('ended', nextDua);

dAudio.addEventListener('canplay', () => {
    setDiscLoading(false);
});

dAudio.addEventListener('playing', () => {
    setDiscLoading(false);
    isDPlaying = true;
    updateDBtn();
    renderDuaList();
});

dAudio.addEventListener('error', (e) => {
    setDiscLoading(false);
    if (hasUserInteracted && e.target.error && e.target.error.code !== 0) {
        tryNextServer(dIndex).then(success => {
            if (!success) {
                showToast('error', 'خطای سرور', 'متأسفانه سرور در دسترس نیست.');
            }
        });
    }
});

dAudio.addEventListener('waiting', () => {
    setDiscLoading(true);
});

function seekDua(e) {
    const rect = document.getElementById('d-progress-bg').getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    if (dAudio.duration) dAudio.currentTime = (offsetX / width) * dAudio.duration;
}

function formatTime(sec) {
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// ===== INITIALIZATION =====
document.getElementById('dua-title').innerText = duaList[0].title;
renderDuaList();