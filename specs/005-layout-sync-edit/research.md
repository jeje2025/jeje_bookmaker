# Research: 웹/PDF 레이아웃 동기화 및 텍스트 편집 기능

**Date**: 2025-12-23
**Branch**: 005-layout-sync-edit

## Research Topics

### 1. PDF→이미지 변환 방식

**Decision**: @react-pdf/renderer → Blob → pdfjs-dist → Canvas → 이미지

**Rationale**:
- 프로젝트가 이미 @react-pdf/renderer를 사용 중
- pdfjs-dist는 PDF를 canvas로 렌더링하는 표준 라이브러리
- canvas.toDataURL()로 PNG 이미지 추출 가능
- react-pdf (wojtekmaj/react-pdf)가 pdfjs-dist를 래핑하여 React 친화적 API 제공

**Alternatives considered**:
| 방식 | 장점 | 단점 | 결정 |
|-----|------|------|------|
| @react-pdf/renderer BlobProvider + pdfjs | 기존 PDF 컴포넌트 재사용 | 추가 의존성 (pdfjs-dist) | ✅ 선택 |
| html2canvas + 웹 컴포넌트 | 웹 렌더링 직접 캡처 | 웹/PDF 불일치 문제 해결 안됨 | ❌ |
| iframe + PDF 직접 표시 | 간단한 구현 | 편집 오버레이 불가 | ❌ |
| Server-side PDF→이미지 | 서버 부하 분산 | 추가 인프라 필요 | ❌ |

**Implementation Pattern**:
```typescript
// 1. @react-pdf/renderer로 PDF Blob 생성
import { pdf } from '@react-pdf/renderer';
const blob = await pdf(<QuestionPDF {...props} />).toBlob();

// 2. pdfjs-dist로 캔버스 렌더링
import * as pdfjs from 'pdfjs-dist';
const arrayBuffer = await blob.arrayBuffer();
const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
const page = await pdfDoc.getPage(pageNum);
const viewport = page.getViewport({ scale: 2.0 }); // 고해상도
const canvas = document.createElement('canvas');
canvas.width = viewport.width;
canvas.height = viewport.height;
await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

// 3. 이미지 데이터 추출
const imageUrl = canvas.toDataURL('image/png');
```

---

### 2. 오버레이 편집 영역 구현

**Decision**: 절대 좌표 기반 투명 레이어 + contentEditable div

**Rationale**:
- PDF 이미지 위에 정확한 위치에 편집 영역 배치 필요
- PDF 좌표계와 웹 좌표계 매핑 필요 (scale factor 적용)
- contentEditable로 자연스러운 텍스트 편집 UX 제공

**Alternatives considered**:
| 방식 | 장점 | 단점 | 결정 |
|-----|------|------|------|
| 절대 좌표 오버레이 | 정확한 위치, PDF와 1:1 매핑 | 좌표 계산 복잡 | ✅ 선택 |
| 별도 편집 모드 | 구현 단순 | WYSIWYG 아님 | ❌ |
| 사이드 패널 편집 | 기존 패턴 | 직관적이지 않음 | ❌ |

**좌표 매핑 전략**:
```typescript
interface EditableRegion {
  id: string;                    // 데이터 식별자 (questionId, fieldType)
  fieldType: 'passageTranslation' | 'explanation' | 'wordMeaning' | 'example';
  pageIndex: number;             // PDF 페이지 번호 (0-based)
  pdfRect: {                     // PDF 좌표계 (포인트 단위)
    x: number;
    y: number;
    width: number;
    height: number;
  };
  originalText: string;          // 원본 텍스트 (빈값 복원용)
  currentText: string;           // 현재 텍스트
}

// PDF 좌표 → 화면 좌표 변환
const screenRect = {
  left: pdfRect.x * scale,
  top: (pageHeight - pdfRect.y - pdfRect.height) * scale,  // PDF는 bottom-up
  width: pdfRect.width * scale,
  height: pdfRect.height * scale,
};
```

---

### 3. 어휘 문제 정답 강조 스타일

**Decision**: 볼드 + colorPalette.primary 색상

**Rationale**:
- 기존 colorPalette 시스템 활용으로 일관된 디자인
- 볼드+색상 조합이 가독성 최적
- 인쇄 시에도 명확하게 구분

**스타일 정의**:
```typescript
// QuestionPDF.tsx 내 정답 스타일
const answerHighlightStyle = {
  fontWeight: 'bold',
  color: blendColor(palette.primary, 1.0),  // 팔레트 primary 색상
};

// ExplanationView.tsx 웹 스타일 (동일)
const answerHighlightClass = "font-bold text-[var(--palette-primary)]";
```

---

### 4. 편집 상태 관리

**Decision**: App.tsx의 기존 Map 구조 확장

**Rationale**:
- 헌법에서 외부 상태 라이브러리 금지
- 기존 questionExplanations: Map<id, ExplanationData> 패턴 유지
- 편집 시 Map 값 업데이트 후 PDF 재렌더링

**상태 흐름**:
```
사용자 편집 → EditableOverlay onSave 콜백
           → App.tsx setQuestionExplanations (Map 업데이트)
           → PdfPreview 재렌더링 (PDF Blob 재생성)
           → 새 이미지 표시
```

---

### 5. 성능 최적화

**Decision**: 디바운스 + 메모이제이션 + 점진적 렌더링

**Rationale**:
- PDF 렌더링은 CPU 집약적이므로 불필요한 재렌더링 방지
- 편집 완료 시점에만 PDF 재생성 (실시간 타이핑 중에는 오버레이만 업데이트)

**최적화 전략**:
```typescript
// 1. 편집 완료 시에만 PDF 재생성 (디바운스)
const debouncedPdfRender = useMemo(
  () => debounce(() => renderPdf(data), 500),
  [data]
);

// 2. 페이지별 이미지 캐싱
const pageImageCache = useRef<Map<string, string>>(new Map());

// 3. 변경된 페이지만 재렌더링
const invalidatedPages = useMemo(() =>
  findAffectedPages(prevData, currentData),
  [prevData, currentData]
);
```

---

## Dependencies

### 필수 추가 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| pdfjs-dist | ^4.x | PDF→Canvas 렌더링 |
| react-pdf | ^9.x | pdfjs React 래퍼 (선택적) |

### 설치 명령

```bash
npm install pdfjs-dist
```

### Worker 설정

```typescript
// src/services/pdfImageRenderer.ts
import * as pdfjs from 'pdfjs-dist';

// Vite 환경에서 worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```

---

## Technical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PDF 렌더링 성능 저하 | Medium | High | 페이지별 캐싱, 디바운스 적용 |
| 좌표 매핑 오차 | Medium | Medium | scale factor 정밀 계산, 테스트 케이스 작성 |
| 메모리 사용량 증가 | Low | Medium | 이미지 캐시 크기 제한 (최근 5페이지) |
| pdfjs worker 로딩 실패 | Low | High | fallback: iframe 직접 표시 |

---

## References

- [PDF to Image conversion using Reactjs](https://medium.com/@charanvinaynarni/pdf-to-image-conversion-using-reactjs-fd250a25bf05)
- [wojtekmaj/react-pdf](https://github.com/wojtekmaj/react-pdf)
- [PDF.JS to JPEG/PNG](https://usefulangle.com/post/24/pdf-to-jpeg-png-with-pdfjs)
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer)
