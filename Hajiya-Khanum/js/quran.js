(() => {
    'use strict';

    // ===== CONSTANTS =====
    const API_BASE = 'https://mp3quran.net/api/v3';
    const CACHE_PREFIX = 'quran_cache_';
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

    // Makki/Madani mapping for 114 Surahs (Index 0 = Surah 1)
    const SURAHH_TYPES = [
        'مکی', 'مدنی', 'مدنی', 'مدنی', 'مدنی', 'مکی', 'مکی', 'مدنی', 'مدنی', 'مکی',
        'مکی', 'مکی', 'مدنی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی',
        'مکی', 'مدنی', 'مکی', 'مدنی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی',
        'مکی', 'مکی', 'مدنی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی',
        'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مدنی', 'مدنی', 'مکی',
        'مکی', 'مکی', 'مکی', 'مکی', 'مدنی', 'مکی', 'مدنی', 'مدنی', 'مدنی', 'مدنی',
        'مدنی', 'مدنی', 'مدنی', 'مدنی', 'مدنی', 'مدنی', 'مکی', 'مکی', 'مکی', 'مکی',
        'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی',
        'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی',
        'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی',
        'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مکی', 'مدنی', 'مدنی', 'مکی',
        'مکی', 'مکی', 'مکی', 'مکی'
    ];

    // ===== UTILITY FUNCTIONS =====
    /**
     * Parses the surah_list from API (can be string or array) into an array of numbers
     */
    function parseSurahList(list) {
        if (!list) return [];
        if (Array.isArray(list)) return list.map(Number);
        if (typeof list === 'string') return list.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
        return [];
    }

    /**
     * Formats seconds into MM:SS string
     */
    function formatTime(sec) {
        if (isNaN(sec)) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // ===== CACHE MANAGER =====
    class CacheManager {
        static get(key) {
            const raw = localStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return null;
            try {
                const data = JSON.parse(raw);
                if (Date.now() - data.timestamp > CACHE_EXPIRY) {
                    localStorage.removeItem(CACHE_PREFIX + key);
                    return null;
                }
                return data.value;
            } catch {
                return null;
            }
        }

        static set(key, value) {
            try {
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                    timestamp: Date.now(),
                    value
                }));
            } catch (e) {
                console.warn('Cache set failed', e);
            }
        }
    }

    // ===== API CLIENT =====
    class ApiClient {
        static async fetchReciters() {
            const cached = CacheManager.get('reciters');
            if (cached) {
                this._refreshReciters(); // Background refresh
                return cached;
            }
            return await this._fetchAndCacheReciters();
        }

        static async _fetchAndCacheReciters() {
            try {
                const res = await fetch(`${API_BASE}/reciters?language=fa`);
                if (!res.ok) throw new Error('Network response was not ok');
                const data = await res.json();
                CacheManager.set('reciters', data.reciters);
                return data.reciters;
            } catch (e) {
                console.error('Failed to fetch reciters', e);
                throw e;
            }
        }

        static async _refreshReciters() {
            try {
                const res = await fetch(`${API_BASE}/reciters?language=fa`);
                if (res.ok) {
                    const data = await res.json();
                    CacheManager.set('reciters', data.reciters);
                }
            } catch {}
        }

        static async fetchSuwar() {
            const cached = CacheManager.get('suwar');
            if (cached) {
                this._refreshSuwar();
                return cached;
            }
            return await this._fetchAndCacheSuwar();
        }

        static async _fetchAndCacheSuwar() {
            try {
                const res = await fetch(`${API_BASE}/suwar?language=fa`);
                if (!res.ok) throw new Error('Network response was not ok');
                const data = await res.json();
                CacheManager.set('suwar', data.suwar);
                return data.suwar;
            } catch (e) {
                console.error('Failed to fetch suwar', e);
                throw e;
            }
        }

        static async _refreshSuwar() {
            try {
                const res = await fetch(`${API_BASE}/suwar?language=fa`);
                if (res.ok) {
                    const data = await res.json();
                    CacheManager.set('suwar', data.suwar);
                }
            } catch {}
        }

        // Support loading a single reciter from cache
        static async fetchReciter(id) {
            const reciters = await this.fetchReciters();
            return reciters.find(r => r.id === id);
        }
    }

    // ===== STATE MANAGER =====
    class StateManager {
        constructor() {
            this.state = this.loadState();
        }

        loadState() {
            const defaultState = {
                currentReciterId: null,
                currentSurahId: 1,
                volume: 1,
                speed: 1,
                playbackPosition: 0,
                favorites: { reciters: [], surahs: [] },
                history: [],
                repeatMode: 'none', // 'none', 'one', 'all'
                shuffle: false
            };
            try {
                const saved = localStorage.getItem('quran_player_state');
                if (saved) {
                    return { ...defaultState, ...JSON.parse(saved) };
                }
            } catch {}
            return defaultState;
        }

        saveState() {
            try {
                localStorage.setItem('quran_player_state', JSON.stringify(this.state));
            } catch {}
        }

        update(partial) {
            Object.assign(this.state, partial);
            this.saveState();
        }
    }

    // ===== PLAYER CONTROLLER =====
    class PlayerController {
        constructor(audioEl, stateManager, uiManager) {
            this.audio = audioEl;
            this.state = stateManager;
            this.ui = uiManager;
            this.setupEvents();
        }

        setupEvents() {
            this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
            this.audio.addEventListener('loadedmetadata', () => this.onMetadataLoad());
            this.audio.addEventListener('progress', () => this.onProgress());
            this.audio.addEventListener('ended', () => this.onEnded());
            this.audio.addEventListener('waiting', () => this.ui.setLoading(true));
            this.audio.addEventListener('canplay', () => this.ui.setLoading(false));
            this.audio.addEventListener('error', (e) => this.onError(e));
        }

        async loadTrack(reciter, surahId) {
            const surahList = parseSurahList(reciter.surah_list);
            if (!surahList.includes(surahId)) {
                this.ui.showToast('error', 'خطا', 'این قاری این سوره را در لیست خود ندارد.');
                return false;
            }

            const url = this.generateUrl(reciter.server, surahId);
            this.audio.src = url;
            this.ui.setLoading(true);
            
            try {
                await new Promise((resolve, reject) => {
                    const onCanPlay = () => { cleanup(); resolve(); };
                    const onError = () => { cleanup(); reject(new Error('Audio load failed')); };
                    const cleanup = () => {
                        this.audio.removeEventListener('canplay', onCanPlay);
                        this.audio.removeEventListener('error', onError);
                    };
                    this.audio.addEventListener('canplay', onCanPlay);
                    this.audio.addEventListener('error', onError);
                    this.audio.load();
                });
                
                if (this.state.state.playbackPosition > 0 && this.state.state.currentSurahId === surahId) {
                    this.audio.currentTime = this.state.state.playbackPosition;
                }
                return true;
            } catch (e) {
                this.ui.showToast('error', 'خطا', 'مشکل در بارگذاری فایل صوتی.');
                this.ui.setLoading(false);
                return false;
            }
        }

        generateUrl(server, surahId) {
            const padded = String(surahId).padStart(3, '0');
            const base = server.endsWith('/') ? server : server + '/';
            return `${base}${padded}.mp3`;
        }

        async play() {
            if (!this.audio.src) return;
            try {
                await this.audio.play();
                this.ui.updatePlayState(true);
            } catch (e) {
                this.ui.showToast('error', 'خطا', 'پخش با خطا مواجه شد.');
            }
        }

        pause() {
            this.audio.pause();
            this.ui.updatePlayState(false);
        }

        stop() {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.ui.updatePlayState(false);
        }

        seek(time) {
            this.audio.currentTime = time;
        }

        setVolume(val) {
            this.audio.volume = val;
            this.state.update({ volume: val });
        }

        setSpeed(val) {
            this.audio.playbackRate = val;
            this.state.update({ speed: val });
        }

        onTimeUpdate() {
            this.ui.updateProgress(this.audio.currentTime, this.audio.duration);
            this.state.update({ playbackPosition: this.audio.currentTime });
        }

        onMetadataLoad() {
            this.ui.updateDuration(this.audio.duration);
            this.ui.setLoading(false);
        }

        onProgress() {
            if (this.audio.buffered.length > 0 && this.audio.duration) {
                const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
                this.ui.updateBuffer(bufferedEnd, this.audio.duration);
            }
        }

        onEnded() {
            this.ui.handleTrackEnd();
        }

        onError() {
            this.ui.setLoading(false);
            this.ui.showToast('error', 'خطای سرور', 'فایل صوتی در دسترس نیست یا خطایی رخ داده است.');
        }
    }

    // ===== UI MANAGER =====
    class UIManager {
        constructor(stateManager, playerController) {
            this.state = stateManager;
            this.player = playerController;
            this.reciters = [];
            this.suwar = [];
            this.currentView = 'surahs';
            
            this.injectStyles();
            this.injectExtraControls();
            this.injectListTabs();
            this.bindEvents();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .quran-extra-controls { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
                .quran-extra-controls button, .quran-extra-controls select { background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3); color: var(--gold-400, #d4af37); padding: 0.4rem 0.8rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
                .quran-extra-controls button:hover, .quran-extra-controls select:hover { background: rgba(212,175,55,0.1); border-color: var(--gold-400, #d4af37); }
                .quran-extra-controls button.active { background: rgba(212,175,55,0.2); color: #fff; }
                .volume-control { display: flex; align-items: center; gap: 0.5rem; color: var(--gold-400, #d4af37); }
                .volume-control input[type="range"] { width: 80px; accent-color: var(--gold-400, #d4af37); }
                .quran-list-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 0.5rem; }
                .quran-list-tabs button { background: transparent; border: none; color: var(--emerald-200, #a7f3d0); padding: 0.5rem 1rem; cursor: pointer; border-radius: 0.5rem 0.5rem 0 0; font-family: inherit; font-size: 0.95rem; }
                .quran-list-tabs button.active { background: rgba(212,175,55,0.1); color: var(--gold-400, #d4af37); border-bottom: 2px solid var(--gold-400, #d4af37); }
                .quran-filters { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
                .quran-filters input, .quran-filters select { background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3); color: var(--emerald-100, #d1fae5); padding: 0.5rem; border-radius: 0.5rem; font-family: inherit; width: 100%; }
                .quran-filters input::placeholder { color: rgba(209, 250, 229, 0.5); }
                .quran-item { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: background 0.2s; }
                .quran-item:hover { background: rgba(255,255,255,0.05); }
                .quran-item.active { background: rgba(212,175,55,0.1); border-right: 3px solid var(--gold-400, #d4af37); }
                .quran-item-info { display: flex; flex-direction: column; gap: 0.2rem; }
                .quran-item-title { color: var(--emerald-100, #d1fae5); font-weight: 500; }
                .quran-item-subtitle { color: var(--emerald-300, #6ee7b7); font-size: 0.85rem; opacity: 0.8; }
                .quran-item-actions { display: flex; gap: 0.5rem; }
                .quran-item-actions button { background: transparent; border: none; color: var(--emerald-200, #a7f3d0); cursor: pointer; padding: 0.2rem; font-size: 1.2rem; }
                .quran-item-actions button.favorited { color: var(--gold-400, #d4af37); }
                .quran-buffer { position: absolute; top: 0; left: 0; height: 100%; background: rgba(255,255,255,0.1); width: 0; pointer-events: none; }
                .quran-progress-bg { position: relative; }
                .quran-item-header { padding: 0.8rem; color: var(--gold-400, #d4af37); font-weight: bold; border-bottom: 1px solid rgba(212,175,55,0.2); }
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                </button>
                <button id="btn-repeat" title="تکرار" aria-label="تکرار">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                </button>
                <button id="btn-download" title="دانلود" aria-label="دانلود سوره">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <label class="volume-control" title="صدا">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
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

            const progressBg = document.getElementById('q-progress-bg');
            if (progressBg) {
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
            filters.innerHTML = `
                <input type="text" id="search-input" placeholder="جستجو..." aria-label="جستجو">
                <select id="filter-rewaya" aria-label="فیلتر روایت">
                    <option value="">همه روایات</option>
                </select>
                <select id="filter-surah" aria-label="فیلتر سوره">
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
            // Event Delegation for Lists
            const listEl = document.getElementById('quran-list');
            if (listEl) {
                listEl.addEventListener('click', (e) => {
                    const item = e.target.closest('.quran-item');
                    if (!item) return;
                    
                    const favBtn = e.target.closest('.quran-item-actions button');
                    if (favBtn) {
                        e.stopPropagation();
                        const type = item.dataset.type === 'surah' ? 'surahs' : 'reciters';
                        this.toggleFavorite(type, Number(item.dataset.id));
                        return;
                    }
                    
                    if (item.dataset.type === 'surah') {
                        this.playSurah(Number(item.dataset.id));
                    } else if (item.dataset.type === 'reciter') {
                        this.selectReciter(Number(item.dataset.id));
                    } else if (item.dataset.type === 'history') {
                        this.state.update({ currentReciterId: Number(item.dataset.reciterId) });
                        this.playSurah(Number(item.dataset.surahId));
                    }
                });
            }

            const qariList = document.getElementById('qariDropdownList');
            if (qariList) {
                qariList.addEventListener('click', (e) => {
                    const item = e.target.closest('.qari-item');
                    if (item) {
                        this.selectReciter(Number(item.dataset.id));
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
            document.getElementById('volume-slider')?.addEventListener('input', (e) => this.player.setVolume(parseFloat(e.target.value)));
            document.getElementById('speed-select')?.addEventListener('change', (e) => this.player.setSpeed(parseFloat(e.target.value)));
            
            // Progress bar seek
            const progressBg = document.getElementById('q-progress-bg');
            if (progressBg) {
                progressBg.addEventListener('click', (e) => {
                    const rect = progressBg.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const width = rect.width;
                    if (this.player.audio.duration) {
                        this.player.seek((offsetX / width) * this.player.audio.duration);
                    }
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));
            
            // Qari dropdown toggle
            document.getElementById('qariSelectorBtn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('qariDropdown').classList.toggle('show');
            });
            document.addEventListener('click', (e) => {
                if (!document.getElementById('qariSelectorBtn')?.contains(e.target) && !document.getElementById('qariDropdown')?.contains(e.target)) {
                    document.getElementById('qariDropdown')?.classList.remove('show');
                }
            });
        }

        switchView(view) {
            this.currentView = view;
            document.querySelectorAll('.quran-list-tabs button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });
            
            const filters = document.getElementById('quran-filters');
            const rewayaFilter = document.getElementById('filter-rewaya');
            const surahFilter = document.getElementById('filter-surah');
            
            if (view === 'reciters') {
                filters.style.display = 'flex';
                rewayaFilter.style.display = 'block';
                surahFilter.style.display = 'block';
            } else {
                filters.style.display = 'flex';
                rewayaFilter.style.display = 'none';
                surahFilter.style.display = 'none';
            }
            
            this.renderList();
        }

        renderList() {
            const listEl = document.getElementById('quran-list');
            if (!listEl) return;
            listEl.innerHTML = '';

            const searchVal = document.getElementById('search-input')?.value.toLowerCase() || '';
            
            if (this.currentView === 'surahs') {
                const items = this.suwar.filter(s => 
                    s.name.toLowerCase().includes(searchVal) || String(s.id).includes(searchVal)
                );
                items.forEach(s => listEl.appendChild(this.createSurahItem(s)));
            } else if (this.currentView === 'reciters') {
                const rewayaVal = document.getElementById('filter-rewaya')?.value || '';
                const surahVal = document.getElementById('filter-surah')?.value || '';
                
                const items = this.reciters.filter(r => {
                    const matchSearch = r.name.toLowerCase().includes(searchVal) || (r.rewaya && r.rewaya.toLowerCase().includes(searchVal));
                    const matchRewaya = !rewayaVal || r.rewaya === rewayaVal;
                    const matchSurah = !surahVal || parseSurahList(r.surah_list).includes(Number(surahVal));
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
            const el = document.createElement('div');
            el.className = 'quran-item';
            el.dataset.type = 'surah';
            el.dataset.id = surah.id;
            if (this.state.state.currentSurahId === surah.id) el.classList.add('active');

            const info = document.createElement('div');
            info.className = 'quran-item-info';

            const title = document.createElement('div');
            title.className = 'quran-item-title';
            title.textContent = `${surah.id}. ${surah.name}`;

            const subtitle = document.createElement('div');
            subtitle.className = 'quran-item-subtitle';
            const type = SURAHH_TYPES[surah.id - 1] || '';
            subtitle.textContent = `${type} | صفحه ${surah.start_page || '-'} تا ${surah.end_page || '-'}`;

            info.appendChild(title);
            info.appendChild(subtitle);

            const actions = document.createElement('div');
            actions.className = 'quran-item-actions';

            const favBtn = document.createElement('button');
            favBtn.title = 'افزودن به علاقه‌مندی‌ها';
            favBtn.textContent = '★';
            if (this.state.state.favorites.surahs.includes(surah.id)) favBtn.classList.add('favorited');

            actions.appendChild(favBtn);
            el.appendChild(info);
            el.appendChild(actions);
            return el;
        }

        createReciterItem(reciter) {
            const el = document.createElement('div');
            el.className = 'quran-item';
            el.dataset.type = 'reciter';
            el.dataset.id = reciter.id;
            if (this.state.state.currentReciterId === reciter.id) el.classList.add('active');

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
            if (this.state.state.favorites.reciters.includes(reciter.id)) favBtn.classList.add('favorited');

            actions.appendChild(favBtn);
            el.appendChild(info);
            el.appendChild(actions);
            return el;
        }

        renderFavorites(listEl) {
            const favReciters = this.reciters.filter(r => this.state.state.favorites.reciters.includes(r.id));
            const favSuwar = this.suwar.filter(s => this.state.state.favorites.surahs.includes(s.id));
            
            if (favReciters.length === 0 && favSuwar.length === 0) {
                listEl.textContent = 'هیچ مورد علاقه‌ای وجود ندارد.';
                return;
            }
            
            if (favReciters.length > 0) {
                const header = document.createElement('div');
                header.className = 'quran-item-header';
                header.textContent = 'قاریان مورد علاقه';
                listEl.appendChild(header);
                favReciters.forEach(r => listEl.appendChild(this.createReciterItem(r)));
            }
            
            if (favSuwar.length > 0) {
                const header = document.createElement('div');
                header.className = 'quran-item-header';
                header.textContent = 'سوره‌های مورد علاقه';
                listEl.appendChild(header);
                favSuwar.forEach(s => listEl.appendChild(this.createSurahItem(s)));
            }
        }

        renderHistory(listEl) {
            if (this.state.state.history.length === 0) {
                listEl.textContent = 'تاریخچه پخشی وجود ندارد.';
                return;
            }
            
            this.state.state.history.forEach(h => {
                const reciter = this.reciters.find(r => r.id === h.reciterId);
                const surah = this.suwar.find(s => s.id === h.surahId);
                if (!reciter || !surah) return;
                
                const el = document.createElement('div');
                el.className = 'quran-item';
                el.dataset.type = 'history';
                el.dataset.reciterId = reciter.id;
                el.dataset.surahId = surah.id;
                
                const info = document.createElement('div');
                info.className = 'quran-item-info';
                
                const title = document.createElement('div');
                title.className = 'quran-item-title';
                title.textContent = `سوره ${surah.name}`;
                
                const subtitle = document.createElement('div');
                subtitle.className = 'quran-item-subtitle';
                subtitle.textContent = reciter.name;
                
                info.appendChild(title);
                info.appendChild(subtitle);
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
                if (r.id === this.state.state.currentReciterId) item.classList.add('active');
                
                const name = document.createElement('div');
                name.className = 'qari-item-name';
                name.textContent = r.name;
                
                const desc = document.createElement('div');
                desc.className = 'qari-item-desc';
                desc.textContent = r.rewaya || '';
                
                item.appendChild(name);
                item.appendChild(desc);
                list.appendChild(item);
            });
        }

        async playSurah(surahId) {
            const reciter = this.reciters.find(r => r.id === this.state.state.currentReciterId);
            if (!reciter) {
                this.showToast('warning', 'هشدار', 'لطفاً ابتدا یک قاری انتخاب کنید.');
                return;
            }
            
            const success = await this.player.loadTrack(reciter, surahId);
            if (success) {
                this.state.update({ currentSurahId: surahId });
                this.updateHeader(reciter, this.suwar.find(s => s.id === surahId));
                await this.player.play();
                this.renderList();
                this.addToHistory(reciter, surahId);
            }
        }

        selectReciter(reciterId, play = true) {
            this.state.update({ currentReciterId: reciterId });
            const reciter = this.reciters.find(r => r.id === reciterId);
            if (reciter) {
                document.getElementById('qariSelectorText').textContent = reciter.name;
                document.getElementById('quran-artist').textContent = `تلاوت: ${reciter.name}`;
                
                if (play && this.state.state.currentSurahId) {
                    this.playSurah(this.state.state.currentSurahId);
                }
            }
            this.renderList();
            this.renderQariDropdown();
        }

        updateHeader(reciter, surah) {
            if (!reciter || !surah) return;
            document.getElementById('quran-title').textContent = `سوره ${surah.name}`;
            document.getElementById('quran-artist').textContent = `تلاوت: ${reciter.name}`;
            document.getElementById('qariSelectorText').textContent = reciter.name;
        }

        toggleFavorite(type, id) {
            const favs = this.state.state.favorites[type];
            const idx = favs.indexOf(id);
            if (idx > -1) favs.splice(idx, 1);
            else favs.push(id);
            
            this.state.update({ favorites: this.state.state.favorites });
            this.renderList();
            this.renderQariDropdown();
        }

        addToHistory(reciter, surahId) {
            let history = this.state.state.history || [];
            history = history.filter(h => !(h.reciterId === reciter.id && h.surahId === surahId));
            history.unshift({ reciterId: reciter.id, surahId, timestamp: Date.now() });
            if (history.length > 50) history = history.slice(0, 50);
            this.state.update({ history });
        }

        toggleShuffle() {
            const newState = !this.state.state.shuffle;
            this.state.update({ shuffle: newState });
            document.getElementById('btn-shuffle').classList.toggle('active', newState);
        }

        toggleRepeat() {
            const modes = ['none', 'all', 'one'];
            const current = this.state.state.repeatMode;
            const next = modes[(modes.indexOf(current) + 1) % modes.length];
            this.state.update({ repeatMode: next });
            
            const btn = document.getElementById('btn-repeat');
            btn.classList.toggle('active', next !== 'none');
            btn.title = next === 'one' ? 'تکرار یک سوره' : next === 'all' ? 'تکرار همه' : 'بدون تکرار';
        }

        downloadTrack() {
            const reciter = this.reciters.find(r => r.id === this.state.state.currentReciterId);
            const surahId = this.state.state.currentSurahId;
            if (!reciter || !surahId) return;
            
            const url = this.player.generateUrl(reciter.server, surahId);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reciter.name} - ${surahId}.mp3`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }

        nextTrack() {
            let nextSurah;
            if (this.state.state.shuffle) {
                const randomIdx = Math.floor(Math.random() * this.suwar.length);
                nextSurah = this.suwar[randomIdx].id;
            } else {
                const currentIdx = this.suwar.findIndex(s => s.id === this.state.state.currentSurahId);
                nextSurah = this.suwar[(currentIdx + 1) % this.suwar.length].id;
            }
            this.playSurah(nextSurah);
        }

        prevTrack() {
            const currentIdx = this.suwar.findIndex(s => s.id === this.state.state.currentSurahId);
            const prevSurah = this.suwar[(currentIdx - 1 + this.suwar.length) % this.suwar.length].id;
            this.playSurah(prevSurah);
        }

        handleTrackEnd() {
            if (this.state.state.repeatMode === 'one') {
                this.player.audio.currentTime = 0;
                this.player.play();
            } else {
                this.nextTrack();
            }
        }

        handleKeyboard(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.player.audio.paused ? this.player.play() : this.player.pause();
                    break;
                case 'ArrowLeft':
                    this.nextTrack();
                    break;
                case 'ArrowRight':
                    this.prevTrack();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.player.setVolume(Math.min(1, this.player.audio.volume + 0.1));
                    document.getElementById('volume-slider').value = this.player.audio.volume;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.player.setVolume(Math.max(0, this.player.audio.volume - 0.1));
                    document.getElementById('volume-slider').value = this.player.audio.volume;
                    break;
                case 'KeyM':
                    this.player.setVolume(this.player.audio.volume > 0 ? 0 : 1);
                    document.getElementById('volume-slider').value = this.player.audio.volume;
                    break;
                case 'KeyS':
                    this.toggleShuffle();
                    break;
                case 'KeyR':
                    this.toggleRepeat();
                    break;
            }
        }

        // ===== UI UPDATE METHODS =====
        updateProgress(current, duration) {
            if (!duration) return;
            const pct = (current / duration) * 100;
            const progress = document.getElementById('q-progress');
            if (progress) progress.style.width = `${pct}%`;
            
            const curEl = document.getElementById('q-current');
            if (curEl) curEl.textContent = formatTime(current);
        }

        updateDuration(duration) {
            const totEl = document.getElementById('q-total');
            if (totEl) totEl.textContent = formatTime(duration);
        }

        updateBuffer(buffered, duration) {
            if (!duration) return;
            const pct = (buffered / duration) * 100;
            const buffer = document.getElementById('q-buffer');
            if (buffer) buffer.style.width = `${pct}%`;
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
            const disc = document.getElementById('quranDisc');
            if (disc) {
                if (loading) disc.classList.add('loading');
                else disc.classList.remove('loading');
            }
        }

        showToast(type, title, message, duration = 4000) {
            const container = document.getElementById('toastContainer');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icon = document.createElement('div');
            icon.className = 'toast-icon';
            icon.innerHTML = this.getToastIcon(type); 
            
            const content = document.createElement('div');
            content.className = 'toast-content';
            
            const t = document.createElement('div');
            t.className = 'toast-title';
            t.textContent = title;
            
            const m = document.createElement('div');
            m.className = 'toast-message';
            m.textContent = message;
            
            content.appendChild(t);
            content.appendChild(m);
            
            const close = document.createElement('button');
            close.className = 'toast-close';
            close.textContent = '×';
            close.addEventListener('click', () => {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 400);
            });
            
            const progress = document.createElement('div');
            progress.className = 'toast-progress';
            progress.style.animation = `toastProgress ${duration}ms linear forwards`;
            
            toast.appendChild(icon);
            toast.appendChild(content);
            toast.appendChild(close);
            toast.appendChild(progress);
            
            container.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.add('hiding');
                    setTimeout(() => toast.remove(), 400);
                }
            }, duration);
        }

        getToastIcon(type) {
            const icons = {
                error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
                warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
                success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
                info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
            };
            return icons[type] || icons.info;
        }
    }

    // ===== APP INITIALIZATION =====
    class App {
        constructor() {
            this.state = new StateManager();
            this.ui = new UIManager(this.state, null);
            this.player = new PlayerController(document.getElementById('quran-audio'), this.state, this.ui);
            this.ui.player = this.player;
            
            this.init();
        }
        
        async init() {
            this.ui.showToast('info', 'در حال بارگذاری', 'لطفاً صبر کنید...', 2000);
            
            try {
                const [reciters, suwar] = await Promise.all([
                    ApiClient.fetchReciters(),
                    ApiClient.fetchSuwar()
                ]);
                
                this.ui.reciters = reciters;
                this.ui.suwar = suwar;
                
                this.populateFilters();
                this.ui.renderQariDropdown();
                
                if (this.state.state.currentReciterId) {
                    const reciter = reciters.find(r => r.id === this.state.state.currentReciterId);
                    if (reciter) this.ui.selectReciter(reciter.id, false);
                } else if (reciters.length > 0) {
                    this.ui.selectReciter(reciters[0].id, false);
                }
                
                if (this.state.state.currentSurahId) {
                    this.ui.updateHeader(
                        reciters.find(r => r.id === this.state.state.currentReciterId),
                        suwar.find(s => s.id === this.state.state.currentSurahId)
                    );
                }
                
                this.player.setVolume(this.state.state.volume);
                this.player.setSpeed(this.state.state.speed);
                document.getElementById('volume-slider').value = this.state.state.volume;
                document.getElementById('speed-select').value = this.state.state.speed;
                
                this.ui.switchView('surahs');
                this.ui.showToast('success', 'پخش‌کننده قرآن', 'آماده پخش است.', 3000);
                
            } catch (e) {
                console.error(e);
                this.ui.showToast('error', 'خطا', 'مشکل در دریافت اطلاعات از سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
            }
        }
        
        populateFilters() {
            const rewayaFilter = document.getElementById('filter-rewaya');
            const surahFilter = document.getElementById('filter-surah');
            
            if (rewayaFilter) {
                const rewayas = [...new Set(this.ui.reciters.map(r => r.rewaya).filter(Boolean))];
                rewayas.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r;
                    opt.textContent = r;
                    rewayaFilter.appendChild(opt);
                });
            }
            
            if (surahFilter) {
                this.ui.suwar.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.name;
                    surahFilter.appendChild(opt);
                });
            }
        }
    }

    // ===== GLOBAL HANDLERS FOR LEGACY INLINE HTML EVENTS =====
    window.seekQuran = (e) => {
        const rect = document.getElementById('q-progress-bg').getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const width = rect.width;
        const audio = document.getElementById('quran-audio');
        if (audio.duration) audio.currentTime = (offsetX / width) * audio.duration;
    };

    window.toggleQuran = () => {
        const audio = document.getElementById('quran-audio');
        if (audio.paused) audio.play();
        else audio.pause();
    };

    window.nextQuran = () => {
        if (window.appInstance) window.appInstance.ui.nextTrack();
    };

    window.prevQuran = () => {
        if (window.appInstance) window.appInstance.ui.prevTrack();
    };

    window.playQuran = (index) => {
        if (window.appInstance) window.appInstance.ui.playSurah(index + 1);
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.appInstance = new App();
    });
})();
