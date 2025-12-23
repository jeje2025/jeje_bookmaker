# Quickstart: PDF A4 페이지 분할

**Feature**: 002-pdf-a4-pagination
**Date**: 2025-12-23

## 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 기능 테스트 가이드

### 1. 기본 PDF 다운로드 테스트

1. 문제집 모드에서 TSV 데이터 입력 (10문제 이상)
2. "PDF 저장" 버튼 클릭
3. 다운로드된 PDF 확인:
   - 각 문제가 페이지 중간에서 잘리지 않는지 확인
   - 페이지 번호가 하단에 표시되는지 확인

### 2. 대용량 PDF 테스트

1. 30문제 이상의 데이터 입력
2. PDF 다운로드 실행
3. 확인 항목:
   - 생성 시간 15초 이내
   - 모든 페이지에서 콘텐츠 분할 확인
   - 페이지 번호 연속성 확인

### 3. 문제 그룹 분할 테스트

1. 같은 지문을 공유하는 연속 문제 2개 입력
2. PDF 다운로드
3. 확인 항목:
   - 그룹이 함께 배치되거나
   - 페이지 경계에서 분리될 경우 첫 문제만 현재 페이지에 배치

### 4. 인쇄 테스트

1. PDF 다운로드 후 A4 용지에 인쇄
2. 확인 항목:
   - 여백이 적절한지 (상하좌우 최소 10mm)
   - 콘텐츠가 잘리지 않는지
   - 페이지 번호가 가독성 있는지

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `src/components/QuestionPDF.tsx` | 문제집 PDF 렌더링 |
| `src/components/VocabularyPDF.tsx` | 단어장 PDF 렌더링 |
| `src/utils/pdfDownload.ts` | PDF 생성/다운로드 유틸 |
| `src/components/A4PageLayout.tsx` | 화면용 페이지 분할 (참조) |

## 핵심 구현 포인트

### wrap={false} 적용

```tsx
// QuestionPDF.tsx 또는 VocabularyPDF.tsx
<View wrap={false} style={styles.contentBlock}>
  {/* 이 블록은 페이지 중간에서 분할되지 않음 */}
  <QuestionCard question={question} />
</View>
```

### 페이지 설정

```tsx
<Page
  size="A4"
  style={{
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 30,
  }}
>
```

### 페이지 번호

```tsx
<Text
  fixed
  style={styles.pageNumber}
  render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
/>
```

## 문제 해결

### PDF 생성이 느린 경우

1. 문제 수 확인 (200개 이상 시 청크 분할 적용)
2. 브라우저 개발자 도구에서 메모리 사용량 확인
3. 콘솔에서 진행률 메시지 확인

### 콘텐츠가 잘리는 경우

1. `wrap={false}` 속성이 적용되었는지 확인
2. 단일 블록 크기가 한 페이지를 초과하지 않는지 확인
3. 여백 설정이 올바른지 확인

### 페이지 번호가 표시되지 않는 경우

1. `fixed` 속성이 Text에 적용되었는지 확인
2. `render` prop이 올바르게 설정되었는지 확인
3. 위치 스타일(bottom, right)이 적절한지 확인
