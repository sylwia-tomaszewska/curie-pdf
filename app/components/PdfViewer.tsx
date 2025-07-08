'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask, TextLayer } from 'pdfjs-dist';
import { useSearchParams } from 'next/navigation';
import HighlightLayer, { HighlightedTextItem } from './HighlightLayer';
import { extractTextContent } from '../utils/extractTextContent';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
}

const PdfViewer = () => {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const textLayerRef = useRef<TextLayer | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const [textItems, setTextItems] = useState<(HighlightedTextItem & { text: string })[]>([]);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const searchParams = useSearchParams();
  const scale = searchParams.get('scale') || '1';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    const pdfLoadingTask = pdfjs.getDocument('/bitcoin.pdf');
    pdfLoadingTask.promise.then(
      (doc) => {
        setPdfDocument(doc);
      },
      (reason) => {
        console.error('Error loading PDF:', reason);
      }
    );
    return () => {
      pdfDocument?.destroy();
    };
  }, []);

  const renderPage = useCallback(async () => {
    if (!pdfDocument) {
      return;
    }
    if (rendering) {
      return;
    }
    setRendering(true);

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      await renderTaskRef.current.promise.catch((error: any) => {
        if (error.name !== 'RenderingCancelledException') {
          console.warn(error);
        }
      });
    }

    const pdfPage = await pdfDocument.getPage(Number(page));
    const viewport = pdfPage.getViewport({ scale: Number(scale) });

    const viewer = viewerRef.current;
    const canvas = canvasRef.current;

    if (!canvas || !viewer) {
      setRendering(false);
      return;
    }

    const canvasContext = canvas.getContext('2d');

    if (!canvasContext) {
      setRendering(false);
      return;
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    viewer.style.width = `${viewport.width}px`;
    viewer.style.height = `${viewport.height}px`;

    setCanvasHeight(viewport.height);
    setCanvasWidth(viewport.width);

    const renderTask = pdfPage.render({ canvasContext, viewport });
    renderTaskRef.current = renderTask;

    try {
      await renderTaskRef.current.promise;
      await renderTextLayer(pdfPage, viewport);
      await extractTextContent(pdfPage, viewport, canvasContext).then((items) => {
        setTextItems(items);
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setRendering(false);
    }
  }, [pdfDocument, page, scale]);

  const renderTextLayer = useCallback(
    async (pdfPage: PDFPageProxy, viewport: pdfjs.PageViewport) => {
      const textContainer = textRef.current;
      if (!textContainer) {
        return;
      }
      textContainer.innerHTML = '';
      textContainer.style.width = `${viewport.width}px`;
      textContainer.style.height = `${viewport.height}px`;

      try {
        const textContent = await pdfPage.getTextContent();

        const textLayer = new pdfjs.TextLayer({
          textContentSource: textContent,
          viewport: viewport,
          container: textContainer,
        });
        textLayerRef.current = textLayer;

        await textLayerRef.current.render();
      } catch (error: any) {
        console.error(error);
        return error;
      }
    },
    [scale]
  );

  useEffect(() => {
    renderPage();
    return () => {
      renderTaskRef.current = null;
      textLayerRef.current = null;
    };
  }, [renderPage]);

  return (
    <div className='pdfViewer'>
      <div ref={viewerRef} className='page'>
        {!pdfDocument && <span>Loading...</span>}
        <canvas ref={canvasRef} role='presentation' />
        <div ref={textRef} className='textLayer' />
        {textItems.length > 0 && <HighlightLayer textItems={textItems} canvasHeight={canvasHeight} canvasWidth={canvasWidth} />}
      </div>
    </div>
  );
};

export default PdfViewer;
