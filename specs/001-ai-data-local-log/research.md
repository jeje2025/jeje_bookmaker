# Research: AI 생성 데이터 로컬 기록

**Date**: 2025-12-23
**Feature**: 001-ai-data-local-log

## Research Summary

이 기능은 매우 단순한 localStorage 기반 구현으로, 복잡한 기술 조사가 필요하지 않음. 기존 웹 표준 API와 프로젝트 패턴을 따름.

---

## Decision 1: 저장소 선택

**Decision**: localStorage 사용

**Rationale**:
- 최근 2개 세션만 저장하는 단순한 요구사항
- 각 세션 데이터는 약 100KB-500KB 예상 (100문제 기준)
- 2개 세션 × 500KB = 약 1MB, localStorage 5MB 제한 내 충분
- 동기식 API로 구현 단순
- 추가 라이브러리 불필요

**Alternatives Considered**:
- IndexedDB: 대용량/비동기 처리에 적합하지만, 2개 세션에는 과도한 복잡성
- sessionStorage: 탭 닫으면 데이터 소멸, 요구사항에 부적합

---

## Decision 2: 데이터 직렬화

**Decision**: JSON.stringify/JSON.parse 사용

**Rationale**:
- 기존 QuestionItem, ExplanationData 타입이 이미 JSON 호환
- Map 객체(questionExplanations)는 Array로 변환 후 저장
- 별도 직렬화 라이브러리 불필요

**Alternatives Considered**:
- superjson: Map/Date 등 복잡한 타입 지원하지만, 프로젝트에 없음
- 수동 변환: Map → Array 변환으로 충분

---

## Decision 3: 세션 식별자

**Decision**: 생성 시간 기반 ID (ISO 8601 타임스탬프)

**Rationale**:
- 2개 세션만 관리하므로 복잡한 ID 체계 불필요
- 타임스탬프는 정렬 및 표시에 유용
- 예: `"2025-12-23T10:30:00.000Z"`

**Alternatives Considered**:
- UUID: 2개 세션에 과도함
- 순차 번호: 삭제 후 재사용 시 혼란 가능

---

## Decision 4: FIFO 관리 로직

**Decision**: 저장 시 배열 길이 체크 후 오래된 것 삭제

**Rationale**:
```typescript
// 의사 코드
const sessions = getSessions(); // 기존 세션 배열
if (sessions.length >= 2) {
  sessions.shift(); // 가장 오래된 것 제거
}
sessions.push(newSession);
saveSessions(sessions);
```

**Alternatives Considered**:
- LRU 캐시 라이브러리: 2개 세션에 과도함
- 타임스탬프 비교: 배열 순서로 충분

---

## Decision 5: 에러 처리

**Decision**: try-catch로 QuotaExceededError 처리, 토스트 알림

**Rationale**:
- localStorage 저장 실패 시 QuotaExceededError 발생
- 기존 앱의 토스트 알림 패턴 재사용
- 저장 실패해도 현재 작업 세션은 유지

**Alternatives Considered**:
- 자동 정리: 2개 제한으로 이미 최소화됨
- 압축: 복잡도 대비 효과 미미

---

## Decision 6: 버전 관리

**Decision**: 저장 데이터에 `version` 필드 추가

**Rationale**:
- 향후 데이터 구조 변경 시 마이그레이션 지원
- 초기 버전: `"1.0"`
- 호환되지 않는 구 버전 데이터는 무시하고 새로 시작

**Alternatives Considered**:
- 버전 없음: 향후 변경 시 기존 데이터 손실 위험
- 복잡한 마이그레이션: 2개 세션에 과도함

---

## localStorage Key 구조

```typescript
// 키 네이밍
const STORAGE_KEY = 'jeje-bookmaker-sessions';

// 저장 구조
interface StorageData {
  version: string;           // "1.0"
  sessions: SavedSession[];  // 최대 2개
}
```

---

## 기존 코드 분석

### App.tsx 상태 관리 패턴
- 30+ 개 상태를 App.tsx에서 직접 관리
- Map 객체로 questionExplanations 관리
- setter 함수를 자식 컴포넌트에 전달

### 기존 localStorage 사용
- `geminiExplanation.ts`: 커스텀 프롬프트 저장 (`custom-prompts` 키)
- 패턴: 직접 localStorage.getItem/setItem 호출

### 필요한 타입 (question.ts)
- QuestionItem: 이미 정의됨
- ExplanationData: 이미 정의됨 (유니온 타입)
- VocaPreviewWord: 이미 정의됨

---

## Unknowns Resolved

| Unknown | Resolution |
|---------|------------|
| 저장소 기술 | localStorage (spec에서 결정됨) |
| 세션 수 제한 | 2개 (spec에서 결정됨) |
| 직렬화 방법 | JSON.stringify + Map→Array 변환 |
| 버전 관리 | version 필드로 단순 관리 |
