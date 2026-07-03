// ============================================
// 🎴 سیستم فال حافظ - نسخه پایدار (اصلاح شده)
// ============================================

async function getHafezFal() {
    const btn = document.getElementById('hafez-btn');
    const res = document.getElementById('hafez-result');
    const loading = document.getElementById('hafez-loading');
    
    if(btn) btn.style.display = 'none';
    if(loading) loading.style.display = 'block';
    if(res) res.style.display = 'none';
    
    let poemData = null;
    let falData = null;
    
    // ============================================
    // مرحله 1: گرفتن شعر از گنجور (با CORS proxy)
    // ============================================
    try {
        console.log('📖 دریافت شعر از گنجور...');
        
        // استفاده از CORS proxy برای دور زدن محدودیت CORS
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const ganjoorUrl = 'https://api.ganjoor.net/api/ganjoor/hafez/faal';
        
        const poemResponse = await fetch(corsProxy + encodeURIComponent(ganjoorUrl));
        
        if (poemResponse.ok) {
            poemData = await poemResponse.json();
            console.log('✅ شعر دریافت شد');
        }
    } catch (error) {
        console.warn('⚠️ خطا در دریافت شعر:', error.message);
        
        // تلاش بدون proxy (شاید در برخی محیط‌ها کار کند)
        try {
            console.log('🔄 تلاش مستقیم بدون proxy...');
            const poemResponse = await fetch('https://api.ganjoor.net/api/ganjoor/hafez/faal');
            if (poemResponse.ok) {
                poemData = await poemResponse.json();
                console.log('✅ شعر مستقیم دریافت شد');
            }
        } catch (directError) {
            console.warn('⚠️ خطا در دریافت مستقیم:', directError.message);
        }
    }
    
    // ============================================
    // مرحله 2: گرفتن فال/تفسیر از API فال
    // ============================================
    try {
        console.log('🔮 دریافت فال...');
        
        const falResponse = await fetch('https://hafez-dxle.onrender.com/fal');
        
        if (falResponse.ok) {
            falData = await falResponse.json();
            console.log('✅ فال دریافت شد');
        }
    } catch (error) {
        console.warn('⚠️ خطا در دریافت فال:', error.message);
        
        // تلاش دوم: استفاده از poemSummary از گنجور به عنوان تفسیر
        if (poemData && poemData.poemSummary) {
            falData = {
                id: poemData.id,
                interpreter: poemData.poemSummary
            };
            console.log('✅ تفسیر از poemSummary استفاده شد');
        } else {
            // تلاش سوم: API جایگزین با CORS proxy
            try {
                console.log('🔄 تلاش با API جایگزین...');
                const corsProxy = 'https://api.allorigins.win/raw?url=';
                const altUrl = 'https://api.ganjoor.net/api/ganjoor/hafez/faal';
                
                const altResponse = await fetch(corsProxy + encodeURIComponent(altUrl));
                
                if (altResponse.ok) {
                    const altData = await altResponse.json();
                    falData = {
                        id: altData.id,
                        interpreter: altData.poemSummary || "به کلیت غزل توجه کنید و با دل پاک نیت نمایید."
                    };
                    console.log('✅ فال جایگزین دریافت شد');
                }
            } catch (altError) {
                console.warn('⚠️ خطا در API جایگزین:', altError.message);
            }
        }
    }
    
    // ============================================
    // مرحله 3: ترکیب و نمایش نتیجه
    // ============================================
    
    // اگر هیچ داده‌ای نگرفتیم
    if (!poemData && !falData) {
        showError("متأسفانه امکان دریافت فال وجود ندارد. لطفاً اتصال اینترنت خود را بررسی کنید.");
        return;
    }
    
    // ساخت داده نهایی
    const finalFal = {
        poem: poemData?.plainText || poemData?.htmlText || "شعر در دسترس نیست",
        tafsir: falData?.interpreter || "تفسیری برای این غزل ثبت نشده است.",
        id: poemData?.id || falData?.id || Math.floor(Math.random() * 495) + 1,
        title: poemData?.title || falData?.title || `غزل شماره ${poemData?.id || falData?.id || ''}`,
        source: poemData && falData ? "گنجور + Hafez Fortune" : (poemData ? "گنجور" : "Hafez Fortune")
    };
    
    // نمایش نتیجه
    displayFal(finalFal);
}

// ============================================
// 📖 نمایش فال
// ============================================
function displayFal(fal) {
    const res = document.getElementById('hafez-result');
    const loading = document.getElementById('hafez-loading');
    
    if (loading) loading.style.display = 'none';
    if (res) res.style.display = 'block';
    
    const titleEl = document.getElementById('hafez-title');
    const sourceEl = document.getElementById('hafez-source');
    if(titleEl) titleEl.innerText = fal.title;
    if(sourceEl) sourceEl.innerText = `منبع: ${fal.source}`;
    
    const poemElement = document.getElementById('hafez-poem');
    if(poemElement) poemElement.innerText = fal.poem;
    
    const tafsirElement = document.getElementById('hafez-tafsir');
    if(tafsirElement) tafsirElement.innerText = fal.tafsir;
}

// ============================================
// ❌ نمایش خطا
// ============================================
function showError(message) {
    const res = document.getElementById('hafez-result');
    const loading = document.getElementById('hafez-loading');
    
    if (loading) loading.style.display = 'none';
    if (res) res.style.display = 'block';
    
    const titleEl = document.getElementById('hafez-title');
    const sourceEl = document.getElementById('hafez-source');
    if(titleEl) titleEl.innerText = '';
    if(sourceEl) sourceEl.innerText = '';
    
    const poemEl = document.getElementById('hafez-poem');
    if(poemEl) {
        poemEl.innerHTML = `
            <div style="color:#ff6b6b; padding:2rem; font-family:'Vazirmatn', sans-serif; text-align:center;">
                ❌ ${message}
                <br><br>
                <button onclick="getHafezFal()" style="padding:10px 24px; background:var(--gold-500); color:var(--emerald-950); border:none; border-radius:9999px; cursor:pointer; font-size:1rem; font-family:'Vazirmatn', sans-serif; font-weight:700;">
                    🔄 تلاش مجدد
                </button>
            </div>
        `;
    }
    
    const tafsirEl = document.getElementById('hafez-tafsir');
    if(tafsirEl) tafsirEl.innerText = '';
}

// ============================================
// 🔄 ریست کردن فال
// ============================================
function resetHafez() {
    const res = document.getElementById('hafez-result');
    const loading = document.getElementById('hafez-loading');
    const btn = document.getElementById('hafez-btn');
    
    if(res) res.style.display = 'none';
    if(loading) loading.style.display = 'none';
    if(btn) btn.style.display = 'block';
    
    const titleEl = document.getElementById('hafez-title');
    const sourceEl = document.getElementById('hafez-source');
    const poemEl = document.getElementById('hafez-poem');
    const tafsirEl = document.getElementById('hafez-tafsir');
    
    if(titleEl) titleEl.innerText = '';
    if(sourceEl) sourceEl.innerText = '';
    if(poemEl) poemEl.innerText = '';
    if(tafsirEl) tafsirEl.innerText = '';
}