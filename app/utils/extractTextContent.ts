import { PageViewport, PDFPageProxy } from 'pdfjs-dist';
import * as pdfjs from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { HighlightedTextItem } from '../components/HighlightLayer';

export const extractTextContent = async (
  page: PDFPageProxy,
  viewport: PageViewport,
  context: CanvasRenderingContext2D
): Promise<(HighlightedTextItem & { text: string })[]> => {
  try {
    const textContent = await page.getTextContent();
    const processedItems = [];
    const items = textContent.items as TextItem[];

    for (const item of items) {
      if (item.str.trim() === '') continue;

      const transform = pdfjs.Util.transform(pdfjs.Util.transform(viewport.transform, item.transform), [1, 0, 0, -1, 0, 0]);

      const scaleRatio = transform[0] / item.transform[0];

      const processedItem: HighlightedTextItem = {
        ...item,
        type: item.hasEOL ? 'sentence' : 'word',
        transform: transform,
        width: item.width * scaleRatio,
        height: item.height * scaleRatio,
        x: transform[4],
        y: transform[5],
        fontFamily: textContent.styles[item.fontName]?.fontFamily || 'sans-serif',
        scale: 1,
        fontSize: 12,
      };

      context.font = `${processedItem.height}px ${processedItem.fontFamily}`;
      const measuredWidth = context.measureText(item.str).width;
      processedItem.scale = processedItem.width / measuredWidth;
      processedItem.fontSize = Number((processedItem.height * processedItem.scale).toFixed(2));

      const words = item.str.split(/(\s+)/);
      let currentX = processedItem.x;

      context.font = `${processedItem.fontSize}px ${processedItem.fontFamily}`;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.trim() !== '') {
          const wordWidth = context.measureText(word).width;

          processedItems.push({
            ...processedItem,
            text: word,
            x: currentX,
            y: processedItem.y,
            width: wordWidth,
            height: processedItem.height,
            fontSize: processedItem.fontSize,
            fontFamily: processedItem.fontFamily,
            originalItem: processedItem,
          });
        }

        const segmentWidth = context.measureText(word).width;
        currentX += segmentWidth;
      }
    }

    return processedItems;
  } catch (error) {
    console.error('Error extracting text content:', error);
    return [];
  }
};
