import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// 한글 폰트 등록 (Pretendard - 로컬 번들링)
Font.register({
  family: 'Pretendard',
  fonts: [
    { src: '/fonts/Pretendard-Regular.otf', fontWeight: 400 },
    { src: '/fonts/Pretendard-Regular.otf', fontWeight: 400, fontStyle: 'italic' },
    { src: '/fonts/Pretendard-Bold.otf', fontWeight: 700 },
    { src: '/fonts/Pretendard-Bold.otf', fontWeight: 700, fontStyle: 'italic' },
  ],
});

// Hyphenation 비활성화 (한글에 불필요)
Font.registerHyphenationCallback((word) => [word]);

// A4 사이즈 스타일 - PDF pt 단위 보정 (화면 px의 약 75-80% 크기)
// 정적 스타일 (fontSize가 없거나 스케일 불필요한 것들)
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: 'Pretendard',
    fontSize: 8,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  unitBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 8,
    color: '#475569',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontWeight: 700,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 8,
    color: '#4b5563',
    marginTop: 6,
  },
  // 카드 스타일 - PDF 크기 보정
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  cardLeft: {
    width: '22%',
  },
  cardRight: {
    width: '78%',
    flexDirection: 'row',
  },
  cardRightContent: {
    flex: 1,
  },
  // ID 배지 컨테이너 (View로 감싸서 정렬)
  idBadgeContainer: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    marginBottom: 6,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
  },
  // ID 배지 텍스트
  idBadge: {
    fontSize: 6,
    fontWeight: 700,
    color: '#475569',
    textAlign: 'center',
  },
  // 단어 - 16pt bold (화면 22px -> PDF 16pt)
  word: {
    fontSize: 16,
    fontWeight: 700,
    color: '#000000',
    marginBottom: 1.5,
    letterSpacing: -0.2,
  },
  // 품사 - 7pt bold gray
  partOfSpeech: {
    fontSize: 7,
    fontWeight: 700,
    color: '#9ca3af',
  },
  // 의미 컨테이너
  meaningContainer: {
    marginBottom: 6,
  },
  // 의미 - 10pt (화면 13px -> PDF 10pt)
  meaning: {
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.4,
  },
  // 정의 - 8pt italic gray
  definition: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 1.3,
    fontStyle: 'italic',
  },
  // 예문 컨테이너
  exampleContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
    paddingLeft: 8,
    marginTop: 6,
  },
  // 예문 - 9pt (화면 12px -> PDF 9pt)
  example: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  // 번역 - 7.5pt gray
  translation: {
    fontSize: 7.5,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  // 체크박스
  checkboxContainer: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  checkbox: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  // 하단 섹션
  cardBottom: {
    flexDirection: 'row',
    gap: 12,
  },
  // 파생어 컨테이너
  derivativesContainer: {
    width: '22%',
  },
  derivative: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 2,
  },
  // 파생어 단어 - 8pt medium
  derivativeWord: {
    fontSize: 8,
    color: '#1f2937',
    fontWeight: 700,
  },
  // 파생어 품사 - 6pt
  derivativePos: {
    fontSize: 6,
    color: '#9ca3af',
  },
  // 파생어 의미 - 7pt
  derivativeMeaning: {
    fontSize: 7,
    color: '#6b7280',
  },
  // 정보 컨테이너 (동의어, 반의어, 어원) - grid-cols-4 매칭
  infoContainer: {
    width: '78%',
    flexDirection: 'row',
    gap: 10,
  },
  infoSection: {
    width: '20%',  // 동의어, 반의어 각각
  },
  infoSectionWide: {
    flex: 1,       // 어원 (Tip) - 나머지 공간 모두 차지
  },
  // 정보 배지 컨테이너 (동, 반, Tip)
  infoBadgeContainer: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 3,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    marginBottom: 3,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 14,
  },
  // 정보 배지 텍스트 (동, 반, Tip)
  infoBadge: {
    fontSize: 6,
    fontWeight: 700,
    color: '#475569',
    textAlign: 'center',
  },
  // 정보 텍스트 - 8pt
  infoText: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 8,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 6,
    color: '#4b5563',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 6,
    color: '#9ca3af',
  },
  // ===== 표버전 스타일 =====
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 4,
    paddingBottom: 8,
  },
  tableColId: {
    width: '5%',
    paddingHorizontal: 2,
    paddingLeft: 4,
  },
  tableColWord: {
    width: '15%',
    paddingHorizontal: 6,
  },
  tableColMeaning: {
    width: '45%',
    paddingHorizontal: 6,
  },
  tableColSyn: {
    width: '15%',
    paddingHorizontal: 6,
  },
  tableColAnt: {
    width: '15%',
    paddingHorizontal: 6,
  },
  tableWord: {
    fontSize: 10,     // 화면 14px -> PDF 10pt
    fontWeight: 700,
    color: '#000000',
    marginBottom: 3,
  },
  tableDerivative: {
    marginTop: 3,
  },
  tableDerivativeWord: {
    fontSize: 8,      // 화면 11px -> PDF 8pt
    color: '#1f2937',
  },
  tableDerivativeMeaning: {
    fontSize: 6,      // 화면 8px -> PDF 6pt
    color: '#6b7280',
  },
  tableMeaning: {
    fontSize: 8.5,    // 화면 12px -> PDF 8.5pt
    color: '#000000',
    lineHeight: 1.25,
    marginBottom: 3,
  },
  tableDefinition: {
    fontSize: 6.5,    // 화면 9px -> PDF 6.5pt
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 1.25,
    marginBottom: 3,
  },
  tableExample: {
    fontSize: 7,      // 화면 10px -> PDF 7pt
    color: '#000000',
    lineHeight: 1.25,
    marginBottom: 3,
  },
  tableTranslation: {
    fontSize: 6.5,    // 화면 9px -> PDF 6.5pt
    color: '#4b5563',
    lineHeight: 1.25,
  },
  // ===== 간단버전 스타일 =====
  simpleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
  },
  simpleColId: {
    width: '4%',
    paddingHorizontal: 3,
  },
  simpleColWord: {
    width: '18%',
    paddingHorizontal: 8,
  },
  simpleColMeaning: {
    width: '28%',
    paddingHorizontal: 8,
  },
  simpleWord: {
    fontSize: 10,     // 화면 14px -> PDF 10pt
    fontWeight: 700,
    color: '#000000',
  },
  simpleMeaning: {
    fontSize: 7,      // 화면 10px -> PDF 7pt
    color: '#000000',
  },
  // ===== 테스트지 스타일 =====
  testRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  testCol: {
    width: '50%',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  testColRight: {
    width: '50%',
    paddingHorizontal: 12,
    paddingBottom: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 3,
    paddingVertical: 3,
    marginBottom: 8,
  },
  testWord: {
    fontSize: 10,     // 화면 14px -> PDF 10pt
    fontWeight: 700,
    color: '#000000',
  },
  testMeaningLabel: {
    fontSize: 6.5,    // 화면 9px -> PDF 6.5pt
    color: '#6b7280',
    paddingTop: 3,
  },
  testMeaningLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 14,
  },
  testChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  testChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  testCheckbox: {
    fontSize: 8,      // 화면 11px -> PDF 8pt
    color: '#9ca3af',
    marginRight: 4,
  },
  testChoiceText: {
    fontSize: 8.5,    // 화면 12px -> PDF 8.5pt
    color: '#374151',
  },
  // ===== 영영정의 테스트지 스타일 =====
  defTestDefinition: {
    fontSize: 6.5,    // 화면 9px -> PDF 6.5pt
    color: '#4b5563',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  defTestAnswerLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    height: 14,
    marginTop: 3,
  },
  // ===== 답지 스타일 =====
  answerCorrect: {
    fontSize: 7,      // PDF 7pt
    color: '#059669',
    fontWeight: 700,
  },
  answerMeaningLabel: {
    fontSize: 6.5,    // PDF 6.5pt
    color: '#000000',
    marginBottom: 3,
  },
  answerSynonymLabel: {
    fontSize: 7,      // PDF 7pt
    color: '#4b5563',
  },
  answerSynonymValue: {
    fontSize: 7,      // PDF 7pt
    color: '#1f2937',
    fontWeight: 700,
  },
  answerWrongItem: {
    flexDirection: 'row',
    marginTop: 1,
  },
  answerWrongX: {
    fontSize: 6.5,    // PDF 6.5pt
    color: '#dc2626',
    marginRight: 2,
  },
  answerWrongText: {
    fontSize: 6.5,    // PDF 6.5pt
    color: '#4b5563',
  },
});

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

// 예문에서 표제어를 찾아 bold로 렌더링하는 헬퍼 함수 (highlightColor 옵션 추가)
const renderHighlightedExample = (text: string, wordToHighlight: string, textStyle: any, highlightColor?: string) => {
  const lowerText = text.toLowerCase();
  const lowerWord = wordToHighlight.toLowerCase();
  const index = lowerText.indexOf(lowerWord);

  if (index === -1) {
    return <Text style={textStyle}>{text}</Text>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + wordToHighlight.length);
  const after = text.substring(index + wordToHighlight.length);

  const highlightStyle = highlightColor
    ? { fontWeight: 700 as const, color: highlightColor }
    : { fontWeight: 700 as const };

  return (
    <Text style={textStyle}>
      {before}
      <Text style={highlightStyle}>{match}</Text>
      {after}
    </Text>
  );
};

// 번역에서 특정 문구를 bold로 렌더링하는 헬퍼 함수 (highlightColor 옵션 추가)
const renderHighlightedTranslation = (text: string, highlightText: string | undefined, textStyle: any, highlightColor?: string) => {
  if (!highlightText) {
    return <Text style={textStyle}>{text}</Text>;
  }

  const index = text.indexOf(highlightText);
  if (index === -1) {
    return <Text style={textStyle}>{text}</Text>;
  }

  const before = text.substring(0, index);
  const match = highlightText;
  const after = text.substring(index + highlightText.length);

  const highlightStyle = highlightColor
    ? { fontWeight: 700 as const, color: highlightColor }
    : { fontWeight: 700 as const };

  return (
    <Text style={textStyle}>
      {before}
      <Text style={highlightStyle}>{match}</Text>
      {after}
    </Text>
  );
};

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

type ViewMode = 'card' | 'table' | 'tableSimple' | 'tableSimpleTest' | 'test' | 'testDefinition' | 'testAnswer' | 'testDefinitionAnswer';

// 팔레트 색상 타입 (HEX + opacity 분리)
interface PaletteColors {
  badgeBg: string;           // HEX 색상
  badgeBgOpacity: number;    // 배경 투명도
  badgeText: string;         // HEX 색상
  badgeTextOpacity: number;  // 텍스트 투명도
  badgeBorder: string;       // HEX 색상
  badgeBorderOpacity: number; // 테두리 투명도
}

// 기본 팔레트 (슬레이트) - ColorPaletteSelector와 동일해야 함
const defaultPalette: PaletteColors = {
  badgeBg: '#f1f5f9',
  badgeBgOpacity: 1,
  badgeText: '#000000',
  badgeTextOpacity: 1,
  badgeBorder: '#cbd5e1',
  badgeBorderOpacity: 1,
};

interface VocabularyPDFProps {
  data: VocabularyItem[];
  headerInfo: HeaderInfo;
  viewMode?: ViewMode;
  unitNumber?: number;
  showPageNumber?: boolean;  // 페이지 번호 표시 여부 (청크 병합 시 false)
  allData?: VocabularyItem[];  // 오답 선택지 생성용 전체 데이터 (청크 분할 시 필요)
  paletteColors?: PaletteColors;  // 컬러 팔레트 (뱃지 색상)
  fontScale?: number;  // 글씨 크기 스케일 (1 = 기본, 1.15 = 보통, 1.3 = 크게)
}

// seed 기반 랜덤 함수 (웹 미리보기와 동일)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 동의어 테스트 문제 생성 함수
function generateTestQuestions(data: VocabularyItem[], unitNumber?: number) {
  return data.map((item) => {
    const baseSeed = (unitNumber || 0) * 10000 + item.id;
    const correctSynonyms = item.synonyms.slice(0, Math.min(3, item.synonyms.length));
    const distractors: Array<{ word: string; meaning: string }> = [];

    const otherWords = data.filter(d => d.id !== item.id);
    for (const other of otherWords) {
      distractors.push({ word: other.word, meaning: other.meaning });
      other.synonyms.forEach(syn => {
        distractors.push({ word: syn, meaning: `(${other.word}의 동의어)` });
      });
    }

    const shuffledDistractors = seededShuffle(distractors, baseSeed);
    const selectedDistractors = shuffledDistractors.slice(0, 4);

    const allChoices = [
      ...correctSynonyms.map(syn => ({ word: syn, isCorrect: true, meaning: '' })),
      ...selectedDistractors.map(d => ({ word: d.word, isCorrect: false, meaning: d.meaning }))
    ];

    return {
      id: item.id,
      word: item.word,
      meaning: item.meaning,
      definition: item.definition,
      correctSynonyms,
      allChoices: seededShuffle(allChoices, baseSeed * 1000)
    };
  });
}

// 영영정의 테스트 문제 생성 함수 (웹 미리보기와 동일)
function generateDefinitionTestQuestions(data: VocabularyItem[], unitNumber?: number) {
  return data.map((item) => {
    const correctDefinition = item.definition || '';
    const distractors: Array<{ definition: string; sourceWord: string; sourceMeaning: string }> = [];

    const otherWords = data.filter(d => d.id !== item.id && d.definition);
    for (const other of otherWords) {
      if (other.definition) {
        distractors.push({
          definition: other.definition,
          sourceWord: other.word,
          sourceMeaning: other.meaning
        });
      }
    }

    // 시드 기반으로 오답 선택 (3개) - item.id와 unitNumber를 시드로 사용
    const baseSeed = (unitNumber || 0) * 10000 + item.id;
    const shuffledDistractors = seededShuffle(distractors, baseSeed);
    const selectedDistractors = shuffledDistractors.slice(0, 3);

    // 정답과 오답 합치기
    const allChoices = [
      { definition: correctDefinition, isCorrect: true, sourceWord: '', sourceMeaning: item.meaning },
      ...selectedDistractors.map(d => ({
        definition: d.definition,
        isCorrect: false,
        sourceWord: d.sourceWord,
        sourceMeaning: d.sourceMeaning
      }))
    ];

    // 시드 기반으로 섞기
    const shuffledChoices = seededShuffle(allChoices, baseSeed * 1000);

    return {
      id: item.id,
      word: item.word,
      meaning: item.meaning,
      correctDefinition,
      allChoices: shuffledChoices
    };
  });
}

// 동적 스타일 타입
type DynamicStyles = ReturnType<typeof createDynamicStyles>;

// ===== 카드 컴포넌트 =====
const VocabularyCardPDF = ({ item, dynamicStyles, textColor }: { item: VocabularyItem; dynamicStyles: DynamicStyles; textColor: string }) => (
  <View style={dynamicStyles.cardDynamic} wrap={false}>
    {/* Top section */}
    <View style={styles.cardTop}>
      {/* Left: Word */}
      <View style={styles.cardLeft}>
        <View style={dynamicStyles.idBadgeContainerDynamic}>
          <Text style={dynamicStyles.idBadgeDynamic}>{String(item.id).padStart(3, '0')}</Text>
        </View>
        <Text style={dynamicStyles.wordDynamic}>{item.word}</Text>
        {item.pronunciation && (
          <Text style={dynamicStyles.pronunciationDynamic}>{item.pronunciation}</Text>
        )}
      </View>

      {/* Right: Meaning & Examples */}
      <View style={styles.cardRight}>
        <View style={styles.cardRightContent}>
          <View style={styles.meaningContainer}>
            <Text style={dynamicStyles.meaningDynamic}>
              <Text style={dynamicStyles.partOfSpeechDynamic}>{item.partOfSpeech} </Text>
              {item.meaning}
            </Text>
            {item.definition && (
              <Text style={dynamicStyles.definitionDynamic}>{item.definition}</Text>
            )}
          </View>
          <View style={styles.exampleContainer}>
            {renderHighlightedExample(item.example, item.word, dynamicStyles.exampleDynamic, textColor)}
            {renderHighlightedTranslation(item.translation, item.translationHighlight, dynamicStyles.translationDynamic, textColor)}
          </View>
        </View>
        <View style={styles.checkboxContainer}>
          <View style={dynamicStyles.checkboxDynamic} />
          <View style={dynamicStyles.checkboxDynamic} />
          <View style={dynamicStyles.checkboxDynamic} />
        </View>
      </View>
    </View>

    {/* Bottom section */}
    <View style={styles.cardBottom}>
      {/* Left: Derivatives */}
      <View style={styles.derivativesContainer}>
        {item.derivatives.map((der, idx) => (
          <View key={idx} style={styles.derivative}>
            <Text style={dynamicStyles.derivativeWordDynamic}>{der.word}</Text>
            {der.partOfSpeech && (
              <Text style={dynamicStyles.derivativePosDynamic}>{der.partOfSpeech}</Text>
            )}
            <Text style={dynamicStyles.derivativeMeaningDynamic}>{der.meaning}</Text>
          </View>
        ))}
      </View>

      {/* Right: Synonyms, Antonyms, Etymology */}
      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <View style={dynamicStyles.infoBadgeContainerDynamic}>
            <Text style={dynamicStyles.infoBadgeDynamic}>동</Text>
          </View>
          <Text style={dynamicStyles.infoTextDynamic}>{item.synonyms.join(', ')}</Text>
        </View>
        <View style={styles.infoSection}>
          <View style={dynamicStyles.infoBadgeContainerDynamic}>
            <Text style={dynamicStyles.infoBadgeDynamic}>반</Text>
          </View>
          <Text style={dynamicStyles.infoTextDynamic}>{item.antonyms.join(', ')}</Text>
        </View>
        <View style={styles.infoSectionWide}>
          <View style={dynamicStyles.infoBadgeContainerDynamic}>
            <Text style={dynamicStyles.infoBadgeDynamic}>Tip</Text>
          </View>
          <Text style={dynamicStyles.infoTextDynamic}>{item.etymology}</Text>
        </View>
      </View>
    </View>
  </View>
);

// ===== 표버전 컴포넌트 =====
const VocabularyTableRowPDF = ({ item, dynamicStyles, textColor }: { item: VocabularyItem; dynamicStyles: DynamicStyles; textColor: string }) => (
  <View style={styles.tableRow} wrap={false}>
    <View style={styles.tableColId}>
      <View style={dynamicStyles.idBadgeContainerDynamic}>
        <Text style={dynamicStyles.idBadgeDynamic}>{String(item.id).padStart(3, '0')}</Text>
      </View>
    </View>
    <View style={styles.tableColWord}>
      <Text style={[dynamicStyles.tableWordDynamic, { color: textColor }]}>{item.word}</Text>
      {item.pronunciation && (
        <Text style={dynamicStyles.pronunciationTableDynamic}>{item.pronunciation}</Text>
      )}
      {item.derivatives.map((der, idx) => (
        <View key={idx} style={styles.tableDerivative}>
          <Text style={dynamicStyles.tableDerivativeWordDynamic}>{der.word}</Text>
          <Text style={dynamicStyles.tableDerivativeMeaningDynamic}>
            {der.partOfSpeech && `${der.partOfSpeech} `}{der.meaning}
          </Text>
        </View>
      ))}
    </View>
    <View style={styles.tableColMeaning}>
      <Text style={dynamicStyles.tableMeaningDynamic}>{item.meaning}</Text>
      {item.definition && <Text style={dynamicStyles.tableDefinitionDynamic}>{item.definition}</Text>}
      {renderHighlightedExample(item.example, item.word, dynamicStyles.tableExampleDynamic, textColor)}
      {renderHighlightedTranslation(item.translation, item.translationHighlight, dynamicStyles.tableTranslationDynamic, textColor)}
    </View>
    <View style={styles.tableColSyn}>
      <View style={dynamicStyles.infoBadgeContainerDynamic}>
        <Text style={dynamicStyles.infoBadgeDynamic}>동</Text>
      </View>
      <Text style={dynamicStyles.infoTextDynamic}>{item.synonyms.join(', ')}</Text>
    </View>
    <View style={styles.tableColAnt}>
      <View style={dynamicStyles.infoBadgeContainerDynamic}>
        <Text style={dynamicStyles.infoBadgeDynamic}>반</Text>
      </View>
      <Text style={dynamicStyles.infoTextDynamic}>{item.antonyms.join(', ')}</Text>
    </View>
  </View>
);

// ===== 간단버전 컴포넌트 =====
const VocabularySimpleRowPDF = ({ left, right, dynamicStyles }: { left: VocabularyItem; right: VocabularyItem | null; dynamicStyles: DynamicStyles }) => (
  <View style={dynamicStyles.simpleRowDynamic} wrap={false}>
    <View style={styles.simpleColId}>
      <View style={dynamicStyles.idBadgeContainerDynamic}>
        <Text style={dynamicStyles.idBadgeDynamic}>{String(left.id).padStart(3, '0')}</Text>
      </View>
    </View>
    <View style={styles.simpleColWord}>
      <Text style={dynamicStyles.simpleWordDynamic}>{left.word}</Text>
    </View>
    <View style={styles.simpleColMeaning}>
      <Text style={dynamicStyles.simpleMeaningDynamic}>{left.meaning}</Text>
    </View>
    {right ? (
      <>
        <View style={styles.simpleColId}>
          <View style={dynamicStyles.idBadgeContainerDynamic}>
            <Text style={dynamicStyles.idBadgeDynamic}>{String(right.id).padStart(3, '0')}</Text>
          </View>
        </View>
        <View style={styles.simpleColWord}>
          <Text style={dynamicStyles.simpleWordDynamic}>{right.word}</Text>
        </View>
        <View style={styles.simpleColMeaning}>
          <Text style={dynamicStyles.simpleMeaningDynamic}>{right.meaning}</Text>
        </View>
      </>
    ) : (
      <>
        <View style={styles.simpleColId} />
        <View style={styles.simpleColWord} />
        <View style={styles.simpleColMeaning} />
      </>
    )}
  </View>
);

// ===== 테스트용 간단버전 컴포넌트 (뜻 숨김) =====
const VocabularySimpleTestRowPDF = ({ left, right, dynamicStyles }: { left: VocabularyItem; right: VocabularyItem | null; dynamicStyles: DynamicStyles }) => (
  <View style={dynamicStyles.simpleRowDynamic} wrap={false}>
    <View style={styles.simpleColId}>
      <View style={dynamicStyles.idBadgeContainerDynamic}>
        <Text style={dynamicStyles.idBadgeDynamic}>{String(left.id).padStart(3, '0')}</Text>
      </View>
    </View>
    <View style={styles.simpleColWord}>
      <Text style={dynamicStyles.simpleWordDynamic}>{left.word}</Text>
    </View>
    <View style={styles.simpleColMeaning}>
      <View style={dynamicStyles.simpleMeaningLineDynamic} />
    </View>
    {right ? (
      <>
        <View style={styles.simpleColId}>
          <View style={dynamicStyles.idBadgeContainerDynamic}>
            <Text style={dynamicStyles.idBadgeDynamic}>{String(right.id).padStart(3, '0')}</Text>
          </View>
        </View>
        <View style={styles.simpleColWord}>
          <Text style={dynamicStyles.simpleWordDynamic}>{right.word}</Text>
        </View>
        <View style={styles.simpleColMeaning}>
          <View style={dynamicStyles.simpleMeaningLineDynamic} />
        </View>
      </>
    ) : (
      <>
        <View style={styles.simpleColId} />
        <View style={styles.simpleColWord} />
        <View style={styles.simpleColMeaning} />
      </>
    )}
  </View>
);

// ===== 동의어 테스트지 컴포넌트 =====
const VocabularyTestRowPDF = ({ left, right, allData, unitNumber, dynamicStyles }: {
  left: VocabularyItem;
  right: VocabularyItem | null;
  allData: VocabularyItem[];
  unitNumber?: number;
  dynamicStyles: DynamicStyles;
}) => {
  const questions = generateTestQuestions(allData, unitNumber);
  const leftQ = questions.find(q => q.id === left.id);
  const rightQ = right ? questions.find(q => q.id === right.id) : null;

  return (
    <View style={dynamicStyles.testRowDynamic} wrap={false}>
      <View style={dynamicStyles.testColDynamic}>
        <View style={styles.testHeader}>
          <View style={dynamicStyles.idBadgeContainerDynamic}>
            <Text style={dynamicStyles.idBadgeDynamic}>{String(left.id).padStart(3, '0')}</Text>
          </View>
          <Text style={dynamicStyles.testWordDynamic}>{left.word}</Text>
          <Text style={dynamicStyles.testMeaningLabelDynamic}>뜻:</Text>
          <View style={dynamicStyles.testMeaningLineDynamic} />
        </View>
        <View style={styles.testChoices}>
          {leftQ?.allChoices.map((choice, idx) => (
            <View key={idx} style={styles.testChoice}>
              <Text style={dynamicStyles.testCheckboxDynamic}>□</Text>
              <Text style={dynamicStyles.testChoiceTextDynamic}>{choice.word}</Text>
            </View>
          ))}
        </View>
      </View>
      {rightQ ? (
        <View style={dynamicStyles.testColRightDynamic}>
          <View style={styles.testHeader}>
            <View style={dynamicStyles.idBadgeContainerDynamic}>
              <Text style={dynamicStyles.idBadgeDynamic}>{String(right!.id).padStart(3, '0')}</Text>
            </View>
            <Text style={dynamicStyles.testWordDynamic}>{right!.word}</Text>
            <Text style={dynamicStyles.testMeaningLabelDynamic}>뜻:</Text>
            <View style={dynamicStyles.testMeaningLineDynamic} />
          </View>
          <View style={styles.testChoices}>
            {rightQ.allChoices.map((choice, idx) => (
              <View key={idx} style={styles.testChoice}>
                <Text style={dynamicStyles.testCheckboxDynamic}>□</Text>
                <Text style={dynamicStyles.testChoiceTextDynamic}>{choice.word}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={dynamicStyles.testColRightDynamic} />
      )}
    </View>
  );
};

// ===== 영영정의 테스트지 컴포넌트 (4지선다) =====
const VocabularyDefTestRowPDF = ({ left, right, allData, unitNumber, dynamicStyles }: {
  left: VocabularyItem;
  right: VocabularyItem | null;
  allData: VocabularyItem[];
  unitNumber?: number;
  dynamicStyles: DynamicStyles;
}) => {
  const questions = generateDefinitionTestQuestions(allData, unitNumber);
  const leftQ = questions.find(q => q.id === left.id);
  const rightQ = right ? questions.find(q => q.id === right.id) : null;

  // borderColor 계산 (dynamicStyles에서 가져오기)
  const borderColor = dynamicStyles.testRowDynamic.borderBottomColor;

  const renderTestContent = (q: typeof leftQ, item: VocabularyItem) => (
    <>
      <View style={styles.testHeader}>
        <View style={dynamicStyles.idBadgeContainerDynamic}>
          <Text style={dynamicStyles.idBadgeDynamic}>{String(item.id).padStart(3, '0')}</Text>
        </View>
        <Text style={dynamicStyles.testWordDynamic}>{item.word}</Text>
      </View>
      {/* 뜻 쓰는 칸 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 6.5, color: '#000000', marginRight: 4 }}>뜻:</Text>
        <View style={dynamicStyles.testMeaningLineDynamic} />
      </View>
      {/* 4지선다 */}
      {q?.allChoices.map((choice, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 }}>
          <View style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
            marginTop: 1
          }}>
            <Text style={{ fontSize: 6, color: '#000000' }}>{idx + 1}</Text>
          </View>
          <Text style={{ fontSize: 7, color: '#000000', flex: 1 }}>{choice.definition}</Text>
        </View>
      ))}
    </>
  );

  return (
    <View style={dynamicStyles.testRowDynamic} wrap={false}>
      <View style={dynamicStyles.testColDynamic}>
        {renderTestContent(leftQ, left)}
      </View>
      {right ? (
        <View style={dynamicStyles.testColRightDynamic}>
          {renderTestContent(rightQ, right)}
        </View>
      ) : (
        <View style={dynamicStyles.testColRightDynamic} />
      )}
    </View>
  );
};

// ===== 동의어 답지 컴포넌트 =====
const VocabularyAnswerRowPDF = ({ left, right, allData, unitNumber, dynamicStyles }: {
  left: VocabularyItem;
  right: VocabularyItem | null;
  allData: VocabularyItem[];
  unitNumber?: number;
  dynamicStyles: DynamicStyles;
}) => {
  const questions = generateTestQuestions(allData, unitNumber);
  const leftQ = questions.find(q => q.id === left.id);
  const rightQ = right ? questions.find(q => q.id === right.id) : null;

  const renderAnswerContent = (q: typeof leftQ, item: VocabularyItem) => (
    <>
      <View style={styles.testHeader}>
        <View style={dynamicStyles.idBadgeContainerDynamic}>
          <Text style={dynamicStyles.idBadgeDynamic}>{String(item.id).padStart(3, '0')}</Text>
        </View>
        <Text style={dynamicStyles.testWordDynamic}>{item.word}</Text>
      </View>
      {/* 뜻 */}
      <Text style={dynamicStyles.answerMeaningLabelDynamic}>뜻: {item.meaning}</Text>
      {/* 동의어 정답 */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <Text style={dynamicStyles.answerSynonymLabelDynamic}>동의어: </Text>
        <Text style={dynamicStyles.answerSynonymValueDynamic}>
          {q?.allChoices.filter(c => c.isCorrect).map(c => c.word).join(', ')}
        </Text>
      </View>
      {/* 오답 설명 */}
      {q?.allChoices.filter(c => !c.isCorrect).map((choice, idx) => (
        <View key={idx} style={styles.answerWrongItem}>
          <Text style={dynamicStyles.answerWrongXDynamic}>✗</Text>
          <Text style={dynamicStyles.answerWrongTextDynamic}>{choice.word}: {choice.meaning}</Text>
        </View>
      ))}
    </>
  );

  return (
    <View style={dynamicStyles.testRowDynamic} wrap={false}>
      <View style={dynamicStyles.testColDynamic}>
        {renderAnswerContent(leftQ, left)}
      </View>
      {right && rightQ ? (
        <View style={dynamicStyles.testColRightDynamic}>
          {renderAnswerContent(rightQ, right)}
        </View>
      ) : (
        <View style={dynamicStyles.testColRightDynamic} />
      )}
    </View>
  );
};

// ===== 영영정의 답지 컴포넌트 (4지선다 정답 표시) =====
const VocabularyDefAnswerRowPDF = ({ left, right, allData, unitNumber, dynamicStyles }: {
  left: VocabularyItem;
  right: VocabularyItem | null;
  allData: VocabularyItem[];
  unitNumber?: number;
  dynamicStyles: DynamicStyles;
}) => {
  const questions = generateDefinitionTestQuestions(allData, unitNumber);
  const leftQ = questions.find(q => q.id === left.id);
  const rightQ = right ? questions.find(q => q.id === right.id) : null;
  // borderColor 계산 (dynamicStyles에서 가져오기)
  const borderColor = dynamicStyles.testRowDynamic.borderBottomColor;

  const renderAnswerContent = (q: typeof leftQ, item: VocabularyItem) => (
    <>
      <View style={styles.testHeader}>
        <View style={dynamicStyles.idBadgeContainerDynamic}>
          <Text style={dynamicStyles.idBadgeDynamic}>{String(item.id).padStart(3, '0')}</Text>
        </View>
        <Text style={dynamicStyles.testWordDynamic}>{item.word}</Text>
      </View>
      {/* 뜻 */}
      <Text style={dynamicStyles.answerMeaningLabelDynamic}>뜻: {item.meaning}</Text>
      {/* 4지선다 정답/오답 표시 */}
      {q?.allChoices.map((choice, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
          <View style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: choice.isCorrect ? '#3b82f6' : borderColor,
            backgroundColor: choice.isCorrect ? '#eff6ff' : '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
            marginTop: 1
          }}>
            <Text style={{ fontSize: 6, color: choice.isCorrect ? '#3b82f6' : '#000000', fontWeight: choice.isCorrect ? 700 : 400 }}>{idx + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: choice.isCorrect ? '#3b82f6' : '#000000', fontWeight: choice.isCorrect ? 700 : 400 }}>
              {choice.definition}
            </Text>
            {choice.isCorrect && choice.sourceMeaning && (
              <Text style={{ fontSize: 6, color: '#3b82f6', fontWeight: 600 }}>({choice.sourceMeaning})</Text>
            )}
            {!choice.isCorrect && choice.sourceMeaning && (
              <Text style={{ fontSize: 6, color: '#000000' }}>({choice.sourceMeaning})</Text>
            )}
          </View>
        </View>
      ))}
    </>
  );

  return (
    <View style={dynamicStyles.testRowDynamic} wrap={false}>
      <View style={dynamicStyles.testColDynamic}>
        {renderAnswerContent(leftQ, left)}
      </View>
      {right ? (
        <View style={dynamicStyles.testColRightDynamic}>
          {renderAnswerContent(rightQ, right)}
        </View>
      ) : (
        <View style={dynamicStyles.testColRightDynamic} />
      )}
    </View>
  );
};

// 데이터를 2개씩 묶는 헬퍼 함수
function pairData<T>(data: T[]): Array<{ left: T; right: T | null }> {
  const pairs: Array<{ left: T; right: T | null }> = [];
  for (let i = 0; i < data.length; i += 2) {
    pairs.push({ left: data[i], right: data[i + 1] || null });
  }
  return pairs;
}

// HEX + opacity를 흰색 배경에 혼합한 불투명 색상으로 변환
// @react-pdf/renderer가 알파 채널을 제대로 지원하지 않아 색상 혼합으로 투명도 시뮬레이션
const blendWithWhite = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // 흰색(255)과 혼합: result = color * opacity + white * (1 - opacity)
  const blendedR = Math.round(r * opacity + 255 * (1 - opacity));
  const blendedG = Math.round(g * opacity + 255 * (1 - opacity));
  const blendedB = Math.round(b * opacity + 255 * (1 - opacity));

  // HEX 문자열로 반환
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(blendedR)}${toHex(blendedG)}${toHex(blendedB)}`;
};

// 동적 스타일 생성 함수 (fontScale 추가)
const createDynamicStyles = (palette: PaletteColors, fontScale: number = 1) => {
  // 흰색 배경에 혼합된 불투명 색상으로 투명도 시뮬레이션
  const bgColor = blendWithWhite(palette.badgeBg, palette.badgeBgOpacity);
  const borderColor = blendWithWhite(palette.badgeBorder, palette.badgeBorderOpacity);
  const textColor = blendWithWhite(palette.badgeText, palette.badgeTextOpacity);

  // fontSize에 스케일 적용하는 헬퍼
  const scaled = (size: number) => size * fontScale;

  return StyleSheet.create({
    // 헤더 타이틀 (동적 팔레트)
    headerTitleDynamic: {
      fontSize: scaled(10),
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: textColor,
      backgroundColor: bgColor,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 0,
      borderWidth: 0.5,
      borderColor: borderColor,
      textAlign: 'center',
    },
    // 헤더 설명 (스케일 적용)
    headerDescriptionDynamic: {
      fontSize: scaled(8),
      color: '#4b5563',
      marginTop: 6,
    },
    // ID 배지 컨테이너 (동적 팔레트)
    idBadgeContainerDynamic: {
      backgroundColor: bgColor,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: borderColor,
      marginBottom: 6,
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 20,
    },
    // ID 배지 텍스트 (동적 팔레트)
    idBadgeDynamic: {
      fontSize: scaled(6),
      fontWeight: 700,
      color: textColor,
      textAlign: 'center',
    },
    // 정보 배지 컨테이너 (동, 반, Tip) (동적 팔레트)
    infoBadgeContainerDynamic: {
      backgroundColor: bgColor,
      paddingHorizontal: 3,
      paddingVertical: 1.5,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: borderColor,
      marginBottom: 3,
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 14,
    },
    // 정보 배지 텍스트 (동, 반, Tip) (동적 팔레트)
    infoBadgeDynamic: {
      fontSize: scaled(6),
      fontWeight: 700,
      color: textColor,
      textAlign: 'center',
    },
    // Unit 배지 (동적 팔레트)
    unitBadgeDynamic: {
      position: 'absolute',
      top: 0,
      left: 0,
      fontSize: scaled(8),
      color: textColor,
      backgroundColor: bgColor,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      fontWeight: 700,
      borderWidth: 0.5,
      borderColor: borderColor,
    },
    // 단어 (동적 팔레트)
    wordDynamic: {
      fontSize: scaled(16),
      fontWeight: 700,
      color: textColor,
      marginBottom: 1.5,
      letterSpacing: -0.2,
    },
    // 발음기호 (원래 회색)
    pronunciationDynamic: {
      fontSize: scaled(8),
      color: '#9ca3af',
      marginTop: -1,
    },
    // 발음기호 테이블용 (원래 회색)
    pronunciationTableDynamic: {
      fontSize: scaled(7),
      color: '#9ca3af',
      marginTop: -1,
    },
    // 체크박스 (동적 팔레트 - borderColor 사용)
    checkboxDynamic: {
      width: 6,
      height: 6,
      borderWidth: 1,
      borderColor: borderColor,
    },
    // 카드 테두리 (동적 팔레트 - borderColor 사용)
    cardDynamic: {
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 6,
      backgroundColor: '#ffffff',
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 14,
      paddingRight: 14,
      marginBottom: 10,
    },
    // ===== 카드 텍스트 스타일 (스케일 적용) =====
    partOfSpeechDynamic: {
      fontSize: scaled(7),
      fontWeight: 700,
      color: '#9ca3af',
    },
    meaningDynamic: {
      fontSize: scaled(10),
      color: '#000000',
      lineHeight: 1.4,
    },
    definitionDynamic: {
      fontSize: scaled(8),
      color: '#6b7280',
      marginTop: 2,
      lineHeight: 1.3,
      fontStyle: 'italic',
    },
    exampleDynamic: {
      fontSize: scaled(9),
      color: '#000000',
      marginBottom: 2,
      lineHeight: 1.4,
    },
    translationDynamic: {
      fontSize: scaled(7.5),
      color: '#4b5563',
      lineHeight: 1.3,
    },
    derivativeWordDynamic: {
      fontSize: scaled(8),
      color: '#1f2937',
      fontWeight: 700,
    },
    derivativePosDynamic: {
      fontSize: scaled(6),
      color: '#9ca3af',
    },
    derivativeMeaningDynamic: {
      fontSize: scaled(7),
      color: '#6b7280',
    },
    infoTextDynamic: {
      fontSize: scaled(8),
      color: '#4b5563',
      lineHeight: 1.3,
    },
    // ===== 표버전 스타일 (스케일 적용) =====
    tableWordDynamic: {
      fontSize: scaled(10),
      fontWeight: 700,
      color: '#000000',
      marginBottom: 3,
    },
    tableDerivativeWordDynamic: {
      fontSize: scaled(8),
      color: '#1f2937',
    },
    tableDerivativeMeaningDynamic: {
      fontSize: scaled(6),
      color: '#6b7280',
    },
    tableMeaningDynamic: {
      fontSize: scaled(8.5),
      color: '#000000',
      lineHeight: 1.25,
      marginBottom: 3,
    },
    tableDefinitionDynamic: {
      fontSize: scaled(6.5),
      color: '#6b7280',
      fontStyle: 'italic',
      lineHeight: 1.25,
      marginBottom: 3,
    },
    tableExampleDynamic: {
      fontSize: scaled(7),
      color: '#000000',
      lineHeight: 1.25,
      marginBottom: 3,
    },
    tableTranslationDynamic: {
      fontSize: scaled(6.5),
      color: '#4b5563',
      lineHeight: 1.25,
    },
    // ===== 간단버전 스타일 (스케일 적용) =====
    simpleRowDynamic: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      paddingVertical: 6,
    },
    simpleWordDynamic: {
      fontSize: scaled(10),
      fontWeight: 700,
      color: '#000000',
    },
    simpleMeaningDynamic: {
      fontSize: scaled(7),
      color: '#000000',
    },
    simpleMeaningLineDynamic: {
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      height: 14,
      width: '90%',
    },
    // ===== 테스트지 스타일 (스케일 적용) =====
    testWordDynamic: {
      fontSize: scaled(10),
      fontWeight: 700,
      color: '#000000',
    },
    testMeaningLabelDynamic: {
      fontSize: scaled(6.5),
      color: '#000000',
      paddingTop: 3,
    },
    testCheckboxDynamic: {
      fontSize: scaled(8),
      color: '#000000',
      marginRight: 4,
    },
    testChoiceTextDynamic: {
      fontSize: scaled(8.5),
      color: '#000000',
    },
    // 테스트지 행 스타일 (동적 border 색상)
    testRowDynamic: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      paddingVertical: 8,
    },
    // 테스트지 왼쪽 열
    testColDynamic: {
      width: '50%',
      paddingHorizontal: 12,
      paddingBottom: 16,
    },
    // 테스트지 오른쪽 열 (세로 구분선)
    testColRightDynamic: {
      width: '50%',
      paddingHorizontal: 12,
      paddingBottom: 16,
      borderLeftWidth: 1,
      borderLeftColor: borderColor,
    },
    // 테스트지 뜻 답안란
    testMeaningLineDynamic: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      minHeight: 14,
    },
    // ===== 영영정의 테스트지 스타일 (스케일 적용) =====
    defTestDefinitionDynamic: {
      fontSize: scaled(6.5),
      color: '#000000',
      fontStyle: 'italic',
      marginBottom: 3,
    },
    // ===== 답지 스타일 (스케일 적용) =====
    answerCorrectDynamic: {
      fontSize: scaled(10),
      color: '#059669',
      fontWeight: 700,
    },
    answerMeaningLabelDynamic: {
      fontSize: scaled(10),
      color: '#000000',
      marginBottom: 4,
    },
    answerSynonymLabelDynamic: {
      fontSize: scaled(10),
      color: '#000000',
    },
    answerSynonymValueDynamic: {
      fontSize: scaled(10),
      color: '#000000',
      fontWeight: 700,
    },
    answerWrongXDynamic: {
      fontSize: scaled(9),
      color: '#dc2626',
      marginRight: 3,
    },
    answerWrongTextDynamic: {
      fontSize: scaled(9),
      color: '#000000',
    },
    // ===== 푸터 스타일 (스케일 적용) =====
    footerTextDynamic: {
      fontSize: scaled(6),
      color: '#4b5563',
    },
    pageNumberDynamic: {
      position: 'absolute',
      bottom: 20,
      right: 30,
      fontSize: scaled(6),
      color: '#9ca3af',
    },
  });
};

// 메인 PDF 문서
export const VocabularyPDF = ({ data, headerInfo, viewMode = 'card', unitNumber, showPageNumber = true, allData, paletteColors, fontScale = 1 }: VocabularyPDFProps) => {
  const pairedData = pairData(data);
  // 오답 선택지 생성용 전체 데이터 (allData가 없으면 data 사용)
  const fullData = allData || data;
  // 팔레트 색상 (없으면 기본값 사용)
  const palette = paletteColors || defaultPalette;
  // 동적 스타일 생성 (fontScale 전달)
  const dynamicStyles = createDynamicStyles(palette, fontScale);
  // 텍스트 색상 (문장 내 단어 하이라이트용)
  const textColor = blendWithWhite(palette.badgeText, palette.badgeTextOpacity);
  // fontSize 스케일 헬퍼
  const scaled = (size: number) => size * fontScale;

  // 콘텐츠 렌더링 함수
  const renderContent = () => {
    switch (viewMode) {
      case 'table':
        return data.map((item) => <VocabularyTableRowPDF key={item.id} item={item} dynamicStyles={dynamicStyles} textColor={textColor} />);

      case 'tableSimple':
        return pairedData.map((pair, idx) => (
          <VocabularySimpleRowPDF key={idx} left={pair.left} right={pair.right} dynamicStyles={dynamicStyles} />
        ));

      case 'tableSimpleTest':
        return pairedData.map((pair, idx) => (
          <VocabularySimpleTestRowPDF key={idx} left={pair.left} right={pair.right} dynamicStyles={dynamicStyles} />
        ));

      case 'test':
        return pairedData.map((pair, idx) => (
          <VocabularyTestRowPDF key={idx} left={pair.left} right={pair.right} allData={fullData} unitNumber={unitNumber} dynamicStyles={dynamicStyles} />
        ));

      case 'testDefinition':
        return pairedData.map((pair, idx) => (
          <VocabularyDefTestRowPDF key={idx} left={pair.left} right={pair.right} allData={fullData} unitNumber={unitNumber} dynamicStyles={dynamicStyles} />
        ));

      case 'testAnswer':
        return pairedData.map((pair, idx) => (
          <VocabularyAnswerRowPDF key={idx} left={pair.left} right={pair.right} allData={fullData} unitNumber={unitNumber} dynamicStyles={dynamicStyles} />
        ));

      case 'testDefinitionAnswer':
        return pairedData.map((pair, idx) => (
          <VocabularyDefAnswerRowPDF key={idx} left={pair.left} right={pair.right} allData={fullData} unitNumber={unitNumber} dynamicStyles={dynamicStyles} />
        ));

      case 'card':
      default:
        return data.map((item) => <VocabularyCardPDF key={item.id} item={item} dynamicStyles={dynamicStyles} textColor={textColor} />);
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {headerInfo.headerTitle && (
          <View style={styles.header}>
            {unitNumber && (
              <Text style={dynamicStyles.unitBadgeDynamic}>Unit {unitNumber}</Text>
            )}
            <Text style={dynamicStyles.headerTitleDynamic}>{headerInfo.headerTitle}</Text>
            {headerInfo.headerDescription && (
              <Text style={styles.headerDescription}>
                {headerInfo.headerDescription}
              </Text>
            )}
          </View>
        )}

        {/* Content based on viewMode */}
        {renderContent()}

        {/* Footer */}
        {headerInfo.footerLeft && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{headerInfo.footerLeft}</Text>
          </View>
        )}

        {/* Page Number - 청크 병합 시 숨김 */}
        {showPageNumber && (
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
            fixed
          />
        )}
      </Page>
    </Document>
  );
};

export default VocabularyPDF;
export type { PaletteColors };
