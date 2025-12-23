/**
 * PDF Image Renderer Service
 * PDF Blob을 페이지별 이미지(PNG data URL)로 변환하는 서비스
 */

import * as pdfjs from 'pdfjs-dist';

// Vite 환경에서 pdfjs worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// 페이지 이미지 캐시 (최근 5페이지만 유지)
const pageImageCache = new Map<string, string>();
const MAX_CACHE_SIZE = 5;

/**
 * 캐시 키 생성
 */
function getCacheKey(pdfId: string, pageNum: number, scale: number): string {
  return `${pdfId}_${pageNum}_${scale}`;
}

/**
 * 캐시에서 오래된 항목 제거 (LRU 방식)
 */
function pruneCache(): void {
  if (pageImageCache.size > MAX_CACHE_SIZE) {
    const firstKey = pageImageCache.keys().next().value;
    if (firstKey) {
      pageImageCache.delete(firstKey);
    }
  }
}

/**
 * PDF 렌더링 옵션
 */
export interface RenderOptions {
  /** 렌더링 스케일 (기본값: 2.0 for 고해상도) */
  scale?: number;
  /** 특정 페이지 범위만 렌더링 [시작, 끝] (1-based) */
  pageRange?: [number, number];
  /** PDF 식별자 (캐싱용) */
  pdfId?: string;
}

/**
 * PDF 렌더링 결과
 */
export interface RenderResult {
  /** 페이지 번호(1-based) → data URL 맵 */
  images: Map<number, string>;
  /** 총 페이지 수 */
  totalPages: number;
}

/**
 * PDF Blob을 페이지별 이미지로 변환
 *
 * @param pdfBlob PDF 파일의 Blob 객체
 * @param options 렌더링 옵션
 * @returns 페이지별 이미지 data URL과 총 페이지 수
 */
export async function renderPdfToImages(
  pdfBlob: Blob,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const { scale = 2.0, pageRange, pdfId = 'default' } = options;

  try {
    // PDF Blob을 ArrayBuffer로 변환
    const arrayBuffer = await pdfBlob.arrayBuffer();

    // pdfjs로 PDF 문서 로드
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const images = new Map<number, string>();

    // 렌더링할 페이지 범위 결정
    const startPage = pageRange ? Math.max(1, pageRange[0]) : 1;
    const endPage = pageRange ? Math.min(totalPages, pageRange[1]) : totalPages;

    // 각 페이지 렌더링
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const cacheKey = getCacheKey(pdfId, pageNum, scale);

      // 캐시에서 확인
      if (pageImageCache.has(cacheKey)) {
        images.set(pageNum, pageImageCache.get(cacheKey)!);
        continue;
      }

      // 페이지 가져오기
      const page = await pdf.getPage(pageNum);

      // 뷰포트 설정 (스케일 적용)
      const viewport = page.getViewport({ scale });

      // 캔버스 생성
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error(`Failed to get canvas context for page ${pageNum}`);
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // 페이지 렌더링
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // 캔버스를 PNG data URL로 변환
      const imageUrl = canvas.toDataURL('image/png');

      // 캐시에 저장
      pruneCache();
      pageImageCache.set(cacheKey, imageUrl);

      images.set(pageNum, imageUrl);

      // 페이지 리소스 정리
      page.cleanup();
    }

    return { images, totalPages };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF 렌더링 실패: ${errorMessage}`);
  }
}

/**
 * 캐시 초기화
 */
export function clearImageCache(): void {
  pageImageCache.clear();
}

/**
 * 특정 PDF의 캐시 무효화
 */
export function invalidateCache(pdfId: string): void {
  const keysToDelete: string[] = [];

  for (const key of pageImageCache.keys()) {
    if (key.startsWith(pdfId + '_')) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => pageImageCache.delete(key));
}

/**
 * T036: 편집 가능 영역 좌표 추출
 *
 * PDF 구조를 분석하여 해설 필드들의 위치 정보를 추출합니다.
 * 현재 구현에서는 PDF 텍스트 위치를 정확히 추출하기 어렵기 때문에,
 * 인라인 편집 기능은 향후 PDF 텍스트 레이어 분석이 추가되면 완성됩니다.
 *
 * @param _questions 문제 목록 (미사용)
 * @param _explanations 해설 데이터 (미사용)
 * @returns 빈 편집 가능 영역 배열 (향후 구현 예정)
 */
export function extractEditableRegions(
  _questions: unknown[],
  _explanations: Map<string, unknown>
): import('../types/question').EditableRegion[] {
  // PDF 텍스트 레이어에서 정확한 좌표를 추출하려면 pdfjs의 textContent API를 사용해야 하지만,
  // @react-pdf/renderer로 생성된 PDF는 텍스트 레이어 구조가 복잡하여
  // 해설 필드와 정확히 매핑하기 어렵습니다.
  //
  // 대안 접근 방식:
  // 1. PDF 렌더링 시 각 필드의 위치를 메타데이터로 저장
  // 2. PDF 외부에서 편집하고 PDF를 재생성
  // 3. 텍스트 기반 검색으로 대략적인 위치 추정
  //
  // 현재는 빈 배열을 반환하여 오버레이 편집을 비활성화합니다.
  // 사용자는 기존 ExplanationView에서 텍스트 편집이 가능합니다.

  return [];
}
