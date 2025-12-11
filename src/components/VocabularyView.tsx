import { memo } from 'react';
import { VocabularyCard } from './VocabularyCard';
import { VocabularyTable } from './VocabularyTable';
import { VocabularyTableSimple } from './VocabularyTableSimple';
import { VocabularyTableSimpleTest } from './VocabularyTableSimpleTest';
import { VocabularyTest } from './VocabularyTest';
import { VocabularyTestDefinition } from './VocabularyTestDefinition';
import { VocabularyTestAnswer } from './VocabularyTestAnswer';
import { VocabularyTestDefinitionAnswer } from './VocabularyTestDefinitionAnswer';
import { HeaderFooter } from './HeaderFooter';
import { A4PageLayout } from './A4PageLayout';

interface VocabularyItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  definition?: string;
  synonyms: string[];
  antonyms: string[];
  derivatives: Array<{ word: string; meaning: string; partOfSpeech?: string }>;
  example: string;
  translation: string;
  translationHighlight?: string;
  etymology: string;
}

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

type ViewMode = 'card' | 'table' | 'tableSimple' | 'tableSimpleTest' | 'test' | 'testDefinition' | 'testAnswer' | 'testDefinitionAnswer';

interface VocabularyViewProps {
  viewMode: ViewMode;
  data: VocabularyItem[];
  headerInfo: HeaderInfo;
  isEditMode: boolean;
  unitNumber?: number;
  onWordUpdate: (id: number, field: string, value: string | string[]) => void;
  onHeaderChange: (updated: Partial<HeaderInfo>) => void;
}

export const VocabularyView = memo(function VocabularyView({
  viewMode,
  data,
  headerInfo,
  isEditMode,
  unitNumber,
  onWordUpdate,
  onHeaderChange
}: VocabularyViewProps) {
  if (viewMode === 'card') {
    return (
      <A4PageLayout
        headerContent={
          <HeaderFooter
            headerInfo={headerInfo}
            showFooter={false}
            isEditable={isEditMode}
            onHeaderChange={onHeaderChange}
            unitNumber={unitNumber}
          />
        }
        showHeaderOnFirstPageOnly={true}
      >
        {data.map((word) => (
          <VocabularyCard
            key={word.id}
            {...word}
            isEditable={isEditMode}
            onUpdate={onWordUpdate}
          />
        ))}
      </A4PageLayout>
    );
  }

  if (viewMode === 'table') {
    return (
      <VocabularyTable
        data={data}
        headerInfo={headerInfo}
        isEditable={isEditMode}
        onUpdate={onWordUpdate}
        onHeaderChange={onHeaderChange}
        unitNumber={unitNumber}
      />
    );
  }

  if (viewMode === 'tableSimple') {
    return (
      <VocabularyTableSimple
        data={data}
        headerInfo={headerInfo}
        unitNumber={unitNumber}
      />
    );
  }

  if (viewMode === 'tableSimpleTest') {
    return (
      <VocabularyTableSimpleTest
        data={data}
        headerInfo={headerInfo}
        unitNumber={unitNumber}
      />
    );
  }

  if (viewMode === 'test') {
    return (
      <VocabularyTest
        data={data}
        headerInfo={headerInfo}
        unitNumber={unitNumber}
      />
    );
  }

  if (viewMode === 'testDefinition') {
    return (
      <VocabularyTestDefinition
        data={data}
        headerInfo={headerInfo}
        unitNumber={unitNumber}
      />
    );
  }

  if (viewMode === 'testAnswer') {
    return (
      <VocabularyTestAnswer
        data={data}
        headerInfo={headerInfo}
        unitNumber={unitNumber}
      />
    );
  }

  if (viewMode === 'testDefinitionAnswer') {
    return (
      <VocabularyTestDefinitionAnswer
        data={data}
        headerInfo={headerInfo}
        unitNumber={unitNumber}
      />
    );
  }

  return null;
});
