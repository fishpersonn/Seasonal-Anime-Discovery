import React from 'react';
import { Anime, Translations } from '../types';
import { PlayCircle, Star, Heart } from 'lucide-react';
import { toneAt } from '../utils/candyColors';
import { genreLabel, sourceLabel } from '../utils/labels';

interface AnimeCardProps {
  anime: Anime;
  onClick: (anime: Anime) => void;
  isFavorite: boolean;
  toggleFavorite: (id: number) => void;
  t: Translations;
  language: 'en' | 'zh';
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick, isFavorite, toggleFavorite, t, language }) => {
  const displayTitle = anime.title_english || anime.title;
  const tone = toneAt(anime.mal_id);
  const displayGenre = anime.genres.slice(0, 3).map(g => genreLabel(g.name, language)).join(' • ');

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(anime.mal_id);
  };

  return (
    <div 
      onClick={() => onClick(anime)}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-candy-800 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl cursor-pointer border-4 ${tone.border} ${tone.hoverBorder} ${tone.hoverShadow}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img 
          src={anime.images.webp.large_image_url || anime.images.jpg.large_image_url} 
          alt={displayTitle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-pink-900/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm">
           <PlayCircle className="h-12 w-12 text-candy-ink opacity-90" />
        </div>

        {/* Top Actions Row */}
        <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start z-10">
          {/* Source Badge */}
          <div className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${tone.solid}`}>
            {sourceLabel(anime.source, language)}
          </div>

          {/* Favorite Button */}
          <button 
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
              isFavorite 
                ? 'bg-pink-500/90 text-white hover:bg-pink-600 animate__animated animate__heartBeat' 
                : 'bg-white/85 text-pink-400 hover:bg-pink-100 hover:text-pink-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Score Badge */}
        {anime.score && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-candy-ink backdrop-blur-md">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{anime.score}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className={`line-clamp-2 text-lg font-bold text-candy-ink transition-colors ${tone.hoverText}`}>
          {displayTitle}
        </h3>
        <p className="mt-2 text-xs font-medium text-candy-soft line-clamp-1">
          {displayGenre || t.unknownGenre}
        </p>
      </div>
    </div>
  );
};

export default AnimeCard;