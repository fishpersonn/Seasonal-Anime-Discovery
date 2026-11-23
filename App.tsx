import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchWinter2026AnimePage } from './services/jikanService';
import { Anime, FilterState, SortOption } from './types';
import AnimeCard from './components/AnimeCard';
import AnimeCardSkeleton from './components/AnimeCardSkeleton';
import FilterSidebar from './components/FilterSidebar';
import AnimeModal from './components/AnimeModal';
import Toast from './components/Toast';
import FallingPetals from './components/FallingPetals';
import { dictionaries } from './utils/translations';
import { Search, Menu, Snowflake, Globe, RefreshCcw, WifiOff, ArrowUp, Loader2, ListFilter, X } from 'lucide-react';

type Lang = 'en' | 'zh';

const SORT_OPTIONS: SortOption[] = ['default', 'score', 'popularity', 'members', 'date', 'episodes', 'title'];
const SEARCH_DEBOUNCE_MS = 300;

const detectLanguage = (): Lang => {
  try {
    const stored = localStorage.getItem('language');
    if (stored === 'en' || stored === 'zh') return stored;
  } catch { /* ignore */ }
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};

// Read filters / sort from the URL so links are shareable and survive reloads.
const readUrlState = (): { filters: FilterState; sort: SortOption } => {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get('sort') as SortOption | null;
  return {
    filters: {
      source: params.get('source'),
      genres: (params.get('genre') || '')
        .split(',')
        .map(Number)
        .filter(n => Number.isInteger(n) && n > 0),
      search: params.get('q') || '',
      favoritesOnly: params.get('fav') === '1',
    },
    sort: sort && SORT_OPTIONS.includes(sort) ? sort : 'default',
  };
};

const sortAnime = (list: Anime[], option: SortOption): Anime[] => {
  const nullsLast = (a: number | null | undefined, b: number | null | undefined, desc: boolean) => {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return desc ? b - a : a - b;
  };
  const time = (a: Anime) => (a.aired?.from ? Date.parse(a.aired.from) : null);
  const name = (a: Anime) => a.title_english || a.title;

  return [...list].sort((a, b) => {
    switch (option) {
      case 'score': return nullsLast(a.score, b.score, true);
      case 'members': return nullsLast(a.members, b.members, true);
      case 'popularity': return nullsLast(a.popularity || null, b.popularity || null, false); // rank: lower is better
      case 'date': return nullsLast(time(a), time(b), true);
      case 'episodes': return nullsLast(a.episodes, b.episodes, true);
      case 'title': return name(a).localeCompare(name(b));
      default: return 0;
    }
  });
};

const App: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Persistent failure flag: unlike `error` (shown in a toast that auto-dismisses),
  // this stays set until the next fetch so the retry UI doesn't vanish.
  const [loadFailed, setLoadFailed] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Language State
  const [language, setLanguage] = useState<Lang>(detectLanguage);
  const t = dictionaries[language];

  // Filters & Sort State
  const [initialUrlState] = useState(readUrlState);
  const [filters, setFilters] = useState<FilterState>(initialUrlState.filters);
  const [sortOption, setSortOption] = useState<SortOption>(initialUrlState.sort);
  // Raw input value; debounced into filters.search
  const [searchInput, setSearchInput] = useState(initialUrlState.filters.search);

  // Favorites State (Persisted)
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load Favorites from LocalStorage on mount
  useEffect(() => {
    const storedFavs = localStorage.getItem('favorites');
    if (storedFavs) {
      try {
        setFavorites(new Set(JSON.parse(storedFavs)));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Persist language and reflect it on <html>
  useEffect(() => {
    try { localStorage.setItem('language', language); } catch { /* ignore */ }
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  }, [language]);

  // Debounce search input -> filters.search
  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  // Sync filters + sort to the URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.source) params.set('source', filters.source);
    if (filters.genres.length) params.set('genre', filters.genres.join(','));
    if (filters.favoritesOnly) params.set('fav', '1');
    if (sortOption !== 'default') params.set('sort', sortOption);
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, '', next);
    }
  }, [filters, sortOption]);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
  };

  // Fetch Logic
  const isFetchingRef = useRef(false);
  const fetchAnime = useCallback(async (pageNum: number, isReset: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (isReset) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      setLoadFailed(false);

      const { data, pagination } = await fetchWinter2026AnimePage(pageNum);
      
      setAnimeList(prev => isReset ? data : [...prev, ...data]);
      setHasNextPage(pagination.has_next_page);
      setPage(pageNum);

    } catch (err) {
      console.error(err);
      setError(t.error); 
      setLoadFailed(true);
    } finally {
      isFetchingRef.current = false;
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [t.error]);

  // Initial Load
  useEffect(() => {
    fetchAnime(1, true);
  }, []); 

  // Infinite scroll: load the next page whenever the sentinel is visible.
  // The observer is re-created after every load so a still-visible sentinel keeps
  // pulling pages (this also lets filters see the whole season, not just what is loaded).
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || isInitialLoading || isLoadingMore || !hasNextPage || loadFailed) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) fetchAnime(page + 1);
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isInitialLoading, isLoadingMore, hasNextPage, loadFailed, page, fetchAnime, animeList.length]);

  // Filter & Sort Logic
  const filteredAndSortedAnime = useMemo(() => {
    let result = animeList.filter(anime => {
      // 1. Source Filter
      if (filters.source && anime.source !== filters.source) return false;
      
      // 2. Genre Filter
      if (filters.genres.length > 0 && !filters.genres.every(id => anime.genres.some(g => g.mal_id === id))) return false;
      
      // 3. Search Filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = (anime.title_english?.toLowerCase().includes(searchLower)) || 
                           (anime.title.toLowerCase().includes(searchLower));
        if (!titleMatch) return false;
      }
      
      // 4. Favorites Filter
      if (filters.favoritesOnly && !favorites.has(anime.mal_id)) return false;

      return true;
    });

    // 5. Sorting
    if (sortOption !== 'default') result = sortAnime(result, sortOption);

    return result;
  }, [animeList, filters, favorites, sortOption]);

  const clearSearch = () => {
    setSearchInput('');
    setFilters(prev => ({ ...prev, search: '' }));
  };

  const clearButton = searchInput ? (
    <button
      type="button"
      onClick={clearSearch}
      aria-label={t.clearSearch}
      title={t.clearSearch}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-pink-400 hover:text-candy-accent"
    >
      <X className="h-4 w-4" />
    </button>
  ) : null;

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-candy-ink">
      <FallingPetals />
      
      {/* Toast Notification */}
      {error && (
        <Toast 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b-4 border-dashed border-yellow-300 bg-white/70 backdrop-blur-md rounded-b-[2rem]">
        <div className="mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-candy-soft hover:text-candy-accent md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={scrollToTop}>
              <Snowflake className="h-8 w-8 text-candy-accent animate__animated animate__swing animate__infinite animate__slower drop-shadow-[0_0_8px_#ff7eb6]" />
              <div>
                <h1 className="sparkle-title text-xl font-bold tracking-tight sm:text-3xl">
                  {t.season} ✨
                </h1>
                <p className="hidden text-xs text-candy-soft sm:block">{t.subtitle} ♡</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end sm:justify-between sm:flex-initial">
             {/* Search Bar */}
             <div className="relative w-full max-w-md hidden sm:block ml-8">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-sky-500" />
              </div>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="block w-full rounded-full border-2 border-sky-300 bg-candy-800/80 py-2 pl-10 pr-4 text-sm text-candy-ink placeholder-pink-300 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-300/40 transition-all"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {clearButton}
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-candy-800 border border-candy-700 hover:bg-candy-700 transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4 text-candy-highlight" />
              <span>{language === 'en' ? 'EN' : '中'}</span>
            </button>
          </div>

        </div>
        {/* Mobile Search */}
        <div className="sm:hidden px-4 pb-4">
           <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-sky-500" />
              </div>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="block w-full rounded-full border-2 border-sky-300 bg-candy-800/80 py-2 pl-10 pr-4 text-sm text-candy-ink placeholder-pink-300 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-300/40 transition-all"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {clearButton}
            </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar */}
        <FilterSidebar 
          animeList={animeList} 
          filters={filters} 
          setFilters={setFilters}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          t={t}
          language={language}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          
          {isInitialLoading ? (
            /* Skeleton Grid */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-in fade-in duration-500">
              {Array.from({ length: 10 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          ) : loadFailed && animeList.length === 0 ? (
            /* Error State */
            <div className="flex h-[60vh] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-pink-300 bg-pink-100/60 text-center p-8 animate-in zoom-in-95 duration-300">
              <div className="rounded-full bg-pink-200 p-4 mb-4">
                <WifiOff className="h-12 w-12 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-pink-500 mb-2">{t.errorTitle}</h3>
              <p className="text-candy-soft max-w-md mb-8">{t.error}</p>
              <button 
                onClick={() => fetchAnime(1, true)}
                className="group flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-3xl font-semibold shadow-lg shadow-red-600/20 transition-all hover:scale-110 hover:-rotate-2 active:scale-95"
              >
                <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                {t.retry}
              </button>
            </div>
          ) : (
            <>
              {/* Toolbar: Results Count & Sort */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-candy-ink">
                  <span className="text-sky-500 text-2xl">{filteredAndSortedAnime.length}</span> {t.foundTitles} 🌸
                </h2>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 bg-candy-800 p-1 rounded-2xl border border-candy-700">
                  <div className="px-2 text-candy-soft">
                    <ListFilter className="w-4 h-4" />
                  </div>
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent text-sm text-candy-ink focus:outline-none py-1 pr-2 cursor-pointer"
                  >
                    <option value="default" className="bg-candy-800">{t.sortDefault}</option>
                    <option value="score" className="bg-candy-800">{t.sortScore}</option>
                    <option value="popularity" className="bg-candy-800">{t.sortPopularity}</option>
                    <option value="members" className="bg-candy-800">{t.sortMembers}</option>
                    <option value="date" className="bg-candy-800">{t.sortDate}</option>
                    <option value="episodes" className="bg-candy-800">{t.sortEpisodes}</option>
                    <option value="title" className="bg-candy-800">{t.sortTitle}</option>
                  </select>
                </div>
              </div>

              {/* Grid */}
              {filteredAndSortedAnime.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-in fade-in duration-500">
                    {filteredAndSortedAnime.map(anime => (
                      <AnimeCard 
                        key={anime.mal_id} 
                        anime={anime} 
                        onClick={setSelectedAnime} 
                        isFavorite={favorites.has(anime.mal_id)}
                        toggleFavorite={toggleFavorite}
                        t={t}
                        language={language}
                      />
                    ))}
                  </div>
                  
                  {/* Infinite scroll sentinel */}
                  {hasNextPage && loadFailed && (
                    <div className="flex justify-center pt-8 pb-4">
                      <button
                        onClick={() => fetchAnime(page + 1)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-3xl font-semibold shadow-lg shadow-red-600/20 transition-all active:scale-95"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        {t.retry}
                      </button>
                    </div>
                  )}

                  {hasNextPage && !loadFailed && (
                    <div ref={sentinelRef} className="flex justify-center pt-8 pb-4 min-h-[3rem]">
                      {isLoadingMore && (
                        <div className="flex items-center gap-2 text-candy-soft">
                          <Loader2 className="w-5 h-5 animate-spin text-candy-accent" />
                          <span>{t.loadingMore}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!hasNextPage && (
                    <div className="text-center text-candy-soft text-sm py-8 border-t-2 border-dashed border-pink-300/30 mt-8">
                      {t.noMoreResults}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-candy-700 text-center">
                  <p className="text-candy-soft">{t.noResults}</p>
                  <button 
                    onClick={() => setFilters({ source: null, genres: [], search: '', favoritesOnly: false })}
                    className="mt-2 text-candy-accent hover:underline"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 p-3 rounded-full bg-gradient-to-br from-pink-400 via-yellow-400 to-emerald-400 text-white shadow-lg shadow-pink-400/40 hover:scale-110 hover:brightness-110 transition-all duration-300 transform ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
      >
        <ArrowUp className="w-6 h-6" />
      </button>

      {/* Detail Modal */}
      <AnimeModal 
        anime={selectedAnime} 
        isOpen={!!selectedAnime} 
        onClose={() => setSelectedAnime(null)} 
        language={language}
        isFavorite={selectedAnime ? favorites.has(selectedAnime.mal_id) : false}
        toggleFavorite={toggleFavorite}
        t={t}
      />
    </div>
  );
};

export default App;