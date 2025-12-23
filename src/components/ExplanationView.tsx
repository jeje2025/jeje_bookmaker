import { memo, useMemo, useState, useCallback } from 'react';
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

// ===== QUICK VER. 답안표 컴포넌트 =====
const QuickAnswerTable = ({ questions }: { questions: QuestionItem[] }) => {
  // 7열 5행 (35문제) 그리드
  const rows = 5;
  const cols = 7;

  // 정답 번호 추출 (①→1, ②→2, ...)
  const getAnswerNumber = (answer: string): string => {
    const map: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
    return map[answer] || answer;
  };

  return (
    <div className="quick-answer-table">
      <div className="quick-answer-title">QUICK VER.</div>
      <table className="quick-answer-grid">
        <tbody>
          {Array.from({ length: rows }, (_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }, (_, colIdx) => {
                const qNum = rowIdx * cols + colIdx + 1;
                const question = questions.find(q => q.questionNumber === qNum);
                return (
                  <td key={colIdx} className="quick-answer-cell">
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

// ===== 편집 가능한 지문 컴포넌트 =====
const EditablePassage = ({
  text,
  onSave,
  className,
  style,
}: {
  text: string;
  onSave: (newText: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const handleDoubleClick = () => {
    setEditValue(text);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="passage-edit-container print:hidden">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-2 text-xs border rounded resize-none"
          style={{ minHeight: '100px', fontSize: scaledSize(9), lineHeight: 1.6 }}
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
          **굵게** / _밑줄_ / ***굵게+밑줄***
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

// ===== 지문 포맷팅 함수 (마크다운 스타일 강조) =====
// - ***text*** : 굵게 + 밑줄
// - **text** : 굵게 (bold)
// - _text_ : 밑줄 (underline)
// - __________ : 빈칸
const formatPassageWithUnderline = (text: string) => {
  if (!text) return null;
  // 패턴: ***굵게+밑줄***, **굵게**, _밑줄_, 빈칸(5개 이상 언더스코어)
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|_[^_]+_|_{5,})/g;
  const parts = text.split(pattern);
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

const groupByPassage = (items: QuestionItem[]): PassageGroup[] => {
  const groups: PassageGroup[] = [];

  items.forEach((item) => {
    const lastGroup = groups[groups.length - 1];

    // 같은 지문이면 그룹에 추가 (연속된 문제만)
    if (lastGroup && lastGroup.passage === item.passage) {
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

// 어휘(동의어) 해설
const VocabularySection = ({
  item,
  explanation,
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: VocabularyExplanation;
  showNumber?: boolean;
}) => {
  // 정답 단어 추출
  const answerIdx = ['①', '②', '③', '④', '⑤'].indexOf(item.answer);
  const answerWord = answerIdx >= 0 ? item.choices[answerIdx] : '';

  // 밑줄 단어 추출
  const underlinedMatch = item.passage.match(/_([^_]+)_/);
  const underlinedWord = underlinedMatch ? underlinedMatch[1] : '';

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <div className="explanation-answer-header">
        {showNumber && <span className="question-num-badge">{item.questionNumber}</span>}
        <span className="answer-badge">{item.answer}</span>
        <span className="answer-word">{answerWord}</span>
      </div>

      {/* 동의어 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          동의어 해설 - {underlinedWord}
        </div>
        <div className="explanation-block-content">
          {explanation?.wordExplanation || (
            <span className="placeholder-text">AI 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* 동의어 추가 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          동의어 추가
        </div>
        {explanation?.synonyms && explanation.synonyms.length > 0 ? (
          <table className="synonym-table">
            <tbody>
              {explanation.synonyms.map((syn, idx) => (
                <tr key={idx}>
                  <td className="synonym-english">{syn.english}</td>
                  <td className="synonym-korean">{syn.korean}</td>
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
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: GrammarExplanation;
  showNumber?: boolean;
}) => {
  const answerIdx = ['①', '②', '③', '④', '⑤'].indexOf(item.answer);
  const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];

  return (
    <div className="explanation-section">
      {/* 정답 헤더 */}
      <div className="explanation-answer-header grammar-header">
        {showNumber && <span className="question-num-badge">{item.questionNumber}</span>}
        <span className="answer-label">정답 |</span>
        <span className="answer-badge">{item.answer}</span>
        <span className="answer-change">{labels[answerIdx]} {explanation?.answerChange || ''}</span>
        <span className="test-point">▶ 출제 Point | {explanation?.testPoint || ''}</span>
      </div>

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">정답 해설 |</div>
        <div className="explanation-block-content">
          {explanation?.correctExplanation || (
            <span className="placeholder-text">AI 해설이 생성되면 여기에 표시됩니다.</span>
          )}
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
                <span className="wrong-text">{exp}</span>
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
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: LogicExplanation;
  showNumber?: boolean;
}) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];

  return (
    <div className="explanation-section">
      {/* 문제 번호 헤더 (그룹 내 여러 문제일 때) */}
      {showNumber && (
        <div className="explanation-answer-header">
          <span className="question-num-badge">{item.questionNumber}</span>
        </div>
      )}

      {/* Step 1) 빈칸 타게팅 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          Step 1) 빈칸 타게팅
        </div>
        <div className="explanation-block-content">
          {explanation?.step1Targeting || (
            <span className="placeholder-text">AI 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* Step 2) 근거 확인 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          Step 2) 근거 확인
        </div>
        <div className="explanation-block-content">
          {explanation?.step2Evidence || (
            <span className="placeholder-text">근거 분석이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* Step 3) 보기 판단 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          Step 3) 보기 판단
        </div>
        <div className="explanation-block-content choice-explanations">
          {explanation?.step3Choices && explanation.step3Choices.length > 0 ? (
            explanation.step3Choices.map((exp, idx) => (
              <div key={idx} className={`choice-item ${item.answer === choiceLabels[idx] ? 'correct' : ''}`}>
                <span className="choice-label">{choiceLabels[idx]}</span>
                <span className="choice-text">{exp}</span>
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
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: MainIdeaExplanation;
  showNumber?: boolean;
}) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];

  return (
    <div className="explanation-section">
      {/* 문제 번호 헤더 (그룹 내 여러 문제일 때) */}
      {showNumber && (
        <div className="explanation-answer-header">
          <span className="question-num-badge">{item.questionNumber}</span>
        </div>
      )}

      {/* 지문 분석 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          지문 분석
        </div>
        <div className="explanation-block-content">
          {explanation?.passageAnalysis || (
            <span className="placeholder-text">AI 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          정답 해설
        </div>
        <div className="explanation-block-content">
          {explanation?.correctExplanation || (
            <span className="placeholder-text">정답 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* 오답 소거 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          오답 소거
        </div>
        <div className="explanation-block-content choice-explanations">
          {explanation?.wrongExplanations && explanation.wrongExplanations.length > 0 ? (
            explanation.wrongExplanations.map((exp, idx) => {
              // 정답은 스킵
              if (item.answer === choiceLabels[idx]) return null;
              return (
                <div key={idx} className="choice-item">
                  <span className="choice-label">{choiceLabels[idx]}번:</span>
                  <span className="choice-text">{exp}</span>
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
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: InsertionExplanation;
  showNumber?: boolean;
}) => {
  const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];

  return (
    <div className="explanation-section">
      {/* 문제 번호 헤더 (그룹 내 여러 문제일 때) */}
      {showNumber && (
        <div className="explanation-answer-header">
          <span className="question-num-badge">{item.questionNumber}</span>
        </div>
      )}

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          정답 해설
        </div>
        <div className="explanation-block-content">
          {explanation?.correctExplanation || (
            <span className="placeholder-text">AI 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* 각 위치별 설명 */}
      {explanation?.positionExplanations && explanation.positionExplanations.length > 0 && (
        <div className="explanation-block">
          <div className="explanation-block-content position-explanations">
            {explanation.positionExplanations.map((exp, idx) => (
              <div key={idx} className="position-item">
                <span className="position-label">{labels[idx]}</span>
                <span className="position-text">{exp}</span>
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
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: OrderExplanation;
  showNumber?: boolean;
}) => {
  return (
    <div className="explanation-section">
      {/* 문제 번호 헤더 (그룹 내 여러 문제일 때) */}
      {showNumber && (
        <div className="explanation-answer-header">
          <span className="question-num-badge">{item.questionNumber}</span>
        </div>
      )}

      {/* 보기의 1열 */}
      <div className="explanation-block">
        <div className="explanation-block-title highlight">보기의 1열 |</div>
        <div className="explanation-block-content">
          {explanation?.firstParagraph || (
            <span className="placeholder-text">AI 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* 쪼개는 포인트 */}
      <div className="explanation-block">
        <div className="explanation-block-title highlight">쪼개는 포인트 |</div>
        <div className="explanation-block-content">
          {explanation?.splitPoint || (
            <span className="placeholder-text">쪼개는 포인트가 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* 결론 */}
      <div className="explanation-block">
        <div className="explanation-block-content conclusion">
          {explanation?.conclusion || (
            <span className="placeholder-text">
              따라서 정답은 <strong>{item.answer}</strong>번입니다.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// 어휘 적절성/밑줄 추론 해설
const WordAppropriatenessSection = ({
  item,
  explanation,
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: WordAppropriatenessExplanation;
  showNumber?: boolean;
}) => {
  const labels = ['(A)', '(B)', '(C)', '(D)', '(E)'];

  return (
    <div className="explanation-section">
      {/* 문제 번호 헤더 (그룹 내 여러 문제일 때) */}
      {showNumber && (
        <div className="explanation-answer-header">
          <span className="question-num-badge">{item.questionNumber}</span>
        </div>
      )}

      {/* 핵심 주제 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📖</span>
          핵심 주제
        </div>
        <div className="explanation-block-content">
          {explanation?.mainTopic || (
            <span className="placeholder-text">AI 해설이 생성되면 여기에 표시됩니다.</span>
          )}
        </div>
      </div>

      {/* 정답 해설 */}
      <div className="explanation-block">
        <div className="explanation-block-title">
          <span className="block-icon">📝</span>
          정답 해설
        </div>
        <div className="explanation-block-content choice-explanations">
          {explanation?.choiceExplanations && explanation.choiceExplanations.length > 0 ? (
            explanation.choiceExplanations.map((exp, idx) => (
              <div key={idx} className="choice-item">
                <span className="choice-label">{labels[idx]}</span>
                <span className="choice-text">{exp}</span>
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
  showNumber = true
}: {
  item: QuestionItem;
  explanation?: ExplanationData;
  showNumber?: boolean;
}) => {
  const { categoryMain, categorySub } = item;

  // 어휘 유형
  if (categoryMain === '어휘') {
    return <VocabularySection item={item} explanation={explanation as VocabularyExplanation} showNumber={showNumber} />;
  }

  // 문법 유형
  if (categoryMain === '문법') {
    return <GrammarSection item={item} explanation={explanation as GrammarExplanation} showNumber={showNumber} />;
  }

  // 논리/빈칸 유형
  if (categoryMain === '논리' || categoryMain === '빈칸') {
    return <LogicSection item={item} explanation={explanation as LogicExplanation} showNumber={showNumber} />;
  }

  // 대의파악 (제목, 요지, 주제, 요약 등)
  if (categoryMain === '대의 파악') {
    return <MainIdeaSection item={item} explanation={explanation as MainIdeaExplanation} showNumber={showNumber} />;
  }

  // 정보파악
  if (categoryMain === '정보 파악') {
    // 순서
    if (categorySub === '순서') {
      return <OrderSection item={item} explanation={explanation as OrderExplanation} showNumber={showNumber} />;
    }
    // 삽입
    if (categorySub === '삽입') {
      return <InsertionSection item={item} explanation={explanation as InsertionExplanation} showNumber={showNumber} />;
    }
    // 어휘 적절성/밑줄 추론
    if (categorySub === '어휘 적절성' || categorySub === '밑줄 추론') {
      return <WordAppropriatenessSection item={item} explanation={explanation as WordAppropriatenessExplanation} showNumber={showNumber} />;
    }
    // 기타 정보파악 (세부정보 등)
    return <MainIdeaSection item={item} explanation={explanation as MainIdeaExplanation} showNumber={showNumber} />;
  }

  // 기본 (알 수 없는 유형)
  return <MainIdeaSection item={item} explanation={explanation as MainIdeaExplanation} showNumber={showNumber} />;
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
  const isCorrect = answer === choiceLabels[idx];

  // 번역이 있는 경우
  if (choiceTranslation) {
    return (
      <div
        key={idx}
        className={`question-choice-translated ${isCorrect ? 'correct' : ''}`}
        style={{ fontSize: scaledSize(9) }}
      >
        <span className="choice-label">{choiceLabels[idx]}</span>
        {displayMode === 'both' ? (
          // 영어 + 한글 둘 다
          <span className="choice-text">
            <span className="choice-english">{choice}</span>
            <span className="choice-korean">{choiceTranslation.korean}</span>
          </span>
        ) : displayMode === 'english' ? (
          // 영어만
          <span className="choice-text">
            <span className="choice-english">{choice}</span>
          </span>
        ) : (
          // 한글만
          <span className="choice-text">
            <span className="choice-korean-only">{choiceTranslation.korean}</span>
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
      style={{ fontSize: scaledSize(9) }}
    >
      {choiceLabels[idx]} {choice}
    </span>
  );
};

// ===== 단일 문제 해설 카드 (지문 1개 + 문제 1개) =====
const SingleExplanationCard = ({
  item,
  explanation,
  choiceDisplayMode = 'both',
  onPassageEdit,
}: {
  item: QuestionItem;
  explanation?: ExplanationData;
  choiceDisplayMode?: 'both' | 'korean' | 'english';
  onPassageEdit?: (questionId: string, newPassage: string) => void;
}) => {
  // ExplanationData에서 번역 정보 추출
  const passageTranslation = explanation?.passageTranslation;
  const choiceTranslations = explanation?.choiceTranslations;

  const handlePassageSave = (newText: string) => {
    if (onPassageEdit) {
      onPassageEdit(item.id, newText);
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
          {/* 한글 번역만 표시 (영어 지문 없이) */}
          {passageTranslation ? (
            <EditablePassage
              text={passageTranslation}
              onSave={handlePassageSave}
              className="question-passage-translation"
              style={{ fontSize: scaledSize(9), lineHeight: 1.6, color: '#333' }}
            />
          ) : (
            /* 한글 번역이 없으면 영어 지문 표시 (fallback) */
            <p className="question-passage" style={{ fontSize: scaledSize(9), lineHeight: 1.6 }}>
              {formatPassageWithUnderline(item.passage)}
            </p>
          )}
          {/* 보기 */}
          <div className="question-choices" style={{ marginTop: choiceTranslations ? '12px' : undefined }}>
            {item.choices.map((choice, idx) => (
              choice && renderChoiceWithTranslation(choice, idx, item.answer, choiceTranslations?.[idx], choiceDisplayMode)
            ))}
          </div>
        </div>
      </div>

      {/* 우측: 해설 */}
      <div className="explanation-content">
        <ExplanationSectionByType item={item} explanation={explanation} showNumber={false} />
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
}: {
  group: PassageGroup;
  explanations?: Map<string, ExplanationData>;
  choiceDisplayMode?: 'both' | 'korean' | 'english';
  onPassageEdit?: (questionId: string, newPassage: string) => void;
}) => {
  const firstItem = group.items[0];
  // 첫 번째 문제의 해설에서 지문 번역 가져오기
  const firstExplanation = explanations?.get(firstItem.id);
  const passageTranslation = firstExplanation?.passageTranslation;

  // 문제 번호 범위 (예: 33~34)
  const questionNumbers = group.items.map(i => i.questionNumber);
  const numberRange = questionNumbers.length > 1
    ? `${Math.min(...questionNumbers)}~${Math.max(...questionNumbers)}`
    : String(questionNumbers[0]);

  const handlePassageSave = (newText: string) => {
    if (onPassageEdit) {
      onPassageEdit(firstItem.id, newText);
    }
  };

  return (
    <div className="explanation-card grouped">
      {/* 좌측: 지문 + 모든 문제의 보기 */}
      <div className="explanation-question">
        <div className="question-number" style={{ fontSize: scaledSize(18) }}>
          {numberRange}
        </div>
        <div className="question-content">
          {/* 한글 번역만 표시 (영어 지문 없이) */}
          {passageTranslation ? (
            <EditablePassage
              text={passageTranslation}
              onSave={handlePassageSave}
              className="question-passage-translation"
              style={{ fontSize: scaledSize(9), lineHeight: 1.6, color: '#333' }}
            />
          ) : (
            /* 한글 번역이 없으면 영어 지문 표시 (fallback) */
            <p className="question-passage" style={{ fontSize: scaledSize(9), lineHeight: 1.6 }}>
              {formatPassageWithUnderline(firstItem.passage)}
            </p>
          )}

          {/* 각 문제의 보기 */}
          {group.items.map((item) => {
            const itemExplanation = explanations?.get(item.id);
            const choiceTranslations = itemExplanation?.choiceTranslations;

            return (
              <div key={item.id} className="grouped-question-choices">
                <div className="grouped-question-header">
                  <span className="grouped-question-num">{item.questionNumber}.</span>
                  <span className="grouped-question-instruction">{item.instruction}</span>
                </div>
                <div className="question-choices">
                  {item.choices.map((choice, idx) => (
                    choice && renderChoiceWithTranslation(choice, idx, item.answer, choiceTranslations?.[idx], choiceDisplayMode)
                  ))}
                </div>
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
}

export const ExplanationView = memo(function ExplanationView({
  data,
  headerInfo,
  unitNumber,
  explanations,
  onHeaderChange,
  choiceDisplayMode = 'both',
  onPassageTranslationEdit,
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
        />
      );
    });
  }, [groupedQuestions, explanations, choiceDisplayMode, onPassageTranslationEdit]);

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
          />
          <QuickAnswerTable questions={data} />
        </div>
      }
      showHeaderOnFirstPageOnly={true}
    >
      {pageChildren}
    </A4PageLayout>
  );
});

export default ExplanationView;
