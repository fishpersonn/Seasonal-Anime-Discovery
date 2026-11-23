import React from 'react';

const AnimeCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl bg-candy-800 border-2 border-pink-300/30 shadow-lg">
      {/* Image Skeleton */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-candy-700 animate-pulse">
        <div className="absolute top-2 right-2 h-6 w-12 rounded-full bg-candy-600/50" />
        <div className="absolute top-2 left-2 h-6 w-16 rounded-full bg-candy-600/50" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Title Lines */}
        <div className="h-6 w-3/4 rounded bg-candy-700 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-candy-700/50 animate-pulse" />
        
        {/* Genre Line */}
        <div className="mt-auto pt-2 flex gap-2">
           <div className="h-3 w-1/4 rounded bg-candy-700/30" />
           <div className="h-3 w-1/4 rounded bg-candy-700/30" />
        </div>
      </div>
    </div>
  );
};

export default AnimeCardSkeleton;