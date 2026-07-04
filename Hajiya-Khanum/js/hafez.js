// ============================================
// 🎴 سیستم فال حافظ - نسخه با فایل JSON محلی
// ============================================

let faalsCache = null; // کش برای جلوگیری از درخواست مجدد

async function getHafezFal() {
    const btn = document.getElementById('hafez-btn');
    const res = document.getElementById('hafez-result');
    const loading = document.getElementById('hafez-loading');
    
    if(btn) btn.style.display = 'none';
    if(loading) loading.style.display = 'block';
    if(res) res.style.display = 'none';
    
    // ============================================
    // مرحله 1: دریافت فایل JSON فال‌ها
    // ============================================
    try {
        console.log('📖 دریافت فایل فال‌ها...');
        
        // اگر قبلاً دریافت نشده، از سرور بگیر
        if (!faalsCache) {
            const response = await fetch('/Hajiya-Khanum/data/Faals.json');
            
            if (!response.ok) {
                throw new Error(`خطا در دریافت فایل: ${response.status}`);
            }
            
            faalsCache = await response.json();
            console.log(`✅ ${faalsCache.length} فال با موفقیت دریافت شد`);
        }
        
        // ============================================
        // مرحله 2: انتخاب تصادفی یک فال
        // ============================================
        const randomIndex = Math.floor(Math.random() * faalsCache.length);
        const selectedFal = faalsCache[randomIndex];
        
        console.log(`🔮 فال شماره ${randomIndex + 1} انتخاب شد`);
        
        // ============================================
        // مرحله 3: نمایش نتیجه
        // ============================================
        const finalFal = {
            poem: selectedFal.poem.replace(/\r\n/g, '\n'),
            tafsir: selectedFal.interpretation,
            id: randomIndex + 1,
            title: `غزل شماره ${randomIndex + 1}`,
            source: 'دیوان حافظ'
        };
        
        displayFal(finalFal);
        
    } catch (error) {
        console.error('❌ خطا:', error.message);
        showError("متأسفانه امکان دریافت فال وجود ندارد. لطفاً دوباره تلاش کنید.");
    }
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
    if(poemElement) {
        poemElement.innerText = fal.poem;
        // حفظ خط‌های جدید در نمایش
        poemElement.style.whiteSpace = 'pre-wrap';
        poemElement.style.lineHeight = '2';
    }
    
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
