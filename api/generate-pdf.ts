import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, headerInfo, viewMode, unitNumber } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // 동적 import로 react-pdf 관련 모듈 로드
    const ReactPDF = await import('@react-pdf/renderer');
    const { createElement } = await import('react');
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

    // VocabularyPDF 컴포넌트 import
    const { VocabularyPDF } = await import('../src/components/VocabularyPDF');

    const CHUNK_SIZE = 500;
    const totalItems = data.length;

    // 청크 분할 함수
    function chunkArray<T>(array: T[], size: number): T[][] {
      const chunks: T[][] = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    }

    // PDF 병합 함수
    async function mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
      const mergedPdf = await PDFDocument.create();

      for (const buffer of pdfBuffers) {
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const totalPages = mergedPdf.getPageCount();
      const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
      const fontSize = 6;
      const color = rgb(0.61, 0.64, 0.69);

      const allPages = mergedPdf.getPages();
      allPages.forEach((page, index) => {
        const { width } = page.getSize();
        const pageNumberText = `${index + 1} / ${totalPages}`;
        const textWidth = font.widthOfTextAtSize(pageNumberText, fontSize);

        page.drawText(pageNumberText, {
          x: width - 30 - textWidth / 2,
          y: 20,
          size: fontSize,
          font: font,
          color: color,
        });
      });

      const pdfBytes = await mergedPdf.save();
      return Buffer.from(pdfBytes);
    }

    // 작은 데이터는 한 번에 처리
    if (totalItems <= CHUNK_SIZE) {
      const doc = createElement(VocabularyPDF, {
        data,
        headerInfo,
        viewMode,
        unitNumber,
        showPageNumber: true
      });

      const pdfStream = await ReactPDF.renderToStream(doc as any);
      const chunks: Buffer[] = [];

      for await (const chunk of pdfStream) {
        chunks.push(Buffer.from(chunk));
      }

      const pdfBuffer = Buffer.concat(chunks);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="vocabulary.pdf"`);
      return res.send(pdfBuffer);
    }

    // 큰 데이터는 청크로 분할 처리
    const dataChunks = chunkArray(data, CHUNK_SIZE);
    const pdfBuffers: Buffer[] = [];

    for (let i = 0; i < dataChunks.length; i++) {
      const chunk = dataChunks[i];
      const isFirstChunk = i === 0;

      const chunkHeaderInfo = isFirstChunk
        ? headerInfo
        : { ...headerInfo, headerTitle: '', headerDescription: '' };

      const doc = createElement(VocabularyPDF, {
        data: chunk,
        headerInfo: chunkHeaderInfo,
        viewMode,
        unitNumber,
        showPageNumber: false
      });

      const pdfStream = await ReactPDF.renderToStream(doc as any);
      const streamChunks: Buffer[] = [];

      for await (const streamChunk of pdfStream) {
        streamChunks.push(Buffer.from(streamChunk));
      }

      pdfBuffers.push(Buffer.concat(streamChunks));
    }

    // PDF 병합
    const mergedPdf = await mergePDFs(pdfBuffers);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vocabulary.pdf"`);
    return res.send(mergedPdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({
      error: 'PDF generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
