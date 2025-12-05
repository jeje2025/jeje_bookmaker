import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// 한글 폰트 등록 (Pretendard - 더 안정적인 CDN)
Font.register({
  family: 'Pretendard',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
      fontWeight: 400,
      fontStyle: 'italic',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf',
      fontWeight: 700,
    },
  ],
});

// Hyphenation 비활성화 (한글에 불필요)
Font.registerHyphenationCallback((word) => [word]);

// A4 사이즈 스타일 - 브라우저 VocabularyCard.tsx와 동일하게 맞춤
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 35,
    fontFamily: 'Pretendard',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  headerDescription: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 8,
  },
  // 카드 스타일 - VocabularyCard.tsx와 매칭
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 28,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cardLeft: {
    width: '28%',
  },
  cardRight: {
    width: '72%',
    flexDirection: 'row',
  },
  cardRightContent: {
    flex: 1,
  },
  // ID 배지 - 8px 폰트
  idBadge: {
    fontSize: 6,
    color: '#475569',
    backgroundColor: '#f1f5f9', // bg-slate-100
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0', // border-slate-200
    marginBottom: 6,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // 단어 - 22px bold
  word: {
    fontSize: 18,
    fontWeight: 700,
    color: '#000000',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  // 품사 - 10px bold gray
  partOfSpeech: {
    fontSize: 8,
    fontWeight: 700,
    color: '#9ca3af', // text-gray-400
  },
  // 의미 컨테이너
  meaningContainer: {
    marginBottom: 6,
  },
  // 의미 - 13px
  meaning: {
    fontSize: 11,
    color: '#000000',
    lineHeight: 1.4,
  },
  // 정의 - 10.5px italic gray
  definition: {
    fontSize: 8.5,
    color: '#6b7280', // text-gray-500
    marginTop: 2,
    lineHeight: 1.3,
  },
  // 예문 컨테이너 - 왼쪽 보더
  exampleContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db', // border-gray-300
    paddingLeft: 8,
  },
  // 예문 - 12px (text-xs)
  example: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  // 번역 - 10px gray
  translation: {
    fontSize: 8,
    color: '#4b5563', // text-gray-600
    lineHeight: 1.3,
  },
  // 체크박스
  checkboxContainer: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 10,
  },
  checkbox: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  // 하단 섹션
  cardBottom: {
    flexDirection: 'row',
  },
  // 파생어 컨테이너
  derivativesContainer: {
    width: '28%',
  },
  derivative: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 1,
  },
  // 파생어 단어 - 11px medium
  derivativeWord: {
    fontSize: 9,
    color: '#1f2937', // text-gray-800
  },
  // 파생어 품사 - 8px
  derivativePos: {
    fontSize: 6,
    color: '#9ca3af', // text-gray-400
  },
  // 파생어 의미 - 10px
  derivativeMeaning: {
    fontSize: 8,
    color: '#6b7280', // text-gray-500
  },
  // 정보 컨테이너 (동의어, 반의어, 어원)
  infoContainer: {
    width: '72%',
    flexDirection: 'row',
  },
  infoSection: {
    width: '25%',
  },
  infoSectionWide: {
    width: '50%',
  },
  // 정보 배지 (동, 반, Tip)
  infoBadge: {
    fontSize: 6,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 3,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // 정보 텍스트 - 10px
  infoText: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 12,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#4b5563',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 25,
    right: 35,
    fontSize: 8,
    color: '#9ca3af',
  },
  // ===== 표버전 스타일 =====
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
  },
  tableColId: {
    width: '5%',
    paddingHorizontal: 2,
  },
  tableColWord: {
    width: '18%',
    paddingHorizontal: 6,
  },
  tableColMeaning: {
    width: '42%',
    paddingHorizontal: 6,
  },
  tableColSyn: {
    width: '17%',
    paddingHorizontal: 6,
  },
  tableColAnt: {
    width: '18%',
    paddingHorizontal: 6,
  },
  tableWord: {
    fontSize: 12,
    fontWeight: 700,
    color: '#000000',
    marginBottom: 2,
  },
  tableDerivative: {
    marginTop: 2,
  },
  tableDerivativeWord: {
    fontSize: 9,
    color: '#1f2937',
  },
  tableDerivativeMeaning: {
    fontSize: 7,
    color: '#6b7280',
  },
  tableMeaning: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 2,
  },
  tableDefinition: {
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  tableExample: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 1,
  },
  tableTranslation: {
    fontSize: 8,
    color: '#4b5563',
  },
  // ===== 간단버전 스타일 =====
  simpleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 5,
  },
  simpleColId: {
    width: '6%',
    paddingHorizontal: 2,
  },
  simpleColWord: {
    width: '22%',
    paddingHorizontal: 6,
  },
  simpleColMeaning: {
    width: '22%',
    paddingHorizontal: 6,
  },
  simpleWord: {
    fontSize: 12,
    fontWeight: 700,
    color: '#000000',
  },
  simpleMeaning: {
    fontSize: 9,
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
    paddingHorizontal: 10,
  },
  testColRight: {
    width: '50%',
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  testWord: {
    fontSize: 12,
    fontWeight: 700,
    color: '#000000',
    marginRight: 8,
  },
  testMeaningLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginRight: 4,
    marginTop: 3,
  },
  testMeaningLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    height: 16,
  },
  testChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  testChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  testCheckbox: {
    fontSize: 10,
    color: '#9ca3af',
    marginRight: 4,
  },
  testChoiceText: {
    fontSize: 10,
    color: '#374151',
  },
  // ===== 영영정의 테스트지 스타일 =====
  defTestDefinition: {
    fontSize: 9,
    color: '#4b5563',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  defTestAnswerLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    height: 20,
    marginTop: 4,
  },
  // ===== 답지 스타일 =====
  answerCorrect: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 700,
  },
  answerMeaningLabel: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 4,
  },
  answerSynonymLabel: {
    fontSize: 10,
    color: '#4b5563',
  },
  answerSynonymValue: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 700,
  },
  answerWrongItem: {
    flexDirection: 'row',
    marginTop: 1,
  },
  answerWrongX: {
    fontSize: 9,
    color: '#dc2626',
    marginRight: 2,
  },
  answerWrongText: {
    fontSize: 9,
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

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

type ViewMode = 'card' | 'table' | 'tableSimple' | 'tableSimpleTest' | 'test' | 'testDefinition' | 'testAnswer' | 'testDefinitionAnswer';

interface VocabularyPDFProps {
  data: VocabularyItem[];
  headerInfo: HeaderInfo;
  viewMode?: ViewMode;
}

// seed 기반 랜덤 함수 (테스트지용)
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 테스트 문제 생성 함수
function generateTestQuestions(data: VocabularyItem[]) {
  return data.map((item) => {
    const correctSynonyms = item.synonyms.slice(0, Math.min(3, item.synonyms.length));
    const distractors: Array<{ word: string; meaning: string }> = [];

    const otherWords = data.filter(d => d.id !== item.id);
    for (const other of otherWords) {
      distractors.push({ word: other.word, meaning: other.meaning });
      other.synonyms.forEach(syn => {
        distractors.push({ word: syn, meaning: `(${other.word}의 동의어)` });
      });
    }

    const shuffledDistractors = seededShuffle(distractors, item.id);
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
      allChoices: seededShuffle(allChoices, item.id + 1000)
    };
  });
}

// ===== 카드 컴포넌트 =====
const VocabularyCardPDF = ({ item }: { item: VocabularyItem }) => (
  <View style={styles.card} wrap={false}>
    {/* Top section */}
    <View style={styles.cardTop}>
      {/* Left: Word */}
      <View style={styles.cardLeft}>
        <Text style={styles.idBadge}>{String(item.id).padStart(3, '0')}</Text>
        <Text style={styles.word}>{item.word}</Text>
      </View>

      {/* Right: Meaning & Examples */}
      <View style={styles.cardRight}>
        <View style={styles.cardRightContent}>
          <View style={styles.meaningContainer}>
            <Text style={styles.meaning}>
              <Text style={styles.partOfSpeech}>{item.partOfSpeech} </Text>
              {item.meaning}
            </Text>
            {item.definition && (
              <Text style={styles.definition}>{item.definition}</Text>
            )}
          </View>
          <View style={styles.exampleContainer}>
            <Text style={styles.example}>{item.example}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
          </View>
        </View>
        <View style={styles.checkboxContainer}>
          <View style={styles.checkbox} />
          <View style={styles.checkbox} />
          <View style={styles.checkbox} />
        </View>
      </View>
    </View>

    {/* Bottom section */}
    <View style={styles.cardBottom}>
      {/* Left: Derivatives */}
      <View style={styles.derivativesContainer}>
        {item.derivatives.map((der, idx) => (
          <View key={idx} style={styles.derivative}>
            <Text style={styles.derivativeWord}>{der.word}</Text>
            {der.partOfSpeech && (
              <Text style={styles.derivativePos}>{der.partOfSpeech}</Text>
            )}
            <Text style={styles.derivativeMeaning}>{der.meaning}</Text>
          </View>
        ))}
      </View>

      {/* Right: Synonyms, Antonyms, Etymology */}
      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.infoBadge}>동</Text>
          <Text style={styles.infoText}>{item.synonyms.join(', ')}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoBadge}>반</Text>
          <Text style={styles.infoText}>{item.antonyms.join(', ')}</Text>
        </View>
        <View style={styles.infoSectionWide}>
          <Text style={styles.infoBadge}>Tip</Text>
          <Text style={styles.infoText}>{item.etymology}</Text>
        </View>
      </View>
    </View>
  </View>
);

// ===== 표버전 컴포넌트 =====
const VocabularyTableRowPDF = ({ item }: { item: VocabularyItem }) => (
  <View style={styles.tableRow} wrap={false}>
    <View style={styles.tableColId}>
      <Text style={styles.idBadge}>{String(item.id).padStart(3, '0')}</Text>
    </View>
    <View style={styles.tableColWord}>
      <Text style={styles.tableWord}>{item.word}</Text>
      {item.derivatives.map((der, idx) => (
        <View key={idx} style={styles.tableDerivative}>
          <Text style={styles.tableDerivativeWord}>{der.word}</Text>
          <Text style={styles.tableDerivativeMeaning}>
            {der.partOfSpeech && `${der.partOfSpeech} `}{der.meaning}
          </Text>
        </View>
      ))}
    </View>
    <View style={styles.tableColMeaning}>
      <Text style={styles.tableMeaning}>{item.meaning}</Text>
      {item.definition && <Text style={styles.tableDefinition}>{item.definition}</Text>}
      <Text style={styles.tableExample}>{item.example}</Text>
      <Text style={styles.tableTranslation}>{item.translation}</Text>
    </View>
    <View style={styles.tableColSyn}>
      <Text style={styles.infoBadge}>동</Text>
      <Text style={styles.infoText}>{item.synonyms.join(', ')}</Text>
    </View>
    <View style={styles.tableColAnt}>
      <Text style={styles.infoBadge}>반</Text>
      <Text style={styles.infoText}>{item.antonyms.join(', ')}</Text>
    </View>
  </View>
);

// ===== 간단버전 컴포넌트 =====
const VocabularySimpleRowPDF = ({ left, right }: { left: VocabularyItem; right: VocabularyItem | null }) => (
  <View style={styles.simpleRow} wrap={false}>
    <View style={styles.simpleColId}>
      <Text style={styles.idBadge}>{String(left.id).padStart(3, '0')}</Text>
    </View>
    <View style={styles.simpleColWord}>
      <Text style={styles.simpleWord}>{left.word}</Text>
    </View>
    <View style={styles.simpleColMeaning}>
      <Text style={styles.simpleMeaning}>{left.meaning}</Text>
    </View>
    {right ? (
      <>
        <View style={styles.simpleColId}>
          <Text style={styles.idBadge}>{String(right.id).padStart(3, '0')}</Text>
        </View>
        <View style={styles.simpleColWord}>
          <Text style={styles.simpleWord}>{right.word}</Text>
        </View>
        <View style={styles.simpleColMeaning}>
          <Text style={styles.simpleMeaning}>{right.meaning}</Text>
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
const VocabularySimpleTestRowPDF = ({ left, right }: { left: VocabularyItem; right: VocabularyItem | null }) => (
  <View style={styles.simpleRow} wrap={false}>
    <View style={styles.simpleColId}>
      <Text style={styles.idBadge}>{String(left.id).padStart(3, '0')}</Text>
    </View>
    <View style={styles.simpleColWord}>
      <Text style={styles.simpleWord}>{left.word}</Text>
    </View>
    <View style={styles.simpleColMeaning}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#d1d5db', height: 14, width: '90%' }} />
    </View>
    {right ? (
      <>
        <View style={styles.simpleColId}>
          <Text style={styles.idBadge}>{String(right.id).padStart(3, '0')}</Text>
        </View>
        <View style={styles.simpleColWord}>
          <Text style={styles.simpleWord}>{right.word}</Text>
        </View>
        <View style={styles.simpleColMeaning}>
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#d1d5db', height: 14, width: '90%' }} />
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
const VocabularyTestRowPDF = ({ left, right, allData }: {
  left: VocabularyItem;
  right: VocabularyItem | null;
  allData: VocabularyItem[];
}) => {
  const questions = generateTestQuestions(allData);
  const leftQ = questions.find(q => q.id === left.id);
  const rightQ = right ? questions.find(q => q.id === right.id) : null;

  return (
    <View style={styles.testRow} wrap={false}>
      <View style={styles.testCol}>
        <View style={styles.testHeader}>
          <Text style={styles.idBadge}>{String(left.id).padStart(3, '0')}</Text>
          <Text style={styles.testWord}>{left.word}</Text>
          <Text style={styles.testMeaningLabel}>뜻:</Text>
          <View style={styles.testMeaningLine} />
        </View>
        <View style={styles.testChoices}>
          {leftQ?.allChoices.map((choice, idx) => (
            <View key={idx} style={styles.testChoice}>
              <Text style={styles.testCheckbox}>□</Text>
              <Text style={styles.testChoiceText}>{choice.word}</Text>
            </View>
          ))}
        </View>
      </View>
      {rightQ ? (
        <View style={styles.testColRight}>
          <View style={styles.testHeader}>
            <Text style={styles.idBadge}>{String(right!.id).padStart(3, '0')}</Text>
            <Text style={styles.testWord}>{right!.word}</Text>
            <Text style={styles.testMeaningLabel}>뜻:</Text>
            <View style={styles.testMeaningLine} />
          </View>
          <View style={styles.testChoices}>
            {rightQ.allChoices.map((choice, idx) => (
              <View key={idx} style={styles.testChoice}>
                <Text style={styles.testCheckbox}>□</Text>
                <Text style={styles.testChoiceText}>{choice.word}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.testColRight} />
      )}
    </View>
  );
};

// ===== 영영정의 테스트지 컴포넌트 =====
const VocabularyDefTestRowPDF = ({ left, right }: { left: VocabularyItem; right: VocabularyItem | null }) => (
  <View style={styles.testRow} wrap={false}>
    <View style={styles.testCol}>
      <View style={styles.testHeader}>
        <Text style={styles.idBadge}>{String(left.id).padStart(3, '0')}</Text>
      </View>
      {left.definition && <Text style={styles.defTestDefinition}>{left.definition}</Text>}
      <View style={styles.defTestAnswerLine} />
    </View>
    {right ? (
      <View style={styles.testColRight}>
        <View style={styles.testHeader}>
          <Text style={styles.idBadge}>{String(right.id).padStart(3, '0')}</Text>
        </View>
        {right.definition && <Text style={styles.defTestDefinition}>{right.definition}</Text>}
        <View style={styles.defTestAnswerLine} />
      </View>
    ) : (
      <View style={styles.testColRight} />
    )}
  </View>
);

// ===== 동의어 답지 컴포넌트 =====
const VocabularyAnswerRowPDF = ({ left, right, allData }: {
  left: VocabularyItem;
  right: VocabularyItem | null;
  allData: VocabularyItem[];
}) => {
  const questions = generateTestQuestions(allData);
  const leftQ = questions.find(q => q.id === left.id);
  const rightQ = right ? questions.find(q => q.id === right.id) : null;

  const renderAnswerContent = (q: typeof leftQ, item: VocabularyItem) => (
    <>
      <View style={styles.testHeader}>
        <Text style={styles.idBadge}>{String(item.id).padStart(3, '0')}</Text>
        <Text style={styles.testWord}>{item.word}</Text>
      </View>
      {/* 뜻 */}
      <Text style={styles.answerMeaningLabel}>뜻: {item.meaning}</Text>
      {/* 동의어 정답 */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <Text style={styles.answerSynonymLabel}>동의어: </Text>
        <Text style={styles.answerSynonymValue}>
          {q?.allChoices.filter(c => c.isCorrect).map(c => c.word).join(', ')}
        </Text>
      </View>
      {/* 오답 설명 */}
      {q?.allChoices.filter(c => !c.isCorrect).map((choice, idx) => (
        <View key={idx} style={styles.answerWrongItem}>
          <Text style={styles.answerWrongX}>✗</Text>
          <Text style={styles.answerWrongText}>{choice.word}: {choice.meaning}</Text>
        </View>
      ))}
    </>
  );

  return (
    <View style={styles.testRow} wrap={false}>
      <View style={styles.testCol}>
        {renderAnswerContent(leftQ, left)}
      </View>
      {right && rightQ ? (
        <View style={styles.testColRight}>
          {renderAnswerContent(rightQ, right)}
        </View>
      ) : (
        <View style={styles.testColRight} />
      )}
    </View>
  );
};

// ===== 영영정의 답지 컴포넌트 =====
const VocabularyDefAnswerRowPDF = ({ left, right }: { left: VocabularyItem; right: VocabularyItem | null }) => (
  <View style={styles.testRow} wrap={false}>
    <View style={styles.testCol}>
      <View style={styles.testHeader}>
        <Text style={styles.idBadge}>{String(left.id).padStart(3, '0')}</Text>
      </View>
      {left.definition && <Text style={styles.defTestDefinition}>{left.definition}</Text>}
      <Text style={styles.answerCorrect}>{left.word}</Text>
      <Text style={styles.simpleMeaning}>{left.meaning}</Text>
    </View>
    {right ? (
      <View style={styles.testColRight}>
        <View style={styles.testHeader}>
          <Text style={styles.idBadge}>{String(right.id).padStart(3, '0')}</Text>
        </View>
        {right.definition && <Text style={styles.defTestDefinition}>{right.definition}</Text>}
        <Text style={styles.answerCorrect}>{right.word}</Text>
        <Text style={styles.simpleMeaning}>{right.meaning}</Text>
      </View>
    ) : (
      <View style={styles.testColRight} />
    )}
  </View>
);

// 데이터를 2개씩 묶는 헬퍼 함수
function pairData<T>(data: T[]): Array<{ left: T; right: T | null }> {
  const pairs: Array<{ left: T; right: T | null }> = [];
  for (let i = 0; i < data.length; i += 2) {
    pairs.push({ left: data[i], right: data[i + 1] || null });
  }
  return pairs;
}

// 메인 PDF 문서
export const VocabularyPDF = ({ data, headerInfo, viewMode = 'card' }: VocabularyPDFProps) => {
  const pairedData = pairData(data);

  // 콘텐츠 렌더링 함수
  const renderContent = () => {
    switch (viewMode) {
      case 'table':
        return data.map((item) => <VocabularyTableRowPDF key={item.id} item={item} />);

      case 'tableSimple':
        return pairedData.map((pair, idx) => (
          <VocabularySimpleRowPDF key={idx} left={pair.left} right={pair.right} />
        ));

      case 'tableSimpleTest':
        return pairedData.map((pair, idx) => (
          <VocabularySimpleTestRowPDF key={idx} left={pair.left} right={pair.right} />
        ));

      case 'test':
        return pairedData.map((pair, idx) => (
          <VocabularyTestRowPDF key={idx} left={pair.left} right={pair.right} allData={data} />
        ));

      case 'testDefinition':
        return pairedData.map((pair, idx) => (
          <VocabularyDefTestRowPDF key={idx} left={pair.left} right={pair.right} />
        ));

      case 'testAnswer':
        return pairedData.map((pair, idx) => (
          <VocabularyAnswerRowPDF key={idx} left={pair.left} right={pair.right} allData={data} />
        ));

      case 'testDefinitionAnswer':
        return pairedData.map((pair, idx) => (
          <VocabularyDefAnswerRowPDF key={idx} left={pair.left} right={pair.right} />
        ));

      case 'card':
      default:
        return data.map((item) => <VocabularyCardPDF key={item.id} item={item} />);
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {headerInfo.headerTitle && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{headerInfo.headerTitle}</Text>
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

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default VocabularyPDF;
