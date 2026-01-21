'use client';

import { Word, WordTag } from '@/lib/types';
import { TAG_COLORS } from '@/lib/utils';

interface WordCloudProps {
  words: Word[];
  maxWords?: number;
  filterTag?: WordTag | 'all';
  showCounts?: boolean;
}

export default function WordCloud({ 
  words, 
  maxWords = 50, 
  filterTag = 'all',
  showCounts = true 
}: WordCloudProps) {
  // Filtrer par tag si nécessaire
  let filteredWords = filterTag === 'all' 
    ? words 
    : words.filter(w => w.tag === filterTag);

  // Trier par count et limiter
  filteredWords = filteredWords
    .sort((a, b) => b.count - a.count)
    .slice(0, maxWords);

  if (filteredWords.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Aucun mot pour le moment
      </div>
    );
  }

  // Calculer les tailles relatives
  const maxCount = Math.max(...filteredWords.map(w => w.count));
  const minCount = Math.min(...filteredWords.map(w => w.count));
  const range = maxCount - minCount || 1;

  const getSize = (count: number): string => {
    const normalized = (count - minCount) / range;
    if (normalized > 0.75) return 'text-2xl font-bold';
    if (normalized > 0.5) return 'text-xl font-semibold';
    if (normalized > 0.25) return 'text-lg font-medium';
    return 'text-base';
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center p-4">
      {filteredWords.map((word, index) => (
        <span
          key={`${word.tag}-${word.word}-${index}`}
          className={`
            word-item
            ${TAG_COLORS[word.tag]}
            ${getSize(word.count)}
            transition-all duration-200
          `}
          title={`${word.tag} - ${word.count} fois`}
        >
          {word.word}
          {showCounts && word.count > 1 && (
            <span className="ml-1 text-xs opacity-70">({word.count})</span>
          )}
        </span>
      ))}
    </div>
  );
}
