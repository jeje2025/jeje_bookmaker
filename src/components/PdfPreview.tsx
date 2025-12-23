/**
 * PDF Preview Component
 * PDF를 이미지로 렌더링하여 웹에서 미리보기를 제공합니다.
 * WYSIWYG 경험을 보장하여 웹 미리보기와 PDF 출력이 100% 일치합니다.
 */

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { pdf } from '@react-pdf/renderer';
import { renderPdfToImages, invalidateCache, clearImageCache } from '../services/pdfImageRenderer';
import type { PdfPreviewState, EditableRegion } from '../types/question';
import { EditableOverlay } from './EditableOverlay';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// 상수 정의
const A4_ASPECT_RATIO = 297 / 210; // A4 세로/가로 비율
const A4_WIDTH_PT = 595.28; // A4 너비 (포인트)
const A4_HEIGHT_PT = 841.89; // A4 높이 (포인트)
const DEFAULT_SCALE = 2.0;
const DEBOUNCE_DELAY = 500;

interface PdfPreviewProps {
  /** PDF 문서 컴포넌트 (QuestionPDF, VocabularyPDF 등) */
  pdfDocument: React.ReactElement;
  /** PDF 식별자 (캐싱용) */
  pdfId?: string;
  /** 초기 페이지 번호 (1-based) */
  initialPage?: number;
  /** 렌더링 스케일 */
  scale?: number;
  /** 편집 가능 영역 */
  editableRegions?: EditableRegion[];
  /** 필드 편집 콜백 */
  onFieldEdit?: (regionId: string, newText: string) => void;
  /** 편집 취소 콜백 */
  onFieldCancel?: (regionId: string) => void;
  /** 페이지 변경 콜백 */
  onPageChange?: (page: number, totalPages: number) => void;
  /** 렌더링 상태 변경 콜백 */
  onStateChange?: (state: PdfPreviewState) => void;
  /** 컨테이너 너비 (px) */
  containerWidth?: number;
  /** 클래스명 */
  className?: string;
}

/**
 * PDF Preview 컴포넌트
 */
export const PdfPreview = memo(function PdfPreview({
  pdfDocument,
  pdfId = 'default',
  initialPage = 1,
  scale = DEFAULT_SCALE,
  editableRegions = [],
  onFieldEdit,
  onFieldCancel,
  onPageChange,
  onStateChange,
  containerWidth,
  className = '',
}: PdfPreviewProps) {
  // 상태 관리
  const [state, setState] = useState<PdfPreviewState>({
    status: 'idle',
    totalPages: 0,
    currentPage: initialPage,
    pageImages: new Map(),
    editableRegions: editableRegions,
    scale: scale,
  });

  // 렌더링 키 (데이터 변경 감지용)
  const [renderKey, setRenderKey] = useState(0);

  // T044: 컴포넌트 마운트 상태 추적 (메모리 누수 방지)
  const isMountedRef = useRef(true);

  // PDF 렌더링
  const renderPdf = useCallback(async () => {
    // 마운트 상태 확인
    if (!isMountedRef.current) return;

    setState(prev => ({ ...prev, status: 'rendering' }));

    try {
      // PDF Blob 생성
      const blob = await pdf(pdfDocument).toBlob();

      // 마운트 상태 재확인 (비동기 작업 후)
      if (!isMountedRef.current) return;

      // PDF를 이미지로 변환
      const result = await renderPdfToImages(blob, {
        scale,
        pdfId,
      });

      // 마운트 상태 재확인
      if (!isMountedRef.current) return;

      setState(prev => ({
        ...prev,
        status: 'ready',
        totalPages: result.totalPages,
        pageImages: result.images,
        currentPage: Math.min(prev.currentPage, result.totalPages) || 1,
        lastRenderedAt: new Date().toISOString(),
      }));
    } catch (error) {
      // 마운트 상태 확인
      if (!isMountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: errorMessage,
      }));
    }
  }, [pdfDocument, scale, pdfId]);

  // T044: 컴포넌트 언마운트 시 메모리 정리
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // 해당 PDF의 캐시 정리
      invalidateCache(pdfId);
    };
  }, [pdfId]);

  // T042: PDF 문서 변경 시 재렌더링 (500ms 디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      invalidateCache(pdfId);
      renderPdf();
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [pdfDocument, renderKey, pdfId, renderPdf]);

  // 상태 변경 콜백
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // 페이지 네비게이션
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, state.totalPages));
    setState(prev => ({ ...prev, currentPage: validPage }));
    onPageChange?.(validPage, state.totalPages);
  }, [state.totalPages, onPageChange]);

  const goToPrevPage = useCallback(() => {
    goToPage(state.currentPage - 1);
  }, [state.currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(state.currentPage + 1);
  }, [state.currentPage, goToPage]);

  // 현재 페이지 이미지
  const currentPageImage = useMemo(() => {
    return state.pageImages.get(state.currentPage);
  }, [state.pageImages, state.currentPage]);

  // 이미지 표시 너비 계산
  const displayWidth = useMemo(() => {
    return containerWidth || 600; // 기본 600px
  }, [containerWidth]);

  const displayHeight = useMemo(() => {
    return displayWidth * A4_ASPECT_RATIO;
  }, [displayWidth]);

  // T039: 현재 페이지의 편집 가능 영역 필터링
  const currentPageRegions = useMemo(() => {
    return editableRegions.filter(region => region.pageIndex === state.currentPage - 1);
  }, [editableRegions, state.currentPage]);

  // T039: 편집 저장 핸들러
  const handleOverlaySave = useCallback((regionId: string, newText: string) => {
    onFieldEdit?.(regionId, newText);
    // T040: 편집 완료 시 PDF 재렌더링 트리거
    setRenderKey(prev => prev + 1);
  }, [onFieldEdit]);

  // T039: 편집 취소 핸들러
  const handleOverlayCancel = useCallback((regionId: string) => {
    onFieldCancel?.(regionId);
  }, [onFieldCancel]);

  // 강제 재렌더링 트리거
  const forceRerender = useCallback(() => {
    setRenderKey(prev => prev + 1);
  }, []);

  // 로딩 상태
  if (state.status === 'idle' || state.status === 'rendering') {
    return (
      <div
        className={`pdf-preview-loading flex flex-col items-center justify-center ${className}`}
        style={{ width: displayWidth, height: displayHeight }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
        <span className="text-sm text-gray-500">PDF 렌더링 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (state.status === 'error') {
    return (
      <div
        className={`pdf-preview-error flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ width: displayWidth, height: displayHeight }}
      >
        <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
        <span className="text-sm text-red-600 mb-2">PDF 렌더링 실패</span>
        <span className="text-xs text-red-400 mb-4">{state.errorMessage}</span>
        <button
          onClick={forceRerender}
          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 정상 렌더링
  return (
    <div className={`pdf-preview-container ${className}`}>
      {/* 페이지 이미지 */}
      <div
        className="pdf-preview-page relative bg-white shadow-lg mx-auto"
        style={{
          width: displayWidth,
          height: displayHeight,
          overflow: 'hidden',
        }}
      >
        {currentPageImage ? (
          <img
            src={currentPageImage}
            alt={`Page ${state.currentPage}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            페이지를 불러올 수 없습니다
          </div>
        )}

        {/* T039: 편집 오버레이 - 현재 페이지의 편집 가능 영역이 있을 때만 표시 */}
        {currentPageRegions.length > 0 && (
          <EditableOverlay
            regions={currentPageRegions}
            scale={scale}
            pageHeight={A4_HEIGHT_PT}
            pageWidth={A4_WIDTH_PT}
            onSave={handleOverlaySave}
            onCancel={handleOverlayCancel}
            containerSize={{ width: displayWidth, height: displayHeight }}
          />
        )}
      </div>

      {/* 페이지 네비게이션 */}
      {state.totalPages > 1 && (
        <div className="pdf-preview-nav flex items-center justify-center gap-4 mt-4">
          <button
            onClick={goToPrevPage}
            disabled={state.currentPage <= 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-600">
            {state.currentPage} / {state.totalPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={state.currentPage >= state.totalPages}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

export default PdfPreview;
