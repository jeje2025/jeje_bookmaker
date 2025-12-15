import { pdf } from '@react-pdf/renderer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { VocabularyPDF } from '../components/VocabularyPDF';
import { createElement } from 'react';

interface VocabularyItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  definition?: string;
  synonyms: string[];
  antonyms: string[];
  derivatives: Array<{ word: string; meaning: string; partOfSpeech?: string }>;
  example: string;
  translation: string;
  translationHighlight?: string;
  etymology: string;
}

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

type ViewMode = 'card' | 'table' | 'tableSimple' | 'tableSimpleTest' | 'test' | 'testDefinition' | 'testAnswer' | 'testDefinitionAnswer';

// 진행률 콜백 타입
type ProgressCallback = (progress: number, message: string) => void;

// 서버사이드 PDF 생성 사용 여부
const USE_SERVER_PDF = true;

// 클라이언트 청크 크기 (폴백용)
const CHUNK_SIZE = 200;

// API 엔드포인트
const PDF_API_URL = '/api/generate-pdf';

// ==================== 서버사이드 PDF 생성 ====================

async function downloadPDFServer(
  data: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode,
  filename?: string,
  unitNumber?: number,
  onProgress?: ProgressCallback
): Promise<void> {
  onProgress?.(10, '서버에 PDF 생성 요청 중...');

  try {
    const response = await fetch(PDF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        headerInfo,
        viewMode,
        unitNumber
      })
    });

    onProgress?.(50, 'PDF 생성 중...');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    onProgress?.(80, '다운로드 준비 중...');

    const blob = await response.blob();
    downloadBlob(blob, filename, headerInfo);

    onProgress?.(100, '완료!');
  } catch (error) {
    console.error('서버 PDF 생성 실패, 클라이언트로 폴백:', error);
    // 서버 실패 시 클라이언트에서 생성
    await downloadPDFClient(data, headerInfo, viewMode, filename, unitNumber, onProgress);
  }
}

// ==================== 클라이언트사이드 PDF 생성 (폴백) ====================

// 브라우저가 UI를 업데이트할 수 있도록 양보
const yieldToMain = (): Promise<void> => {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve(), { timeout: 100 });
    } else {
      setTimeout(resolve, 0);
    }
  });
};

// 데이터를 청크로 분할
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// 청크별 PDF 생성 (페이지 번호 없이)
async function generateChunkPDF(
  chunk: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode,
  isFirstChunk: boolean,
  unitNumber?: number
): Promise<Uint8Array> {
  const chunkHeaderInfo = isFirstChunk ? headerInfo : { ...headerInfo, headerTitle: '', headerDescription: '' };

  const doc = createElement(VocabularyPDF, {
    data: chunk,
    headerInfo: chunkHeaderInfo,
    viewMode,
    unitNumber,
    showPageNumber: false
  });

  await yieldToMain();

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// 여러 PDF를 하나로 병합하고 연속 페이지 번호 추가
async function mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
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

  return await mergedPdf.save();
}

async function downloadPDFClient(
  data: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode = 'card',
  filename?: string,
  unitNumber?: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const totalItems = data.length;

  if (totalItems <= CHUNK_SIZE) {
    onProgress?.(10, 'PDF 생성 중...');
    await yieldToMain();
    const doc = createElement(VocabularyPDF, { data, headerInfo, viewMode, unitNumber });
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const blob = await pdf(doc).toBlob();
    onProgress?.(90, '다운로드 준비 중...');
    downloadBlob(blob, filename, headerInfo);
    onProgress?.(100, '완료!');
    return;
  }

  const chunks = chunkArray(data, CHUNK_SIZE);
  const totalChunks = chunks.length;
  const pdfBuffers: Uint8Array[] = [];

  onProgress?.(5, `${totalItems}개 단어를 ${totalChunks}개 청크로 분할...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirstChunk = i === 0;

    onProgress?.(
      Math.round((i / totalChunks) * 100),
      `청크 ${i + 1}/${totalChunks} 생성 중... (${chunk.length}개 단어)`
    );

    const pdfBuffer = await generateChunkPDF(chunk, headerInfo, viewMode, isFirstChunk, unitNumber);
    pdfBuffers.push(pdfBuffer);

    onProgress?.(
      Math.round(((i + 1) / totalChunks) * 100),
      `청크 ${i + 1}/${totalChunks} 완료`
    );

    await yieldToMain();
  }

  const mergedPdfBytes = await mergePDFs(pdfBuffers);
  const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

  onProgress?.(95, '다운로드 준비 중...');
  downloadBlob(blob, filename, headerInfo);
  onProgress?.(100, '완료!');
}

// ==================== 메인 다운로드 함수 ====================

export async function downloadPDF(
  data: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode = 'card',
  filename?: string,
  unitNumber?: number,
  onProgress?: ProgressCallback
): Promise<void> {
  if (USE_SERVER_PDF) {
    await downloadPDFServer(data, headerInfo, viewMode, filename, unitNumber, onProgress);
  } else {
    await downloadPDFClient(data, headerInfo, viewMode, filename, unitNumber, onProgress);
  }
}

// Blob 다운로드 헬퍼
function downloadBlob(blob: Blob, filename?: string, headerInfo?: HeaderInfo): void {
  const name = filename || headerInfo?.headerTitle || 'vocabulary';
  const sanitizedName = name.replace(/[^a-zA-Z0-9가-힣\s\-]/g, '').trim();
  const finalFilename = `${sanitizedName}.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
