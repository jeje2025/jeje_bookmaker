import { pdf } from '@react-pdf/renderer';
import { VocabularyPDF } from '../components/VocabularyPDF';
import { createElement } from 'react';

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

export async function downloadPDF(
  data: VocabularyItem[],
  headerInfo: HeaderInfo,
  viewMode: ViewMode = 'card',
  filename?: string
): Promise<void> {
  // PDF 문서 생성
  const doc = createElement(VocabularyPDF, { data, headerInfo, viewMode });
  const blob = await pdf(doc).toBlob();

  // 파일명 생성
  const name = filename || headerInfo.headerTitle || 'vocabulary';
  const sanitizedName = name.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim();
  const finalFilename = `${sanitizedName}.pdf`;

  // 다운로드 링크 생성 및 클릭
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
