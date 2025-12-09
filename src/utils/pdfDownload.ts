import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
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

// 청크 크기 설정 (단어 수 기준)
const CHUNK_SIZE = 100;

// 데이터를 청크로 분할
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// 청크별 PDF 생성
async function generateChunkPDF(
  chunk: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode,
  isFirstChunk: boolean
): Promise<Uint8Array> {
  // 첫 번째 청크만 헤더 표시
  const chunkHeaderInfo = isFirstChunk ? headerInfo : { ...headerInfo, headerTitle: '', headerDescription: '' };

  const doc = createElement(VocabularyPDF, {
    data: chunk,
    headerInfo: chunkHeaderInfo,
    viewMode
  });

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// 여러 PDF를 하나로 병합
async function mergePDFs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

// 메인 다운로드 함수 (청크 분할 + 병합)
export async function downloadPDF(
  data: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode = 'card',
  filename?: string,
  onProgress?: ProgressCallback
): Promise<void> {
  const totalItems = data.length;

  // 100개 이하면 기존 방식으로 빠르게 처리
  if (totalItems <= CHUNK_SIZE) {
    onProgress?.(10, 'PDF 생성 중...');
    const doc = createElement(VocabularyPDF, { data, headerInfo, viewMode });
    const blob = await pdf(doc).toBlob();
    onProgress?.(90, '다운로드 준비 중...');
    downloadBlob(blob, filename, headerInfo);
    onProgress?.(100, '완료!');
    return;
  }

  // 청크 분할
  const chunks = chunkArray(data, CHUNK_SIZE);
  const totalChunks = chunks.length;
  const pdfBuffers: Uint8Array[] = [];

  onProgress?.(5, `${totalItems}개 단어를 ${totalChunks}개 청크로 분할...`);

  // 청크별 PDF 생성
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirstChunk = i === 0;

    onProgress?.(
      5 + Math.round((i / totalChunks) * 75),
      `청크 ${i + 1}/${totalChunks} 생성 중... (${chunk.length}개 단어)`
    );

    const pdfBuffer = await generateChunkPDF(chunk, headerInfo, viewMode, isFirstChunk);
    pdfBuffers.push(pdfBuffer);

    // 청크 완료 후 진행률 업데이트
    onProgress?.(
      5 + Math.round(((i + 1) / totalChunks) * 75),
      `청크 ${i + 1}/${totalChunks} 완료`
    );
  }

  onProgress?.(80, 'PDF 병합 중...');

  // PDF 병합
  const mergedPdfBytes = await mergePDFs(pdfBuffers);
  const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

  onProgress?.(95, '다운로드 준비 중...');

  // 다운로드
  downloadBlob(blob, filename, headerInfo);

  onProgress?.(100, '완료!');
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
