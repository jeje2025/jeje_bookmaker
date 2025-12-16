import { HeaderFooter } from './HeaderFooter';
import { A4PageLayout } from './A4PageLayout';
import { useMemo } from 'react';

interface VocabularyItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  definition?: string;
  synonyms: string[];
  antonyms: string[];
  derivatives: Array<{ word: string; meaning: string; partOfSpeech: string }>;
  example: string;
  translation: string;
  etymology: string;
}

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

interface VocabularyTestDefinitionProps {
  data: VocabularyItem[];
  headerInfo?: HeaderInfo;
  unitNumber?: number;
}

interface TestQuestion {
  id: number;
  word: string;
  correctDefinition: string;
  allChoices: Array<{ definition: string; isCorrect: boolean; sourceWord?: string }>;
}

export function VocabularyTestDefinition({ data, headerInfo, unitNumber }: VocabularyTestDefinitionProps) {
  // 시드 기반 랜덤 함수 (일관된 결과를 위해)
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // 시드 기반 셔플 함수
  const seededShuffle = <T,>(array: T[], seed: number): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  // 영영정의 테스트 문제 생성
  const generateTestQuestions = (): TestQuestion[] => {
    return data.map((item) => {
      const correctDefinition = item.definition || '';
      const distractors: Array<{ definition: string; sourceWord: string }> = [];

      // 다른 단어들의 영영정의에서 오답 선택지 생성
      const otherWords = data.filter(d => d.id !== item.id && d.definition);
      for (const other of otherWords) {
        if (other.definition) {
          distractors.push({
            definition: other.definition,
            sourceWord: other.word
          });
        }
      }

      // 시드 기반으로 오답 선택 (3개) - item.id와 unitNumber를 시드로 사용
      const baseSeed = (unitNumber || 0) * 10000 + item.id;
      const shuffledDistractors = seededShuffle(distractors, baseSeed);
      const selectedDistractors = shuffledDistractors.slice(0, 3);

      // 정답과 오답 합치기
      const allChoices = [
        { definition: correctDefinition, isCorrect: true },
        ...selectedDistractors.map(d => ({
          definition: d.definition,
          isCorrect: false,
          sourceWord: d.sourceWord
        }))
      ];

      // 시드 기반으로 섞기 - baseSeed * 1000을 시드로 사용
      const shuffledChoices = seededShuffle(allChoices, baseSeed * 1000);

      return {
        id: item.id,
        word: item.word,
        correctDefinition,
        allChoices: shuffledChoices
      };
    });
  };

  const questions = useMemo(() => generateTestQuestions(), [data]);
  
  // 데이터를 2개씩 묶기
  const pairedQuestions = [];
  for (let i = 0; i < questions.length; i += 2) {
    pairedQuestions.push({
      left: questions[i],
      right: questions[i + 1] || null
    });
  }

  // 각 행을 개별 컴포넌트로
  const testRows = pairedQuestions.map((pair, pairIndex) => (
    <table key={pairIndex} className="w-full border-collapse">
      <tbody>
        <tr 
          className="border-b border-gray-200"
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          {/* 왼쪽 열 */}
          <td className="py-3 px-4 align-top pb-6" style={{ width: '50%', verticalAlign: 'top' }}>
            <div className="mb-3">
              <div className="flex items-start gap-2 my-[4px] mx-[0px] px-[0px] py-[4px]">
                {/* 번호 */}
                <div className="inline-block px-1.5 py-0.5 bg-slate-100/80 backdrop-blur-md rounded-full border border-slate-200/60" style={{ flexShrink: 0 }}>
                  <p className="uppercase tracking-tight text-slate-600 font-medium" style={{ fontSize: '8px' }}>
                    {String(pair.left.id).padStart(3, '0')}
                  </p>
                </div>
                
                {/* 단어 */}
                <div style={{ fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }} className="text-black">
                  {pair.left.word}
                </div>
                
                {/* 뜻: 라벨 */}
                <div className="text-gray-500 print:text-black" style={{ fontSize: '9px', flexShrink: 0, paddingTop: '4px' }}>
                  뜻:
                </div>
                
                {/* 뜻 쓰는 칸 */}
                <div className="flex-1" style={{ 
                  borderBottom: '1px solid #d1d5db',
                  minHeight: '20px'
                }}>
                </div>
              </div>
            </div>
            
            {/* 영영정의 선택 */}
            <div className="flex flex-col gap-1.5 my-[16px] mx-[0px]">
              {pair.left.allChoices.map((choice, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2"
                  style={{ fontSize: '11px' }}
                >
                  <div className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 print:text-black print:border-black mt-0.5" style={{ 
                    width: '18px', 
                    height: '18px', 
                    fontSize: '9px',
                    flexShrink: 0,
                    fontWeight: 500
                  }}>
                    {idx + 1}
                  </div>
                  <span className="text-gray-700 print:text-black text-[11px] leading-relaxed flex-1">
                    {choice.definition}
                  </span>
                </div>
              ))}
            </div>
          </td>

          {/* 오른쪽 열 */}
          <td className="py-3 px-4 align-top border-l border-gray-200 pb-6" style={{ width: '50%', verticalAlign: 'top' }}>
            {pair.right && (
              <>
                <div className="mb-3">
                  <div className="flex items-start gap-2 my-[4px] mx-[0px] px-[0px] py-[4px]">
                    {/* 번호 */}
                    <div className="inline-block px-1.5 py-0.5 bg-slate-100/80 backdrop-blur-md rounded-full border border-slate-200/60" style={{ flexShrink: 0 }}>
                      <p className="uppercase tracking-tight text-slate-600 font-medium" style={{ fontSize: '8px' }}>
                        {String(pair.right.id).padStart(3, '0')}
                      </p>
                    </div>
                    
                    {/* 단어 */}
                    <div style={{ fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }} className="text-black">
                      {pair.right.word}
                    </div>
                    
                    {/* 뜻: 라벨 */}
                    <div className="text-gray-500 print:text-black" style={{ fontSize: '9px', flexShrink: 0, paddingTop: '4px' }}>
                      뜻:
                    </div>
                    
                    {/* 뜻 쓰는 칸 */}
                    <div className="flex-1" style={{ 
                      borderBottom: '1px solid #d1d5db',
                      minHeight: '20px'
                    }}>
                    </div>
                  </div>
                </div>
                
                {/* 영영정의 선택 */}
                <div className="flex flex-col gap-1.5 my-[16px] mx-[0px]">
                  {pair.right.allChoices.map((choice, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2"
                      style={{ fontSize: '11px' }}
                    >
                      <div className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 print:text-black print:border-black mt-0.5" style={{ 
                        width: '18px', 
                        height: '18px', 
                        fontSize: '9px',
                        flexShrink: 0,
                        fontWeight: 500
                      }}>
                        {idx + 1}
                      </div>
                      <span className="text-gray-700 print:text-black text-[11px] leading-relaxed flex-1">
                        {choice.definition}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  ));

  return (
    <A4PageLayout
      headerContent={<HeaderFooter headerInfo={headerInfo} showFooter={false} unitNumber={unitNumber} />}
      showHeaderOnFirstPageOnly={true}
    >
      {testRows}
    </A4PageLayout>
  );
}