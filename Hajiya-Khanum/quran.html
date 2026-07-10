(() => {
    'use strict';

    // ===== CONSTANTS =====
    const API_BASE = 'https://mp3quran.net/api/v3';
    const CACHE_PREFIX = 'quran_cache_';
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

    // Makki/Madani mapping (index 0 = Surah 1)
    const SURAHH_TYPES = [
        'مکی','مدنی','مدنی','مدنی','مدنی','مکی','مکی','مدنی','مدنی','مکی',
        'مکی','مکی','مدنی','مکی','مکی','مکی','مکی','مکی','مکی','مکی',
        'مکی','مدنی','مکی','مدنی','مکی','مکی','مکی','مکی','مکی','مکی',
        'مکی','مکی','مدنی','مکی','مکی','مکی','مکی','مکی','مکی','مکی',
        'مکی','مکی','مکی','مکی','مکی','مکی','مکی','مدنی','مدنی','مکی',
        'مکی','مکی','مکی','مکی','مدنی','مکی','مدنی','مدنی','مدنی','مدنی',
        'مدنی','مدنی','مدنی','مدنی','مدنی','مدنی','مکی','مکی','مکی','مکی',
        'مکی','مکی','مکی','مکی','مکی','مکی','مکی','مکی','مکی','مکی',
        'مکی','مکی','مکی','مکی','مکی','مکی','مکی','مکی','مکی','مکی',
        'مکی','مکی','مکی','مکی','مکی','مکی','مکی','مدنی','مدنی','مکی',
        'مکی','مکی','مکی','مکی'
    ];

    // ===== UTILITIES =====
    const parseSurahList = (list) => {
        if (!list) return [];
        if (Array.isArray(list)) return list.map(n => Number(n)).filter(n => !isNaN(n));
        if (typeof list === 'string') {
            return list.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
        }
        return [];
    };

    const formatTime = (sec) => {
        if (isNaN(sec) || !isFinite(sec)) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const toNum = (v) => {
        const n = Number(v);
        return isNaN(n) ? null : n;
    };

    // ===== CACHE =====
    const Cache = {
        get(key) {
            try {
                const raw = localStorage.getItem(CACHE_PREFIX + key);
                if (!raw) return null;
                const data = JSON.parse(raw);
                if (Date.now() - data.timestamp > CACHE_EXPIRY) {
                    localStorage.removeItem(CACHE_PREFIX + key);
                    return null;
                }
                return data.value;
            } catch { return null; }
        },
        set(key, value) {
            try {
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ timestamp: Date.now(), value }));
            } catch {}
        }
    };

    // ===== API =====
    const API = {
        async fetchReciters() {
            const cached = Cache.get('reciters');
            if (cached) { this.refreshReciters(); return cached; }
            return await this._fetchReciters();
        },
        async _fetchReciters() {
            try {
                const res = await fetch(`${API_BASE}/reciters?language=fa`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                const reciters = (data.reciters || []).map(r => ({
                    id: toNum(r.id),
                    name: r.name || '',
                    rewaya: r.rewaya || '',
                    server: (r.server || '').replace(/\/+$/, '') + '/',
                    surah_list: parseSurahList(r.surah_list)
                }));
                Cache.set('reciters', reciters);
                return reciters;
            } catch (e) {
                console.error('Failed to fetch reciters:', e);
                return [];
            }
        },
        async refreshReciters() {
            try {
                const data = await (await fetch(`${API_BASE}/reciters?language=fa`)).json();
                const reciters = (data.reciters || []).map(r => ({
                    id: toNum(r.id),
                    name: r.name || '',
                    rewaya: r.rewaya || '',
                    server: (r.server || '').replace(/\/+$/, '') + '/',
                    surah_list: parseSurahList(r.surah_list)
                }));
                Cache.set('reciters', reciters);
            } catch {}
        },
        async fetchSuwar() {
            const cached = Cache.get('suwar');
            if (cached) { this.refreshSuwar(); return cached; }
            return await this._fetchSuwar();
        },
        async _fetchSuwar() {
            try {
                const res = await fetch(`${API_BASE}/suwar?language=fa`);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                const suwar = (data.suwar || []).map(s => ({
                    id: toNum(s.id),
                    name: s.name || '',
                    start_page: toNum(s.start_page),
                    end_page: toNum(s.end_page),
                    surah_type: s.surah_type || ''
                }));
                Cache.set('suwar', suwar);
                return suwar;
            } catch (e) {
                console.error('Failed to fetch suwar:', e);
                return [];
            }
        },
        async refreshSuwar() {
            try {
                const data = await (await fetch(`${API_BASE}/suwar?language=fa`)).json();
                const suwar = (data.suwar || []).map(s => ({
                    id: toNum(s.id),
                    name: s.name || '',
                    start_page: toNum(s.start_page),
                    end_page: toNum(s.end_page),
                    surah_type: s.surah_type || ''
                }));
                Cache.set('suwar', suwar);
            } catch {}
        }
    };

    // ===== STATE =====
    class State {
        constructor() {
            this.data = this.load();
        }
        load() {
            const defaults = {
                currentReciterId: null,
                currentSurahId: 1,
                volume: 1,
                speed: 1,
                playbackPosition: 0,
                favorites: { reciters: [], surahs: [] },
                history: [],
                repeatMode: 'none',
                shuffle: false
            };
            try {
                const saved = localStorage.getItem('quran_player_state');
                if (saved) return { ...defaults, ...JSON.parse(saved) };
            } catch {}
            return defaults;
        }
        save() {
            try { localStorage.setItem('quran_player_state', JSON.stringify(this.data)); } catch {}
        }
        update(partial) {
            Object.assign(this.data, partial);
            this.save();
        }
    }

    // ===== TOAST =====
    const toastIcons = {
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    function showToast(type, title, message, duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${toastIcons[type] || toastIcons.info}</div>
            <div class="toast-content">
                <div class="toast-title"></div>
                <div class="toast-message"></div>
            </div>
            <button class="toast-close">×</button>
            <div class="toast-progress" style="animation: toastProgress ${duration}ms linear forwards;"></div>
        `;
        toast.querySelector('.toast-title').textContent = title;
        toast.querySelector('.toast-message').textContent = message;
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 400);
        });
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 400);
            }
        }, duration);
    }

    // ===== MAIN APP =====
    class QuranApp {
        constructor() {
            this.state = new State();
            this.reciters = [];
            this.suwar = [];
            this.audio = document.getElementById('quran-audio');
            this.isQPlaying = false;
            this.isLoading = false;
            this.currentView = 'surahs';

            this.injectStyles();
            this.injectExtraControls();
            this.injectListTabs();
            this.bindEvents();
            this.init();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .quran-extra-controls{display:flex;align-items:center;justify-content:center;gap:.8rem;margin-top:1rem;flex-wrap:wrap}
                .quran-extra-controls button,.quran-extra-controls select{background:rgba(255,255,255,.05);border:1px solid rgba(212,175,55,.3);color:var(--gold-400,#d4af37);padding:.4rem .7rem;border-radius:.5rem;cursor:pointer;transition:all .2s;font-family:inherit;font-size:.85rem}
                .quran-extra-controls button:hover,.quran-extra-controls select:hover{background:rgba(212,175,55,.15);border-color:var(--gold-400,#d4af37)}
                .quran-extra-controls button.active{background:rgba(212,175,55,.25);color:#fff}
                .volume-control{display:flex;align-items:center;gap:.4rem;color:var(--gold-400,#d4af37)}
                .volume-control input[type="range"]{width:70px;accent-color:var(--gold-400,#d4af37)}
                .quran-list-tabs{display:flex;gap:.3rem;margin-bottom:.8rem;border-bottom:1px solid rgba(212,175,55,.2);padding-bottom:.5rem;flex-wrap:wrap}
                .quran-list-tabs button{background:transparent;border:none;color:var(--emerald-200,#a7f3d0);padding:.4rem .8rem;cursor:pointer;border-radius:.4rem .4rem 0 0;font-family:inherit;font-size:.9rem;transition:all .2s}
                .quran-list-tabs button.active{background:rgba(212,175,55,.15);color:var(--gold-400,#d4af37);border-bottom:2px solid var(--gold-400,#d4af37)}
                .quran-filters{display:flex;flex-direction:column;gap:.5rem;margin-bottom:.8rem}
                .quran-filters input,.quran-filters select{background:rgba(255,255,255,.05);border:1px solid rgba(212,175,55,.3);color:var(--emerald-100,#d1fae5);padding:.5rem;border-radius:.5rem;font-family:inherit;width:100%}
                .quran-filters input::placeholder{color:rgba(209,250,229,.5)}
                .quran-item{display:flex;justify-content:space-between;align-items:center;padding:.7rem .8rem;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;transition:background .2s;list-style:none}
                .quran-item:hover{background:rgba(255,255,255,.05)}
                .quran-item.active{background:rgba(212,175,55,.12);border-right:3px solid var(--gold-400,#d4af37)}
                .quran-item-info{display:flex;flex-direction:column;gap:.15rem;flex:1;min-width:0}
                .quran-item-title{color:var(--emerald-100,#d1fae5);font-weight:500;font-size:.95rem}
                .quran-item-subtitle{color:var(--emerald-300,#6ee7b7);font-size:.8rem;opacity:.8}
                .quran-item-actions{display:flex;gap:.3rem;flex-shrink:0}
                .quran-item-actions button{background:transparent;border:none;color:var(--emerald-200,#a7f3d0);cursor:pointer;padding:.2rem .4rem;font-size:1.1rem;line-height:1}
                .quran-item-actions button.favorited{color:var(--gold-400,#d4af37)}
                .quran-buffer{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.12);width:0;pointer-events:none;transition:width .3s}
                .quran-progress-bg{position:relative;overflow:hidden}
                .quran-item-header{padding:.7rem .8rem;color:var(--gold-400,#d4af37);font-weight:bold;border-bottom:1px solid rgba(212,175,55,.2);font-size:.95rem}
                .qari-item{display:flex;align-items:center;gap:.7rem;padding:.7rem;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .2s}
                .qari-item:hover{background:rgba(255,255,255,.05)}
                .qari-item.active{background:rgba(212,175,55,.12)}
                .qari-item-name{color:var(--emerald-100,#d1fae5);font-weight:500;font-size:.95rem}
                .qari-item-desc{color:var(--emerald-300,#6ee7b7);font-size:.8rem;opacity:.8}
                .qari-item-check{margin-right:auto;color:var(--gold-400,#d4af37);display:none}
                .qari-item.active .qari-item-check{display:block}
                .quran-status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-left:.4rem;animation:pulse 2s infinite}
                @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
            `;
            document.head.appendChild(style);
        }

        injectExtraControls() {
            const controls = document.querySelector('.quran-controls');
            if (!controls) return;

            const extra = document.createElement('div');
            extra.className = 'quran-extra-controls';
            extra.innerHTML = `
                <button id="btn-shuffle" title="پخش تصادفی" aria-label="پخش تصادفی">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                </button>
                <button id="btn-repeat" title="تکرار" aria-label="تکرار">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                </button>
                <button id="btn-download" title="دانلود" aria-label="دانلود سوره">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <label class="volume-control" title="صدا">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="1" aria-label="تنظیم صدا">
                </label>
                <select id="speed-select" title="سرعت پخش" aria-label="سرعت پخش">
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1" selected>1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                </select>
            `;
            controls.after(extra);

            // Add buffer bar to progress
            const progressBg = document.getElementById('q-progress-bg');
            if (progressBg && !document.getElementById('q-buffer')) {
                const bufferBar = document.createElement('div');
                bufferBar.className = 'quran-buffer';
                bufferBar.id = 'q-buffer';
                progressBg.prepend(bufferBar);
            }
        }

        injectListTabs() {
            const listSide = document.querySelector('.quran-list-side');
            if (!listSide) return;

            const tabs = document.createElement('div');
            tabs.className = 'quran-list-tabs';
            tabs.innerHTML = `
                <button class="active" data-view="surahs">سوره‌ها</button>
                <button data-view="reciters">قاریان</button>
                <button data-view="favorites">علاقه‌مندی‌ها</button>
                <button data-view="history">تاریخچه</button>
            `;

            const filters = document.createElement('div');
            filters.className = 'quran-filters';
            filters.id = 'quran-filters';
            filters.style.display = 'none';
            filters.innerHTML = `
                <input type="text" id="search-input" placeholder="جستجو..." aria-label="جستجو">
                <select id="filter-rewaya" aria-label="فیلتر روایت" style="display:none">
                    <option value="">همه روایات</option>
                </select>
                <select id="filter-surah" aria-label="فیلتر سوره" style="display:none">
                    <option value="">همه سوره‌ها</option>
                </select>
            `;

            const header = listSide.querySelector('.quran-list-header');
            if (header) {
                header.after(tabs);
                tabs.after(filters);
            } else {
                listSide.prepend(filters);
                listSide.prepend(tabs);
            }
        }

        bindEvents() {
            // List clicks
            const listEl = document.getElementById('quran-list');
            if (listEl) {
                listEl.addEventListener('click', (e) => {
                    const item = e.target.closest('.quran-item');
                    if (!item) return;
                    const favBtn = e.target.closest('.quran-item-actions button');
                    if (favBtn) {
                        e.stopPropagation();
                        const type = item.dataset.type === 'surah' ? 'surahs' : 'reciters';
                        this.toggleFavorite(type, toNum(item.dataset.id));
                        return;
                    }
                    if (item.dataset.type === 'surah') {
                        this.playSurah(toNum(item.dataset.id));
                    } else if (item.dataset.type === 'reciter') {
                        this.selectReciter(toNum(item.dataset.id));
                    } else if (item.dataset.type === 'history') {
                        this.state.update({ currentReciterId: toNum(item.dataset.reciterId) });
                        this.playSurah(toNum(item.dataset.surahId));
                    }
                });
            }

            // Qari dropdown clicks
            const qariList = document.getElementById('qariDropdownList');
            if (qariList) {
                qariList.addEventListener('click', (e) => {
                    const item = e.target.closest('.qari-item');
                    if (item) {
                        this.selectReciter(toNum(item.dataset.id));
                        document.getElementById('qariDropdown').classList.remove('show');
                    }
                });
            }

            // Tabs
            document.querySelectorAll('.quran-list-tabs button').forEach(btn => {
                btn.addEventListener('click', () => this.switchView(btn.dataset.view));
            });

            // Filters
            document.getElementById('search-input')?.addEventListener('input', () => this.renderList());
            document.getElementById('filter-rewaya')?.addEventListener('change', () => this.renderList());
            document.getElementById('filter-surah')?.addEventListener('change', () => this.renderList());

            // Extra controls
            document.getElementById('btn-shuffle')?.addEventListener('click', () => this.toggleShuffle());
            document.getElementById('btn-repeat')?.addEventListener('click', () => this.toggleRepeat());
            document.getElementById('btn-download')?.addEventListener('click', () => this.downloadTrack());
            document.getElementById('volume-slider')?.addEventListener('input', (e) => {
                this.audio.volume = parseFloat(e.target.value);
                this.state.update({ volume: this.audio.volume });
            });
            document.getElementById('speed-select')?.addEventListener('change', (e) => {
                this.audio.playbackRate = parseFloat(e.target.value);
                this.state.update({ speed: this.audio.playbackRate });
            });

            // Progress bar seek
            const progressBg = document.getElementById('q-progress-bg');
            if (progressBg) {
                progressBg.addEventListener('click', (e) => {
                    const rect = progressBg.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const width = rect.width;
                    if (this.audio.duration) {
                        this.audio.currentTime = (offsetX / width) * this.audio.duration;
                    }
                });
            }

            // Keyboard
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));

            // Audio events
            this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
            this.audio.addEventListener('loadedmetadata', () => this.onMetadataLoad());
            this.audio.addEventListener('progress', () => this.onProgress());
            this.audio.addEventListener('ended', () => this.onEnded());
            this.audio.addEventListener('waiting', () => this.setLoading(true));
            this.audio.addEventListener('canplay', () => this.setLoading(false));
            this.audio.addEventListener('playing', () => {
                this.setLoading(false);
                this.isQPlaying = true;
                this.updatePlayState(true);
                this.renderList();
            });
            this.audio.addEventListener('pause', () => {
                this.isQPlaying = false;
                this.updatePlayState(false);
                this.renderList();
            });
            this.audio.addEventListener('error', () => {
                this.setLoading(false);
                showToast('error', 'خطای سرور', 'فایل صوتی در دسترس نیست');
            });

            // Qari dropdown toggle
            document.getElementById('qariSelectorBtn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('qariDropdown').classList.toggle('show');
            });
            document.addEventListener('click', (e) => {
                const btn = document.getElementById('qariSelectorBtn');
                const dd = document.getElementById('qariDropdown');
                if (btn && dd && !btn.contains(e.target) && !dd.contains(e.target)) {
                    dd.classList.remove('show');
                }
            });
        }

        async init() {
            showToast('info', 'در حال بارگذاری', 'لطفاً صبر کنید...', 2000);

            const [reciters, suwar] = await Promise.all([
                API.fetchReciters(),
                API.fetchSuwar()
            ]);

            this.reciters = reciters;
            this.suwar = suwar;

            if (reciters.length === 0 || suwar.length === 0) {
                showToast('error', 'خطا', 'مشکل در دریافت اطلاعات. لطفاً صفحه را رفرش کنید.');
                return;
            }

            this.populateFilters();
            this.renderQariDropdown();

            // Restore state
            if (this.state.data.currentReciterId) {
                const r = reciters.find(x => x.id === this.state.data.currentReciterId);
                if (r) this.updateReciterUI(r);
                else this.updateReciterUI(reciters[0]);
            } else {
                this.updateReciterUI(reciters[0]);
            }

            this.audio.volume = this.state.data.volume;
            this.audio.playbackRate = this.state.data.speed;
            document.getElementById('volume-slider').value = this.state.data.volume;
            document.getElementById('speed-select').value = this.state.data.speed;

            this.switchView('surahs');
            showToast('success', 'پخش‌کننده قرآن', 'آماده پخش است. روی یک سوره کلیک کنید.', 3000);
        }

        populateFilters() {
            const rewayaFilter = document.getElementById('filter-rewaya');
            const surahFilter = document.getElementById('filter-surah');
            if (rewayaFilter) {
                const rewayas = [...new Set(this.reciters.map(r => r.rewaya).filter(Boolean))];
                rewayas.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r;
                    opt.textContent = r;
                    rewayaFilter.appendChild(opt);
                });
            }
            if (surahFilter) {
                this.suwar.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.name;
                    surahFilter.appendChild(opt);
                });
            }
        }

        switchView(view) {
            this.currentView = view;
            document.querySelectorAll('.quran-list-tabs button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });
            const filters = document.getElementById('quran-filters');
            const rewayaF = document.getElementById('filter-rewaya');
            const surahF = document.getElementById('filter-surah');
            if (view === 'reciters') {
                filters.style.display = 'flex';
                rewayaF.style.display = 'block';
                surahF.style.display = 'block';
            } else {
                filters.style.display = 'flex';
                rewayaF.style.display = 'none';
                surahF.style.display = 'none';
            }
            this.renderList();
        }

        renderList() {
            const listEl = document.getElementById('quran-list');
            if (!listEl) return;
            listEl.innerHTML = '';
            const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();

            if (this.currentView === 'surahs') {
                const items = this.suwar.filter(s =>
                    s.name.toLowerCase().includes(searchVal) || String(s.id).includes(searchVal)
                );
                items.forEach(s => listEl.appendChild(this.createSurahItem(s)));
            } else if (this.currentView === 'reciters') {
                const rewayaVal = document.getElementById('filter-rewaya')?.value || '';
                const surahVal = toNum(document.getElementById('filter-surah')?.value);
                const items = this.reciters.filter(r => {
                    const matchSearch = r.name.toLowerCase().includes(searchVal) ||
                        (r.rewaya && r.rewaya.toLowerCase().includes(searchVal));
                    const matchRewaya = !rewayaVal || r.rewaya === rewayaVal;
                    const matchSurah = !surahVal || r.surah_list.includes(surahVal);
                    return matchSearch && matchRewaya && matchSurah;
                });
                items.forEach(r => listEl.appendChild(this.createReciterItem(r)));
            } else if (this.currentView === 'favorites') {
                this.renderFavorites(listEl);
            } else if (this.currentView === 'history') {
                this.renderHistory(listEl);
            }
        }

        createSurahItem(surah) {
            const el = document.createElement('li');
            el.className = 'quran-item';
            el.dataset.type = 'surah';
            el.dataset.id = surah.id;
            if (this.state.data.currentSurahId === surah.id) el.classList.add('active');

            const info = document.createElement('div');
            info.className = 'quran-item-info';

            const title = document.createElement('div');
            title.className = 'quran-item-title';
            title.textContent = `${surah.id}. ${surah.name}`;

            const subtitle = document.createElement('div');
            subtitle.className = 'quran-item-subtitle';
            const type = SURAHH_TYPES[surah.id - 1] || surah.surah_type || '';
            subtitle.textContent = `${type} | صفحه ${surah.start_page || '-'} تا ${surah.end_page || '-'}`;

            info.appendChild(title);
            info.appendChild(subtitle);

            const actions = document.createElement('div');
            actions.className = 'quran-item-actions';
            const favBtn = document.createElement('button');
            favBtn.title = 'افزودن به علاقه‌مندی‌ها';
            favBtn.textContent = '★';
            if (this.state.data.favorites.surahs.includes(surah.id)) favBtn.classList.add('favorited');
            actions.appendChild(favBtn);

            el.appendChild(info);
            el.appendChild(actions);
            return el;
        }

        createReciterItem(reciter) {
            const el = document.createElement('li');
            el.className = 'quran-item';
            el.dataset.type = 'reciter';
            el.dataset.id = reciter.id;
            if (this.state.data.currentReciterId === reciter.id) el.classList.add('active');

            const info = document.createElement('div');
            info.className = 'quran-item-info';

            const title = document.createElement('div');
            title.className = 'quran-item-title';
            title.textContent = reciter.name;

            const subtitle = document.createElement('div');
            subtitle.className = 'quran-item-subtitle';
            subtitle.textContent = reciter.rewaya || 'روایت نامشخص';

            info.appendChild(title);
            info.appendChild(subtitle);

            const actions = document.createElement('div');
            actions.className = 'quran-item-actions';
            const favBtn = document.createElement('button');
            favBtn.title = 'افزودن به علاقه‌مندی‌ها';
            favBtn.textContent = '★';
            if (this.state.data.favorites.reciters.includes(reciter.id)) favBtn.classList.add('favorited');
            actions.appendChild(favBtn);

            el.appendChild(info);
            el.appendChild(actions);
            return el;
        }

        renderFavorites(listEl) {
            const favR = this.reciters.filter(r => this.state.data.favorites.reciters.includes(r.id));
            const favS = this.suwar.filter(s => this.state.data.favorites.surahs.includes(s.id));
            if (favR.length === 0 && favS.length === 0) {
                listEl.textContent = 'هیچ مورد علاقه‌ای وجود ندارد.';
                return;
            }
            if (favR.length > 0) {
                const h = document.createElement('li');
                h.className = 'quran-item-header';
                h.textContent = 'قاریان مورد علاقه';
                listEl.appendChild(h);
                favR.forEach(r => listEl.appendChild(this.createReciterItem(r)));
            }
            if (favS.length > 0) {
                const h = document.createElement('li');
                h.className = 'quran-item-header';
                h.textContent = 'سوره‌های مورد علاقه';
                listEl.appendChild(h);
                favS.forEach(s => listEl.appendChild(this.createSurahItem(s)));
            }
        }

        renderHistory(listEl) {
            if (!this.state.data.history.length) {
                listEl.textContent = 'تاریخچه پخشی وجود ندارد.';
                return;
            }
            this.state.data.history.forEach(h => {
                const r = this.reciters.find(x => x.id === h.reciterId);
                const s = this.suwar.find(x => x.id === h.surahId);
                if (!r || !s) return;
                const el = document.createElement('li');
                el.className = 'quran-item';
                el.dataset.type = 'history';
                el.dataset.reciterId = r.id;
                el.dataset.surahId = s.id;
                const info = document.createElement('div');
                info.className = 'quran-item-info';
                const t = document.createElement('div');
                t.className = 'quran-item-title';
                t.textContent = `سوره ${s.name}`;
                const st = document.createElement('div');
                st.className = 'quran-item-subtitle';
                st.textContent = r.name;
                info.appendChild(t);
                info.appendChild(st);
                el.appendChild(info);
                listEl.appendChild(el);
            });
        }

        renderQariDropdown() {
            const list = document.getElementById('qariDropdownList');
            if (!list) return;
            list.innerHTML = '';
            this.reciters.forEach(r => {
                const item = document.createElement('div');
                item.className = 'qari-item';
                item.dataset.id = r.id;
                if (r.id === this.state.data.currentReciterId) item.classList.add('active');

                const name = document.createElement('div');
                name.className = 'qari-item-name';
                name.textContent = r.name;

                const desc = document.createElement('div');
                desc.className = 'qari-item-desc';
                desc.textContent = r.rewaya || '';

                const check = document.createElement('svg');
                check.className = 'qari-item-check';
                check.setAttribute('fill', 'currentColor');
                check.setAttribute('viewBox', '0 0 20 20');
                check.innerHTML = '<path fill-rule="evenodd" d="M16.707 5.293a1 0 010 1.414l-8 8a1 0 01-1.414 0l-4-4a1 0 011.414-1.414L8 12.586l7.293-7.293a1 0 011.414 0z" clip-rule="evenodd"/>';

                item.appendChild(name);
                item.appendChild(desc);
                item.appendChild(check);
                list.appendChild(item);
            });
        }

        updateReciterUI(reciter) {
            if (!reciter) return;
            this.state.update({ currentReciterId: reciter.id });
            document.getElementById('qariSelectorText').textContent = reciter.name;
            document.getElementById('quran-artist').textContent = `تلاوت: ${reciter.name}`;
            this.renderQariDropdown();
            this.renderList();
        }

        generateUrl(reciter, surahId) {
            const padded = String(surahId).padStart(3, '0');
            return `${reciter.server}${padded}.mp3`;
        }

        async playSurah(surahId) {
            const reciter = this.reciters.find(r => r.id === this.state.data.currentReciterId);
            if (!reciter) {
                showToast('warning', 'هشدار', 'لطفاً ابتدا یک قاری انتخاب کنید.');
                return;
            }
            if (!reciter.surah_list.includes(surahId)) {
                showToast('error', 'خطا', 'این قاری این سوره را در لیست خود ندارد.');
                return;
            }

            const surah = this.suwar.find(s => s.id === surahId);
            if (!surah) return;

            this.setLoading(true);
            const url = this.generateUrl(reciter, surahId);
            this.audio.src = url;

            try {
                await this.audio.load();
                this.state.update({ currentSurahId: surahId });
                document.getElementById('quran-title').textContent = `سوره ${surah.name}`;
                document.getElementById('quran-artist').textContent = `تلاوت: ${reciter.name}`;

                await this.audio.play();
                this.isQPlaying = true;
                this.updatePlayState(true);
                this.renderList();
                this.addToHistory(reciter.id, surahId);
                showToast('success', 'در حال پخش', `${surah.name} - ${reciter.name}`, 2500);
            } catch (e) {
                console.error('Play error:', e);
                this.setLoading(false);
                showToast('error', 'خطا در پخش', 'لطفاً اتصال اینترنت خود را بررسی کنید.');
            }
        }

        selectReciter(reciterId) {
            const reciter = this.reciters.find(r => r.id === reciterId);
            if (!reciter) return;
            this.updateReciterUI(reciter);
            document.getElementById('qariDropdown').classList.remove('show');
            showToast('success', 'قاری تغییر کرد', reciter.name, 2500);
            if (this.state.data.currentSurahId && this.isQPlaying) {
                this.playSurah(this.state.data.currentSurahId);
            }
        }

        toggleFavorite(type, id) {
            const favs = this.state.data.favorites[type];
            const idx = favs.indexOf(id);
            if (idx > -1) favs.splice(idx, 1);
            else favs.push(id);
            this.state.update({ favorites: this.state.data.favorites });
            this.renderList();
            this.renderQariDropdown();
        }

        addToHistory(reciterId, surahId) {
            let history = this.state.data.history || [];
            history = history.filter(h => !(h.reciterId === reciterId && h.surahId === surahId));
            history.unshift({ reciterId, surahId, timestamp: Date.now() });
            if (history.length > 50) history = history.slice(0, 50);
            this.state.update({ history });
        }

        toggleShuffle() {
            const newState = !this.state.data.shuffle;
            this.state.update({ shuffle: newState });
            document.getElementById('btn-shuffle').classList.toggle('active', newState);
            showToast('info', newState ? 'پخش تصادفی روشن' : 'پخش تصادفی خاموش', '', 1500);
        }

        toggleRepeat() {
            const modes = ['none', 'all', 'one'];
            const current = this.state.data.repeatMode;
            const next = modes[(modes.indexOf(current) + 1) % modes.length];
            this.state.update({ repeatMode: next });
            const btn = document.getElementById('btn-repeat');
            btn.classList.toggle('active', next !== 'none');
            const labels = { none: 'بدون تکرار', all: 'تکرار همه', one: 'تکرار یک سوره' };
            btn.title = labels[next];
            showToast('info', labels[next], '', 1500);
        }

        downloadTrack() {
            const reciter = this.reciters.find(r => r.id === this.state.data.currentReciterId);
            const surahId = this.state.data.currentSurahId;
            if (!reciter || !surahId) {
                showToast('warning', 'هشدار', 'ابتدا یک سوره را انتخاب کنید.');
                return;
            }
            const url = this.generateUrl(reciter, surahId);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reciter.name} - ${String(surahId).padStart(3, '0')}.mp3`;
            a.target = '_blank';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
        }

        nextTrack() {
            let nextSurah;
            if (this.state.data.shuffle) {
                const idx = Math.floor(Math.random() * this.suwar.length);
                nextSurah = this.suwar[idx].id;
            } else {
                const currentIdx = this.suwar.findIndex(s => s.id === this.state.data.currentSurahId);
                nextSurah = this.suwar[(currentIdx + 1) % this.suwar.length].id;
            }
            this.playSurah(nextSurah);
        }

        prevTrack() {
            const currentIdx = this.suwar.findIndex(s => s.id === this.state.data.currentSurahId);
            const prevSurah = this.suwar[(currentIdx - 1 + this.suwar.length) % this.suwar.length].id;
            this.playSurah(prevSurah);
        }

        onTimeUpdate() {
            if (!this.audio.duration) return;
            const pct = (this.audio.currentTime / this.audio.duration) * 100;
            const progress = document.getElementById('q-progress');
            if (progress) progress.style.width = `${pct}%`;
            const curEl = document.getElementById('q-current');
            if (curEl) curEl.textContent = formatTime(this.audio.currentTime);
            this.state.update({ playbackPosition: this.audio.currentTime });
        }

        onMetadataLoad() {
            const totEl = document.getElementById('q-total');
            if (totEl) totEl.textContent = formatTime(this.audio.duration);
            this.setLoading(false);
        }

        onProgress() {
            if (this.audio.buffered.length > 0 && this.audio.duration) {
                const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
                const pct = (bufferedEnd / this.audio.duration) * 100;
                const buffer = document.getElementById('q-buffer');
                if (buffer) buffer.style.width = `${pct}%`;
            }
        }

        onEnded() {
            if (this.state.data.repeatMode === 'one') {
                this.audio.currentTime = 0;
                this.audio.play().catch(() => {});
            } else {
                this.nextTrack();
            }
        }

        updatePlayState(isPlaying) {
            const playIcon = document.getElementById('q-play-icon');
            const pauseIcon = document.getElementById('q-pause-icon');
            if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
            if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
            const disc = document.getElementById('quranDisc');
            if (disc) {
                if (isPlaying) disc.classList.add('animate-pulse-glow');
                else disc.classList.remove('animate-pulse-glow');
            }
        }

        setLoading(loading) {
            this.isLoading = loading;
            const disc = document.getElementById('quranDisc');
            if (disc) {
                if (loading) disc.classList.add('loading');
                else disc.classList.remove('loading');
            }
        }

        handleKeyboard(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.audio.paused) {
                        if (!this.audio.src) this.playSurah(this.state.data.currentSurahId);
                        else this.audio.play().catch(() => {});
                    } else this.audio.pause();
                    break;
                case 'ArrowLeft': this.nextTrack(); break;
                case 'ArrowRight': this.prevTrack(); break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.audio.volume = Math.min(1, this.audio.volume + 0.1);
                    document.getElementById('volume-slider').value = this.audio.volume;
                    this.state.update({ volume: this.audio.volume });
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.audio.volume = Math.max(0, this.audio.volume - 0.1);
                    document.getElementById('volume-slider').value = this.audio.volume;
                    this.state.update({ volume: this.audio.volume });
                    break;
                case 'KeyM':
                    this.audio.volume = this.audio.volume > 0 ? 0 : 1;
                    document.getElementById('volume-slider').value = this.audio.volume;
                    this.state.update({ volume: this.audio.volume });
                    break;
                case 'KeyS': this.toggleShuffle(); break;
                case 'KeyR': this.toggleRepeat(); break;
            }
        }
    }

    // ===== GLOBAL HANDLERS (for inline HTML onclick) =====
    window.toggleQuran = () => {
        const audio = document.getElementById('quran-audio');
        if (audio.paused) {
            if (!audio.src && window.appInstance) {
                window.appInstance.playSurah(window.appInstance.state.data.currentSurahId);
            } else {
                audio.play().catch(() => {});
            }
        } else audio.pause();
    };

    window.nextQuran = () => {
        if (window.appInstance) window.appInstance.nextTrack();
    };

    window.prevQuran = () => {
        if (window.appInstance) window.appInstance.prevTrack();
    };

    window.seekQuran = (e) => {
        const rect = document.getElementById('q-progress-bg').getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const width = rect.width;
        const audio = document.getElementById('quran-audio');
        if (audio.duration) audio.currentTime = (offsetX / width) * audio.duration;
    };

    window.playQuran = (index) => {
        if (window.appInstance) window.appInstance.playSurah(index + 1);
    };

    // ===== INIT =====
    document.addEventListener('DOMContentLoaded', () => {
        window.appInstance = new QuranApp();
    });
})();
