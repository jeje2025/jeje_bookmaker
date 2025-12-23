import { memo } from 'react';
import { scaledSize } from '../utils/fontScale';
import type { QuestionItem } from '../types/question';

interface QuestionCardProps {
  item: QuestionItem;
  showAnswer?: boolean;
  showInstruction?: boolean;
  isCommonInstruction?: boolean; // 공통 발문 여부 (2개 이상 문제가 같은 발문 공유)
}

// 지문에서 마크다운 스타일 강조 처리
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
      return (
        <span key={idx} className="font-bold underline underline-offset-2">
          {word}
        </span>
      );
    }
    // 굵게 (**text**)
    if (part.startsWith('**') && part.endsWith('**')) {
      const word = part.slice(2, -2);
      return (
        <span key={idx} className="font-bold">
          {word}
        </span>
      );
    }
    // 밑줄 (_text_)
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
const QuestionCardComponent = ({ item, showAnswer = false, showInstruction = true, isCommonInstruction = false }: QuestionCardProps) => {
  const { questionNumber, passage, choices, answer, instruction } = item;

  return (
    <div className="question-compact">
      {/* 발문 (그룹 첫 문제만 표시) - 문제 번호 위에 */}
      {showInstruction && instruction && (
        <p
          className={isCommonInstruction ? "q-instruction q-instruction-common" : "q-instruction"}
          style={{ fontSize: scaledSize(9.5) }}
        >
          {instruction}
        </p>
      )}

      {/* 문제 번호 + 지문 + 보기 */}
      <div className="question-row">
        {/* 문제 번호 배지 - 해설지 스타일과 동일 */}
        <div className="q-number" style={{ fontSize: scaledSize(14) }}>
          {questionNumber}
        </div>
        <div className="q-content">
          {/* 지문 */}
          {passage && (
            <p className="q-passage" style={{ fontSize: scaledSize(9), lineHeight: 1.6 }}>
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
                  style={{ fontSize: scaledSize(9.5) }}
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
