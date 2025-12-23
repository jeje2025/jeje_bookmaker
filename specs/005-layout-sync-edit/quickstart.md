# Quickstart: 웹/PDF 레이아웃 동기화 및 텍스트 편집 기능

**Date**: 2025-12-23
**Branch**: 005-layout-sync-edit

## 1. 의존성 설치

```bash
# pdfjs-dist 설치 (PDF→Canvas 변환용)
npm install pdfjs-dist
```

## 2. 핵심 파일 생성 순서

### Phase 1: PDF 이미지 렌더링 서비스

**파일**: `src/services/pdfImageRenderer.ts`

```typescript
// 핵심 기능:
// 1. @react-pdf/renderer의 Blob을 pdfjs-dist로 Canvas 렌더링
// 2. Canvas를 PNG data URL로 변환
// 3. 페이지별 캐싱

import * as pdfjs from 'pdfjs-dist';

// Worker 설정 (Vite 환경)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function renderPdfToImages(pdfBlob: Blob, scale = 2.0) {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const images = new Map<number, string>();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: canvas.getContext('2d')!,
      viewport
    }).promise;
    images.set(i, canvas.toDataURL('image/png'));
  }

  return { images, totalPages: pdf.numPages };
}
```

### Phase 2: PDF 미리보기 컴포넌트

**파일**: `src/components/PdfPreview.tsx`

```typescript
// 핵심 기능:
// 1. PDF Blob 생성 (기존 QuestionPDF/VocabularyPDF 활용)
// 2. pdfImageRenderer로 이미지 변환
// 3. 페이지 네비게이션
// 4. EditableOverlay 렌더링

interface PdfPreviewProps {
  pdfComponent: React.ReactElement;  // <QuestionPDF /> 또는 <VocabularyPDF />
  editableRegions: EditableRegion[];
  onFieldEdit: (questionId: string, fieldType: string, value: string) => void;
}
```

### Phase 3: 편집 오버레이 컴포넌트

**파일**: `src/components/EditableOverlay.tsx`

```typescript
// 핵심 기능:
// 1. PDF 이미지 위에 투명 레이어 배치
// 2. 각 편집 영역에 클릭 가능한 div 배치
// 3. 클릭 시 contentEditable 활성화
// 4. Enter/Escape/blur 시 저장/취소

interface EditableOverlayProps {
  regions: EditableRegion[];
  scale: number;
  pageHeight: number;
  onSave: (regionId: string, newText: string) => void;
}
```

### Phase 4: 어휘 정답 강조 스타일

**수정 파일**: `src/components/QuestionPDF.tsx`

```typescript
// VocabularyExplanation 렌더링 시 정답 강조 추가
const VocabAnswerSection = ({ question, explanation, palette }) => (
  <View>
    <Text style={{ fontWeight: 'bold', color: palette.primary }}>
      정답: {circledNumber(question.answer)}
    </Text>
    {/* 정답 보기 강조 표시 */}
  </View>
);
```

**수정 파일**: `src/components/ExplanationView.tsx`

```typescript
// 웹에서도 동일한 정답 강조
{explanation.type === 'vocabulary' && (
  <div className="font-bold" style={{ color: colorPalette.primary }}>
    정답: {circledNumber(answer)}
  </div>
)}
```

## 3. App.tsx 상태 추가

```typescript
// 새로운 상태
const [editedFields, setEditedFields] = useState<Map<string, EditedFieldMap>>(new Map());
const [pdfPreviewState, setPdfPreviewState] = useState<PdfPreviewState>({
  status: 'idle',
  totalPages: 0,
  currentPage: 1,
  pageImages: new Map(),
  editableRegions: [],
  scale: 2.0,
});

// 편집 핸들러
const handleFieldEdit = useCallback((questionId: string, fieldType: string, value: string) => {
  // 빈 값이면 원본 복원
  if (!value.trim()) {
    // 원본 값 복원 로직
    return;
  }

  // 편집 저장
  setEditedFields(prev => {
    const newMap = new Map(prev);
    // ... 업데이트 로직
    return newMap;
  });

  // ExplanationData도 업데이트
  setQuestionExplanations(prev => {
    // ... 업데이트 로직
  });
}, []);
```

## 4. 테스트 시나리오

### 시나리오 1: PDF 미리보기 동기화
1. 문제 데이터 입력
2. 해설 생성
3. "미리보기" 탭에서 PDF 이미지 확인
4. PDF 다운로드하여 이미지와 비교

### 시나리오 2: 어휘 정답 표시
1. 어휘(동의어) 문제 포함 데이터 입력
2. 해설 생성
3. 해설지에서 정답 번호 + 보기 강조 확인

### 시나리오 3: 인라인 편집
1. 해설지 미리보기에서 텍스트 클릭
2. 텍스트 수정
3. Enter 또는 외부 클릭으로 저장
4. PDF 다운로드하여 수정 내용 반영 확인

### 시나리오 4: 빈 값 복원
1. 텍스트 편집 모드 진입
2. 내용 전체 삭제
3. Enter 또는 외부 클릭
4. 원본 텍스트로 자동 복원 확인

## 5. 성능 체크포인트

| 항목 | 목표 | 측정 방법 |
|-----|------|---------|
| PDF 이미지 렌더링 | < 2초 (10페이지) | console.time |
| 편집 반영 → PDF 재렌더링 | < 1초 | 사용자 체감 |
| 메모리 사용량 | < 500MB | Chrome DevTools |

## 6. 롤백 포인트

문제 발생 시 기존 뷰로 폴백:
- PdfPreview 컴포넌트 대신 기존 A4PageLayout 기반 뷰 사용
- `usePdfPreview` 플래그로 전환 가능하게 구현

```typescript
// App.tsx
const [usePdfPreview, setUsePdfPreview] = useState(true);

// 조건부 렌더링
{usePdfPreview ? (
  <PdfPreview {...props} />
) : (
  <ExplanationView {...props} />  // 기존 뷰
)}
```
