import { pdf } from '@react-pdf/renderer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { VocabularyPDF, type PaletteColors } from '../components/VocabularyPDF';
import { QuestionPDF, type QuestionPDFViewMode } from '../components/QuestionPDF';
import { createElement } from 'react';
import type { QuestionItem, HeaderInfo, ExplanationData, VocaPreviewWord } from '../types/question';

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
const CHUNK_SIZE = 200;

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
  unitNumber?: number,
  allData?: VocabularyItem[],  // 오답 선택지 생성용 전체 데이터
  paletteColors?: PaletteColors,  // 컬러 팔레트
  fontScale?: number  // 글씨 크기 스케일
): Promise<Uint8Array> {
  // 첫 번째 청크만 헤더 표시
  const chunkHeaderInfo = isFirstChunk ? headerInfo : { ...headerInfo, headerTitle: '', headerDescription: '' };

  const doc = createElement(VocabularyPDF, {
    data: chunk,
    headerInfo: chunkHeaderInfo,
    viewMode,
    unitNumber,
    showPageNumber: false,  // 청크에서는 페이지 번호 숨김 (병합 후 추가)
    allData,  // 오답 선택지 생성용 전체 데이터 전달
    paletteColors,  // 컬러 팔레트 전달
    fontScale  // 글씨 크기 스케일 전달
  });

  // 브라우저 UI 업데이트 기회 제공
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

  // 연속 페이지 번호 추가
  const totalPages = mergedPdf.getPageCount();
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 6;
  const color = rgb(0.61, 0.64, 0.69); // #9ca3af

  const allPages = mergedPdf.getPages();
  allPages.forEach((page, index) => {
    const { width } = page.getSize();
    const pageNumberText = `${index + 1} / ${totalPages}`;
    const textWidth = font.widthOfTextAtSize(pageNumberText, fontSize);

    page.drawText(pageNumberText, {
      x: width - 30 - textWidth / 2,  // 오른쪽 여백 30pt에서 중앙 정렬
      y: 20,  // 하단 20pt 위치
      size: fontSize,
      font: font,
      color: color,
    });
  });

  return await mergedPdf.save();
}

// 메인 다운로드 함수 (청크 분할 + 병합)
export async function downloadPDF(
  data: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode = 'card',
  filename?: string,
  unitNumber?: number,
  onProgress?: ProgressCallback,
  paletteColors?: PaletteColors,  // 컬러 팔레트
  fontScale?: number  // 글씨 크기 스케일
): Promise<void> {
  const totalItems = data.length;

  // 100개 이하면 기존 방식으로 빠르게 처리
  if (totalItems <= CHUNK_SIZE) {
    onProgress?.(10, 'PDF 생성 중...');
    await yieldToMain();
    const doc = createElement(VocabularyPDF, { data, headerInfo, viewMode, unitNumber, paletteColors, fontScale });
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
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
      Math.round((i / totalChunks) * 100),
      `청크 ${i + 1}/${totalChunks} 생성 중... (${chunk.length}개 단어)`
    );

    const pdfBuffer = await generateChunkPDF(chunk, headerInfo, viewMode, isFirstChunk, unitNumber, data, paletteColors, fontScale);
    pdfBuffers.push(pdfBuffer);

    // 청크 완료 후 진행률 업데이트
    onProgress?.(
      Math.round(((i + 1) / totalChunks) * 100),
      `청크 ${i + 1}/${totalChunks} 완료`
    );

    // 브라우저가 숨 쉴 틈 제공
    await yieldToMain();
  }

  // PDF 병합
  const mergedPdfBytes = await mergePDFs(pdfBuffers);
  const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

  onProgress?.(95, '다운로드 준비 중...');

  // 다운로드
  downloadBlob(blob, filename, headerInfo);

  onProgress?.(100, '완료!');
}

// Blob 다운로드 헬퍼
function downloadBlob(blob: Blob, filename?: string, headerInfo?: HeaderInfo | QuestionHeaderInfo): void {
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

// ===== 문제지/해설지 PDF 다운로드 =====

interface QuestionHeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

// 문제지 PDF 다운로드 함수
export async function downloadQuestionPDF(
  data: QuestionItem[],
  headerInfo: QuestionHeaderInfo,
  viewMode: QuestionPDFViewMode = 'question',
  filename?: string,
  unitNumber?: number,
  onProgress?: ProgressCallback,
  paletteColors?: PaletteColors,
  fontScale?: number,
  explanations?: Map<string, ExplanationData>,
  choiceDisplayMode?: 'both' | 'korean' | 'english',
  vocaPreviewWords?: VocaPreviewWord[]
): Promise<void> {
  onProgress?.(10, 'PDF 생성 중...');
  await yieldToMain();

  const doc = createElement(QuestionPDF, {
    data,
    headerInfo,
    viewMode,
    unitNumber,
    showPageNumber: true,
    explanations,
    paletteColors,
    fontScale,
    choiceDisplayMode,
    vocaPreviewWords,
  });

  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  onProgress?.(50, 'PDF 렌더링 중...');

  const blob = await pdf(doc).toBlob();

  onProgress?.(90, '다운로드 준비 중...');

  // 파일명 결정
  let finalFilename = filename;
  if (!finalFilename) {
    const suffix = viewMode === 'answer' ? '_해설지' : viewMode === 'vocabulary' ? '_어휘문제지' : viewMode === 'vocaPreview' ? '_단어장' : '_문제지';
    finalFilename = headerInfo.headerTitle + suffix;
  }

  downloadBlob(blob, finalFilename, headerInfo);

  onProgress?.(100, '완료!');
}
