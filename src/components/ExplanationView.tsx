import { Fragment, memo, useMemo, useState, useCallback, useRef } from 'react';
import { A4PageLayout } from './A4PageLayout';
import { HeaderFooter } from './HeaderFooter';
import { scaledSize } from '../utils/fontScale';
import type {
  QuestionItem,
  HeaderInfo,
  ExplanationData,
  VocabularyExplanation,
  GrammarExplanation,
  LogicExplanation,
  MainIdeaExplanation,
  InsertionExplanation,
  OrderExplanation,
  WordAppropriatenessExplanation,
  ChoiceTranslation,
} from '../types/question';

// ===== 정답 정규화 헬퍼 (①↔1 통합 비교용) =====
const normalizeAnswer = (answer: string): string => {
  const circleToNum: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  if (circleToNum[answer]) return circleToNum[answer];
  if (/^[1-5]$/.test(answer)) return answer;
  return answer;
};

// 정답 비교 (①과 1을 같은 것으로 처리)
const isAnswerMatch = (answer: string, choiceLabel: string): boolean => {
  return normalizeAnswer(answer) === normalizeAnswer(choiceLabel);
};

// 정답 보기 텍스트 추출 (answer 번호에 해당하는 choice)
const getAnswerChoiceText = (answer: string, choices: string[]): string => {
  const answerNum = parseInt(normalizeAnswer(answer));
  if (answerNum >= 1 && answerNum <= 5 && choices[answerNum - 1]) {
    return choices[answerNum - 1];
  }
  return '';
};

// 마크다운 문자(*, **) 제거
const stripMarkdown = (text: string | undefined | null): string => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\*+/g, '');
};

// AI 해설에서 앞에 붙은 번호 및 마크다운 문자 제거
const stripLeadingNumber = (text: string | undefined | null): string => {
  if (!text || typeof text !== 'string') return '';
  // ①, ②, ③, ④, ⑤ 또는 (A), (B) 등으로 시작하는 경우 제거
  // 마크다운 강조 표시(*, **) 제거
  return text
    .replace(/^[①②③④⑤]\s*/, '')
    .replace(/^\([A-E]\)\s*/, '')
    .replace(/\*+/g, '')
    .trim();
};

// ===== 대분류별 문항 수 표 컴포넌트 (한 행에 2유형씩) =====
const CategorySummaryTable = ({ questions }: { questions: QuestionItem[] }) => {
  // 대분류별 문항 수 집계
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      const category = q.categoryMain || '기타';
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const categories = Object.entries(categoryCounts);

  if (categories.length === 0) return null;

  // 2개씩 행으로 묶기
  const rows: [string, number][][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    rows.push(categories.slice(i, i + 2) as [string, number][]);
  }

  return (
    <div className="category-summary-table">
      <table>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map(([category, count]) => (
                <Fragment key={category}>
                  <td className="category-name-cell">{category}</td>
                  <td className="category-count-cell">{count}문항</td>
                </Fragment>
              ))}
              {/* 홀수개일 때 빈 셀 채우기 */}
              {row.length === 1 && (
                <Fragment key="empty">
                  <td className="category-name-cell empty"></td>
                  <td className="category-count-cell empty"></td>
                </Fragment>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ===== 빠른 정답 답안표 컴포넌트 =====
const QuickAnswerTable = ({ questions }: { questions: QuestionItem[] }) => {
  // 세로 5문제씩 그룹화 (01-05, 06-10, 11-15...)
  const rowsPerGroup = 5;
  const maxQuestionNumber = questions.length > 0
    ? Math.max(...questions.map(q => q.questionNumber))
    : 0;
  const numGroups = Math.ceil(maxQuestionNumber / rowsPerGroup); // 열 개수 (5문제 그룹)

  // 정답 번호 추출 (①→1, 1→1 등 통합 처리)
  const getAnswerNumber = (answer: string): string => {
    const circleToNum: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
    if (circleToNum[answer]) return circleToNum[answer];
    // 이미 숫자면 그대로 반환
    if (/^[1-5]$/.test(answer)) return answer;
    return answer;
  };

  return (
    <div className="quick-answer-table">
      <div className="quick-answer-title">Quick Ver.</div>
      <table className="quick-answer-grid vertical">
        <tbody>
          {Array.from({ length: rowsPerGroup }, (_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: numGroups }, (_, groupIdx) => {
                // 세로로 5문제씩: 그룹0(1-5), 그룹1(6-10), 그룹2(11-15)...
                const qNum = groupIdx * rowsPerGroup + rowIdx + 1;
                const question = questions.find(q => q.questionNumber === qNum);
                // 문제 번호가 최대 문제 번호를 초과하면 빈 셀 표시
                if (qNum > maxQuestionNumber) {
                  return (
                    <td key={groupIdx} className="quick-answer-cell vertical" style={{ opacity: 0.3 }}>
                      <span className="quick-answer-num">{String(qNum).padStart(2, '0')}</span>
                      <span className="quick-answer-circle"></span>
                    </td>
                  );
                }
                return (
                  <td key={groupIdx} className="quick-answer-cell vertical">
                    <span className="quick-answer-num">{String(qNum).padStart(2, '0')}</span>
                    <span className="quick-answer-circle">
                      {question ? getAnswerNumber(question.answer) : ''}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ===== 마크다운 마크업 토글 헬퍼 =====
// 선택된 텍스트에 마크업을 추가하거나 제거
const toggleMarkup = (
  text: string,
  selectionStart: number,
  selectionEnd: number,
  markup: string // "**" for bold, "_" for underline
): { newText: string; newStart: number; newEnd: number } => {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const markupLen = markup.length;

  // 이미 마크업이 있는지 확인
  const hasMarkupInside = selected.startsWith(markup) && selected.endsWith(markup) && selected.length >= markupLen * 2;
  const hasMarkupOutside = before.endsWith(markup) && after.startsWith(markup);

  if (hasMarkupInside) {
    // 내부에 마크업이 있으면 제거
    const newSelected = selected.slice(markupLen, -markupLen);
    return {
      newText: before + newSelected + after,
      newStart: selectionStart,
      newEnd: selectionStart + newSelected.length
    };
  } else if (hasMarkupOutside) {
    // 외부에 마크업이 있으면 제거
    const newBefore = before.slice(0, -markupLen);
    const newAfter = after.slice(markupLen);
    return {
      newText: newBefore + selected + newAfter,
      newStart: selectionStart - markupLen,
      newEnd: selectionEnd - markupLen
    };
  } else {
    // 마크업 추가
    return {
      newText: before + markup + selected + markup + after,
      newStart: selectionStart + markupLen,
      newEnd: selectionEnd + markupLen
    };
  }
};

// ===== 범용 편집 가능한 텍스트 컴포넌트 =====
const EditableText = ({
  text,
  onSave,
  className,
  style,
  placeholder,
  multiline = false,
  formatText = false, // true면 마크다운 포맷팅 적용
}: {
  text: string;
  onSave?: (newText: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  formatText?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // onSave가 없으면 편집 불가
  if (!onSave) {
    return (
      <span className={className} style={style}>
        {text || <span className="placeholder-text">{placeholder}</span>}
      </span>
    );
  }

  const handleDoubleClick = () => {
    setEditValue(text);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      return;
    }
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
      return;
    }

    // Cmd+B (굵게) 또는 Cmd+U (밑줄)
    if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'u')) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;

      if (start === end) return; // 선택 영역이 없으면 무시

      const markup = e.key === 'b' ? '**' : '_';
      const result = toggleMarkup(editValue, start, end, markup);

      setEditValue(result.newText);

      // 커서 위치 복원
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(result.newStart, result.newEnd);
        }
      }, 0);
    }
  };

  // 편집 모드에서 단어 더블클릭 시 굵게 토글
  const handleWordDoubleClick = (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.stopPropagation();
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;

    if (start === end) return; // 선택 영역이 없으면 무시

    const result = toggleMarkup(editValue, start, end, '**');
    setEditValue(result.newText);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 0);
  };

  if (isEditing) {
    return (
      <div className="edit-container print:hidden">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onDoubleClick={handleWordDoubleClick}
            className="w-full p-2 text-xs border rounded resize-none"
            style={{ minHeight: '60px', fontSize: scaledSize(10), lineHeight: 1.5 }}
            autoFocus
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onDoubleClick={handleWordDoubleClick}
            className="w-full p-1 text-xs border rounded"
            style={{ fontSize: scaledSize(10) }}
            autoFocus
          />
        )}
        <div className="flex gap-1 mt-1">
          <button
            onClick={handleSave}
            className="px-2 py-0.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-700"
          >
            저장
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Cmd+B: 굵게 | Cmd+U: 밑줄 | 단어 더블클릭: 굵게 토글
        </p>
      </div>
    );
  }

  const displayContent = text ? (
    formatText ? formatPassageWithUnderline(text) : text
  ) : (
    <span className="placeholder-text">{placeholder}</span>
  );

  return (
    <span
      className={`${className || ''} cursor-pointer hover:bg-yellow-50 transition-colors`}
      style={style}
      onDoubleClick={handleDoubleClick}
      title="더블클릭하여 편집"
    >
      {displayContent}
    </span>
  );
};

// ===== 편집 가능한 지문 컴포넌트 =====
const EditablePassage = ({
  text,
  onSave,
  className,
  style,
}: {
  text: string;
  onSave?: (newText: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // onSave가 없으면 편집 불가
  if (!onSave) {
    return (
      <p className={className} style={style}>
        {formatPassageWithUnderline(text)}
      </p>
    );
  }

  const handleDoubleClick = () => {
    setEditValue(text);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      return;
    }

    // Cmd+B (굵게) 또는 Cmd+U (밑줄)
    if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'u')) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;

      if (start === end) return; // 선택 영역이 없으면 무시

      const markup = e.key === 'b' ? '**' : '_';
      const result = toggleMarkup(editValue, start, end, markup);

      setEditValue(result.newText);

      // 커서 위치 복원
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(result.newStart, result.newEnd);
        }
      }, 0);
    }
  };

  // 편집 모드에서 단어 더블클릭 시 굵게 토글
  const handleWordDoubleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;

    if (start === end) return; // 선택 영역이 없으면 무시

    const result = toggleMarkup(editValue, start, end, '**');
    setEditValue(result.newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 0);
  };

  if (isEditing) {
    return (
      <div className="passage-edit-container print:hidden">
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onDoubleClick={handleWordDoubleClick}
          className="w-full p-2 text-xs border rounded resize-none"
          style={{ minHeight: '100px', fontSize: scaledSize(10), lineHeight: 1.6 }}
          autoFocus
        />
        <div className="flex gap-1 mt-1">
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs bg-slate-800 text-white rounded hover:bg-slate-700"
          >
            저장
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Cmd+B: 굵게 | Cmd+U: 밑줄 | 단어 더블클릭: 굵게 토글
        </p>
      </div>
    );
  }

  return (
    <p
      className={`${className} cursor-pointer hover:bg-yellow-50 transition-colors`}
      style={style}
      onDoubleClick={handleDoubleClick}
      title="더블클릭하여 편집"
    >
      {formatPassageWithUnderline(text)}
    </p>
  );
};

// ===== 문장 삽입 유형 발문에서 삽입 문장 추출 =====
const extractInsertionSentence = (instruction: string): string | null => {
  if (!instruction) return null;
  const patterns = [
    /(?:다음 문장이 들어갈 위치로 가장 적절한 것은\??)\s*(.+)$/s,
    /(?:주어진 문장이 들어가기에 가장 적절한 곳은\??)\s*(.+)$/s,
    /(?:글의 흐름으로 보아.*?들어가기에 가장 적절한 곳은\??)\s*(.+)$/s,
  ];
  for (const pattern of patterns) {
    const match = instruction.match(pattern);
    if (match && match[1] && match[1].trim().length > 10) {
      return match[1].trim();
    }
  }
  return null;
};

// ===== 지문 포맷팅 함수 (마크다운 스타일 강조) =====
// - ***text*** : 굵게 + 밑줄
// - **text** : 굵게 (bold)
// - _text_ : 밑줄 (underline)
// - __________ : 빈칸
// - insertionSentence : 삽입 문장 (굵게 처리)
const formatPassageWithUnderline = (text: string, insertionSentence?: string | null) => {
  if (!text) return null;

  // 삽입 문장이 있으면 지문에서 해당 문장을 찾아 **로 감싸기
  let processedText = text;
  if (insertionSentence) {
    // 삽입 문장의 처음 30자로 매칭 시도 (지문에 삽입된 문장은 약간 다를 수 있음)
    const searchPrefix = insertionSentence.substring(0, Math.min(30, insertionSentence.length));
    const escapedPrefix = searchPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 해당 문장 시작부터 문장 끝(마침표)까지 찾기
    const sentencePattern = new RegExp(`(${escapedPrefix}[^.]*\\.)`, 'i');
    const match = processedText.match(sentencePattern);
    if (match) {
      // 이미 **로 감싸져 있지 않은 경우만 처리
      if (!processedText.includes(`**${match[1]}**`)) {
        processedText = processedText.replace(match[1], `**${match[1]}**`);
      }
    }
  }

  // 패턴: ***굵게+밑줄***, **굵게**, _밑줄_, 빈칸(5개 이상 언더스코어)
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|_[^_]+_|_{5,})/g;
  const parts = processedText.split(pattern);
  return parts.map((part, idx) => {
    // 빈칸 (5개 이상의 언더스코어)
    if (/^_{5,}$/.test(part)) {
      return (
        <span key={idx} className="inline-block mx-1" style={{
          borderBottom: '1px solid #333',
          minWidth: '80px',
          height: '1.2em'
        }}>
          &nbsp;
        </span>
      );
    }
    // 굵게 + 밑줄 (***text***)
    if (part.startsWith('***') && part.endsWith('***')) {
      const word = part.slice(3, -3);
      return <span key={idx} className="font-bold underline underline-offset-2">{word}</span>;
    }
    // 굵게 (**text**)
    if (part.startsWith('**') && part.endsWith('**')) {
      const word = part.slice(2, -2);
      return <span key={idx} className="font-bold">{word}</span>;
    }
    // 밑줄 (_text_)
    if (part.startsWith('_') && part.endsWith('_')) {
      const word = part.slice(1, -1);
      return <span key={idx} className="underline underline-offset-2">{word}</span>;
    }
    return <span key={idx}>{part}</span>;
  });
};

// ===== 같은 지문을 공유하는 문제들 그룹핑 =====
interface PassageGroup {
  passage: string;
  items: QuestionItem[];
}

// 지문 정규화 (공백, 줄바꿈 등 차이 무시)
const normalizePassage = (passage: string): string => {
  return passage
    .replace(/\s+/g, ' ')  // 모든 공백을 단일 공백으로
    .trim()
    .toLowerCase();
};

// 두 지문이 같은지 비교 (정규화 후 비교)
const isSamePassage = (passage1: string, passage2: string): boolean => {
  return normalizePassage(passage1) === normalizePassage(passage2);
};

const groupByPassage = (items: QuestionItem[]): PassageGroup[] => {
  const groups: PassageGroup[] = [];

  // 세트 문제 처리: passage가 없으면 이전 문제의 passage 상속
  let lastPassage = '';
  const processedItems = items.map(item => {
    if (item.passage && item.passage.trim()) {
      lastPassage = item.passage;
      return item;
    } else if (lastPassage) {
      return { ...item, passage: lastPassage };
    }
    return item;
  });

  // 최대 그룹 크기 (4개까지만 묶음)
  const MAX_GROUP_SIZE = 4;

  processedItems.forEach((item) => {
    const lastGroup = groups[groups.length - 1];

    // 같은 지문이면 그룹에 추가 (연속된 문제만, 정규화 비교) + 최대 그룹 크기 제한
    if (lastGroup && isSamePassage(lastGroup.passage, item.passage) && lastGroup.items.length < MAX_GROUP_SIZE) {
      lastGroup.items.push(item);
    } else {
      // 새 그룹 생성
      groups.push({
        passage: item.passage,
        items: [item]
      });
    }
  });

  return groups;
};

// ===== 유형별 해설 섹션 컴포넌트 =====

// 해설 편집 콜백 타입
type ExplanationEditCallback = (questionId: string, field: string, value: string | { english: string; korean: string }[]) => void;

// ===== 통일된 정답 헤더 컴포넌트 =====
const AnswerHeader = ({
  questionNumber,
  answer,
  answerText,
  answerChange,
  showNumber = true,
  categoryMain,
  categorySub,
}: {
  questionNumber: number;
  answer: string;
  answerText?: string;
  answerChange?: string;
  showNumber?: boolean;
  categoryMain?: string;
  categorySub?: string;
}) => (
  <div className="explanation-answer-header">
    <div className="answer-left">
      {showNumber && <span className="question-num-badge">{questionNumber}</span>}
      <span className="answer-label">정답</span>
      <span className="answer-badge">{normalizeAnswer(answer)}</span>
      {/* 문법: answerChange (원래 → 수정) 표시 */}
      {answerChange && (
        <span className="answer-change">{answerChange}</span>
      )}
      {/* 일반: 정답 보기 텍스트 표시 */}
      {!answerChange && answerText && (
        <span className="answer-text">{answerText}</span>
      )}
    </div>
    <div className="answer-right">
      {categoryMain && (
        <div className="answer-category">
          {categoryMain}{categorySub ? ` | ${categorySub}` : ''}
        </div>
      )}
    </div>
  </div>
);

// 어휘(동의어) 해설
const VocabularySection = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
  isEditMode = false,
}: {
  item: QuestionItem;
  explanation?: VocabularyExplanation;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
  isEditMode?: boolean;
}) => {
  // 정답 단어 추출 (answer는 1~5 숫자)
  const answerNum = Number(item.answer);
  const answerWord = answerNum >= 1 && answerNum <= 5 ? item.choices[answerNum - 1] : '';

  // 밑줄 단어 추출
  const underlinedMatch = item.passage.match(/_([^_]+)_/);
  const underlinedWord = underlinedMatch ? underlinedMatch[1] : '';

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <AnswerHeader
        questionNumber={item.questionNumber}
                answer={item.answer}
        answerText={getAnswerChoiceText(item.answer, item.choices)}
        showNumber={showNumber}
        categoryMain={item.categoryMain}
        categorySub={item.categorySub}
      />

      {/* 동의어 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          동의어 해설 | {underlinedWord}
        </div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.wordExplanation || ''}
            placeholder="AI 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'wordExplanation', newText) : undefined}
          />
        </div>
      </div>

      {/* 동의어 추가 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          동의어 추가 |
        </div>
        {explanation?.synonyms && explanation.synonyms.length > 0 ? (
          <table className="synonym-table">
            <tbody>
              {explanation.synonyms.map((syn, idx) => (
                <tr key={idx}>
                  <td className="synonym-english">
                    <EditableText
                      text={syn.english}
                      onSave={onEdit ? (newText) => {
                        const newSynonyms = [...(explanation.synonyms || [])];
                        newSynonyms[idx] = { ...newSynonyms[idx], english: newText };
                        onEdit(item.id, 'synonyms', newSynonyms);
                      } : undefined}
                    />
                  </td>
                  <td className="synonym-korean">
                    <EditableText
                      text={syn.korean}
                      onSave={onEdit ? (newText) => {
                        const newSynonyms = [...(explanation.synonyms || [])];
                        newSynonyms[idx] = { ...newSynonyms[idx], korean: newText };
                        onEdit(item.id, 'synonyms', newSynonyms);
                      } : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="explanation-block-content">
            <span className="placeholder-text">동의어 목록이 생성되면 여기에 표시됩니다.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 문법 해설
const GrammarSection = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
}: {
  item: QuestionItem;
  explanation?: GrammarExplanation;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
}) => {
  const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <AnswerHeader
        questionNumber={item.questionNumber}
        answer={item.answer}
        answerChange={explanation?.answerChange}
        showNumber={showNumber}
        categoryMain={item.categoryMain}
        categorySub={item.categorySub}
      />

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">정답 해설 |</div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.correctExplanation || ''}
            placeholder="AI 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'correctExplanation', newText) : undefined}
          />
        </div>
      </div>

      {/* 오답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">오답 해설 |</div>
        <div className="explanation-block-content wrong-explanations">
          {explanation?.wrongExplanations && explanation.wrongExplanations.length > 0 ? (
            explanation.wrongExplanations.map((exp, idx) => (
              <div key={idx} className="wrong-item">
                <span className="wrong-label">{labels[idx]}</span>
                <EditableText
                  text={exp || ''}
                  className="wrong-text"
                  formatText={true}
                  onSave={onEdit ? (newText) => {
                    const newWrongExplanations = [...(explanation.wrongExplanations || [])];
                    newWrongExplanations[idx] = newText;
                    onEdit(item.id, 'wrongExplanations', newWrongExplanations as any);
                  } : undefined}
                />
              </div>
            ))
          ) : (
            <span className="placeholder-text">오답 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

// 논리/빈칸 해설
const LogicSection = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
}: {
  item: QuestionItem;
  explanation?: LogicExplanation;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
}) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <AnswerHeader
        questionNumber={item.questionNumber}
        answer={item.answer}
        answerText={getAnswerChoiceText(item.answer, item.choices)}
        showNumber={showNumber}
        categoryMain={item.categoryMain}
        categorySub={item.categorySub}
      />

      {/* 빈칸 타게팅 | */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          빈칸 타게팅 |
        </div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.step1Targeting || ''}
            placeholder="AI 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'step1Targeting', newText) : undefined}
          />
        </div>
      </div>

      {/* Step 2) 근거 확인 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          근거 확인 |
        </div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.step2Evidence || ''}
            placeholder="근거 분석이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'step2Evidence', newText) : undefined}
          />
        </div>
      </div>

      {/* Step 3) 보기 판단 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          보기 판단 |
        </div>
        <div className="explanation-block-content choice-explanations">
          {explanation?.step3Choices && explanation.step3Choices.length > 0 ? (
            explanation.step3Choices.map((exp, idx) => (
              <div key={idx} className={`choice-item ${isAnswerMatch(item.answer, choiceLabels[idx]) ? 'correct' : ''}`}>
                <span className="choice-label">{choiceLabels[idx]}</span>
                <EditableText
                  text={stripLeadingNumber(exp) || ''}
                  className="choice-text"
                  formatText={true}
                  onSave={onEdit ? (newText) => {
                    const newChoices = [...(explanation.step3Choices || [])];
                    newChoices[idx] = newText;
                    onEdit(item.id, 'step3Choices', newChoices as any);
                  } : undefined}
                />
              </div>
            ))
          ) : (
            <span className="placeholder-text">보기 판단이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

// 대의파악 (제목/요지) 해설
const MainIdeaSection = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
}: {
  item: QuestionItem;
  explanation?: MainIdeaExplanation;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
}) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <AnswerHeader
        questionNumber={item.questionNumber}
        answer={item.answer}
        answerText={getAnswerChoiceText(item.answer, item.choices)}
        showNumber={showNumber}
        categoryMain={item.categoryMain}
        categorySub={item.categorySub}
      />

      {/* 지문 분석 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          지문 분석 |
        </div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.passageAnalysis || ''}
            placeholder="AI 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'passageAnalysis', newText) : undefined}
          />
        </div>
      </div>

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          정답 해설 |
        </div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.correctExplanation || ''}
            placeholder="정답 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'correctExplanation', newText) : undefined}
          />
        </div>
      </div>

      {/* 오답 소거 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          오답 소거 |
        </div>
        <div className="explanation-block-content choice-explanations">
          {explanation?.wrongExplanations && explanation.wrongExplanations.length > 0 ? (
            explanation.wrongExplanations.map((exp, idx) => {
              // 정답은 스킵
              if (isAnswerMatch(item.answer, choiceLabels[idx])) return null;
              return (
                <div key={idx} className="choice-item">
                  <span className="choice-label">{choiceLabels[idx]}</span>
                  <EditableText
                    text={stripLeadingNumber(exp) || ''}
                    className="choice-text"
                    formatText={true}
                    onSave={onEdit ? (newText) => {
                      const newWrongExplanations = [...(explanation.wrongExplanations || [])];
                      newWrongExplanations[idx] = newText;
                      onEdit(item.id, 'wrongExplanations', newWrongExplanations as any);
                    } : undefined}
                  />
                </div>
              );
            })
          ) : (
            <span className="placeholder-text">오답 소거가 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

// 정보파악 (삽입) 해설
const InsertionSection = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
}: {
  item: QuestionItem;
  explanation?: InsertionExplanation;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
}) => {
  const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <AnswerHeader
        questionNumber={item.questionNumber}
        answer={item.answer}
        answerText={getAnswerChoiceText(item.answer, item.choices)}
        showNumber={showNumber}
        categoryMain={item.categoryMain}
        categorySub={item.categorySub}
      />

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          정답 해설 |
        </div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.correctExplanation || ''}
            placeholder="AI 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'correctExplanation', newText) : undefined}
          />
        </div>
      </div>

      {/* 각 위치별 설명 */}
      {explanation?.positionExplanations && explanation.positionExplanations.length > 0 && (
        <div className="explanation-block">
          <div className="explanation-block-content position-explanations">
            {explanation.positionExplanations.map((exp, idx) => (
              <div key={idx} className="position-item">
                <span className="position-label">{labels[idx]}</span>
                <EditableText
                  text={exp || ''}
                  className="position-text"
                  formatText={true}
                  onSave={onEdit ? (newText) => {
                    const newPositions = [...(explanation.positionExplanations || [])];
                    newPositions[idx] = newText;
                    onEdit(item.id, 'positionExplanations', newPositions as any);
                  } : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 정보파악 (순서) 해설
const OrderSection = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
}: {
  item: QuestionItem;
  explanation?: OrderExplanation;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
}) => {
  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <AnswerHeader
        questionNumber={item.questionNumber}
        answer={item.answer}
        answerText={getAnswerChoiceText(item.answer, item.choices)}
        showNumber={showNumber}
        categoryMain={item.categoryMain}
        categorySub={item.categorySub}
      />

      {/* 보기의 1열 */}
      <div className="explanation-block">
        <div className="explanation-block-title highlight">보기의 1열 |</div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.firstParagraph || ''}
            placeholder="AI 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'firstParagraph', newText) : undefined}
          />
        </div>
      </div>

      {/* 쪼개는 포인트 */}
      <div className="explanation-block">
        <div className="explanation-block-title highlight">쪼개는 포인트 |</div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.splitPoint || ''}
            placeholder="쪼개는 포인트가 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'splitPoint', newText) : undefined}
          />
        </div>
      </div>

      {/* 결론 */}
      <div className="explanation-block">
        <div className="explanation-block-content conclusion">
          <EditableText
            text={explanation?.conclusion || `따라서 정답은 ${item.answer}번입니다.`}
            placeholder={`따라서 정답은 ${item.answer}번입니다.`}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'conclusion', newText) : undefined}
          />
        </div>
      </div>
    </div>
  );
};

// 어휘 적절성/밑줄 추론 해설
const WordAppropriatenessSection = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
}: {
  item: QuestionItem;
  explanation?: WordAppropriatenessExplanation;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
}) => {
  const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <AnswerHeader
        questionNumber={item.questionNumber}
        answer={item.answer}
        answerText={getAnswerChoiceText(item.answer, item.choices)}
        showNumber={showNumber}
        categoryMain={item.categoryMain}
        categorySub={item.categorySub}
      />

      {/* 핵심 주제 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          핵심 주제 |
        </div>
        <div className="explanation-block-content">
          <EditableText
            text={explanation?.mainTopic || ''}
            placeholder="AI 해설이 생성되면 여기에 표시됩니다."
            multiline={true}
            formatText={true}
            onSave={onEdit ? (newText) => onEdit(item.id, 'mainTopic', newText) : undefined}
          />
        </div>
      </div>

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          정답 해설 |
        </div>
        <div className="explanation-block-content choice-explanations">
          {explanation?.choiceExplanations && explanation.choiceExplanations.length > 0 ? (
            explanation.choiceExplanations.map((exp, idx) => (
              <div key={idx} className="choice-item">
                <span className="choice-label">{labels[idx]}</span>
                <EditableText
                  text={stripLeadingNumber(exp) || ''}
                  className="choice-text"
                  formatText={true}
                  onSave={onEdit ? (newText) => {
                    const newChoices = [...(explanation.choiceExplanations || [])];
                    newChoices[idx] = newText;
                    onEdit(item.id, 'choiceExplanations', newChoices as any);
                  } : undefined}
                />
              </div>
            ))
          ) : (
            <span className="placeholder-text">각 보기별 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== 유형별 해설 섹션 선택 =====
const ExplanationSectionByType = ({
  item,
  explanation,
  showNumber = true,
  onEdit,
  isEditMode = false,
}: {
  item: QuestionItem;
  explanation?: ExplanationData;
  showNumber?: boolean;
  onEdit?: ExplanationEditCallback;
  isEditMode?: boolean;
}): JSX.Element => {
  // explanation.type을 우선 사용 (AI 해설 유형), 없으면 categoryMain fallback
  const explType = explanation?.type;

  if (explType === 'vocabulary') {
    return <VocabularySection item={item} explanation={explanation as VocabularyExplanation} showNumber={showNumber} onEdit={onEdit} isEditMode={isEditMode} />;
  }
  if (explType === 'grammar') {
    return <GrammarSection item={item} explanation={explanation as GrammarExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (explType === 'logic') {
    return <LogicSection item={item} explanation={explanation as LogicExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (explType === 'mainIdea') {
    return <MainIdeaSection item={item} explanation={explanation as MainIdeaExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (explType === 'insertion') {
    return <InsertionSection item={item} explanation={explanation as InsertionExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (explType === 'order') {
    return <OrderSection item={item} explanation={explanation as OrderExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (explType === 'wordAppropriateness') {
    return <WordAppropriatenessSection item={item} explanation={explanation as WordAppropriatenessExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }

  // fallback: categoryMain 기반 분기
  const { categoryMain, categorySub } = item;

  if (categoryMain === '어휘') {
    return <VocabularySection item={item} explanation={explanation as VocabularyExplanation} showNumber={showNumber} onEdit={onEdit} isEditMode={isEditMode} />;
  }
  if (categoryMain === '문법') {
    return <GrammarSection item={item} explanation={explanation as GrammarExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (categoryMain === '논리' || categoryMain === '빈칸') {
    return <LogicSection item={item} explanation={explanation as LogicExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (categoryMain === '대의 파악') {
    return <MainIdeaSection item={item} explanation={explanation as MainIdeaExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }
  if (categoryMain === '정보 파악') {
    if (categorySub === '순서') {
      return <OrderSection item={item} explanation={explanation as OrderExplanation} showNumber={showNumber} onEdit={onEdit} />;
    }
    if (categorySub === '삽입') {
      return <InsertionSection item={item} explanation={explanation as InsertionExplanation} showNumber={showNumber} onEdit={onEdit} />;
    }
    if (categorySub === '어휘 적절성' || categorySub === '밑줄 추론') {
      return <WordAppropriatenessSection item={item} explanation={explanation as WordAppropriatenessExplanation} showNumber={showNumber} onEdit={onEdit} />;
    }
    return <MainIdeaSection item={item} explanation={explanation as MainIdeaExplanation} showNumber={showNumber} onEdit={onEdit} />;
  }

  // 기본 (알 수 없는 유형)
  return <MainIdeaSection item={item} explanation={explanation as MainIdeaExplanation} showNumber={showNumber} onEdit={onEdit} />;
};

// ===== 보기 렌더링 헬퍼 (번역 포함) =====
const renderChoiceWithTranslation = (
  choice: string,
  idx: number,
  answer: string,
  choiceTranslation?: ChoiceTranslation,
  displayMode: 'both' | 'korean' | 'english' = 'both'
) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];
  const isCorrect = isAnswerMatch(answer, choiceLabels[idx]);

  // 번역이 있는 경우
  if (choiceTranslation) {
    return (
      <div
        key={idx}
        className={`question-choice-translated ${isCorrect ? 'correct' : ''}`}
        style={{ fontSize: scaledSize(9.5) }}
      >
        <span className="choice-label">{choiceLabels[idx]}</span>
        {displayMode === 'both' ? (
          // 영어 + 한글 둘 다
          <span className="choice-text">
            <span className="choice-english">{stripLeadingNumber(choice)}</span>
            <span className="choice-korean">{stripLeadingNumber(choiceTranslation.korean)}</span>
          </span>
        ) : displayMode === 'english' ? (
          // 영어만
          <span className="choice-text">
            <span className="choice-english">{stripLeadingNumber(choice)}</span>
          </span>
        ) : (
          // 한글만
          <span className="choice-text">
            <span className="choice-korean-only">{stripLeadingNumber(choiceTranslation.korean)}</span>
          </span>
        )}
      </div>
    );
  }

  // 번역이 없는 경우 (기존 방식)
  return (
    <span
      key={idx}
      className={`question-choice ${isCorrect ? 'correct' : ''}`}
      style={{ fontSize: scaledSize(9.5) }}
    >
      {choiceLabels[idx]} {choice}
    </span>
  );
};

// 보기가 짧은 마커인지 확인 (예: "(A)", "(B)", "A", "B" 등)
// 단어(hasty, ethical 등)는 마커가 아니므로 번역 표시
const isShortMarker = (choice: string): boolean => {
  const trimmed = choice.trim();
  // (A)~(E), A~E 패턴만 마커로 인식
  if (/^\([A-E]\)$/.test(trimmed)) return true;
  if (/^[A-E]$/.test(trimmed)) return true;
  // 3자 이하이고 알파벳/숫자만 있는 경우 (예: "A", "1", "AB")
  if (trimmed.length <= 3 && /^[A-Za-z0-9]+$/.test(trimmed)) return true;
  return false;
};

// ===== 편집 가능한 보기 렌더링 헬퍼 =====
const renderEditableChoice = (
  choice: string,
  idx: number,
  answer: string,
  choiceTranslation?: ChoiceTranslation,
  displayMode: 'both' | 'korean' | 'english' = 'both',
  onSave?: (newChoice: string) => void
) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];
  const isCorrect = isAnswerMatch(answer, choiceLabels[idx]);

  // 짧은 마커(A, B, C 등)인 경우 번역 없이 원문만 표시
  const skipTranslation = isShortMarker(choice);

  return (
    <div
      key={idx}
      className={`question-choice-translated ${isCorrect ? 'correct' : ''}`}
      style={{ fontSize: scaledSize(9.5) }}
    >
      <span className="choice-label">{choiceLabels[idx]}</span>
      <span className="choice-text">
        {displayMode !== 'korean' && (
          <EditableText
            text={stripLeadingNumber(choice)}
            onSave={onSave}
            className="choice-english"
          />
        )}
        {choiceTranslation && displayMode !== 'english' && !skipTranslation && (
          <span className="choice-korean">{stripLeadingNumber(choiceTranslation.korean)}</span>
        )}
      </span>
    </div>
  );
};

// ===== 단일 문제 해설 카드 (지문 1개 + 문제 1개) =====
const SingleExplanationCard = ({
  item,
  explanation,
  choiceDisplayMode = 'both',
  onPassageEdit,
  onExplanationEdit,
  onEnglishPassageEdit,
  onChoiceEdit,
  onInstructionEdit,
  isEditMode = false,
}: {
  item: QuestionItem;
  explanation?: ExplanationData;
  choiceDisplayMode?: 'both' | 'korean' | 'english';
  onPassageEdit?: (questionId: string, newPassage: string) => void;
  onExplanationEdit?: ExplanationEditCallback;
  onEnglishPassageEdit?: (questionId: string, newPassage: string) => void;
  onChoiceEdit?: (questionId: string, choiceIndex: number, newChoice: string) => void;
  onInstructionEdit?: (questionId: string, newInstruction: string) => void;
  isEditMode?: boolean;
}) => {
  // ExplanationData에서 번역 정보 추출
  const passageTranslation = explanation?.passageTranslation;
  const choiceTranslations = explanation?.choiceTranslations;
  const instructionText = explanation?.instructionTranslation || item.instruction;
  const passageSummary = explanation?.passageSummary;

  const handlePassageSave = (newText: string) => {
    if (onPassageEdit) {
      onPassageEdit(item.id, newText);
    }
  };

  const handleEnglishPassageSave = (newText: string) => {
    if (onEnglishPassageEdit) {
      onEnglishPassageEdit(item.id, newText);
    }
  };

  const handleInstructionSave = (newText: string) => {
    if (onInstructionEdit) {
      onInstructionEdit(item.id, newText);
    }
  };

  return (
    <div className="explanation-card">
      {/* 좌측: 문제 */}
      <div className="explanation-question">
        <div className="question-number" style={{ fontSize: scaledSize(18) }}>
          {item.questionNumber}
        </div>
        <div className="question-content">
          {/* 발문 번역 */}
          {instructionText && instructionText.trim() && (
            <EditablePassage
              text={instructionText}
              onSave={onInstructionEdit ? handleInstructionSave : undefined}
              className="instruction-translation"
              style={{ fontSize: scaledSize(9.5), color: '#333', marginBottom: '10px' }}
            />
          )}
          {/* 한글 번역만 표시 (영어 지문 숨김) - 번역 없으면 영어 지문 fallback */}
          {passageTranslation ? (
            <EditablePassage
              text={passageTranslation}
              onSave={handlePassageSave}
              className="question-passage-translation"
              style={{ fontSize: scaledSize(9), lineHeight: 1.6, color: '#333', marginBottom: '8px' }}
            />
          ) : item.passage ? (
            <EditablePassage
              text={item.passage}
              onSave={onEnglishPassageEdit ? handleEnglishPassageSave : undefined}
              className="question-passage"
              style={{ fontSize: scaledSize(9), lineHeight: 1.6, marginBottom: '8px' }}
            />
          ) : null}
          {/* 지문 요약 (분야/중심 소재/주제/요지) - 어휘/문법일 때는 분야/소재/주제/요지 전체 숨김 */}
          {passageSummary && item.categoryMain?.trim() !== '어휘' && item.categoryMain?.trim() !== '문법' && (
            <div className="passage-summary" style={{ marginBottom: '12px' }}>
              <div className="summary-row">
                <span className="summary-label">분야</span>
                <span className="summary-value">{passageSummary.field}</span>
                <span className="summary-divider">|</span>
                <span className="summary-label">소재</span>
                <span className="summary-value">{passageSummary.topic}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">주제</span>
                <span className="summary-value">{passageSummary.subject}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">요지</span>
                <span className="summary-value">{passageSummary.mainIdea}</span>
              </div>
            </div>
          )}
          {/* 보기 - 문법 유형은 보기 숨김 */}
          {item.categoryMain?.trim() !== '문법' && (
            <div className="question-choices" style={{ marginTop: '8px', fontSize: scaledSize(9.5) }}>
              {item.choices.map((choice, idx) => (
                choice && renderEditableChoice(
                  choice,
                  idx,
                  item.answer,
                  choiceTranslations?.[idx],
                  choiceDisplayMode,
                  onChoiceEdit ? (newChoice) => onChoiceEdit(item.id, idx, newChoice) : undefined
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 우측: 해설 */}
      <div className="explanation-content">
        <ExplanationSectionByType
          item={item}
          explanation={explanation}
          showNumber={false}
          onEdit={onExplanationEdit}
          isEditMode={isEditMode}
        />
      </div>
    </div>
  );
};

// ===== 그룹 해설 카드 (지문 1개 + 문제 여러개) =====
const GroupedExplanationCard = ({
  group,
  explanations,
  choiceDisplayMode = 'both',
  onPassageEdit,
  onExplanationEdit,
  onEnglishPassageEdit,
  onChoiceEdit,
  onInstructionEdit,
  isEditMode = false,
}: {
  group: PassageGroup;
  explanations?: Map<string, ExplanationData>;
  choiceDisplayMode?: 'both' | 'korean' | 'english';
  onPassageEdit?: (questionId: string, newPassage: string) => void;
  onExplanationEdit?: ExplanationEditCallback;
  onEnglishPassageEdit?: (questionId: string, newPassage: string) => void;
  onChoiceEdit?: (questionId: string, choiceIndex: number, newChoice: string) => void;
  onInstructionEdit?: (questionId: string, newInstruction: string) => void;
  isEditMode?: boolean;
}) => {
  const firstItem = group.items[0];
  // 첫 번째 문제의 해설에서 지문 번역 가져오기
  const firstExplanation = explanations?.get(firstItem.id);
  const passageTranslation = firstExplanation?.passageTranslation;
  const passageSummary = firstExplanation?.passageSummary;

  // 문제 번호 범위 (예: 15~17)
  const questionNumbers = group.items.map(i => i.questionNumber);
  const minNum = Math.min(...questionNumbers);
  const maxNum = Math.max(...questionNumbers);

  const handlePassageSave = (newText: string) => {
    if (onPassageEdit) {
      onPassageEdit(firstItem.id, newText);
    }
  };

  const handleEnglishPassageSave = (newText: string) => {
    if (onEnglishPassageEdit) {
      onEnglishPassageEdit(firstItem.id, newText);
    }
  };

  return (
    <div className="explanation-card grouped">
      {/* 좌측: 지문 + 모든 문제의 보기 */}
      <div className="explanation-question">
        {/* 문제 번호: 다중 지문일 경우 세로 배치 */}
        {questionNumbers.length > 1 ? (
          <div className="question-number-vertical" style={{ fontSize: scaledSize(18) }}>
            <span>{minNum}</span>
            <span className="number-separator-vertical">~</span>
            <span>{maxNum}</span>
          </div>
        ) : (
          <div className="question-number" style={{ fontSize: scaledSize(18) }}>
            {minNum}
          </div>
        )}
        <div className="question-content">
          {/* 한글 번역만 표시 (영어 지문 숨김) - 번역 없으면 영어 지문 fallback */}
          {passageTranslation ? (
            <EditablePassage
              text={passageTranslation}
              onSave={handlePassageSave}
              className="question-passage-translation"
              style={{ fontSize: scaledSize(9), lineHeight: 1.6, color: '#333', marginBottom: '8px' }}
            />
          ) : firstItem.passage ? (
            <EditablePassage
              text={firstItem.passage}
              onSave={onEnglishPassageEdit ? handleEnglishPassageSave : undefined}
              className="question-passage"
              style={{ fontSize: scaledSize(9), lineHeight: 1.6, marginBottom: '8px' }}
            />
          ) : null}
          {/* 지문 요약 (분야/중심 소재/주제/요지) - 어휘/문법일 때는 전체 숨김 */}
          {passageSummary && firstItem.categoryMain?.trim() !== '어휘' && firstItem.categoryMain?.trim() !== '문법' && (
            <div className="passage-summary" style={{ marginBottom: '12px' }}>
              <div className="summary-row">
                <span className="summary-label">분야</span>
                <span className="summary-value">{passageSummary.field}</span>
                <span className="summary-divider">|</span>
                <span className="summary-label">소재</span>
                <span className="summary-value">{passageSummary.topic}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">주제</span>
                <span className="summary-value">{passageSummary.subject}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">요지</span>
                <span className="summary-value">{passageSummary.mainIdea}</span>
              </div>
            </div>
          )}

          {/* 각 문제의 보기 - 문법 유형은 보기 숨김 */}
          {group.items.map((item) => {
            const itemExplanation = explanations?.get(item.id);
            const choiceTranslations = itemExplanation?.choiceTranslations;
            const instructionText = itemExplanation?.instructionTranslation || item.instruction;
            const isGrammar = item.categoryMain?.trim() === '문법';

            return (
              <div key={item.id} className="grouped-question-choices">
                <div className="grouped-question-header">
                  <span className="grouped-question-num">{item.questionNumber}.</span>
                  <EditableText
                    text={instructionText || ''}
                    onSave={onInstructionEdit ? (newText) => onInstructionEdit(item.id, newText) : undefined}
                    className="grouped-question-instruction"
                  />
                </div>
                {!isGrammar && (
                  <div className="question-choices">
                    {item.choices.map((choice, idx) => (
                      choice && renderEditableChoice(
                        choice,
                        idx,
                        item.answer,
                        choiceTranslations?.[idx],
                        choiceDisplayMode,
                        onChoiceEdit ? (newChoice) => onChoiceEdit(item.id, idx, newChoice) : undefined
                      )
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측: 각 문제의 해설 */}
      <div className="explanation-content">
        {group.items.map((item, idx) => (
          <div key={item.id} className={`grouped-explanation-item ${idx > 0 ? 'mt-4' : ''}`}>
            <ExplanationSectionByType
              item={item}
              explanation={explanations?.get(item.id)}
              showNumber={true}
              onEdit={onExplanationEdit}
              isEditMode={isEditMode}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 메인 ExplanationView 컴포넌트 =====
interface ExplanationViewProps {
  data: QuestionItem[];
  headerInfo: HeaderInfo;
  unitNumber?: number;
  explanations?: Map<string, ExplanationData>;  // questionId -> ExplanationData
  onHeaderChange: (updated: Partial<HeaderInfo>) => void;
  choiceDisplayMode?: 'both' | 'korean' | 'english'; // 보기 표시 설정
  onPassageTranslationEdit?: (questionId: string, newPassage: string) => void; // 지문 번역 편집 콜백
  onExplanationEdit?: ExplanationEditCallback; // 해설 필드 편집 콜백
  onEnglishPassageEdit?: (questionId: string, newPassage: string) => void; // 영어 지문 편집 콜백
  onChoiceEdit?: (questionId: string, choiceIndex: number, newChoice: string) => void; // 보기 편집 콜백
  onInstructionEdit?: (questionId: string, newInstruction: string) => void; // 발문 편집 콜백
  isEditMode?: boolean; // 편집 모드
}

export const ExplanationView = memo(function ExplanationView({
  data,
  headerInfo,
  unitNumber,
  explanations,
  onHeaderChange,
  choiceDisplayMode = 'both',
  onPassageTranslationEdit,
  onExplanationEdit,
  onEnglishPassageEdit,
  onChoiceEdit,
  onInstructionEdit,
  isEditMode = false,
}: ExplanationViewProps) {
  // 같은 지문을 공유하는 문제들 그룹핑
  const groupedQuestions = useMemo(() => groupByPassage(data), [data]);

  // 페이지 children 생성
  const pageChildren = useMemo(() => {
    return groupedQuestions.map((group, idx) => {
      // 단일 문제
      if (group.items.length === 1) {
        return (
          <SingleExplanationCard
            key={group.items[0].id}
            item={group.items[0]}
            explanation={explanations?.get(group.items[0].id)}
            choiceDisplayMode={choiceDisplayMode}
            onPassageEdit={onPassageTranslationEdit}
            onExplanationEdit={onExplanationEdit}
            onEnglishPassageEdit={onEnglishPassageEdit}
            onChoiceEdit={onChoiceEdit}
            onInstructionEdit={onInstructionEdit}
            isEditMode={isEditMode}
          />
        );
      }
      // 그룹 문제 (같은 지문 공유)
      return (
        <GroupedExplanationCard
          key={`group-${idx}`}
          group={group}
          explanations={explanations}
          choiceDisplayMode={choiceDisplayMode}
          onPassageEdit={onPassageTranslationEdit}
          onExplanationEdit={onExplanationEdit}
          onEnglishPassageEdit={onEnglishPassageEdit}
          onChoiceEdit={onChoiceEdit}
          onInstructionEdit={onInstructionEdit}
          isEditMode={isEditMode}
        />
      );
    });
  }, [groupedQuestions, explanations, choiceDisplayMode, onPassageTranslationEdit, onExplanationEdit, onEnglishPassageEdit, onChoiceEdit, onInstructionEdit, isEditMode]);

  // 그룹 문제(2개 이상)의 인덱스 계산 - 전체 페이지 사용
  const fullPageIndices = useMemo(() => {
    return groupedQuestions
      .map((group, idx) => (group.items.length > 1 ? idx : -1))
      .filter(idx => idx !== -1);
  }, [groupedQuestions]);

  return (
    <A4PageLayout
      headerContent={
        <div className="explanation-header">
          <HeaderFooter
            headerInfo={{
              ...headerInfo,
              headerTitle: headerInfo.headerTitle,
            }}
            showFooter={false}
            isEditable={false}
            onHeaderChange={onHeaderChange}
            unitNumber={unitNumber}
            categoryContent={<CategorySummaryTable questions={data} />}
          />
          <QuickAnswerTable questions={data} />
        </div>
      }
      showHeaderOnFirstPageOnly={true}
      fullPageIndices={fullPageIndices}
    >
      {pageChildren}
    </A4PageLayout>
  );
});

export default ExplanationView;
