"use client";

import { FC, useEffect, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { getValidAccessToken } from "@/utils/tokenUtils";

GlobalWorkerOptions.workerSrc = "/pdfjs/5.3.31/pdf.worker.min.mjs"; // ✅ под твой путь

interface Props {
  pdfUrl: string;
}

const PdfAsImagesViewer: FC<Props> = ({ pdfUrl }) => {
  const [images, setImages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        // Получаем токен для аутентификации
        const token = getValidAccessToken();
        
        // Настраиваем заголовки для PDF.js
        const httpHeaders: Record<string, string> = {};
        if (token) {
          httpHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const pdf = await getDocument({
          url: pdfUrl,
          httpHeaders: httpHeaders,
        }).promise;
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
      } catch (err: any) {
        console.error("Failed to render PDF:", err);
        if (err?.message?.includes('404') || err?.message?.includes('Unexpected server response')) {
          setError("PDF файл не найден или недоступен");
        } else if (err?.message?.includes('401') || err?.message?.includes('403')) {
          setError("Нет доступа к PDF файлу. Пожалуйста, войдите в систему.");
        } else {
          setError("Ошибка при загрузке PDF файла");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  if (loading) return <div>Загрузка PDF...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (images.length === 0) return <div>PDF файл пуст</div>;

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
