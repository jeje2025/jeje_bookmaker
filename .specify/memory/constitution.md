<!--
===============================================================================
SYNC IMPACT REPORT
===============================================================================
Version Change: N/A → 1.0.0 (Initial)
Modified Principles: N/A (New constitution)
Added Sections:
  - Core Principles (5 principles)
  - 기술 표준 (Technology Standards)
  - 개발 워크플로우 (Development Workflow)
  - Governance

Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Compatible (Constitution Check section exists)
  ✅ .specify/templates/spec-template.md - Compatible (Requirements section aligns)
  ✅ .specify/templates/tasks-template.md - Compatible (Phase structure aligns)

Follow-up TODOs: None
===============================================================================
-->

# 제제 교재 (JEJE Bookmaker) Constitution

## Core Principles

### I. 사용자 경험 우선 (UX-First)

모든 기능 개발은 최종 사용자(교사, 학생)의 학습 경험을 최우선으로 고려해야 합니다.

**필수 준수 사항:**
- PDF 출력물의 가독성과 인쇄 품질 MUST 검증 후 배포
- A4 레이아웃은 실제 인쇄 환경에서 테스트 MUST
- UI 반응 시간은 200ms 이내 SHOULD 유지
- 한글 폰트(Pretendard) 렌더링 품질 MUST 보장

**근거:** 교육 도구로서의 본질적 가치는 생성된 교재의 품질과 사용 편의성에 있음.

### II. 데이터 무결성 (Data Integrity)

문제 데이터, AI 해설, 단어장 정보의 정확성과 일관성을 보장해야 합니다.

**필수 준수 사항:**
- 정답 형식: 내부 저장은 숫자(1-5), 화면 표시는 동그라미(①-⑤) MUST
- 지문 마크업 규칙: `_word_`(밑줄), `__________`(빈칸) MUST 준수
- TSV 파싱 시 데이터 유효성 검증 MUST
- AI 응답(ExplanationData) 타입 안전성 MUST 보장

**근거:** 교재의 신뢰성은 데이터 정확성에 직결됨.

### III. 모듈화된 뷰 시스템 (Modular Views)

3가지 앱 모드(문제집/단어장/구문교재)는 독립적으로 동작하되, 공통 컴포넌트를 재사용해야 합니다.

**필수 준수 사항:**
- 앱 모드별 컴포넌트는 `Question*.tsx`, `Vocabulary*.tsx`, `Grammar*.tsx` 네이밍 MUST
- 공통 UI는 `src/components/ui/` 디렉토리에 MUST 위치
- A4PageLayout, HeaderFooter 등 레이아웃 컴포넌트는 모든 모드에서 재사용 SHOULD
- 뷰 모드 전환 시 상태 격리 MUST

**근거:** 기능 확장 시 기존 모드에 영향 없이 독립적 개발 가능.

### IV. AI 서비스 안정성 (AI Service Reliability)

Gemini API 통합은 실패 시에도 앱의 핵심 기능이 동작해야 합니다.

**필수 준수 사항:**
- AI 호출 실패 시 사용자에게 명확한 피드백 MUST 제공
- 배치 처리 중 부분 실패 허용, 성공한 결과는 MUST 보존
- API 키 및 민감 정보는 환경 변수로 MUST 관리
- 프롬프트 템플릿은 `geminiExplanation.ts`에 MUST 중앙 관리

**근거:** AI 서비스 장애가 전체 앱 사용 불가로 이어지면 안 됨.

### V. 인쇄 최적화 (Print Optimization)

생성된 PDF는 실제 인쇄 환경에서 의도한 대로 출력되어야 합니다.

**필수 준수 사항:**
- 페이지 분할은 A4PageLayout 컴포넌트가 MUST 자동 처리
- Pantone 컬러 팔레트는 인쇄 호환성 MUST 고려
- 폰트 크기 스케일(0.85x ~ 1.2x)은 가독성 테스트 후 SHOULD 조정
- PDF 생성 시 @react-pdf/renderer 또는 html2canvas MUST 사용

**근거:** 디지털 화면과 실제 인쇄물의 차이를 최소화해야 교재 품질 보장.

## 기술 표준

### 기술 스택 제약

| 분류 | 허용 기술 | 비고 |
|------|----------|------|
| 프론트엔드 | React 18+, TypeScript | Vite 빌드 시스템 |
| UI 컴포넌트 | Radix UI, Tailwind CSS | 접근성 보장 |
| 상태 관리 | React 내장 상태 (App.tsx 중앙 관리) | 외부 상태 라이브러리 금지 |
| PDF 생성 | @react-pdf/renderer, pdf-lib, html2canvas | |
| AI 서비스 | Google Gemini API | 백엔드 프록시 권장 |
| 백엔드 | Supabase Edge Functions (Deno, Hono.js) | |

### 코드 구조 규칙

- 타입 정의는 `src/types/` 디렉토리에 중앙 관리 MUST
- 서비스 로직은 `src/services/` 디렉토리에 MUST 위치
- 유틸리티 함수는 `src/utils/` 디렉토리에 MUST 위치
- 컴포넌트는 기능별로 명확한 네이밍 MUST

## 개발 워크플로우

### 변경 사항 검증

1. **로컬 테스트**: `npm run dev`로 개발 서버 실행 후 기능 확인 MUST
2. **빌드 검증**: `npm run build` 성공 MUST
3. **PDF 출력 테스트**: 변경된 뷰 모드의 PDF 다운로드 및 확인 SHOULD
4. **인쇄 테스트**: 레이아웃 변경 시 실제 인쇄 확인 SHOULD

### 커밋 규칙

- 기능 단위로 커밋 SHOULD
- 커밋 메시지는 한글 또는 영어로 명확하게 MUST

## Governance

### 헌법 수정 절차

1. 수정 제안 시 변경 사유와 영향 범위 문서화 MUST
2. 기존 원칙 삭제/변경 시 MAJOR 버전 증가 MUST
3. 새 원칙 추가 시 MINOR 버전 증가 MUST
4. 문구 수정/명확화는 PATCH 버전 증가

### 준수 검증

- 모든 PR은 Core Principles 위반 여부 검토 SHOULD
- 기술 스택 변경 시 기술 표준 섹션 업데이트 MUST
- 새로운 앱 모드 추가 시 원칙 III (모듈화된 뷰 시스템) 준수 MUST

### 참조 문서

- 개발 가이드: `CLAUDE.md`
- 프로젝트 개요: `README.md`

**Version**: 1.0.0 | **Ratified**: 2025-12-23 | **Last Amended**: 2025-12-23