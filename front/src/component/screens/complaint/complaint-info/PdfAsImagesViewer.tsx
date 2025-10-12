"use client";

import { FC, useEffect, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = "/pdfjs/5.3.31/pdf.worker.min.mjs"; // ✅ под твой путь

interface Props {
  pdfUrl: string;
}

const PdfAsImagesViewer: FC<Props> = ({ pdfUrl }) => {
  const [images, setImages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const pdf = await getDocument(pdfUrl).promise;
        const pages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          pages.push(canvas.toDataURL());
        }

        setImages(pages);
      } catch (err) {
        console.error("Failed to render PDF:", err);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  if (images.length === 0) return <div>Loading PDF...</div>;

  return (
    <div className="select-none pointer-events-auto mt-2 text-gray-900">
      <img src={images[pageIndex]} alt={`Page ${pageIndex + 1}`} className="w-full max-w-[600px] mx-auto" />
      <div className="flex justify-between text-sm mt-2">
        <button
          onClick={() => setPageIndex(p => Math.max(p - 1, 0))}
          disabled={pageIndex === 0}
          className="text-gray-900 hover:text-gray-700"
        >
          ← Prev
        </button>
        <span>
          Page {pageIndex + 1} of {images.length}
        </span>
        <button
          onClick={() => setPageIndex(p => Math.min(p + 1, images.length - 1))}
          disabled={pageIndex === images.length - 1}
          className="text-gray-900 hover:text-gray-700"
        >
          Next →
        </button>
      </div>
    </div>

  );
};

export default PdfAsImagesViewer;
