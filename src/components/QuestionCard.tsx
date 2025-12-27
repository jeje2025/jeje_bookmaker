import { memo } from 'react';
import { scaledSize } from '../utils/fontScale';
import type { QuestionItem } from '../types/question';

interface QuestionCardProps {
  item: QuestionItem;
  showAnswer?: boolean;
  showInstruction?: boolean;
  isCommonInstruction?: boolean; // 공통 발문 여부 (2개 이상 문제가 같은 발문 공유)
  groupQuestionNumbers?: number[]; // 공동 지문 그룹의 문제 번호들 (첫 문제에서만 전달)
  isFirstInGroup?: boolean; // 그룹 첫 문제 여부 (지문 표시용)
  hideChoices?: boolean; // 보기 숨김 여부 (밑줄형 등)
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

// 문장 삽입 유형 발문 파싱 (발문과 제시문 분리)
const parseInsertionInstruction = (instruction: string): { question: string; insertSentence: string | null } => {
  // "다음 문장이 들어갈 위치로 가장 적절한 것은?" 패턴 이후의 텍스트를 제시문으로 분리
  const patterns = [
    /^(.*?(?:다음 문장이 들어갈 위치로 가장 적절한 것은\??))\s*(.+)$/s,
    /^(.*?(?:주어진 문장이 들어가기에 가장 적절한 곳은\??))\s*(.+)$/s,
    /^(.*?(?:글의 흐름으로 보아.*?들어가기에 가장 적절한 곳은\??))\s*(.+)$/s,
  ];

  for (const pattern of patterns) {
    const match = instruction.match(pattern);
    if (match && match[2] && match[2].trim().length > 10) {
      return { question: match[1].trim(), insertSentence: match[2].trim() };
    }
  }

  return { question: instruction, insertSentence: null };
};

// 단일 문제 컴포넌트 (Final Pick 스타일)
const QuestionCardComponent = ({
  item,
  showAnswer = false,
  showInstruction = true,
  isCommonInstruction = false,
  groupQuestionNumbers,
  isFirstInGroup = true,
  hideChoices = false
}: QuestionCardProps) => {
  const { questionNumber, passage, choices, answer, instruction } = item;

  // 문장 삽입 유형인지 확인하고 발문/제시문 분리
  const parsedInstruction = instruction ? parseInsertionInstruction(instruction) : { question: '', insertSentence: null };

  // 공동 지문 그룹 번호 계산
  const isGrouped = groupQuestionNumbers && groupQuestionNumbers.length > 1;
  const minNum = isGrouped ? Math.min(...groupQuestionNumbers) : questionNumber;
  const maxNum = isGrouped ? Math.max(...groupQuestionNumbers) : questionNumber;

  // 첫 문제가 아니면 지문 숨김 (공동 지문)
  const showPassage = isFirstInGroup && passage;

  return (
    <div className="question-compact">
      {/* 발문 (그룹 첫 문제만 표시) - 문제 번호 위에 */}
      {showInstruction && instruction && (
        <>
          <p
            className={isCommonInstruction ? "q-instruction q-instruction-common" : "q-instruction"}
            style={{ fontSize: scaledSize(9.5) }}
          >
            {parsedInstruction.question}
          </p>
          {/* 문장 삽입 제시문 (별도 영역) */}
          {parsedInstruction.insertSentence && (
            <div className="q-insert-sentence" style={{ fontSize: scaledSize(9) }}>
              {parsedInstruction.insertSentence}
            </div>
          )}
        </>
      )}

      {/* 문제 번호 + 지문 + 보기 */}
      <div className="question-row">
        {/* 문제 번호 배지 - 해설지 스타일과 동일 */}
        {isGrouped && isFirstInGroup ? (
          // 공동 지문: 세로 배치 (33 ~ 34)
          <div className="q-number q-number-vertical" style={{ fontSize: scaledSize(14) }}>
            <span>{minNum}</span>
            <span className="q-number-separator">~</span>
            <span>{maxNum}</span>
          </div>
        ) : !isGrouped ? (
          // 단일 문제: 일반 번호
          <div className="q-number" style={{ fontSize: scaledSize(14) }}>
            {questionNumber}
          </div>
        ) : (
          // 공동 지문의 두 번째 이후 문제: 개별 번호
          <div className="q-number" style={{ fontSize: scaledSize(14) }}>
            {questionNumber}
          </div>
        )}
        <div className="q-content">
          {/* 지문 - 공동 지문은 첫 문제에만 표시 */}
          {showPassage && (
            <p className="q-passage" style={{ fontSize: scaledSize(9), lineHeight: 1.6 }}>
              {formatPassageWithUnderline(passage)}
            </p>
          )}

          {/* 보기 - 가로 배치 (밑줄형은 숨김) */}
          {!hideChoices && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export const QuestionCard = memo(QuestionCardComponent);
export default QuestionCard;
