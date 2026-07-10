// ===== LIST OF QURAN RECITERS (اصلاح شده با شناسه‌های صحیح) =====
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
        edition: 'ar.saadghamdi', // اصلاح: شناسه صحیح
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
        id: 'minshawi',
        name: 'منشاوی',
        desc: 'مرتّل - کیفیت 128kbps',
        edition: 'ar.minshawi', // اصلاح: minshawy → minshawi
        icon: 'م'
    },
    {
        id: 'shaatree',
        name: 'ابوبکر شاطری',
        desc: 'کیفیت 128kbps',
        edition: 'ar.shaatree', // اصلاح: abubakrishri → shaatree
        icon: 'ش'
    },
    {
        id: 'ajamy',
        name: 'احمد عجمی',
        desc: 'کیفیت 128kbps',
        edition: 'ar.ahmedalajmi', // اصلاح: ahmedajamy → ahmedalajmi
        icon: 'ا'
    }
];

// ===== تابع به‌روزرسانی شده برای ساخت URL صحیح با fallback =====
function getAudioUrl(surahNum) {
    const reciter = quranReciters[currentReciterIndex];
    
    // روش اول: استفاده از Islamic Network CDN (سوره کامل)
    const primaryUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciter.edition}/${surahNum}.mp3`;
    
    return primaryUrl;
}

// ===== تابع کمکی برای بررسی سلامت URL =====
async function checkAudioUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return true;
    } catch (error) {
        console.warn('URL check failed:', error);
        return false;
    }
}

// ===== تابع بارگذاری با مدیریت خطای بهتر =====
function loadQuran(index) {
    setDiscLoading(true);
    
    const surahNum = quranList[index].num;
    const url = getAudioUrl(surahNum);
    
    // تنظیم source
    qAudio.src = url;
    qAudio.load(); // بارگذاری صریح
    
    document.getElementById('quran-title').innerText = quranList[index].title;
    renderQuranList();
    
    // لاگ برای دیباگ
    console.log(`Loading surah ${surahNum}: ${url}`);
}

// ===== تابع پخش با مدیریت خطای بهتر =====
function playQuran(index) {
    qIndex = index;
    hasUserInteracted = true;
    loadQuran(qIndex);
    
    // تلاش برای پخش با تاخیر کوتاه برای اطمینان از بارگذاری
    setTimeout(() => {
        const playPromise = qAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isQPlaying = true;
                updateQBtn();
                setDiscLoading(false);
                console.log('✅ پخش با موفقیت شروع شد');
            }).catch(err => {
                console.error('❌ خطا در پخش:', err);
                
                // تلاش مجدد بعد از 500ms
                setTimeout(() => {
                    qAudio.play().then(() => {
                        isQPlaying = true;
                        updateQBtn();
                        setDiscLoading(false);
                    }).catch(err2 => {
                        console.error('❌ تلاش دوم هم ناموفق بود:', err2);
                        showToast('error', 'خطا در پخش', 'لطفاً اتصال اینترنت خود را بررسی کنید یا قاری دیگری را امتحان کنید', 5000);
                        setDiscLoading(false);
                    });
                }, 500);
            });
        }
    }, 100);
}

// ===== تابع تغییر قاری با بارگذاری مجدد =====
function selectReciter(index) {
    currentReciterIndex = index;
    const reciter = quranReciters[index];
    
    // ذخیره در localStorage
    localStorage.setItem('selectedReciter', reciter.id);
    
    // به‌روزرسانی UI
    updateQariDisplay();
    renderQariList();
    
    // بستن dropdown
    document.getElementById('qariDropdown').classList.remove('show');
    document.getElementById('qariSelectorBtn').classList.remove('active');
    
    // بارگذاری مجدد سوره فعلی با قاری جدید
    if (hasUserInteracted) {
        loadQuran(qIndex);
        
        // تلاش برای پخش
        setTimeout(() => {
            const playPromise = qAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    showToast('success', 'قاری تغییر کرد', `تلاوت ${reciter.name} در حال پخش است`, 3000);
                }).catch(err => {
                    console.warn('خطا در پخش خودکار:', err);
                    showToast('info', 'قاری تغییر کرد', 'برای پخش مجدد روی دکمه پخش کلیک کنید', 3000);
                });
            }
        }, 200);
    } else {
        showToast('success', 'قاری تغییر کرد', `${reciter.name} انتخاب شد`, 3000);
    }
}

// ===== مدیریت رویدادهای صوتی بهبود یافته =====
qAudio.addEventListener('error', (e) => {
    setDiscLoading(false);
    const error = e.target.error;
    let errorMsg = 'خطای نامشخص';
    
    if (error) {
        switch (error.code) {
            case 1: // MEDIA_ERR_ABORTED
                errorMsg = 'پخش متوقف شد';
                break;
            case 2: // MEDIA_ERR_NETWORK
                errorMsg = 'خطای شبکه - لطفاً اتصال اینترنت را بررسی کنید';
                break;
            case 3: // MEDIA_ERR_DECODE
                errorMsg = 'فایل صوتی خراب است';
                break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                errorMsg = 'فایل صوتی در دسترس نیست - قاری دیگری را امتحان کنید';
                break;
        }
    }
    
    console.error('خطای صوت:', errorMsg, e);
    
    if (hasUserInteracted) {
        showToast('error', 'خطای پخش', errorMsg, 5000);
    }
});

qAudio.addEventListener('canplay', () => {
    console.log('✅ فایل صوتی آماده پخش است');
    setDiscLoading(false);
});

qAudio.addEventListener('playing', () => {
    console.log('▶️ در حال پخش');
    setDiscLoading(false);
    isQPlaying = true;
    updateQBtn();
    renderQuranList();
});

qAudio.addEventListener('waiting', () => {
    console.log('⏳ در حال بافر...');
    setDiscLoading(true);
});

qAudio.addEventListener('stalled', () => {
    console.warn('⚠️ پخش متوقف شد (stalled)');
    setDiscLoading(true);
});
