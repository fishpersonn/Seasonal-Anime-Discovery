export type SeasonName = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export interface CurrentSeason {
  season: SeasonName;
  year: number;
}

// Anime seasons: Winter Jan-Mar, Spring Apr-Jun, Summer Jul-Sep, Fall Oct-Dec.
export const getCurrentSeason = (date: Date = new Date()): CurrentSeason => {
  const m = date.getMonth(); // 0-11
  const season: SeasonName = m < 3 ? 'WINTER' : m < 6 ? 'SPRING' : m < 9 ? 'SUMMER' : 'FALL';
  return { season, year: date.getFullYear() };
};

const LABELS: Record<'en' | 'zh', Record<SeasonName, string>> = {
  en: { WINTER: 'Winter', SPRING: 'Spring', SUMMER: 'Summer', FALL: 'Fall' },
  zh: { WINTER: '冬季', SPRING: '春季', SUMMER: '夏季', FALL: '秋季' },
};

export const seasonLabel = (lang: 'en' | 'zh', { season, year }: CurrentSeason): string =>
  lang === 'zh' ? `${year} ${LABELS.zh[season]}` : `${LABELS.en[season]} ${year}`;
