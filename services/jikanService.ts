import { Anime, JikanGenre, Pagination } from '../types';

// Data source: AniList GraphQL API (https://graphql.anilist.co).
// File name is kept (jikanService) so existing imports keep working; the data is
// mapped into the app's existing `Anime` shape below.
const ENDPOINT = 'https://graphql.anilist.co';
const PER_PAGE = 25;

// Simple delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const REQUEST_TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;

// Errors worth retrying: network failures, timeouts, rate limits and 5xx.
class RetryableError extends Error {}

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage lastPage perPage }
    media(season: WINTER, seasonYear: 2026, type: ANIME, sort: POPULARITY_DESC) {
      id
      idMal
      siteUrl
      title { romaji english native }
      coverImage { large extraLarge }
      trailer { id site }
      format
      source
      episodes
      status
      duration
      averageScore
      popularity
      favourites
      description(asHtml: false)
      seasonYear
      startDate { year month day }
      endDate { year month day }
      genres
    }
  }
}`;

// --- AniList -> app model mapping ------------------------------------------

interface AniListDate { year: number | null; month: number | null; day: number | null }

interface AniListMedia {
  id: number;
  idMal: number | null;
  siteUrl: string;
  title: { romaji: string | null; english: string | null; native: string | null };
  coverImage: { large: string | null; extraLarge: string | null };
  trailer: { id: string | null; site: string | null } | null;
  format: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  duration: number | null;
  averageScore: number | null;
  popularity: number | null;
  favourites: number | null;
  description: string | null;
  seasonYear: number | null;
  startDate: AniListDate;
  endDate: AniListDate;
  genres: string[];
}

const SOURCE_LABELS: Record<string, string> = {
  ORIGINAL: 'Original',
  MANGA: 'Manga',
  LIGHT_NOVEL: 'Light novel',
  VISUAL_NOVEL: 'Visual novel',
  VIDEO_GAME: 'Game',
  OTHER: 'Other',
  NOVEL: 'Novel',
  DOUJINSHI: 'Doujinshi',
  ANIME: 'Anime',
  WEB_NOVEL: 'Web novel',
  LIVE_ACTION: 'Live action',
  GAME: 'Game',
  COMIC: 'Comic',
  MULTIMEDIA_PROJECT: 'Multimedia project',
  PICTURE_BOOK: 'Picture book',
};

const FORMAT_LABELS: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
};

const STATUS_LABELS: Record<string, string> = {
  FINISHED: 'Finished Airing',
  RELEASING: 'Currently Airing',
  NOT_YET_RELEASED: 'Not yet aired',
  CANCELLED: 'Cancelled',
  HIATUS: 'On Hiatus',
};

// AniList genres have no numeric ids; derive a stable one from the name.
const genreId = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash);
};

const toGenre = (name: string): JikanGenre => ({
  mal_id: genreId(name),
  type: 'anime',
  name,
  url: '',
});

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const stripHtml = (html: string | null): string | null => {
  if (!html) return null;
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text || null;
};

const toIsoDate = (d: AniListDate): string | null => {
  if (!d.year) return null;
  const mm = String(d.month ?? 1).padStart(2, '0');
  const dd = String(d.day ?? 1).padStart(2, '0');
  return `${d.year}-${mm}-${dd}T00:00:00+00:00`;
};

const mapMedia = (m: AniListMedia, rank: number): Anime => {
  const cover = m.coverImage.extraLarge || m.coverImage.large || '';
  const small = m.coverImage.large || cover;
  const image = { image_url: small, small_image_url: small, large_image_url: cover };
  const youtubeId = m.trailer?.site === 'youtube' ? m.trailer.id : null;
  const genres = m.genres.map(toGenre);

  return {
    mal_id: m.idMal ?? m.id,
    url: m.siteUrl,
    images: { jpg: image, webp: image },
    trailer: {
      youtube_id: youtubeId,
      url: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null,
      embed_url: youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null,
    },
    approved: true,
    titles: [
      m.title.romaji && { type: 'Default', title: m.title.romaji },
      m.title.english && { type: 'English', title: m.title.english },
      m.title.native && { type: 'Japanese', title: m.title.native },
    ].filter(Boolean) as { type: string; title: string }[],
    title: m.title.romaji || m.title.english || m.title.native || '',
    title_english: m.title.english,
    title_japanese: m.title.native,
    type: (m.format && FORMAT_LABELS[m.format]) || (m.format ? titleCase(m.format) : 'Unknown'),
    source: (m.source && SOURCE_LABELS[m.source]) || 'Unknown',
    episodes: m.episodes,
    status: (m.status && STATUS_LABELS[m.status]) || m.status || 'Unknown',
    airing: m.status === 'RELEASING',
    duration: m.duration ? `${m.duration} min per ep` : 'Unknown',
    rating: '',
    score: m.averageScore ? m.averageScore / 10 : null,
    scored_by: null,
    rank: null,
    popularity: rank, // 1 = most popular (lower is better), matches the app's sort
    members: m.popularity ?? 0,
    favorites: m.favourites ?? 0,
    synopsis: stripHtml(m.description),
    background: null,
    aired: { from: toIsoDate(m.startDate), to: toIsoDate(m.endDate) },
    season: 'winter',
    year: m.seasonYear,
    genres,
    explicit_genres: [],
    themes: [],
    demographics: [],
  };
};

// --- Network ----------------------------------------------------------------

const fetchWithTimeout = async (url: string, init: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RetryableError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
    }
    throw new RetryableError(error instanceof Error ? error.message : 'Network error');
  } finally {
    clearTimeout(timer);
  }
};

// --- sessionStorage cache -------------------------------------------------
const CACHE_PREFIX = 'anilist:winter2026:page:';
const CACHE_TTL_MS = 30 * 60 * 1000;

type PageResult = { data: Anime[]; pagination: Pagination };

const readCache = (page: number): PageResult | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + page);
    if (!raw) return null;
    const { savedAt, result } = JSON.parse(raw) as { savedAt: number; result: PageResult };
    if (Date.now() - savedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_PREFIX + page);
      return null;
    }
    return result;
  } catch {
    return null;
  }
};

const writeCache = (page: number, result: PageResult) => {
  try {
    sessionStorage.setItem(CACHE_PREFIX + page, JSON.stringify({ savedAt: Date.now(), result }));
  } catch {
    // Storage full or unavailable: caching is best-effort.
  }
};

export const fetchWinter2026AnimePage = async (page: number = 1): Promise<PageResult> => {
  const cached = readCache(page);
  if (cached) return cached;

  // Small delay so quick clicks do not hammer the API and the skeleton feels purposeful.
  await delay(300);

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new RetryableError('Rate limit exceeded. Please wait a moment.');
        }
        if (response.status >= 500) {
          throw new RetryableError(`AniList API Error: ${response.status} ${response.statusText}`);
        }
        // Other 4xx: retrying will not help.
        throw new Error(`AniList API Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (json.errors?.length) {
        throw new Error(`AniList API Error: ${json.errors[0].message}`);
      }

      const pageData = json.data.Page as {
        pageInfo: { currentPage: number; hasNextPage: boolean; lastPage: number; perPage: number };
        media: AniListMedia[];
      };
      const offset = (page - 1) * PER_PAGE;
      const data = pageData.media.map((m, i) => mapMedia(m, offset + i + 1));

      const result: PageResult = {
        data,
        pagination: {
          last_visible_page: pageData.pageInfo.lastPage,
          has_next_page: pageData.pageInfo.hasNextPage,
          current_page: pageData.pageInfo.currentPage,
          items: { count: data.length, total: 0, per_page: pageData.pageInfo.perPage },
        },
      };
      writeCache(page, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to fetch anime (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, lastError);

      if (!(lastError instanceof RetryableError) || attempt === MAX_RETRIES) break;

      // Exponential backoff: 1s, 2s, 4s
      await delay(1000 * 2 ** attempt);
    }
  }

  throw lastError;
};

export const fetchWinter2026Anime = async (): Promise<Anime[]> => {
  const { data } = await fetchWinter2026AnimePage(1);
  return data;
};
