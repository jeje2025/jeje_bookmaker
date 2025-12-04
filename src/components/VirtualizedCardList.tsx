import { useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { VocabularyCard } from './VocabularyCard';

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
  translationHighlight?: string;
  etymology: string;
}

interface VirtualizedCardListProps {
  data: VocabularyItem[];
  isEditable?: boolean;
  onUpdate?: (id: number, field: string, value: any) => void;
}

export function VirtualizedCardList({ data, isEditable = false, onUpdate }: VirtualizedCardListProps) {
  // 카드 높이 추정 (대략적인 값)
  const getItemSize = (index: number) => {
    // 각 카드의 높이는 내용에 따라 다르므로 평균 높이로 설정
    // 더 정확하게 하려면 각 항목의 실제 내용을 분석해야 함
    return 280; // 평균 카드 높이 (px)
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const word = data[index];
    return (
      <div style={style} className="px-4">
        <VocabularyCard 
          key={word.id} 
          {...word} 
          isEditable={isEditable}
          onUpdate={onUpdate}
        />
      </div>
    );
  };

  // 뷰포트 높이 계산
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight - 200 : 800;

  return (
    <List
      height={containerHeight}
      itemCount={data.length}
      itemSize={getItemSize}
      width="100%"
      className="print:hidden"
    >
      {Row}
    </List>
  );
}
