# Quickstart: AI 생성 데이터 로컬 기록

**Date**: 2025-12-23
**Feature**: 001-ai-data-local-log

## Overview

이 기능은 AI 해설 생성 결과를 브라우저 localStorage에 저장하고, 이전 세션을 불러오거나 삭제할 수 있게 합니다.

## Prerequisites

- 기존 프로젝트 환경 (`npm install` 완료)
- 브라우저 개발 도구 접근 가능

## Quick Implementation Steps

### Step 1: 타입 정의 추가

`src/types/question.ts`에 추가:

```typescript
export interface SavedSession {
  id: string;
  createdAt: string;
  questionCount: number;
  questions: QuestionItem[];
  explanations: [string, ExplanationData][];
  vocabularyList?: VocaPreviewWord[];
}

export interface StorageData {
  version: string;
  sessions: SavedSession[];
}
```

### Step 2: 서비스 생성

`src/services/sessionStorage.ts` 생성:

```typescript
const STORAGE_KEY = 'jeje-bookmaker-sessions';
const MAX_SESSIONS = 2;
const VERSION = '1.0';

export function saveSession(session: SavedSession): boolean {
  try {
    const data = loadStorageData();

    // FIFO: 2개 초과 시 오래된 것 삭제
    while (data.sessions.length >= MAX_SESSIONS) {
      data.sessions.shift();
    }

    data.sessions.push(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('세션 저장 실패:', error);
    return false;
  }
}

export function getSessions(): SavedSession[] {
  const data = loadStorageData();
  return data.sessions;
}

export function deleteSession(id: string): void {
  const data = loadStorageData();
  data.sessions = data.sessions.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function deleteAllSessions(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, sessions: [] }));
}

function loadStorageData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: VERSION, sessions: [] };

    const data = JSON.parse(raw);
    if (data.version !== VERSION) {
      // 버전 불일치 시 새로 시작
      return { version: VERSION, sessions: [] };
    }
    return data;
  } catch {
    return { version: VERSION, sessions: [] };
  }
}
```

### Step 3: App.tsx 통합

AI 해설 생성 완료 시 자동 저장:

```typescript
// 해설 생성 완료 후
const session: SavedSession = {
  id: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  questionCount: questionList.length,
  questions: questionList,
  explanations: Array.from(questionExplanations.entries()),
  vocabularyList: vocabularyList // 있는 경우
};

const success = saveSession(session);
if (!success) {
  toast({ title: '저장 실패', description: '저장소 용량이 부족합니다.' });
}
```

### Step 4: 세션 목록 UI

불러오기/삭제 UI 구현:

```tsx
// 세션 목록 표시
const sessions = getSessions();
sessions.map(s => (
  <div key={s.id}>
    <span>{new Date(s.createdAt).toLocaleString()} ({s.questionCount}문제)</span>
    <Button onClick={() => loadSession(s)}>불러오기</Button>
    <Button onClick={() => deleteSession(s.id)}>삭제</Button>
  </div>
));
```

## Testing

1. 문제 입력 후 AI 해설 생성
2. 브라우저 개발 도구 > Application > localStorage에서 `jeje-bookmaker-sessions` 확인
3. 새로고침 후 불러오기 테스트
4. 3번째 세션 저장 시 첫 번째 세션이 자동 삭제되는지 확인

## Troubleshooting

| 문제 | 원인 | 해결 |
|------|------|------|
| 저장 실패 | localStorage 용량 초과 | 브라우저 데이터 정리 또는 세션 삭제 |
| 데이터 손실 | 버전 불일치 | 정상 동작 (새 버전으로 시작) |
| 불러오기 실패 | JSON 파싱 오류 | 콘솔 로그 확인, 데이터 초기화 |

## File Checklist

- [ ] `src/types/question.ts` - SavedSession, StorageData 타입 추가
- [ ] `src/services/sessionStorage.ts` - 새 파일 생성
- [ ] `src/App.tsx` - 저장 로직 통합
- [ ] `src/components/SessionManager.tsx` - UI 컴포넌트 생성 (선택)
