'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask, TextLayer } from 'pdfjs-dist';
import { useSearchParams } from 'next/navigation';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
}

const PdfViewer = () => {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const textLayerRef = useRef<TextLayer | null>(null);
  const isCancelledRef = useRef<boolean>(true);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const scale = searchParams.get('scale') || '1';
  const search = searchParams.get('search') || '';
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

  const renderPage = async () => {
    const isCancelled = isCancelledRef.current;

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
          console.error(error);
        }
      });
    }

    if (textRef.current) {
      textRef.current.innerHTML = '';
    }
    textLayerRef.current = null;

    const pdfPage = await pdfDocument.getPage(Number(page));
    const viewport = pdfPage.getViewport({ scale: Number(scale) });

    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    const textContainer = textRef.current;

    if (!canvas || !textContainer || !viewer) {
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

    const renderTask = pdfPage.render({ canvasContext, viewport });
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;

      if (isCancelled) {
        setRendering(false);
        return;
      }

      const textContent = await pdfPage.getTextContent();
      const textLayer = new pdfjs.TextLayer({
        textContentSource: textContent,
        container: textContainer,
        viewport: viewport,
      });
      textLayerRef.current = textLayer;
      await textLayer.render();
    } catch (error: any) {
      if (error.name !== 'RenderingCancelledException') {
        console.error(error);
      }
    } finally {
      if (!isCancelled) {
        setRendering(false);
      }
    }
  };

  useEffect(() => {
    if (!pdfDocument) {
      return;
    }
    isCancelledRef.current = false;

    renderPage();

    return () => {
      isCancelledRef.current = true;
    };
  }, [pdfDocument, page, scale]);

  return (
    <div className='pdfViewer'>
      <div ref={viewerRef} className='page'>
        {!pdfDocument && <span>Loading...</span>}
        <canvas ref={canvasRef} role='presentation' />
        <div ref={textRef} className='textLayer' />
      </div>
    </div>
  );
};

export default PdfViewer;
