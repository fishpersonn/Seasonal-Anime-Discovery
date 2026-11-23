import React, { useEffect, useState } from 'react';
import { Anime, Translations } from '../types';
import { X, Star, Users, Heart, Calendar, Play, Languages, ExternalLink, Loader2, Youtube } from 'lucide-react';
import { toneAt } from '../utils/candyColors';
import { getGoogleTranslateUrl } from '../services/aiService';

interface AnimeModalProps {
  anime: Anime | null;
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'zh';
  isFavorite: boolean;
  toggleFavorite: (id: number) => void;
  t: Translations;
}

const AnimeModal: React.FC<AnimeModalProps> = ({ anime, isOpen, onClose, language, isFavorite, toggleFavorite, t }) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Prevent body scroll when modal is open and reset video state
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset loading state when modal opens or anime changes
      setIsVideoLoaded(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, anime]);

  if (!isOpen || !anime) return null;

  // Fix for YouTube Error 153:
  // 1. Use standard 'www.youtube.com' instead of 'youtube-nocookie.com' to avoid cookie/auth issues.
  // 2. Remove 'enablejsapi=1' and 'origin' as they cause configuration mismatch in some sandbox environments.
  // 3. Keep parameters simple.
  const trailerUrl = anime.trailer.youtube_id 
    ? `https://www.youtube.com/embed/${anime.trailer.youtube_id}?autoplay=0&rel=0&modestbranding=1&showinfo=0`
    : anime.trailer.embed_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-fuchsia-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-candy-900 rounded-[2rem] border-4 border-sky-300 shadow-2xl shadow-sky-400/30 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-candy-accent transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3">
          
          {/* Left Column: Image & Stats */}
          <div className="relative h-64 lg:h-full lg:col-span-1">
            <div className="absolute inset-0">
               <img 
                src={anime.images.webp.large_image_url} 
                alt={anime.title}
                className="w-full h-full object-cover lg:rounded-l-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-candy-900 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-candy-900/90" />
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 lg:hidden">
              <h2 className="text-2xl font-bold text-candy-ink shadow-black drop-shadow-md">
                {anime.title_english || anime.title}
              </h2>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="p-6 lg:col-span-2 lg:p-8 space-y-6">
            
            {/* Header (Desktop) */}
            <div className="hidden lg:block">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-candy-ink mb-2">
                    {anime.title_english || anime.title}
                  </h2>
                  {anime.title_japanese && (
                    <h3 className="text-lg text-candy-soft font-medium">
                      {anime.title_japanese}
                    </h3>
                  )}
                </div>
                {/* Favorite Button (Desktop) */}
                <button
                  onClick={() => toggleFavorite(anime.mal_id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
                    isFavorite
                      ? 'bg-pink-500/20 border-pink-400 text-pink-500'
                      : 'bg-candy-800 border-pink-300/30 text-candy-soft hover:text-pink-500 hover:border-pink-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span className="text-sm font-semibold">{isFavorite ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-yellow-100 text-yellow-700 border-2 border-yellow-300">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{anime.score || 'N/A'} {t.score}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-100 text-sky-700 border-2 border-sky-300">
                <Users className="w-4 h-4 text-sky-500" />
                <span>{anime.members.toLocaleString()} {t.members}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-pink-100 text-pink-600 border-2 border-pink-300">
                <Heart className="w-4 h-4 text-pink-500" />
                <span>{anime.favorites.toLocaleString()} {t.favs}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-100 text-emerald-700 border-2 border-emerald-300">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>{anime.year || 2026}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs font-bold text-pink-600 bg-pink-100 rounded-full">
                {anime.type}
              </span>
              {anime.genres.map((genre, i) => (
                <span key={genre.mal_id} className={`px-3 py-1 text-xs font-medium border-2 rounded-full ${toneAt(i + 1).soft} ${toneAt(i + 1).softBorder} ${toneAt(i + 1).text}`}>
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-candy-ink">{t.synopsis}</h3>
                
                {/* Google Translate Button (Only visible if synopsis exists) */}
                {anime.synopsis && (
                  <a 
                    href={getGoogleTranslateUrl(anime.synopsis)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-candy-highlight hover:text-candy-accent transition-colors border-2 border-pink-300/30 hover:bg-candy-800 px-2 py-1 rounded-full"
                    title="Translate with Google"
                  >
                    <Languages className="w-3 h-3" />
                    <span>Google 翻譯</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              
              <div className="p-4 rounded-3xl bg-candy-800/50 border-2 border-pink-300/30 min-h-[100px]">
                <p className="text-candy-soft leading-relaxed text-sm max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {anime.synopsis || t.noSynopsis}
                </p>
              </div>
            </div>

            {/* Trailer */}
            {trailerUrl ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-candy-ink flex items-center gap-2">
                  <Play className="w-4 h-4 fill-white" /> {t.trailer}
                </h3>
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border-2 border-pink-300/30">
                  {!isVideoLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-candy-800 z-10">
                      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                      <span className="text-sm text-candy-soft font-medium animate-pulse">Loading trailer...</span>
                    </div>
                  )}
                  <iframe 
                    src={trailerUrl}
                    title="Trailer"
                    className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={() => setIsVideoLoaded(true)}
                  />
                </div>
              </div>
            ) : (
               <div className="p-4 rounded-3xl border-2 border-dashed border-pink-300/30 text-center text-candy-soft text-sm">
                 {t.noTrailer}
               </div>
            )}
            
            <div className="pt-4 border-t border-pink-300/30 flex justify-end gap-3 flex-wrap">
               {anime.trailer.url && (
                 <a 
                   href={anime.trailer.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="px-6 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold rounded-2xl transition-colors flex items-center gap-2 shadow-lg shadow-red-900/20"
                 >
                   <Youtube className="w-5 h-5" />
                   {t.watchTrailer}
                 </a>
               )}
               <a 
                 href={anime.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="px-6 py-2 bg-sky-400 hover:bg-sky-500 text-white font-semibold rounded-2xl transition-colors flex items-center gap-2"
               >
                 {t.viewMal}
                 <ExternalLink className="w-4 h-4" />
               </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeModal;