import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { RotateCcw, Maximize2, Minimize2, Settings, RefreshCw } from 'lucide-react';
import type { QuestionItem, HeaderInfo, ExplanationData } from '../types/question';
import { DEFAULT_PROMPTS, PROMPT_LABELS, PROMPT_VARIABLES, setCustomPrompts } from '../services/geminiExplanation';

// AI 제공자 타입
type AIProvider = 'gemini' | 'openai' | 'claude';

// AI 설정 인터페이스
interface AISettings {
  provider: AIProvider;
  model: string;
  apiKeys: {
    gemini: string;
    openai: string;
    claude: string;
  };
}

// AI 제공자별 모델 목록 (2025년 12월 기준)
// 비용: 입력/출력 per 1M tokens (USD)
const AI_MODELS: Record<AIProvider, { value: string; label: string; cost: string }[]> = {
  gemini: [
    { value: 'gemini-3-flash', label: 'Gemini 3 Flash (최신)', cost: '무료~$0.15/$0.60' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (추천)', cost: '$1.25/$10.00' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', cost: '$0.15/$0.60' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', cost: '$0.075/$0.30' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', cost: '무료~$0.10/$0.40' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', cost: '$1.25/$5.00' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', cost: '$0.075/$0.30' },
  ],
  openai: [
    { value: 'gpt-5.2', label: 'GPT-5.2 (최신)', cost: '$5.00/$20.00' },
    { value: 'gpt-5.1', label: 'GPT-5.1', cost: '$4.00/$16.00' },
    { value: 'gpt-5', label: 'GPT-5 (추천)', cost: '$3.00/$12.00' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini', cost: '$0.50/$2.00' },
    { value: 'gpt-5-nano', label: 'GPT-5 Nano', cost: '$0.15/$0.60' },
    { value: 'gpt-4o', label: 'GPT-4o', cost: '$2.50/$10.00' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', cost: '$0.15/$0.60' },
    { value: 'gpt-4.1', label: 'GPT-4.1', cost: '$2.00/$8.00' },
    { value: 'o3-mini', label: 'o3 Mini (추론)', cost: '$1.10/$4.40' },
  ],
  claude: [
    { value: 'claude-opus-4-5', label: 'Claude Opus 4.5 (최신)', cost: '$5.00/$25.00' },
    { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1', cost: '$15.00/$75.00' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (추천)', cost: '$3.00/$15.00' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', cost: '$3.00/$15.00' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', cost: '$0.80/$4.00' },
  ],
};

const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  gemini: '🟡 Gemini (Google)',
  openai: '🟢 ChatGPT (OpenAI)',
  claude: '🟠 Claude (Anthropic)',
};

// 환경 변수에서 API 키 불러오기
const ENV_API_KEYS = {
  gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
  openai: import.meta.env.VITE_OPENAI_API_KEY || '',
  claude: import.meta.env.VITE_CLAUDE_API_KEY || '',
};

// 기본 AI 설정
const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  apiKeys: ENV_API_KEYS,
};

// AI 설정을 localStorage에서 불러오기
const loadAISettings = (): AISettings => {
  const saved = localStorage.getItem('ai-settings');
  if (saved) {
    try {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_AI_SETTINGS;
    }
  }
  return DEFAULT_AI_SETTINGS;
};

// AI 설정을 localStorage에 저장
const saveAISettings = (settings: AISettings) => {
  localStorage.setItem('ai-settings', JSON.stringify(settings));
};

// 현재 AI 설정 내보내기 (다른 컴포넌트에서 사용)
export const getAISettings = loadAISettings;

interface QuestionInputProps {
  onSave: (data: QuestionItem[]) => void;
  data: QuestionItem[];
  headerInfo: HeaderInfo;
  onHeaderChange: (info: HeaderInfo) => void;
  onGenerateExplanations?: (questions: QuestionItem[]) => void;
  onGenerateVocabulary?: (questions: QuestionItem[]) => void;
  isGenerating?: boolean;
  isGeneratingVocabulary?: boolean;
  explanations?: Map<string, ExplanationData>;
  generationProgress?: { current: number; total: number };
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onRegenerateQuestion?: (questionId: string) => void;
  regeneratingIds?: Set<string>;
}

// 셀 데이터 인터페이스 (그리드용)
interface CellData {
  id: string;
  year: string;
  questionNumber: string;
  categoryMain: string;
  categorySub: string;
  instruction: string;
  passage: string;
  choice1: string;
  choice2: string;
  choice3: string;
  choice4: string;
  choice5: string;
  answer: string;
  hint: string;
  explanation: string;
}

// 컬럼 정의 (해설 열 제외 - 힌트까지만 표시)
const columns: (keyof CellData)[] = [
  'id', 'year', 'questionNumber', 'categoryMain', 'categorySub',
  'instruction', 'passage', 'choice1', 'choice2', 'choice3', 'choice4', 'choice5', 'answer', 'hint'
];

const columnLabels: { [key in keyof CellData]: string } = {
  id: '고유번호',
  year: '연도',
  questionNumber: '번호',
  categoryMain: '대분류',
  categorySub: '소분류',
  instruction: '발문',
  passage: '지문',
  choice1: '1',
  choice2: '2',
  choice3: '3',
  choice4: '4',
  choice5: '5',
  answer: '정답',
  hint: '힌트',
  explanation: '해설'
};

const columnWidths: { [key in keyof CellData]: string } = {
  id: '100px',
  year: '60px',
  questionNumber: '50px',
  categoryMain: '80px',
  categorySub: '80px',
  instruction: '200px',
  passage: '300px',
  choice1: '100px',
  choice2: '100px',
  choice3: '100px',
  choice4: '100px',
  choice5: '100px',
  answer: '50px',
  hint: '150px',
  explanation: '250px'
};

// 빈 행 생성
const createEmptyRow = (): CellData => ({
  id: '',
  year: '',
  questionNumber: '',
  categoryMain: '',
  categorySub: '',
  instruction: '',
  passage: '',
  choice1: '',
  choice2: '',
  choice3: '',
  choice4: '',
  choice5: '',
  answer: '',
  hint: '',
  explanation: ''
});

// QuestionItem을 CellData로 변환
const convertToCellData = (items: QuestionItem[]): CellData[] => {
  return items.map(item => ({
    id: item.id,
    year: String(item.year),
    questionNumber: String(item.questionNumber),
    categoryMain: item.categoryMain,
    categorySub: item.categorySub,
    instruction: item.instruction,
    passage: item.passage,
    choice1: item.choices[0] || '',
    choice2: item.choices[1] || '',
    choice3: item.choices[2] || '',
    choice4: item.choices[3] || '',
    choice5: item.choices[4] || '',
    answer: item.answer,
    hint: item.hint || '',
    explanation: item.explanation || ''
  }));
};

// CellData를 QuestionItem으로 변환
const convertToQuestionItem = (cells: CellData[]): QuestionItem[] => {
  return cells
    .filter(cell => cell.id || cell.passage || cell.instruction) // 최소한 하나는 있어야 함
    .map(cell => ({
      id: cell.id,
      year: parseInt(cell.year) || 0,
      questionNumber: parseInt(cell.questionNumber) || 0,
      categoryMain: cell.categoryMain,
      categorySub: cell.categorySub,
      instruction: cell.instruction,
      passage: cell.passage,
      choices: [cell.choice1, cell.choice2, cell.choice3, cell.choice4, cell.choice5],
      answer: cell.answer,
      hint: cell.hint || undefined,
      explanation: cell.explanation || undefined
    }));
};

export function QuestionInput({ onSave, data, headerInfo, onHeaderChange, onGenerateExplanations, onGenerateVocabulary, isGenerating, isGeneratingVocabulary, explanations, generationProgress, isExpanded, onToggleExpand, onRegenerateQuestion, regeneratingIds }: QuestionInputProps) {
  const [rows, setRows] = useState<CellData[]>(() => {
    if (data && data.length > 0) {
      return convertToCellData(data);
    }
    return Array(5).fill(null).map(() => createEmptyRow());
  });

  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // 프롬프트 편집 상태
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState<string>('vocabulary');
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>(() => {
    // localStorage에서 저장된 프롬프트 불러오기
    const saved = localStorage.getItem('custom-prompts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomPrompts(parsed);
        return parsed;
      } catch {
        return {};
      }
    }
    return {};
  });

  // AI 설정 상태
  const [aiSettings, setAiSettings] = useState<AISettings>(loadAISettings);
  const [settingsTab, setSettingsTab] = useState<'ai' | 'prompts'>('ai');

  // AI 설정 변경 핸들러
  const handleAISettingsChange = (newSettings: Partial<AISettings>) => {
    const updated = { ...aiSettings, ...newSettings };
    setAiSettings(updated);
    saveAISettings(updated);
  };

  // AI 제공자 변경 시 기본 모델도 변경
  const handleProviderChange = (provider: AIProvider) => {
    const defaultModel = AI_MODELS[provider][0].value;
    handleAISettingsChange({ provider, model: defaultModel });
  };

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});
  const tableRef = useRef<HTMLDivElement>(null);

  // 내부 변경인지 외부 변경인지 구분하기 위한 ref
  const isInternalChange = useRef(false);

  // data prop 변경 시 rows 업데이트 (외부에서 변경된 경우만)
  useEffect(() => {
    if (!isInternalChange.current && data && data.length > 0) {
      setRows(convertToCellData(data));
    }
    isInternalChange.current = false;
  }, [data]);

  // rows 변경 시 부모에게 알림 (내부 변경 플래그 설정)
  const saveToParent = (newRows: CellData[]) => {
    isInternalChange.current = true;
    const questionItems = convertToQuestionItem(newRows);
    onSave(questionItems);
  };

  // 행 추가
  const addRow = () => {
    const newRows = [...rows, createEmptyRow()];
    setRows(newRows);
    saveToParent(newRows);
  };

  // 행 삭제
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
      saveToParent(newRows);
    }
  };

  // 정답 번호 변환 (①→1, ②→2, ...)
  const convertAnswerToNumber = (value: string): string => {
    const circleToNum: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
    const trimmed = value.trim();
    return circleToNum[trimmed] || trimmed;
  };

  // 셀 값 변경
  const updateCell = (rowIndex: number, column: keyof CellData, value: string) => {
    const newRows = [...rows];
    // 정답 컬럼이면 동그라미를 숫자로 변환
    newRows[rowIndex][column] = column === 'answer' ? convertAnswerToNumber(value) : value;
    setRows(newRows);
    saveToParent(newRows);
  };

  // 셀 포커스 이동
  const moveFocus = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const element = inputRefs.current[key];
    if (element) {
      element.focus();
      setFocusedCell({ row: rowIndex, col: colIndex });
    }
  };

  // 키보드 이벤트 처리 (방향키 + Tab + Enter)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, rowIndex: number, colIndex: number) => {
    const isTextarea = e.currentTarget.tagName === 'TEXTAREA';

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          moveFocus(rowIndex - 1, colIndex);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < rows.length - 1) {
          moveFocus(rowIndex + 1, colIndex);
        } else {
          // 마지막 행이면 새 행 추가
          addRow();
          setTimeout(() => moveFocus(rowIndex + 1, colIndex), 0);
        }
        break;

      case 'ArrowLeft':
        // textarea가 아닐 때만, 또는 커서가 맨 앞일 때만
        if (!isTextarea || (e.currentTarget as HTMLInputElement).selectionStart === 0) {
          if (colIndex > 0) {
            e.preventDefault();
            moveFocus(rowIndex, colIndex - 1);
          }
        }
        break;

      case 'ArrowRight':
        // textarea가 아닐 때만, 또는 커서가 맨 뒤일 때만
        const inputEl = e.currentTarget as HTMLInputElement;
        if (!isTextarea || inputEl.selectionStart === inputEl.value.length) {
          if (colIndex < columns.length - 1) {
            e.preventDefault();
            moveFocus(rowIndex, colIndex + 1);
          }
        }
        break;

      case 'Enter':
        if (!isTextarea || e.shiftKey) {
          e.preventDefault();
          if (rowIndex < rows.length - 1) {
            moveFocus(rowIndex + 1, colIndex);
          } else {
            addRow();
            setTimeout(() => moveFocus(rowIndex + 1, colIndex), 0);
          }
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: 이전 셀
          if (colIndex > 0) {
            moveFocus(rowIndex, colIndex - 1);
          } else if (rowIndex > 0) {
            moveFocus(rowIndex - 1, columns.length - 1);
          }
        } else {
          // Tab: 다음 셀
          if (colIndex < columns.length - 1) {
            moveFocus(rowIndex, colIndex + 1);
          } else if (rowIndex < rows.length - 1) {
            moveFocus(rowIndex + 1, 0);
          } else {
            addRow();
            setTimeout(() => moveFocus(rowIndex + 1, 0), 0);
          }
        }
        break;
    }
  };

  // TSV/CSV 파싱 (셀 내부 줄바꿈 처리)
  // 엑셀/넘버스에서 셀 내부에 줄바꿈이 있으면 해당 셀을 따옴표로 감싸서 복사함
  const parseTsvWithQuotes = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (insideQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // 이스케이프된 따옴표 ("")
            currentCell += '"';
            i++; // 다음 따옴표 건너뛰기
          } else {
            // 따옴표 영역 종료
            insideQuotes = false;
          }
        } else {
          // 따옴표 내부의 모든 문자 (줄바꿈 포함)
          currentCell += char;
        }
      } else {
        if (char === '"') {
          // 따옴표 영역 시작
          insideQuotes = true;
        } else if (char === '\t') {
          // 탭: 셀 구분
          currentRow.push(currentCell);
          currentCell = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          // 줄바꿈: 행 구분
          currentRow.push(currentCell);
          if (currentRow.some(cell => cell.trim() !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
          if (char === '\r') i++; // \r\n인 경우 \n 건너뛰기
        } else if (char === '\r') {
          // 단독 \r도 줄바꿈으로 처리
          currentRow.push(currentCell);
          if (currentRow.some(cell => cell.trim() !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    // 마지막 셀과 행 처리
    currentRow.push(currentCell);
    if (currentRow.some(cell => cell.trim() !== '')) {
      rows.push(currentRow);
    }

    return rows;
  };

  // HTML을 마크다운으로 변환 (굵게, 밑줄 서식 유지)
  const convertHtmlToMarkdown = (html: string): string => {
    // DOMParser로 HTML 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 재귀적으로 노드를 마크다운으로 변환
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(node.childNodes).map(processNode).join('');

        // 굵게 + 밑줄
        const isBold = tagName === 'b' || tagName === 'strong' ||
                       element.style?.fontWeight === 'bold' ||
                       parseInt(element.style?.fontWeight || '0') >= 700;
        const isUnderline = tagName === 'u' ||
                           element.style?.textDecoration?.includes('underline');

        if (isBold && isUnderline) {
          return `***${children}***`;
        } else if (isBold) {
          return `**${children}**`;
        } else if (isUnderline) {
          return `_${children}_`;
        }

        // 이탤릭
        if (tagName === 'i' || tagName === 'em') {
          return `*${children}*`;
        }

        // 테이블 셀
        if (tagName === 'td' || tagName === 'th') {
          return children + '\t';
        }

        // 테이블 행
        if (tagName === 'tr') {
          return children.replace(/\t$/, '') + '\n';
        }

        return children;
      }

      return '';
    };

    // body 내용 처리
    const result = processNode(doc.body);
    return result.trim();
  };

  // 붙여넣기 처리 (엑셀에서 복사한 데이터)
  const handlePaste = (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, startRow: number, startCol: number) => {
    e.preventDefault();

    const plainData = e.clipboardData.getData('text');
    const htmlData = e.clipboardData.getData('text/html');

    // 기본적으로 plain text 사용
    let pastedData = plainData;

    // HTML이 있고, 테이블이 아닌 단일 셀 데이터인 경우만 서식 변환 시도
    // (탭이 없으면 단일 셀로 간주)
    if (htmlData && !plainData.includes('\t') && htmlData.includes('<')) {
      const converted = convertHtmlToMarkdown(htmlData);
      // 변환 결과에 탭이 없으면 (테이블 구조가 아니면) 사용
      if (!converted.includes('\t') || converted.split('\t').length <= 2) {
        pastedData = converted;
      }
    }

    // 탭이 없으면 단일 셀로 취급 (넘버스에서 셀 내부 줄바꿈이 있는 경우)
    const hasTab = pastedData.includes('\t');
    let pastedRows: string[][];
    let dataStartIndex = 0;

    if (!hasTab) {
      // 탭이 없으면 전체를 하나의 셀로 처리 (줄바꿈 유지)
      pastedRows = [[pastedData.trim()]];
      // 단일 셀 붙여넣기는 헤더 감지 하지 않음
    } else {
      // 탭이 있으면 TSV로 파싱
      pastedRows = parseTsvWithQuotes(pastedData);

      // 헤더 행 감지 (첫 줄에 '고유번호', '연도' 등이 있으면 헤더로 판단)
      const firstRow = pastedRows[0]?.join(' ').toLowerCase() || '';
      const hasHeader = firstRow.includes('고유번호') || firstRow.includes('연도') || firstRow.includes('id');
      dataStartIndex = hasHeader ? 1 : 0;
    }

    if (pastedRows.length === 0) return;

    const newRows = [...rows];

    pastedRows.slice(dataStartIndex).forEach((cells, rowOffset) => {
      const targetRow = startRow + rowOffset;

      // 필요하면 행 추가
      while (newRows.length <= targetRow) {
        newRows.push(createEmptyRow());
      }

      cells.forEach((cell, colOffset) => {
        const targetCol = startCol + colOffset;
        if (targetCol < columns.length) {
          const colName = columns[targetCol];
          // 정답 컬럼이면 동그라미를 숫자로 변환
          newRows[targetRow][colName] = colName === 'answer' ? convertAnswerToNumber(cell.trim()) : cell.trim();
        }
      });
    });

    setRows(newRows);
    saveToParent(newRows);
    toast.success(`${pastedRows.length - dataStartIndex}개 행 붙여넣기 완료`, { duration: 1000 });
  };

  // 전체 비우기
  const clearAll = () => {
    const newRows = Array(5).fill(null).map(() => createEmptyRow());
    setRows(newRows);
    saveToParent(newRows);
    toast.success('모든 데이터가 비워졌습니다', { duration: 1000 });
  };

  // 긴 텍스트 컬럼인지 확인
  const isLongTextColumn = (col: keyof CellData) => {
    return col === 'instruction' || col === 'passage' || col === 'hint' || col === 'explanation';
  };

  return (
    <div className="flex flex-col h-full">
      {/* 제목/설명 입력 */}
      <div className="mb-4 flex-shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="headerTitle" className="whitespace-nowrap text-xs text-slate-700">
            제목
          </Label>
          <Input
            id="headerTitle"
            value={headerInfo.headerTitle}
            onChange={(e) => onHeaderChange({ ...headerInfo, headerTitle: e.target.value })}
            placeholder="예: 2025 동국대 편입 기출"
            className="bg-white flex-1 text-sm border-gray-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="headerDescription" className="text-slate-600 whitespace-nowrap text-xs">
            설명
          </Label>
          <Input
            id="headerDescription"
            value={headerInfo.headerDescription}
            onChange={(e) => onHeaderChange({ ...headerInfo, headerDescription: e.target.value })}
            placeholder="예: 어휘/문법/논리 40문항"
            className="bg-white border-gray-300 flex-1 text-sm"
          />
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="mb-2 flex gap-2 flex-shrink-0">
        <Button onClick={addRow} variant="outline" size="sm">
          + 행 추가
        </Button>
        <Button onClick={clearAll} variant="outline" size="sm">
          전체 비우기
        </Button>
        {onToggleExpand && (
          <Button
            onClick={onToggleExpand}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            title={isExpanded ? '사이드바 축소' : '사이드바 확장'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isExpanded ? '축소' : '확장'}
          </Button>
        )}
        <span className="text-xs text-slate-500 self-center ml-auto">
          엑셀에서 복사 후 붙여넣기 가능 · 방향키로 셀 이동
        </span>
      </div>

      {/* 엑셀 그리드 */}
      <div
        ref={tableRef}
        className="border border-gray-300 rounded flex-1"
        style={{ minHeight: '300px', overflow: 'auto' }}
      >
        <table style={{ minWidth: '2000px', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th
                className="border border-gray-300 px-2 py-2 text-xs w-10"
                style={{ position: 'sticky', left: 0, top: 0, zIndex: 30, backgroundColor: '#f3f4f6' }}
              >#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border border-gray-300 px-2 py-2 text-xs whitespace-nowrap"
                  style={{ minWidth: columnWidths[col], width: columnWidths[col], position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 20 }}
                >
                  {columnLabels[col]}
                </th>
              ))}
              <th className="border border-gray-300 px-2 py-2 text-xs w-20" style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 20 }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={focusedCell?.row === rowIndex ? 'bg-blue-50' : ''}>
                <td
                  className="border border-gray-300 px-2 py-1 text-xs text-center"
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    backgroundColor: focusedCell?.row === rowIndex ? '#eff6ff' : '#f9fafb'
                  }}
                >
                  {rowIndex + 1}
                </td>
                {columns.map((col, colIndex) => (
                  <td
                    key={col}
                    className={`border border-gray-300 p-0 ${
                      focusedCell?.row === rowIndex && focusedCell?.col === colIndex
                        ? 'ring-2 ring-blue-500 ring-inset'
                        : ''
                    }`}
                  >
                    {isLongTextColumn(col) ? (
                      <textarea
                        ref={(el) => {
                          inputRefs.current[`${rowIndex}-${colIndex}`] = el;
                        }}
                        value={row[col]}
                        onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                        onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                        className="w-full px-2 py-1.5 text-xs border-0 focus:outline-none resize-none"
                        style={{ minWidth: columnWidths[col], minHeight: '60px' }}
                        rows={3}
                      />
                    ) : (
                      <input
                        ref={(el) => {
                          inputRefs.current[`${rowIndex}-${colIndex}`] = el;
                        }}
                        type="text"
                        value={row[col]}
                        onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                        onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                        className="w-full px-2 py-1.5 text-xs border-0 focus:outline-none"
                        style={{ minWidth: columnWidths[col] }}
                      />
                    )}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-1 text-center bg-gray-50">
                  <div className="flex items-center justify-center gap-1">
                    {/* 새로고침 버튼 - 해설 재생성 */}
                    {onRegenerateQuestion && row.id && (
                      <button
                        onClick={() => onRegenerateQuestion(row.id)}
                        className={`p-1 rounded transition-colors ${
                          regeneratingIds?.has(row.id)
                            ? 'bg-blue-100 text-blue-600 cursor-wait'
                            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'
                        }`}
                        disabled={regeneratingIds?.has(row.id)}
                        title={regeneratingIds?.has(row.id) ? "재생성 중..." : "이 문제 해설 재생성"}
                      >
                        <RefreshCw size={14} className={regeneratingIds?.has(row.id) ? 'animate-spin' : ''} />
                      </button>
                    )}
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="text-red-500 hover:text-red-700 text-xs p-1"
                      disabled={rows.length === 1}
                      title="행 삭제"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 안내 */}
      <div className="mt-3 text-xs text-slate-500 flex-shrink-0">
        <p>💡 팁: 엑셀에서 데이터를 복사(Ctrl+C)한 후 첫 번째 셀에 붙여넣기(Ctrl+V)하면 자동으로 채워집니다.</p>
      </div>

      {/* AI 생성 섹션 */}
      {(onGenerateExplanations || onGenerateVocabulary) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI 설정 버튼 */}
            <Button
              onClick={() => {
                setSettingsTab('ai');
                setIsPromptEditorOpen(true);
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Settings size={14} />
              AI 설정
            </Button>
            {/* AI 해설 생성 버튼 */}
            {onGenerateExplanations && (
              <Button
                onClick={() => {
                  const questions = convertToQuestionItem(rows);
                  if (questions.length === 0) {
                    toast.error('문제 데이터가 없습니다', { duration: 1000 });
                    return;
                  }
                  onGenerateExplanations(questions);
                }}
                disabled={isGenerating || rows.every(r => !r.id && !r.passage)}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    해설 생성 중...
                  </>
                ) : (
                  <>
                    🤖 해설 생성
                  </>
                )}
              </Button>
            )}
            {/* 단어장 생성 버튼 */}
            {onGenerateVocabulary && (
              <Button
                onClick={() => {
                  const questions = convertToQuestionItem(rows);
                  if (questions.length === 0) {
                    toast.error('문제 데이터가 없습니다', { duration: 1000 });
                    return;
                  }
                  onGenerateVocabulary(questions);
                }}
                disabled={isGeneratingVocabulary || rows.every(r => !r.id && !r.passage)}
                variant="outline"
                className="border-slate-300"
              >
                {isGeneratingVocabulary ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    단어장 생성 중...
                  </>
                ) : (
                  <>
                    📚 단어장 생성
                  </>
                )}
              </Button>
            )}
            {/* 해설 개수 표시 */}
            {explanations && explanations.size > 0 && (
              <span className="text-xs text-green-600 ml-2">
                ({explanations.size}개 해설)
              </span>
            )}
          </div>

          {/* 프로그레스바 */}
          {isGenerating && generationProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>해설 생성 중...</span>
                <span>{generationProgress.current} / {generationProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-slate-800 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* AI 설정 팝업 */}
      <Dialog open={isPromptEditorOpen} onOpenChange={setIsPromptEditorOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>AI 설정</DialogTitle>
            <DialogDescription>
              AI 제공자, 모델, API 키를 설정하고 프롬프트를 커스터마이징할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {/* 메인 탭 선택 */}
          <div className="flex gap-2 border-b border-gray-200 pb-3">
            <button
              onClick={() => setSettingsTab('ai')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                settingsTab === 'ai'
                  ? 'bg-slate-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🤖 AI 설정
            </button>
            <button
              onClick={() => setSettingsTab('prompts')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                settingsTab === 'prompts'
                  ? 'bg-slate-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📝 프롬프트 설정
              {Object.keys(editedPrompts).length > 0 && (
                <span className="ml-1 text-purple-300">•</span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {/* AI 설정 탭 */}
            {settingsTab === 'ai' && (
              <div className="space-y-6 p-2" style={{ height: 'calc(95vh - 180px)' }}>
                {/* AI 제공자 선택 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700">AI 제공자 선택</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(AI_PROVIDER_LABELS) as AIProvider[]).map((provider) => (
                      <button
                        key={provider}
                        onClick={() => handleProviderChange(provider)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          aiSettings.provider === provider
                            ? 'border-slate-800 bg-slate-800 text-white shadow-lg'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`font-medium ${aiSettings.provider === provider ? 'text-white' : 'text-gray-800'}`}>{AI_PROVIDER_LABELS[provider]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 모델 선택 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700">모델 선택</Label>
                  <p className="text-xs text-gray-500 -mt-1">비용: 입력/출력 (1M 토큰당, USD)</p>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {AI_MODELS[aiSettings.provider].map((model) => (
                      <button
                        key={model.value}
                        onClick={() => handleAISettingsChange({ model: model.value })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          aiSettings.model === model.value
                            ? 'border-slate-800 bg-slate-800 text-white shadow-lg'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`font-medium text-sm ${aiSettings.model === model.value ? 'text-white' : 'text-gray-800'}`}>{model.label}</div>
                        <div className={`text-xs mt-0.5 ${aiSettings.model === model.value ? 'text-green-300' : 'text-green-600'}`}>{model.cost}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 현재 설정 요약 */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm font-medium text-slate-700 mb-2">현재 설정</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>• 제공자: <span className="font-medium">{AI_PROVIDER_LABELS[aiSettings.provider]}</span></div>
                    <div>• 모델: <span className="font-mono text-xs">{aiSettings.model}</span></div>
                    <div>• 비용: <span className="text-green-600 font-medium">{AI_MODELS[aiSettings.provider].find(m => m.value === aiSettings.model)?.cost || '-'}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* 프롬프트 설정 탭 */}
            {settingsTab === 'prompts' && (
              <div className="flex flex-col gap-4 p-2" style={{ height: 'calc(95vh - 180px)' }}>
                {/* 유형 선택 탭 */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  {Object.keys(DEFAULT_PROMPTS).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPromptType(key)}
                      className={`px-4 py-2 text-sm rounded-md font-medium transition-colors border-2 ${
                        selectedPromptType === key
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : editedPrompts[key]
                          ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {PROMPT_LABELS[key]}
                      {editedPrompts[key] && ' •'}
                    </button>
                  ))}
                </div>

                {/* 프롬프트 편집 영역 */}
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between shrink-0">
                    <Label className="text-base text-gray-700 font-semibold">
                      {PROMPT_LABELS[selectedPromptType]} 프롬프트
                    </Label>
                    {editedPrompts[selectedPromptType] && (
                      <button
                        onClick={() => {
                          const newPrompts = { ...editedPrompts };
                          delete newPrompts[selectedPromptType];
                          setEditedPrompts(newPrompts);
                          setCustomPrompts(newPrompts);
                          localStorage.setItem('custom-prompts', JSON.stringify(newPrompts));
                          toast.success('기본값으로 초기화됨', { duration: 1000 });
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <RotateCcw size={14} />
                        기본값으로 초기화
                      </button>
                    )}
                  </div>
                  <textarea
                    value={editedPrompts[selectedPromptType] || DEFAULT_PROMPTS[selectedPromptType]}
                    onChange={(e) => {
                      const value = e.target.value;
                      const defaultValue = DEFAULT_PROMPTS[selectedPromptType];

                      const newPrompts = { ...editedPrompts };
                      if (value === defaultValue) {
                        delete newPrompts[selectedPromptType];
                      } else {
                        newPrompts[selectedPromptType] = value;
                      }

                      setEditedPrompts(newPrompts);
                      setCustomPrompts(newPrompts);
                      localStorage.setItem('custom-prompts', JSON.stringify(newPrompts));
                    }}
                    className="flex-1 p-4 text-sm font-mono bg-gray-50 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-slate-500"
                    style={{ minHeight: '500px' }}
                    placeholder="프롬프트를 입력하세요..."
                  />
                  <p className="text-sm text-gray-500 shrink-0">
                    사용 가능한 변수: {(PROMPT_VARIABLES[selectedPromptType] || PROMPT_VARIABLES.default).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
