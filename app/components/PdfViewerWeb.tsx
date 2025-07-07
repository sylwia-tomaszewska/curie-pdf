import * as pdfjs from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { EventBus, PDFLinkService, PDFFindController, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PdfViewer from './PdfViewer';

if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
}

const PdfViewerWeb = ({ pdfPath }: { pdfPath: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [eventBus, setEventBus] = useState<EventBus | null>(null);
  const [linkService, setLinkService] = useState<PDFLinkService | null>(null);
  const [findController, setFindController] = useState<PDFFindController | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const eventBus = new EventBus();
    const pdfLinkService = new PDFLinkService({
      eventBus: eventBus,
    });
    const pdfFindController = new PDFFindController({
      linkService: pdfLinkService,
      eventBus: eventBus,
    });
    setEventBus(eventBus);
    setLinkService(pdfLinkService);
    setFindController(pdfFindController);

    const pdf = pdfjs.getDocument(pdfPath);

    pdf.promise.then(
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

  useEffect(() => {
    if (pdfDocument) {
      const container = containerRef.current;

      if (!container || !eventBus || !linkService || !findController) return;

      viewerRef.current = new PDFViewer({
        container: container,
        eventBus: eventBus,
        linkService: linkService,
        findController: findController,
      });

      const viewer = viewerRef.current;
    }
  }, [pdfDocument, eventBus, linkService, findController]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const search = searchParams.get('search') || '';
  }, [searchParams]);

  return (
    <div ref={containerRef} className={'absolute overflow-auto w-full h-full'}>
      <div ref={viewerRef}>
        <PdfViewer pdfDocument={pdfDocument} />
      </div>
    </div>
  );
};

export default PdfViewerWeb;
