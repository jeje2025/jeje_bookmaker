import type { SavedSession, StorageData, EditedFieldMap, EditedField } from '../types/question';

const STORAGE_KEY = 'jeje-bookmaker-sessions';
const MAX_SESSIONS = 2;
const VERSION = '1.0';

/**
 * T041: EditedFieldMap을 직렬화 가능한 형태로 변환
 */
export function serializeEditedFields(
  editedFields: Map<string, EditedFieldMap>
): [string, [string, EditedField][]][] {
  const result: [string, [string, EditedField][]][] = [];

  for (const [questionId, fieldMap] of editedFields.entries()) {
    const fieldEntries: [string, EditedField][] = Array.from(fieldMap.entries());
    result.push([questionId, fieldEntries]);
  }

  return result;
}

/**
 * T041: 직렬화된 editedFields를 Map으로 복원
 */
export function deserializeEditedFields(
  serialized: [string, [string, EditedField][]][] | undefined
): Map<string, EditedFieldMap> {
  const result = new Map<string, EditedFieldMap>();

  if (!serialized) return result;

  for (const [questionId, fieldEntries] of serialized) {
    const fieldMap = new Map<string, EditedField>(fieldEntries);
    result.set(questionId, fieldMap);
  }

  return result;
}

/**
 * T003: localStorage에서 저장된 데이터를 불러옴
 * 버전 불일치 시 초기 상태 반환
 */
export function loadStorageData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: VERSION, sessions: [] };
    }

    const data = JSON.parse(raw) as StorageData;

    // 버전 불일치 시 새로 시작
    if (data.version !== VERSION) {
      console.warn(`세션 데이터 버전 불일치: ${data.version} !== ${VERSION}, 초기화됨`);
      return { version: VERSION, sessions: [] };
    }

    return data;
  } catch (error) {
    console.error('세션 데이터 로드 실패:', error);
    return { version: VERSION, sessions: [] };
  }
}

/**
 * T004: 세션 저장 (FIFO - 최대 2개 유지)
 * @returns 저장 성공 여부
 */
export function saveSession(session: SavedSession): boolean {
  try {
    const data = loadStorageData();

    // FIFO: 2개 초과 시 가장 오래된 것 삭제
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

/**
 * T005: 저장된 모든 세션 목록 반환
 */
export function getSessions(): SavedSession[] {
  const data = loadStorageData();
  return data.sessions;
}

/**
 * T006: 특정 세션 삭제
 */
export function deleteSession(id: string): void {
  try {
    const data = loadStorageData();
    data.sessions = data.sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('세션 삭제 실패:', error);
  }
}

/**
 * T006: 모든 세션 삭제
 */
export function deleteAllSessions(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, sessions: [] }));
  } catch (error) {
    console.error('전체 세션 삭제 실패:', error);
  }
}
