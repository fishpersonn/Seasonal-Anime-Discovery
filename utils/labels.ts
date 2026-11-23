// Display-time translations for data values that come from the API in English.
// The underlying values stay English (filters/URL params key on them); only what
// the user sees is translated.

type Lang = 'en' | 'zh';

const GENRES_ZH: Record<string, string> = {
  'Action': '動作',
  'Adventure': '冒險',
  'Comedy': '喜劇',
  'Drama': '劇情',
  'Ecchi': '澀澀',
  'Fantasy': '奇幻',
  'Hentai': '成人',
  'Horror': '恐怖',
  'Mahou Shoujo': '魔法少女',
  'Mecha': '機戰',
  'Music': '音樂',
  'Mystery': '懸疑',
  'Psychological': '心理',
  'Romance': '戀愛',
  'Sci-Fi': '科幻',
  'Slice of Life': '日常',
  'Sports': '運動',
  'Supernatural': '超自然',
  'Thriller': '驚悚',
};

const SOURCES_ZH: Record<string, string> = {
  'Original': '原創',
  'Manga': '漫畫',
  'Light novel': '輕小說',
  'Visual novel': '視覺小說',
  'Game': '遊戲',
  'Other': '其他',
  'Novel': '小說',
  'Doujinshi': '同人誌',
  'Anime': '動畫',
  'Web novel': '網路小說',
  'Live action': '真人作品',
  'Comic': '漫畫',
  'Multimedia project': '跨媒體企劃',
  'Picture book': '繪本',
  'Unknown': '未知',
};

const TYPES_ZH: Record<string, string> = {
  'TV': 'TV 動畫',
  'TV Short': 'TV 短篇',
  'Movie': '劇場版',
  'Special': '特別篇',
  'OVA': 'OVA',
  'ONA': 'ONA',
  'Music': 'MV',
  'Unknown': '未知',
};

const lookup = (map: Record<string, string>, value: string, lang: Lang) =>
  lang === 'zh' ? map[value] ?? value : value;

export const genreLabel = (name: string, lang: Lang) => lookup(GENRES_ZH, name, lang);
export const sourceLabel = (name: string, lang: Lang) => lookup(SOURCES_ZH, name, lang);
export const typeLabel = (name: string, lang: Lang) => lookup(TYPES_ZH, name, lang);
