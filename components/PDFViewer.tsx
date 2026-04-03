"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure the worker correctly for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center w-full my-8 bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      {/* Viewer Header/Toolbar */}
      <div className="w-full bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between z-10">
        <h3 className="font-bold text-stone-700 text-sm">Trình xem tài liệu PDF</h3>
        
        <div className="flex items-center gap-4">
           {/* Zoom Controls */}
           <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
             <button 
                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                className="p-1 hover:bg-white rounded hover:shadow-sm text-stone-600 transition-all"
                title="Thu nhỏ"
             >
                <ZoomOut className="size-4" />
             </button>
             <span className="text-xs font-bold text-stone-500 w-12 text-center">{Math.round(scale * 100)}%</span>
             <button 
                onClick={() => setScale(s => Math.min(3, s + 0.25))}
                className="p-1 hover:bg-white rounded hover:shadow-sm text-stone-600 transition-all"
                title="Phóng to"
             >
                <ZoomIn className="size-4" />
             </button>
           </div>
        </div>
      </div>
      
      {/* PDF Document Viewer */}
      <div className="w-full overflow-auto flex justify-center py-6 custom-scroll bg-stone-100/50 max-h-[80vh]">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center gap-6"
          loading={
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 text-amber-600 animate-spin" />
              <p className="text-stone-500 text-sm font-medium">Đang tải tài liệu...</p>
            </div>
          }
          error={
            <div className="text-red-500 py-10 text-center text-sm font-medium">
              Không thể tải tài liệu PDF. Vui lòng thử lại sau.
            </div>
          }
        >
          {Array.from(new Array(numPages || 0), (_, index) => (
            <Page 
               key={`page_${index + 1}`}
               pageNumber={index + 1} 
               scale={scale} 
               renderTextLayer={true}
               renderAnnotationLayer={true}
               className="shadow-xl rounded overflow-hidden"
               loading={<Loader2 className="size-8 text-amber-600 animate-spin my-20 mx-auto" />}
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
