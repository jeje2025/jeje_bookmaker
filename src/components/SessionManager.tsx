import { useState, useEffect } from 'react';
import { Clock, Download, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { getSessions, deleteSession, deleteAllSessions } from '../services/sessionStorage';
import type { SavedSession, QuestionItem, ExplanationData, VocaPreviewWord } from '../types/question';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface SessionManagerProps {
  onLoadSession: (
    questions: QuestionItem[],
    explanations: Map<string, ExplanationData>,
    headerTitle: string,
    vocaWords?: VocaPreviewWord[]
  ) => void;
}

export function SessionManager({ onLoadSession }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // 세션 목록 로드
  const loadSessions = () => {
    const data = getSessions();
    setSessions(data);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 세션 불러오기
  const handleLoadSession = (session: SavedSession) => {
    setIsLoading(true);
    try {
      // Array → Map 변환
      const explanationsMap = new Map<string, ExplanationData>(session.explanations);

      onLoadSession(
        session.questions,
        explanationsMap,
        session.headerTitle || `${new Date(session.createdAt).toLocaleDateString('ko-KR')} (${session.questionCount}문제)`,
        session.vocabularyList
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 삭제
  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    loadSessions();
    setDeleteTarget(null);
  };

  // 전체 삭제
  const handleDeleteAll = () => {
    deleteAllSessions();
    loadSessions();
    setShowDeleteAllConfirm(false);
  };

  // 날짜 포맷
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
        <p>저장된 세션이 없습니다</p>
        <p className="text-xs mt-1">AI 해설을 생성하면 자동으로 저장됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-slate-600">
          <Clock size={14} />
          <span className="text-xs font-medium">최근 세션 ({sessions.length}/2)</span>
        </div>
        {sessions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-slate-400 hover:text-red-500"
            onClick={() => setShowDeleteAllConfirm(true)}
          >
            모두 삭제
          </Button>
        )}
      </div>

      {/* 세션 목록 */}
      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {session.headerTitle || formatDate(session.createdAt)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(session.createdAt)} · {session.questionCount}개 문제
                  {session.vocabularyList && session.vocabularyList.length > 0 && (
                    <span className="ml-1">· {session.vocabularyList.length}개 단어</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                  onClick={() => handleLoadSession(session)}
                  disabled={isLoading}
                  title="불러오기"
                >
                  <Download size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                  onClick={() => setDeleteTarget(session.id)}
                  title="삭제"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 개별 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>세션 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 세션을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteTarget && handleDeleteSession(deleteTarget)}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 전체 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모든 세션 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              저장된 모든 세션({sessions.length}개)을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteAll}
            >
              모두 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
