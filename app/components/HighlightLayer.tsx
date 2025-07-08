import { useSearchParams } from 'next/navigation';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { highlightWords } from '../utils/highlightWords';

export type HighlightedTextItem = Partial<TextItem> & {
  id?: string;
  type: 'word' | 'sentence';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  borderColor?: string;
  fontSize: number;
  fontFamily: string;
  transform: number[];
  scale: number;
  originalItem?: HighlightedTextItem;
};

const HighlightLayer = ({
  textItems,
  canvasWidth,
  canvasHeight,
}: {
  textItems: (HighlightedTextItem & { text: string })[];
  canvasWidth: number;
  canvasHeight: number;
}) => {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const [highlights, setHighlights] = useState<(HighlightedTextItem & { text: string })[]>([]);

  const generateHighlights = useCallback(() => {
    if (!textItems || textItems.length === 0) return;

    const newHighlights: (HighlightedTextItem & { text: string })[] = [];

    if (search && search.length > 0) {
      const highlightedWords = highlightWords(search);

      highlightedWords.forEach((wordToHighlight, index) => {
        const matchingItems = textItems.filter((item) => item.type === 'word' && item.text.toLowerCase().includes(wordToHighlight.toLowerCase()));

        matchingItems.forEach((item) => {
          newHighlights.push({
            ...item,
            id: `word-${index}-${item.x}-${item.y}`,
            type: 'word',
            x: item.x,
            y: item.y - item.height,
            width: item.width,
            height: item.height,
            str: item.str,
            color: 'rgba(255, 255, 0, 0.4)',
            borderColor: 'rgba(255, 255, 0, 0.8)',
          });
        });
      });
    }

    setHighlights(newHighlights);
  }, [textItems, search]);

  useEffect(() => {
    generateHighlights();
  }, [generateHighlights]);

  return (
    <div
      className='absolute top-0 left-0 pointer-events-none'
      style={{
        width: canvasWidth,
        height: canvasHeight,
      }}>
      {highlights.length > 0 &&
        highlights.map((highlight) => (
          <div
            key={highlight.id}
            className='absolute cursor-pointer pointer-events-auto'
            style={{
              left: `${highlight.x}px`,
              top: `${highlight.y}px`,
              width: `${highlight.width}px`,
              height: `${highlight.height}px`,
              backgroundColor: highlight.color,
              border: `1px solid ${highlight.borderColor}`,
              borderRadius: '2px',
              transition: 'all 0.2s ease',
            }}
            title={`${highlight.type}: ${highlight.str}`}
          />
        ))}
    </div>
  );
};

export default HighlightLayer;
