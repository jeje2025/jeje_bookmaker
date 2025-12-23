import { memo } from 'react';
import { scaledSize } from '../utils/fontScale';
import type { QuestionItem } from '../types/question';

interface QuestionCardProps {
  item: QuestionItem;
  showAnswer?: boolean;
  showInstruction?: boolean;
}

// 지문에서 밑줄 표시할 단어 처리 + 빈칸 __________ 처리
const formatPassageWithUnderline = (text: string) => {
  if (!text) return null;

  // 밑줄 패턴: _word_ 형식 또는 __________ (빈칸)
  const parts = text.split(/(_[^_]+_|_{5,})/g);

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
    // 밑줄 단어
    if (part.startsWith('_') && part.endsWith('_')) {
      const word = part.slice(1, -1);
      return (
        <span key={idx} className="underline underline-offset-2">
          {word}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

// 보기 번호 변환
const choiceLabels = ['①', '②', '③', '④', '⑤'];

// 단일 문제 컴포넌트 (Final Pick 스타일)
const QuestionCardComponent = ({ item, showAnswer = false, showInstruction = true }: QuestionCardProps) => {
  const { questionNumber, passage, choices, answer, instruction } = item;

  return (
    <div className="question-compact">
      {/* 발문 (그룹 첫 문제만 표시) */}
      {showInstruction && instruction && (
        <div className="instruction-line">
          <p style={{ fontSize: scaledSize(10) }}>{instruction}</p>
        </div>
      )}

      {/* 문제 번호 + 지문 + 보기 */}
      <div className="question-row">
        {/* 큰 보라색 문제 번호 */}
        <div
          className="q-number"
          style={{
            fontSize: scaledSize(18),
            color: 'var(--badge-text, #9b59b6)',
            fontWeight: 700,
            minWidth: '32px'
          }}
        >
          {questionNumber}
        </div>
        <div className="q-content">
          {/* 지문 */}
          {passage && (
            <p className="q-passage" style={{ fontSize: scaledSize(10), lineHeight: 1.6 }}>
              {formatPassageWithUnderline(passage)}
            </p>
          )}

          {/* 보기 - 가로 배치 */}
          <div className="q-choices">
            {choices.map((choice, idx) => (
              choice && (
                <span
                  key={idx}
                  className={`q-choice ${showAnswer && answer === choiceLabels[idx] ? 'correct' : ''}`}
                  style={{ fontSize: scaledSize(10) }}
                >
                  {choiceLabels[idx]} {choice}
                </span>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuestionCard = memo(QuestionCardComponent);
export default QuestionCard;
