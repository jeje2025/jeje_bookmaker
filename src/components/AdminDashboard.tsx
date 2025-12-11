import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Download, Trash2, ChevronDown, ChevronUp, Upload, Database } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface UsageLog {
  id?: string;
  timestamp: string;
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
  footerRight?: string;
  viewMode?: string;
  wordCount: number;
  inputTokens?: number;
  outputTokens?: number;
  vocabularyList?: any[];
}

// 제제보카 설정
const JEJEVOCA_URL = 'https://ooxinxuphknbfhbancgs.supabase.co';
const JEJEVOCA_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veGlueHVwaGtuYmZoYmFuY2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDExMTQsImV4cCI6MjA3NDM3NzExNH0.lrbSZb3DTTWBkX3skjOHZ7N_WC_5YURB0ncDHFrwEzY';

interface JejevocaCategory {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export function AdminDashboard({ onClose, onLoad }: { onClose: () => void; onLoad?: (log: UsageLog) => void }) {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [expandedLogData, setExpandedLogData] = useState<any>(null); // 상세 단어 목록
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [migrateCategory, setMigrateCategory] = useState('');
  const [migrateDifficulty, setMigrateDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isMigrating, setIsMigrating] = useState(false);

  // 제제보카 카테고리 상태
  const [jejevocaCategories, setJejevocaCategories] = useState<JejevocaCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LOGS_PER_PAGE = 50; // 한 번에 50개씩 로딩

  useEffect(() => {
    fetchLogs();
    fetchJejevocaCategories();
  }, []);

  // 제제보카 카테고리 가져오기
  const fetchJejevocaCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch(
        `${JEJEVOCA_URL}/functions/v1/server/admin/categories`,
        {
          headers: {
            'Authorization': `Bearer ${JEJEVOCA_ANON_KEY}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setJejevocaCategories(data.categories || []);
        // 첫 번째 카테고리를 기본값으로 설정
        if (data.categories && data.categories.length > 0) {
          setMigrateCategory(data.categories[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Jejevoca categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchLogs = async (page = 1, append = false) => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * LOGS_PER_PAGE;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/logs?limit=${LOGS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newLogs = data.logs || [];

        if (append) {
          setLogs(prev => [...prev, ...newLogs]);
        } else {
          setLogs(newLogs);
        }

        // 더 불러올 데이터가 있는지 확인
        setHasMore(newLogs.length === LOGS_PER_PAGE);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchLogs(currentPage + 1, true);
    }
  };

  // 상세 단어 목록 로드 (클릭 시에만 가져옴 - 메모리 최적화)
  const loadLogDetail = async (logId: string, index: number) => {
    // 이미 열려있으면 닫기
    if (expandedLog === index) {
      setExpandedLog(null);
      setExpandedLogData(null);
      return;
    }

    setExpandedLog(index);
    setIsLoadingDetail(true);
    setExpandedLogData(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/load-log/${encodeURIComponent(logId)}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.log) {
          setExpandedLogData(data.log);
        }
      }
    } catch (error) {
      console.error('Failed to load log detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const clearLogs = () => {
    if (confirm('모든 사용 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem('usage_logs');
      setLogs([]);
    }
  };

  const toggleLogSelection = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      // id가 있으면 id 사용, 없으면 timestamp 사용 (fallback)
      setSelectedLogs(new Set(logs.map(log => log.id || log.timestamp)));
    }
  };

  const handleMigrate = async () => {
    if (selectedLogs.size === 0) {
      toast.error('마이그레이션할 데이터를 선택해주세요.', { duration: 1000 });
      return;
    }

    if (!migrateCategory.trim()) {
      toast.error('카테고리를 선택해주세요.', { duration: 1000 });
      return;
    }

    setIsMigrating(true);

    const migratedCount = { success: 0, error: 0 };
    const errors: string[] = [];

    try {
      // 선택된 로그들 처리
      for (const selectedId of Array.from(selectedLogs) as string[]) {
        try {
          // logs 배열에서 메타데이터 찾기 (id 또는 timestamp로)
          const logMeta = logs.find((l: UsageLog) => (l.id || l.timestamp) === selectedId);
          console.log('Found log meta:', selectedId, 'id:', logMeta?.id);

          // API에서 단어 목록 포함한 전체 데이터 가져오기
          // load-log API는 UUID(id)를 사용
          const apiLogId = logMeta?.id || selectedId;
          console.log('Fetching log detail from API with id:', apiLogId);

          const logResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/load-log/${encodeURIComponent(apiLogId)}`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );

          let log: any = null;
          if (logResponse.ok) {
            const logData = await logResponse.json();
            log = logData.log;
            console.log('Loaded log:', log?.headerTitle, 'words:', log?.vocabularyList?.length);
          } else {
            console.error('Failed to load log:', logResponse.status, await logResponse.text());
          }

          if (!log || !log.vocabularyList || log.vocabularyList.length === 0) {
            errors.push(`${log?.headerTitle || selectedId}: 단어 목록 없음`);
            migratedCount.error++;
            continue;
          }

          // 2. 제제보카 형식으로 데이터 변환
          const payload = {
            title: log.headerTitle || 'Untitled',
            description: log.headerDescription || '',
            category: migrateCategory,
            difficulty_level: migrateDifficulty,
            header_title: log.headerTitle || '',
            header_description: log.headerDescription || '',
            source_chapter: log.footerLeft || '',
            token_input: log.inputTokens || 0,
            token_output: log.outputTokens || 0,
            words: log.vocabularyList.map((item: any, index: number) => ({
              word: item.word || '',
              pronunciation: item.pronunciation || '',
              part_of_speech: item.partOfSpeech || '',
              meaning: item.meaning || '',
              definition: item.definition || '',
              synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
              antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
              derivatives: Array.isArray(item.derivatives) ? item.derivatives : [],
              example: item.example || '',
              translation: item.translation || '',
              translation_highlight: item.translationHighlight || '',
              etymology: item.etymology || '',
              order_index: index
            }))
          };

          console.log('Uploading to Jejevoca:', payload.title, `(${payload.words.length} words)`);

          // 3. 제제보카 Edge Function으로 직접 업로드
          const uploadResponse = await fetch(
            `${JEJEVOCA_URL}/functions/v1/server/admin/shared-vocabularies`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JEJEVOCA_ANON_KEY}`
              },
              body: JSON.stringify(payload)
            }
          );

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload failed:', errorText);
            errors.push(`${log.headerTitle}: 업로드 실패 - ${errorText.substring(0, 50)}`);
            migratedCount.error++;
            continue;
          }

          const result = await uploadResponse.json();
          console.log('Upload success:', result);
          migratedCount.success++;

        } catch (err) {
          console.error('Migration error for log:', selectedId, err);
          errors.push(`로그 ${selectedId}: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
          migratedCount.error++;
        }
      }

      // 결과 표시
      if (migratedCount.success > 0) {
        toast.success(`${migratedCount.success}개 단어장이 제제보카로 업로드되었습니다!`, { duration: 2000 });
        setShowMigrateDialog(false);
        setSelectedLogs(new Set());
      }

      if (migratedCount.error > 0) {
        toast.warning(`${migratedCount.error}개 항목에서 오류가 발생했습니다.`, { duration: 2000 });
        console.error('Migration errors:', errors);
      }

      if (migratedCount.success === 0 && migratedCount.error > 0) {
        toast.error('모든 항목에서 오류가 발생했습니다.', { duration: 2000 });
      }

    } catch (error) {
      console.error('Migration error:', error);
      toast.error(`마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, { duration: 2000 });
    } finally {
      setIsMigrating(false);
    }
  };

  const exportCSV = () => {
    const headers = ['날짜/시간', '제목', '설명', '레이아웃', '단어 개수', '입력 토큰', '출력 토큰', '총 토큰', '비용($)', '비용(₩)'];
    const exchangeRate = 1400;
    
    const rows = logs.map(log => {
      const inputTokens = log.inputTokens || 0;
      const outputTokens = log.outputTokens || 0;
      const totalTokens = inputTokens + outputTokens;
      const cost = (inputTokens / 1000000) * 0.10 + (outputTokens / 1000000) * 0.40;
      const costKRW = cost * exchangeRate;
      
      return [
        log.timestamp,
        log.headerTitle,
        log.headerDescription,
        log.viewMode,
        log.wordCount.toString(),
        inputTokens.toString(),
        outputTokens.toString(),
        totalTokens.toString(),
        cost.toFixed(6),
        costKRW.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = `usage_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    // 메모리 누수 방지: Object URL 해제
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 100);
  };

  const viewModeLabels: { [key: string]: string } = {
    card: '카드형',
    table: '표버전',
    tableSimple: '간단버전',
    test: '테스트',
    testAnswer: '답지'
  };

  // 통계 계산
  const totalGenerations = logs.length;
  const totalWords = logs.reduce((sum, log) => sum + log.wordCount, 0);
  const totalInputTokens = logs.reduce((sum, log) => sum + (log.inputTokens || 0), 0);
  const totalOutputTokens = logs.reduce((sum, log) => sum + (log.outputTokens || 0), 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  
  // API 비용 계산 (Gemini 2.0 Flash: input $0.10/1M, output $0.40/1M)
  const inputCost = (totalInputTokens / 1000000) * 0.10;
  const outputCost = (totalOutputTokens / 1000000) * 0.40;
  const totalCost = inputCost + outputCost;
  
  // 원화 환산
  const exchangeRate = 1400;
  const totalCostKRW = totalCost * exchangeRate;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[90vw] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-slate-900 text-lg">관리자 대시보드</h2>
            <p className="text-xs text-slate-500 mt-0.5">AI 생성 상세 기록 및 비용 분석</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* API 비용 - 오른쪽 끝에 강조 */}
        <div className="px-5 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-5">
              <div>
                <div className="text-xs text-slate-600">총 생성 횟수</div>
                <div className="text-xl text-slate-900 mt-0.5">{totalGenerations.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600">총 단어 수</div>
                <div className="text-xl text-slate-900 mt-0.5">{totalWords.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-600">총 토큰 수</div>
                <div className="text-lg text-slate-900 mt-0.5">{totalTokens.toLocaleString()}</div>
                <div className="text-xs text-slate-500">
                  입력 {totalInputTokens.toLocaleString()} · 출력 {totalOutputTokens.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* API 비용 - 오른쪽 강조 (KRW만) */}
            <div className="text-right">
              <div className="text-xs text-slate-600">총 API 비용</div>
              <div className="text-2xl text-indigo-600 mt-0.5">
                ₩{totalCostKRW < 1 ? totalCostKRW.toFixed(2) : Math.round(totalCostKRW).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                입력 ₩{(inputCost * exchangeRate).toFixed(2)} · 출력 ₩{(outputCost * exchangeRate).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-2 border-b flex gap-2 bg-slate-50 flex-shrink-0">
          <Button onClick={exportCSV} variant="outline" size="sm" disabled={logs.length === 0}>
            <Download size={14} className="mr-1" />
            CSV 내보내기
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm" disabled={logs.length === 0}>
            <Trash2 size={14} className="mr-1" />
            기록 삭제
          </Button>
          <Button
            onClick={() => setShowMigrateDialog(true)}
            variant="outline"
            size="sm"
            disabled={selectedLogs.size === 0}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Database size={14} className="mr-1" />
            제제보카로 마이그레이션 ({selectedLogs.size})
          </Button>
          <div className="flex-1"></div>
          <div className="text-xs text-slate-500 flex items-center">
            총 {logs.length}개 기록
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0 mt-2"> {/* mt-2 추가로 위쪽 간격 줄이기 */}
          {isLoading ? (
            <div className="text-center text-gray-500 py-12">
              로그를 불러오는 중입니다...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              아직 AI 생성 기록이 없습니다.
              <p className="text-xs mt-2">단어 입력 후 '🤖 생성' 버튼을 클릭하면 기록됩니다.</p>
            </div>
          ) : (
            <>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-2 py-2 text-center font-semibold text-slate-700 w-10">
                    <input
                      type="checkbox"
                      checked={selectedLogs.size === logs.length && logs.length > 0}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-700 w-10">#</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-700 w-32">날짜/시간</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-700">제목</th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-700">설명</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-700 w-16">레이아웃</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-700 w-16">단어 수</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-700 w-20">입력 토큰</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-700 w-20">출력 토큰</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-700 w-20">총 토큰</th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-700 w-22">비용 (₩)</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-700 w-14">상세</th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-700 w-20">불러오기</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const inputTokens = log.inputTokens || 0;
                  const outputTokens = log.outputTokens || 0;
                  const totalTokensPerLog = inputTokens + outputTokens;
                  const cost = (inputTokens / 1000000) * 0.10 + (outputTokens / 1000000) * 0.40;
                  const costKRW = cost * exchangeRate;
                  const isExpanded = expandedLog === index;

                  return (
                    <React.Fragment key={index}>
                      <tr
                        className="border-b hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedLogs.has(log.id || log.timestamp)}
                            onChange={() => toggleLogSelection(log.id || log.timestamp)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-2 text-slate-500 font-mono">{logs.length - index}</td>
                        <td className="px-2 py-2 text-slate-700 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('ko-KR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="px-2 py-2 text-slate-900 font-medium">{log.headerTitle || '-'}</td>
                        <td className="px-2 py-2 text-slate-600">{log.headerDescription || '-'}</td>
                        <td className="px-2 py-2 text-center">
                          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {log.viewMode ? viewModeLabels[log.viewMode] || '-' : '-'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right text-slate-900 font-mono">{log.wordCount}</td>
                        <td className="px-2 py-2 text-right text-slate-700 font-mono">{inputTokens.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-slate-700 font-mono">{outputTokens.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-slate-900 font-mono font-semibold">{totalTokensPerLog.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right text-indigo-600 font-mono">
                          ₩{costKRW < 1 ? costKRW.toFixed(2) : Math.round(costKRW).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => loadLogDetail(log.id || log.timestamp, index)}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            disabled={isLoadingDetail && expandedLog === index}
                          >
                            {isLoadingDetail && expandedLog === index ? (
                              <span className="animate-spin">⏳</span>
                            ) : isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={async () => {
                              if (!onLoad) return;
                              try {
                                // API에서 단어 목록 포함한 전체 데이터 가져오기
                                const apiLogId = log.id || log.timestamp;
                                const response = await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/load-log/${encodeURIComponent(apiLogId)}`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${publicAnonKey}`,
                                    },
                                  }
                                );
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.success && data.log) {
                                    onLoad(data.log);
                                  } else {
                                    toast.error('데이터를 불러올 수 없습니다.', { duration: 1500 });
                                  }
                                } else {
                                  toast.error('불러오기 실패', { duration: 1500 });
                                }
                              } catch (error) {
                                console.error('Load error:', error);
                                toast.error('불러오기 중 오류 발생', { duration: 1500 });
                              }
                            }}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Upload size={16} />
                          </button>
                        </td>
                      </tr>
                      
                      {/* 확장된 상세 정보 - 표 형식 */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={13} className="px-6 py-3 bg-slate-50 border-b">
                            {isLoadingDetail ? (
                              <div className="text-center text-gray-500 py-4">
                                단어 목록 불러오는 중...
                              </div>
                            ) : expandedLogData?.vocabularyList && expandedLogData.vocabularyList.length > 0 ? (
                              <>
                                <div className="text-xs text-slate-600 font-semibold mb-2">
                                  생성된 단어 목록 ({expandedLogData.vocabularyList.length}개)
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                  <table className="w-full bg-white border border-slate-200 text-xs">
                                    <thead className="bg-slate-100 sticky top-0">
                                      <tr>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 w-6">#</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[60px]">단어</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[70px]">발음</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 w-10">품사</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[100px]">뜻</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[80px]">동의어</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[80px]">반의어</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[120px]">예문</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[100px]">번역</th>
                                        <th className="px-2 py-2 text-left border-b border-slate-200 min-w-[100px]">어원</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedLogData.vocabularyList.map((word: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                          <td className="px-2 py-2 text-slate-400 font-mono">{idx + 1}</td>
                                          <td className="px-2 py-2 text-slate-900 font-semibold min-w-[60px]">{word.word || '-'}</td>
                                          <td className="px-2 py-2 text-slate-600 min-w-[70px]">{word.pronunciation || '-'}</td>
                                          <td className="px-2 py-2">
                                            {word.partOfSpeech ? (
                                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{word.partOfSpeech}</span>
                                            ) : '-'}
                                          </td>
                                          <td className="px-2 py-2 text-slate-700 min-w-[100px]">{word.meaning || '-'}</td>
                                          <td className="px-2 py-2 text-slate-600 min-w-[80px]">
                                            {word.synonyms && Array.isArray(word.synonyms) && word.synonyms.length > 0 
                                              ? word.synonyms.join(', ') 
                                              : word.synonyms || '-'}
                                          </td>
                                          <td className="px-2 py-2 text-slate-600 min-w-[80px]">
                                            {word.antonyms && Array.isArray(word.antonyms) && word.antonyms.length > 0 
                                              ? word.antonyms.join(', ') 
                                              : word.antonyms || '-'}
                                          </td>
                                          <td className="px-2 py-2 text-slate-600 min-w-[120px]">{word.example || '-'}</td>
                                          <td className="px-2 py-2 text-slate-600 min-w-[100px]">{word.translation || '-'}</td>
                                          <td className="px-2 py-2 text-slate-500 min-w-[100px]">{word.etymology || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-slate-500 py-4 text-center">
                                단어 목록이 저장되지 않았습니다. (이전 버전의 로그일 수 있습니다)
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* 더 불러오기 버튼 */}
            {hasMore && !isLoading && logs.length > 0 && (
              <div className="flex justify-center py-4 border-t">
                <Button onClick={loadMore} variant="outline" size="sm">
                  더 불러오기 ({logs.length}개 로드됨)
                </Button>
              </div>
            )}
            {isLoading && logs.length > 0 && (
              <div className="text-center text-gray-500 py-4 border-t">
                로딩 중...
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* 마이그레이션 다이얼로그 */}
      <Dialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>제제보카 선물 단어장으로 업로드</DialogTitle>
            <DialogDescription>
              선택한 {selectedLogs.size}개의 단어장을 제제보카 프리셋으로 업로드합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              {isLoadingCategories ? (
                <div className="text-sm text-gray-500 py-2">카테고리 로딩 중...</div>
              ) : (
                <Select
                  value={migrateCategory}
                  onValueChange={setMigrateCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {jejevocaCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">난이도</Label>
              <Select
                value={migrateDifficulty}
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setMigrateDifficulty(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">초급 (Beginner)</SelectItem>
                  <SelectItem value="intermediate">중급 (Intermediate)</SelectItem>
                  <SelectItem value="advanced">고급 (Advanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleMigrate}
                disabled={isMigrating || !migrateCategory.trim() || isLoadingCategories}
                className="flex-1"
              >
                {isMigrating ? '업로드 중...' : '제제보카로 업로드'}
              </Button>
              <Button
                onClick={() => setShowMigrateDialog(false)}
                variant="outline"
                disabled={isMigrating}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}