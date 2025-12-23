import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { QuestionItem, HeaderInfo, ExplanationData, ChoiceTranslation, VocaPreviewWord } from '../types/question';

// Pretendard 폰트 등록 (로컬 번들링)
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

// 팔레트 색상 타입
interface PaletteColors {
  badgeBg: string;
  badgeBgOpacity: number;
  badgeText: string;
  badgeTextOpacity: number;
  badgeBorder: string;
  badgeBorderOpacity: number;
}

// 기본 팔레트 (비바 마젠타)
const defaultPalette: PaletteColors = {
  badgeBg: '#fdf2f8',
  badgeBgOpacity: 1,
  badgeText: '#be185d',
  badgeTextOpacity: 1,
  badgeBorder: '#fbcfe8',
  badgeBorderOpacity: 1,
};

// HEX + opacity를 흰색 배경에 혼합
const blendWithWhite = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const blendedR = Math.round(r * opacity + 255 * (1 - opacity));
  const blendedG = Math.round(g * opacity + 255 * (1 - opacity));
  const blendedB = Math.round(b * opacity + 255 * (1 - opacity));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(blendedR)}${toHex(blendedG)}${toHex(blendedB)}`;
};

// 기본 스타일
const createStyles = (palette: PaletteColors, fontScale: number = 1) => {
  const bgColor = blendWithWhite(palette.badgeBg, palette.badgeBgOpacity);
  const textColor = blendWithWhite(palette.badgeText, palette.badgeTextOpacity);
  const borderColor = blendWithWhite(palette.badgeBorder, palette.badgeBorderOpacity);

  const scaled = (size: number) => size * fontScale;

  return StyleSheet.create({
    // ===== 페이지 기본 =====
    page: {
      paddingTop: 36,  // 12mm ≈ 36pt
      paddingBottom: 42,  // 15mm ≈ 42pt
      paddingHorizontal: 42,  // 15mm ≈ 42pt
      fontFamily: 'Pretendard',
      fontSize: scaled(8),
      backgroundColor: '#ffffff',
    },

    // ===== 헤더 =====
    header: {
      marginBottom: 12,
      alignItems: 'center',
      position: 'relative',
    },
    headerTitle: {
      fontSize: scaled(10),
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: textColor,
      backgroundColor: bgColor,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 10,
      borderWidth: 0.5,
      borderColor: borderColor,
      textAlign: 'center',
    },
    headerDescription: {
      fontSize: scaled(7),
      color: '#4b5563',
      marginTop: 4,
    },
    unitBadge: {
      position: 'absolute',
      top: 0,
      left: 0,
      fontSize: scaled(7),
      color: textColor,
      backgroundColor: bgColor,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      fontWeight: 700,
    },

    // ===== 페이지 번호 =====
    pageNumber: {
      position: 'absolute',
      bottom: 20,
      right: 42,
      fontSize: 6,
      color: '#9ca3af',
    },

    // ===== 푸터 =====
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 42,
    },
    footerText: {
      fontSize: 6,
      color: '#4b5563',
    },

    // ===== 문제지 스타일 (웹과 동일) =====
    // 문제 그룹 레이아웃 (6:4)
    questionGroupLayout: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 8,
    },
    // 문제 컬럼 (60%)
    questionsColumn: {
      flex: 6,
    },
    // 사이드바 컬럼 (40%)
    sidebarColumn: {
      flex: 4,
    },
    // 컴팩트 문제 아이템
    questionCompact: {
      marginBottom: 8,
    },
    // 발문 라인
    instructionLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#333',
      paddingBottom: 2,
      marginBottom: 6,
    },
    instructionText: {
      fontSize: scaled(8),
      color: '#333',
      fontWeight: 400,
    },
    // 문제 행 (번호 + 내용)
    questionRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 4,
    },
    // 문제 번호
    qNumber: {
      fontSize: scaled(14),
      fontWeight: 700,
      color: textColor,
      width: 22,
      textAlign: 'right',
      flexShrink: 0,
    },
    // 문제 내용
    qContent: {
      flex: 1,
    },
    // 지문
    qPassage: {
      fontSize: scaled(8),
      color: '#333',
      lineHeight: 1.5,
      marginBottom: 4,
      textAlign: 'justify',
    },
    // 지문 내 강조
    passageBold: {
      fontWeight: 700,
    },
    passageUnderline: {
      textDecoration: 'underline',
    },
    passageBoldUnderline: {
      fontWeight: 700,
      textDecoration: 'underline',
    },
    // 보기 컨테이너 (가로 배치)
    qChoices: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 2,
      marginTop: 4,
    },
    qChoice: {
      fontSize: scaled(8),
      color: '#333',
      marginRight: 8,
    },
    qChoiceCorrect: {
      fontSize: scaled(8),
      color: textColor,
      fontWeight: 700,
      marginRight: 8,
    },

    // ===== MY VOCA 사이드바 =====
    myVocaTitle: {
      textAlign: 'center',
      fontSize: scaled(9),
      fontWeight: 400,
      letterSpacing: 2,
      color: '#333',
      marginBottom: 1,
    },
    myVocaDotted: {
      borderBottomWidth: 1,
      borderBottomColor: '#999',
      borderStyle: 'dotted',
      marginBottom: 4,
    },
    myVocaList: {
      flexDirection: 'column',
      gap: 0,
    },
    myVocaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      height: 12,
    },
    myVocaCheck: {
      color: '#999',
      fontSize: 6,
      letterSpacing: -2,
      flexShrink: 0,
    },
    myVocaNum: {
      color: textColor,
      fontSize: scaled(7),
      width: 12,
      flexShrink: 0,
    },
    myVocaLine: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      height: 8,
    },

    // ===== 분석 사이드바 =====
    analysisSidebar: {
      flexDirection: 'column',
      gap: 4,
    },
    analysisSectionTitle: {
      fontSize: scaled(7),
      fontWeight: 400,
      color: textColor,
      marginTop: 4,
    },
    analysisSectionTitleFirst: {
      fontSize: scaled(7),
      fontWeight: 400,
      color: textColor,
      marginTop: 0,
    },
    analysisText: {
      fontSize: scaled(6),
      color: '#666',
      lineHeight: 1.3,
    },
    analysisBoxSm: {
      minHeight: 28,
      backgroundColor: '#f8f8f8',
      borderRadius: 3,
    },
    analysisBoxMd: {
      minHeight: 40,
      backgroundColor: '#f8f8f8',
      borderRadius: 3,
    },
    analysisBoxLg: {
      minHeight: 50,
      backgroundColor: '#f8f8f8',
      borderRadius: 3,
      flex: 1,
    },

    // ===== 해설지 헤더 =====
    explanationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 12,
    },

    // ===== QUICK VER. 답안표 =====
    quickAnswerTable: {
      flexShrink: 0,
    },
    quickAnswerTitle: {
      textAlign: 'right',
      fontSize: scaled(8),
      fontWeight: 400,
      letterSpacing: 1,
      color: '#666',
      marginBottom: 2,
    },
    quickAnswerRow: {
      flexDirection: 'row',
    },
    quickAnswerCell: {
      padding: 1,
      paddingHorizontal: 3,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      minWidth: 22,
      alignItems: 'center',
    },
    quickAnswerNum: {
      fontSize: scaled(6),
      color: textColor,
    },
    quickAnswerCircle: {
      fontSize: scaled(8),
      fontWeight: 700,
      color: '#333',
    },

    // ===== 해설 카드 =====
    explanationCard: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    explanationCardLast: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
      paddingBottom: 10,
    },
    // 좌측: 문제 영역 (50%)
    explanationQuestion: {
      flex: 1,
      flexDirection: 'row',
      gap: 5,
    },
    explanationQuestionNumber: {
      fontSize: scaled(14),
      fontWeight: 700,
      color: textColor,
      flexShrink: 0,
      minWidth: 22,
    },
    explanationQuestionContent: {
      flex: 1,
    },
    // 지문 한글 번역 스타일
    questionPassageTranslation: {
      fontSize: scaled(7),
      color: '#333',
      lineHeight: 1.4,
      marginBottom: 5,
      textAlign: 'justify',
      borderLeftWidth: 2,
      borderLeftColor: textColor,
      paddingLeft: 6,
      backgroundColor: 'rgba(139, 92, 246, 0.03)',
    },
    questionPassage: {
      fontSize: scaled(7),
      color: '#333',
      lineHeight: 1.4,
      marginBottom: 5,
      textAlign: 'justify',
    },
    // 보기
    questionChoices: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 2,
    },
    questionChoice: {
      fontSize: scaled(7),
      color: '#333',
      marginRight: 6,
    },
    questionChoiceCorrect: {
      fontSize: scaled(7),
      color: textColor,
      fontWeight: 700,
      marginRight: 6,
    },
    // 번역 포함 보기 (세로 배치)
    choiceTranslated: {
      padding: 2,
      paddingHorizontal: 4,
      marginBottom: 2,
      borderRadius: 3,
      backgroundColor: '#fafafa',
    },
    choiceTranslatedCorrect: {
      padding: 2,
      paddingHorizontal: 4,
      marginBottom: 2,
      borderRadius: 3,
      backgroundColor: bgColor,
    },
    choiceLabel: {
      fontSize: scaled(8),
      fontWeight: 700,
      color: textColor,
    },
    choiceEnglish: {
      fontSize: scaled(7),
      color: '#333',
      fontWeight: 400,
      paddingLeft: 12,
    },
    choiceKorean: {
      fontSize: scaled(6),
      color: '#666',
      paddingLeft: 12,
    },
    choiceKoreanOnly: {
      fontSize: scaled(7),
      color: '#333',
      paddingLeft: 12,
    },

    // 우측: 해설 영역 (50%)
    explanationContent: {
      flex: 1,
    },
    // 해설 섹션
    explanationSection: {
      flexDirection: 'column',
      gap: 6,
    },
    // 정답 헤더
    answerHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 5,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    answerBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: textColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    answerBadgeText: {
      fontSize: scaled(9),
      fontWeight: 700,
      color: '#ffffff',
    },
    answerWord: {
      fontSize: scaled(10),
      fontWeight: 700,
      color: '#333',
      flex: 1,
      flexWrap: 'wrap',
    },
    // 해설 블록
    explanationBlock: {
      flexDirection: 'column',
      gap: 2,
      marginBottom: 6,
    },
    explanationBlockTitle: {
      fontSize: scaled(8),
      fontWeight: 700,
      color: textColor,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    blockIcon: {
      fontSize: scaled(10),
    },
    explanationBlockContent: {
      fontSize: scaled(7),
      color: '#333',
      lineHeight: 1.4,
      paddingLeft: 3,
    },
    placeholderText: {
      color: '#999',
      fontStyle: 'italic',
    },
    // 동의어 테이블
    synonymTable: {
      marginTop: 2,
    },
    synonymRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      paddingVertical: 2,
    },
    synonymEnglish: {
      width: '45%',
      fontSize: scaled(7),
      color: '#333',
      fontWeight: 400,
      paddingHorizontal: 4,
    },
    synonymKorean: {
      width: '55%',
      fontSize: scaled(7),
      color: '#666',
      paddingHorizontal: 4,
    },
    // 오답/정답 해설
    wrongExplanations: {
      flexDirection: 'column',
      gap: 3,
    },
    wrongItem: {
      flexDirection: 'row',
      gap: 4,
    },
    wrongLabel: {
      fontSize: scaled(7),
      fontWeight: 700,
      color: textColor,
      minWidth: 18,
    },
    wrongText: {
      fontSize: scaled(7),
      color: '#333',
      flex: 1,
    },
    // 어휘 문제 정답 강조 (T022, T024)
    vocabAnswerHighlight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: bgColor,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 6,
    },
    vocabAnswerLabel: {
      fontSize: scaled(8),
      fontWeight: 700,
      color: textColor,
    },
    vocabAnswerText: {
      fontSize: scaled(8),
      fontWeight: 700,
      color: textColor,
    },
    // 보기 해설
    choiceExplanations: {
      flexDirection: 'column',
      gap: 3,
    },
    choiceItem: {
      flexDirection: 'row',
      gap: 4,
    },
    choiceItemCorrect: {
      flexDirection: 'row',
      gap: 4,
      backgroundColor: bgColor,
      padding: 2,
      paddingHorizontal: 4,
      borderRadius: 3,
      marginHorizontal: -4,
    },
    // 문제 번호 뱃지
    questionNumBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 3,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 5,
    },
    questionNumBadgeText: {
      fontSize: scaled(10),
      fontWeight: 700,
      color: textColor,
    },
    // 그룹 해설
    groupedQuestionChoices: {
      marginTop: 8,
      paddingTop: 5,
      borderTopWidth: 1,
      borderTopColor: '#ddd',
      borderStyle: 'dashed',
    },
    groupedQuestionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 4,
    },
    groupedQuestionNum: {
      fontSize: scaled(10),
      fontWeight: 700,
      color: textColor,
    },
    groupedQuestionInstruction: {
      fontSize: scaled(7),
      color: '#666',
    },
    groupedExplanationItem: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      marginTop: 10,
    },
    groupedExplanationItemFirst: {
      paddingTop: 0,
      borderTopWidth: 0,
      marginTop: 0,
    },

    // ===== 어휘 문제지 스타일 =====
    vocabTestRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      paddingVertical: 4,
    },
    vocabColId: {
      width: '4%',
      paddingHorizontal: 2,
    },
    vocabColWord: {
      width: '14%',
      paddingHorizontal: 4,
    },
    vocabColBlank: {
      width: '32%',
      paddingHorizontal: 4,
    },
    vocabIdBadge: {
      backgroundColor: bgColor,
      paddingHorizontal: 3,
      paddingVertical: 1,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: borderColor,
      alignSelf: 'flex-start',
    },
    vocabIdText: {
      fontSize: 5,
      fontWeight: 700,
      color: textColor,
      textAlign: 'center',
    },
    vocabWord: {
      fontSize: scaled(8),
      fontWeight: 700,
      color: '#000',
    },
    vocabBlankLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      height: 14,
      width: '100%',
    },

    // ===== 단어장 프리뷰 스타일 =====
    vocaPreviewRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      alignItems: 'center',
    },
    vocaPreviewColNum: {
      width: '4%',
      padding: 2,
      paddingHorizontal: 3,
    },
    vocaPreviewColWord: {
      width: '18%',
      padding: 2,
      paddingHorizontal: 4,
    },
    vocaPreviewColMeaning: {
      width: '28%',
      padding: 2,
      paddingHorizontal: 4,
    },
    vocaPreviewNum: {
      fontSize: scaled(7),
      color: textColor,
      fontWeight: 700,
    },
    vocaPreviewWord: {
      fontSize: scaled(8),
      fontWeight: 400,
      color: '#000',
    },
    vocaPreviewMeaning: {
      fontSize: scaled(7),
      color: '#4b5563',
    },
  });
};

// ===== 지문 포맷팅 (마크다운 스타일) =====
const formatPassage = (text: string, styles: ReturnType<typeof createStyles>): React.ReactNode[] => {
  if (!text) return [];
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|_[^_]+_|_{5,})/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    // 빈칸 (5개 이상의 언더스코어)
    if (/^_{5,}$/.test(part)) {
      return <Text key={idx} style={{ borderBottomWidth: 1, borderBottomColor: '#333', paddingHorizontal: 20 }}>{' '.repeat(10)}</Text>;
    }
    // 굵게 + 밑줄 (***text***)
    if (part.startsWith('***') && part.endsWith('***')) {
      const word = part.slice(3, -3);
      return <Text key={idx} style={styles.passageBoldUnderline}>{word}</Text>;
    }
    // 굵게 (**text**)
    if (part.startsWith('**') && part.endsWith('**')) {
      const word = part.slice(2, -2);
      return <Text key={idx} style={styles.passageBold}>{word}</Text>;
    }
    // 밑줄 (_text_)
    if (part.startsWith('_') && part.endsWith('_')) {
      const word = part.slice(1, -1);
      return <Text key={idx} style={styles.passageUnderline}>{word}</Text>;
    }
    return <Text key={idx}>{part}</Text>;
  });
};

// ===== 같은 지문 그룹핑 =====
interface PassageGroup {
  passage: string;
  items: QuestionItem[];
}

// 지문 정규화 (공백, 줄바꿈 등 차이 무시)
const normalizePassage = (passage: string): string => {
  return passage
    .replace(/\s+/g, ' ')  // 모든 공백을 단일 공백으로
    .trim()
    .toLowerCase();
};

// 두 지문이 같은지 비교 (정규화 후 비교)
const isSamePassage = (passage1: string, passage2: string): boolean => {
  return normalizePassage(passage1) === normalizePassage(passage2);
};

const groupByPassage = (items: QuestionItem[]): PassageGroup[] => {
  const groups: PassageGroup[] = [];

  // 세트 문제 처리: passage가 없으면 이전 문제의 passage 상속
  let lastPassage = '';
  const processedItems = items.map(item => {
    if (item.passage && item.passage.trim()) {
      lastPassage = item.passage;
      return item;
    } else if (lastPassage) {
      return { ...item, passage: lastPassage };
    }
    return item;
  });

  // 최대 그룹 크기 (2개까지만 묶음)
  const MAX_GROUP_SIZE = 2;

  processedItems.forEach((item) => {
    const lastGroup = groups[groups.length - 1];
    // 정규화 비교로 공백/줄바꿈 차이 무시 + 최대 그룹 크기 제한
    if (lastGroup && isSamePassage(lastGroup.passage, item.passage) && lastGroup.items.length < MAX_GROUP_SIZE) {
      lastGroup.items.push(item);
    } else {
      groups.push({ passage: item.passage, items: [item] });
    }
  });
  return groups;
};

// ===== 같은 발문 그룹핑 =====
const groupByInstruction = (items: QuestionItem[]) => {
  const result: { instruction: string; items: QuestionItem[] }[] = [];
  items.forEach((item) => {
    const lastGroup = result[result.length - 1];
    if (lastGroup && lastGroup.instruction === item.instruction) {
      lastGroup.items.push(item);
    } else {
      result.push({ instruction: item.instruction, items: [item] });
    }
  });
  return result;
};

// ===== MY VOCA 사이드바 =====
const MyVocaSidebar = ({ styles, count = 30 }: { styles: ReturnType<typeof createStyles>; count?: number }) => (
  <View>
    <Text style={styles.myVocaTitle}>MY VOCA</Text>
    <View style={styles.myVocaDotted} />
    <View style={styles.myVocaList}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.myVocaRow}>
          <Text style={styles.myVocaCheck}>☐☐</Text>
          <Text style={styles.myVocaNum}>{String(i + 1).padStart(2, '0')}</Text>
          <View style={styles.myVocaLine} />
        </View>
      ))}
    </View>
  </View>
);

// ===== 분석 사이드바 =====
const AnalysisSidebar = ({ styles, categoryMain, categorySub }: { styles: ReturnType<typeof createStyles>; categoryMain: string; categorySub?: string }) => {
  if (categoryMain === '어휘') {
    return <MyVocaSidebar styles={styles} count={20} />;
  }

  if (categoryMain === '논리' || categoryMain === '빈칸') {
    return (
      <View style={styles.analysisSidebar}>
        <Text style={styles.analysisSectionTitleFirst}>1단계 | 빈칸 정체성 파악</Text>
        <View style={styles.analysisBoxSm} />
        <Text style={styles.analysisSectionTitle}>2단계 | 단서 수집</Text>
        <Text style={styles.analysisText}>① 시그널 - 같은 말 | 반대 말 | 인과 | 양보</Text>
        <Text style={styles.analysisText}>② 그래서 빈칸은? (주관식)</Text>
        <View style={styles.analysisBoxSm} />
        <Text style={styles.analysisSectionTitle}>Feed Back & 오답 원인</Text>
        <View style={styles.analysisBoxSm} />
      </View>
    );
  }

  if (categoryMain === '대의 파악' || categoryMain === '정보 파악') {
    if (categorySub === '어휘 적절성' || categorySub === '밑줄 추론') {
      return (
        <View style={styles.analysisSidebar}>
          <Text style={styles.analysisSectionTitleFirst}>1단계 | 중심 소재 + 중심 내용 파악</Text>
          <View style={styles.analysisBoxSm} />
          <Text style={styles.analysisSectionTitle}>2단계 | 각 보기 반의어 의심</Text>
          <View style={styles.analysisBoxSm} />
          <Text style={styles.analysisSectionTitle}>Feed Back & 오답 원인</Text>
          <View style={styles.analysisBoxSm} />
        </View>
      );
    }
    return (
      <View style={styles.analysisSidebar}>
        <Text style={styles.analysisSectionTitleFirst}>중심 소재 + 중심 내용 파악</Text>
        <View style={styles.analysisBoxMd} />
        <Text style={styles.analysisSectionTitle}>Feed Back & 오답 원인</Text>
        <View style={styles.analysisBoxSm} />
      </View>
    );
  }

  if (categoryMain === '문법') {
    return (
      <View style={styles.analysisSidebar}>
        <Text style={styles.analysisSectionTitleFirst}>1단계 | 출제 포인트 파악</Text>
        <View style={styles.analysisBoxSm} />
        <Text style={styles.analysisSectionTitle}>2단계 | 알고리즘 분석</Text>
        <View style={styles.analysisBoxMd} />
        <Text style={styles.analysisSectionTitle}>Feed Back & 오답 원인</Text>
        <View style={styles.analysisBoxSm} />
      </View>
    );
  }

  return (
    <View style={styles.analysisSidebar}>
      <Text style={styles.analysisSectionTitleFirst}>Feed Back & 오답 원인</Text>
      <View style={styles.analysisBoxMd} />
    </View>
  );
};

// ===== 문제 카드 (웹과 동일 구조) =====
const QuestionCardPDF = ({
  styles,
  item,
  showAnswer,
  showInstruction,
}: {
  styles: ReturnType<typeof createStyles>;
  item: QuestionItem;
  showAnswer: boolean;
  showInstruction: boolean;
}) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];

  return (
    <View style={styles.questionCompact} wrap={false}>
      {/* 발문 */}
      {showInstruction && item.instruction && (
        <View style={styles.instructionLine}>
          <Text style={styles.instructionText}>{item.instruction}</Text>
        </View>
      )}

      {/* 문제 행 (번호 + 내용) */}
      <View style={styles.questionRow}>
        <Text style={styles.qNumber}>{item.questionNumber}</Text>
        <View style={styles.qContent}>
          {/* 지문 */}
          {item.passage && (
            <Text style={styles.qPassage}>
              {formatPassage(item.passage, styles)}
            </Text>
          )}
          {/* 보기 - 가로 배치 */}
          <View style={styles.qChoices}>
            {item.choices.map((choice, idx) => {
              if (!choice) return null;
              const isCorrect = item.answer === choiceLabels[idx];
              return (
                <Text
                  key={idx}
                  style={showAnswer && isCorrect ? styles.qChoiceCorrect : styles.qChoice}
                >
                  {choiceLabels[idx]} {choice}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

// ===== QUICK VER. 답안표 =====
const QuickAnswerTablePDF = ({ styles, questions }: { styles: ReturnType<typeof createStyles>; questions: QuestionItem[] }) => {
  const rows = 5;
  const cols = 7;

  const getAnswerNumber = (answer: string): string => {
    const map: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
    return map[answer] || answer;
  };

  return (
    <View style={styles.quickAnswerTable}>
      <Text style={styles.quickAnswerTitle}>QUICK VER.</Text>
      {Array.from({ length: rows }, (_, rowIdx) => (
        <View key={rowIdx} style={styles.quickAnswerRow}>
          {Array.from({ length: cols }, (_, colIdx) => {
            const qNum = rowIdx * cols + colIdx + 1;
            const question = questions.find(q => q.questionNumber === qNum);
            return (
              <View key={colIdx} style={styles.quickAnswerCell}>
                <Text style={styles.quickAnswerNum}>{String(qNum).padStart(2, '0')}</Text>
                <Text style={styles.quickAnswerCircle}>
                  {question ? getAnswerNumber(question.answer) : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ===== 해설 카드 =====
const ExplanationCardPDF = ({
  styles,
  item,
  explanation,
  choiceDisplayMode = 'both',
  isLast = false,
}: {
  styles: ReturnType<typeof createStyles>;
  item: QuestionItem;
  explanation?: ExplanationData;
  choiceDisplayMode?: 'both' | 'korean' | 'english';
  isLast?: boolean;
}) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];
  const passageTranslation = explanation?.passageTranslation;
  const choiceTranslations = explanation?.choiceTranslations;

  // 정답 인덱스 (answer는 1~5 숫자)
  const answerNum = Number(item.answer);
  const answerIdx = answerNum >= 1 && answerNum <= 5 ? answerNum - 1 : -1;
  const answerWord = answerIdx >= 0 ? item.choices[answerIdx] : '';

  // 밑줄 단어 추출
  const underlinedMatch = item.passage.match(/_([^_]+)_/);
  const underlinedWord = underlinedMatch ? underlinedMatch[1] : '';

  return (
    <View style={isLast ? styles.explanationCardLast : styles.explanationCard} wrap={false}>
      {/* 좌측: 문제 */}
      <View style={styles.explanationQuestion}>
        <Text style={styles.explanationQuestionNumber}>{item.questionNumber}</Text>
        <View style={styles.explanationQuestionContent}>
          {/* 지문 (한글 번역 또는 영어) */}
          {passageTranslation ? (
            <Text style={styles.questionPassageTranslation}>
              {formatPassage(passageTranslation, styles)}
            </Text>
          ) : (
            <Text style={styles.questionPassage}>
              {formatPassage(item.passage, styles)}
            </Text>
          )}

          {/* 보기 */}
          <View style={{ marginTop: 8 }}>
            {item.choices.map((choice, idx) => {
              if (!choice) return null;
              const isCorrect = answerIdx === idx;
              const translation = choiceTranslations?.[idx];

              // 번역이 있고 both 또는 korean 모드인 경우
              if (translation && (choiceDisplayMode === 'both' || choiceDisplayMode === 'korean')) {
                return (
                  <View key={idx} style={isCorrect ? styles.choiceTranslatedCorrect : styles.choiceTranslated}>
                    <Text style={styles.choiceLabel}>{choiceLabels[idx]}</Text>
                    {choiceDisplayMode === 'both' && (
                      <Text style={styles.choiceEnglish}>{choice}</Text>
                    )}
                    <Text style={choiceDisplayMode === 'korean' ? styles.choiceKoreanOnly : styles.choiceKorean}>
                      {translation.korean}
                    </Text>
                  </View>
                );
              }

              // 영어만 또는 번역 없는 경우
              return (
                <Text
                  key={idx}
                  style={isCorrect ? styles.questionChoiceCorrect : styles.questionChoice}
                >
                  {choiceLabels[idx]} {choice}
                </Text>
              );
            })}
          </View>
        </View>
      </View>

      {/* 우측: 해설 */}
      <View style={styles.explanationContent}>
        {/* 정답 헤더 */}
        <View style={styles.answerHeader}>
          <View style={styles.answerBadge}>
            <Text style={styles.answerBadgeText}>{answerNum}</Text>
          </View>
          <Text style={styles.answerWord}>{answerWord}</Text>
        </View>

        <View style={styles.explanationSection}>
          {/* 어휘 해설 */}
          {(explanation?.type === 'vocabulary' || (!explanation?.type && item.categoryMain === '어휘')) && (
            <>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>
                  동의어 해설 | {underlinedWord}
                </Text>
                <Text style={styles.explanationBlockContent}>
                  {(explanation as any)?.wordExplanation || 'AI 해설이 생성되면 여기에 표시됩니다.'}
                </Text>
              </View>

              {(explanation as any)?.synonyms?.length > 0 && (
                <View style={styles.explanationBlock}>
                  <Text style={styles.explanationBlockTitle}>
                    동의어 추가
                  </Text>
                  <View style={styles.synonymTable}>
                    {(explanation as any).synonyms.map((syn: any, idx: number) => (
                      <View key={idx} style={styles.synonymRow}>
                        <Text style={styles.synonymEnglish}>{syn.english}</Text>
                        <Text style={styles.synonymKorean}>{syn.korean}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* 문법 해설 */}
          {(explanation?.type === 'grammar' || (!explanation?.type && item.categoryMain === '문법')) && (
            <>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockContent}>
                  ▶ 출제 Point | {(explanation as any)?.testPoint || ''}
                </Text>
              </View>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>정답 해설 |</Text>
                <Text style={styles.explanationBlockContent}>
                  {(explanation as any)?.correctExplanation || 'AI 해설이 생성되면 여기에 표시됩니다.'}
                </Text>
              </View>
            </>
          )}

          {/* 논리/빈칸 해설 */}
          {(explanation?.type === 'logic' || (!explanation?.type && (item.categoryMain === '논리' || item.categoryMain === '빈칸'))) && (
            <>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>
                  Step 1) 빈칸 타게팅
                </Text>
                <Text style={styles.explanationBlockContent}>
                  {(explanation as any)?.step1Targeting || 'AI 해설이 생성되면 여기에 표시됩니다.'}
                </Text>
              </View>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>
                  Step 2) 근거 확인
                </Text>
                <Text style={styles.explanationBlockContent}>
                  {(explanation as any)?.step2Evidence || ''}
                </Text>
              </View>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>
                  Step 3) 보기 판단
                </Text>
                <View style={styles.choiceExplanations}>
                  {(explanation as any)?.step3Choices && (explanation as any).step3Choices.length > 0 ? (
                    (explanation as any).step3Choices.map((exp: string, idx: number) => (
                      <View key={idx} style={answerIdx === idx ? styles.choiceItemCorrect : styles.choiceItem}>
                        <Text style={styles.wrongLabel}>{choiceLabels[idx]}</Text>
                        <Text style={styles.wrongText}>{exp}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.explanationBlockContent}>보기 판단이 생성되면 여기에 표시됩니다.</Text>
                  )}
                </View>
              </View>
            </>
          )}

          {/* 대의파악/정보파악 해설 */}
          {(explanation?.type === 'mainIdea' || (!explanation?.type && (item.categoryMain === '대의 파악' || item.categoryMain === '정보 파악'))) && (
            <>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>
                  지문 분석 |
                </Text>
                <Text style={styles.explanationBlockContent}>
                  {(explanation as any)?.passageAnalysis || 'AI 해설이 생성되면 여기에 표시됩니다.'}
                </Text>
              </View>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>
                  정답 해설 |
                </Text>
                <Text style={styles.explanationBlockContent}>
                  {(explanation as any)?.correctExplanation || ''}
                </Text>
              </View>
              <View style={styles.explanationBlock}>
                <Text style={styles.explanationBlockTitle}>
                  오답 소거 |
                </Text>
                <View style={styles.choiceExplanations}>
                  {(explanation as any)?.wrongExplanations && (explanation as any).wrongExplanations.length > 0 ? (
                    (explanation as any).wrongExplanations.map((exp: string, idx: number) => {
                      // 정답은 스킵
                      if (answerIdx === idx) return null;
                      return (
                        <View key={idx} style={styles.choiceItem}>
                          <Text style={styles.wrongLabel}>{choiceLabels[idx]}</Text>
                          <Text style={styles.wrongText}>{exp}</Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.explanationBlockContent}>오답 소거가 생성되면 여기에 표시됩니다.</Text>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

// ===== 그룹 해설 카드 (같은 지문 공유) =====
const GroupedExplanationCardPDF = ({
  styles,
  group,
  explanations,
  choiceDisplayMode = 'both',
}: {
  styles: ReturnType<typeof createStyles>;
  group: PassageGroup;
  explanations?: Map<string, ExplanationData>;
  choiceDisplayMode?: 'both' | 'korean' | 'english';
}) => {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];
  const firstItem = group.items[0];
  const firstExplanation = explanations?.get(firstItem.id);
  const passageTranslation = firstExplanation?.passageTranslation;

  // 문제 번호 범위 (예: 14~15)
  const questionNumbers = group.items.map(i => i.questionNumber);
  const numberRange = questionNumbers.length > 1
    ? `${Math.min(...questionNumbers)}~${Math.max(...questionNumbers)}`
    : String(questionNumbers[0]);

  return (
    <View style={styles.explanationCard} break>
      {/* 좌측: 지문 + 모든 문제의 보기 */}
      <View style={styles.explanationQuestion}>
        <Text style={styles.explanationQuestionNumber}>{numberRange}</Text>
        <View style={styles.explanationQuestionContent}>
          {/* 지문 (한글 번역 또는 영어) - 첫 번째 문제의 번역 사용 */}
          {passageTranslation ? (
            <Text style={styles.questionPassageTranslation}>
              {formatPassage(passageTranslation, styles)}
            </Text>
          ) : (
            <Text style={styles.questionPassage}>
              {formatPassage(firstItem.passage, styles)}
            </Text>
          )}

          {/* 각 문제의 보기 */}
          {group.items.map((item) => {
            const itemExplanation = explanations?.get(item.id);
            const choiceTranslations = itemExplanation?.choiceTranslations;
            const itemAnswerNum = Number(item.answer);
            const itemAnswerIdx = itemAnswerNum >= 1 && itemAnswerNum <= 5 ? itemAnswerNum - 1 : -1;

            return (
              <View key={item.id} style={styles.groupedQuestionChoices}>
                <View style={styles.groupedQuestionHeader}>
                  <Text style={styles.groupedQuestionNum}>{item.questionNumber}.</Text>
                  <Text style={styles.groupedQuestionInstruction}>{item.instruction}</Text>
                </View>
                <View style={{ marginTop: 4 }}>
                  {item.choices.map((choice, idx) => {
                    if (!choice) return null;
                    const isCorrect = itemAnswerIdx === idx;
                    const translation = choiceTranslations?.[idx];

                    if (translation && (choiceDisplayMode === 'both' || choiceDisplayMode === 'korean')) {
                      return (
                        <View key={idx} style={isCorrect ? styles.choiceTranslatedCorrect : styles.choiceTranslated}>
                          <Text style={styles.choiceLabel}>{choiceLabels[idx]}</Text>
                          {choiceDisplayMode === 'both' && (
                            <Text style={styles.choiceEnglish}>{choice}</Text>
                          )}
                          <Text style={choiceDisplayMode === 'korean' ? styles.choiceKoreanOnly : styles.choiceKorean}>
                            {translation.korean}
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <Text
                        key={idx}
                        style={isCorrect ? styles.questionChoiceCorrect : styles.questionChoice}
                      >
                        {choiceLabels[idx]} {choice}
                      </Text>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 우측: 각 문제의 해설 */}
      <View style={styles.explanationContent}>
        {group.items.map((item, idx) => {
          const explanation = explanations?.get(item.id);
          const answerNum = Number(item.answer);
          const answerIdx = answerNum >= 1 && answerNum <= 5 ? answerNum - 1 : -1;
          const answerWord = answerIdx >= 0 ? item.choices[answerIdx] : '';
          const underlinedMatch = item.passage.match(/_([^_]+)_/);
          const underlinedWord = underlinedMatch ? underlinedMatch[1] : '';

          return (
            <View key={item.id} style={idx > 0 ? styles.groupedExplanationItem : styles.groupedExplanationItemFirst}>
              {/* 정답 헤더 */}
              <View style={styles.answerHeader}>
                <View style={styles.questionNumBadge}>
                  <Text style={styles.questionNumBadgeText}>{item.questionNumber}</Text>
                </View>
                <View style={styles.answerBadge}>
                  <Text style={styles.answerBadgeText}>{answerNum}</Text>
                </View>
                <Text style={styles.answerWord}>{answerWord}</Text>
              </View>

              <View style={styles.explanationSection}>
                {/* 어휘 해설 */}
                {(explanation?.type === 'vocabulary' || (!explanation?.type && item.categoryMain === '어휘')) && (
                  <>
                    <View style={styles.explanationBlock}>
                      <Text style={styles.explanationBlockTitle}>
                        동의어 해설 | {underlinedWord}
                      </Text>
                      <Text style={styles.explanationBlockContent}>
                        {(explanation as any)?.wordExplanation || 'AI 해설이 생성되면 여기에 표시됩니다.'}
                      </Text>
                    </View>
                    {(explanation as any)?.synonyms?.length > 0 && (
                      <View style={styles.explanationBlock}>
                        <Text style={styles.explanationBlockTitle}>동의어 추가</Text>
                        <View style={styles.synonymTable}>
                          {(explanation as any).synonyms.map((syn: any, synIdx: number) => (
                            <View key={synIdx} style={styles.synonymRow}>
                              <Text style={styles.synonymEnglish}>{syn.english}</Text>
                              <Text style={styles.synonymKorean}>{syn.korean}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}

                {/* 논리/빈칸 해설 */}
                {(explanation?.type === 'logic' || (!explanation?.type && (item.categoryMain === '논리' || item.categoryMain === '빈칸'))) && (
                  <>
                    <View style={styles.explanationBlock}>
                      <Text style={styles.explanationBlockTitle}>Step 1) 빈칸 타게팅</Text>
                      <Text style={styles.explanationBlockContent}>
                        {(explanation as any)?.step1Targeting || 'AI 해설이 생성되면 여기에 표시됩니다.'}
                      </Text>
                    </View>
                    <View style={styles.explanationBlock}>
                      <Text style={styles.explanationBlockTitle}>Step 2) 근거 확인</Text>
                      <Text style={styles.explanationBlockContent}>
                        {(explanation as any)?.step2Evidence || ''}
                      </Text>
                    </View>
                    <View style={styles.explanationBlock}>
                      <Text style={styles.explanationBlockTitle}>Step 3) 보기 판단</Text>
                      <View style={styles.choiceExplanations}>
                        {(explanation as any)?.step3Choices && (explanation as any).step3Choices.length > 0 ? (
                          (explanation as any).step3Choices.map((exp: string, expIdx: number) => (
                            <View key={expIdx} style={answerIdx === expIdx ? styles.choiceItemCorrect : styles.choiceItem}>
                              <Text style={styles.wrongLabel}>{choiceLabels[expIdx]}</Text>
                              <Text style={styles.wrongText}>{exp}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.explanationBlockContent}>보기 판단이 생성되면 여기에 표시됩니다.</Text>
                        )}
                      </View>
                    </View>
                  </>
                )}

                {/* 대의파악/정보파악 해설 */}
                {(explanation?.type === 'mainIdea' || (!explanation?.type && (item.categoryMain === '대의 파악' || item.categoryMain === '정보 파악'))) && (
                  <>
                    <View style={styles.explanationBlock}>
                      <Text style={styles.explanationBlockTitle}>지문 분석 |</Text>
                      <Text style={styles.explanationBlockContent}>
                        {(explanation as any)?.passageAnalysis || 'AI 해설이 생성되면 여기에 표시됩니다.'}
                      </Text>
                    </View>
                    <View style={styles.explanationBlock}>
                      <Text style={styles.explanationBlockTitle}>정답 해설 |</Text>
                      <Text style={styles.explanationBlockContent}>
                        {(explanation as any)?.correctExplanation || ''}
                      </Text>
                    </View>
                    <View style={styles.explanationBlock}>
                      <Text style={styles.explanationBlockTitle}>오답 소거 |</Text>
                      <View style={styles.choiceExplanations}>
                        {(explanation as any)?.wrongExplanations && (explanation as any).wrongExplanations.length > 0 ? (
                          (explanation as any).wrongExplanations.map((exp: string, expIdx: number) => {
                            if (answerIdx === expIdx) return null;
                            return (
                              <View key={expIdx} style={styles.choiceItem}>
                                <Text style={styles.wrongLabel}>{choiceLabels[expIdx]}</Text>
                                <Text style={styles.wrongText}>{exp}</Text>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={styles.explanationBlockContent}>오답 소거가 생성되면 여기에 표시됩니다.</Text>
                        )}
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ===== 어휘 문제지 행 =====
const VocabTestRowPDF = ({
  styles,
  left,
  right,
}: {
  styles: ReturnType<typeof createStyles>;
  left: { id: string; word: string; questionNumber: number };
  right: { id: string; word: string; questionNumber: number } | null;
}) => (
  <View style={styles.vocabTestRow}>
    {/* 왼쪽 */}
    <View style={styles.vocabColId}>
      <View style={styles.vocabIdBadge}>
        <Text style={styles.vocabIdText}>{String(left.questionNumber).padStart(3, '0')}</Text>
      </View>
    </View>
    <View style={styles.vocabColWord}>
      <Text style={styles.vocabWord}>{left.word}</Text>
    </View>
    <View style={styles.vocabColBlank}>
      <View style={styles.vocabBlankLine} />
    </View>

    {/* 오른쪽 */}
    <View style={styles.vocabColId}>
      {right && (
        <View style={styles.vocabIdBadge}>
          <Text style={styles.vocabIdText}>{String(right.questionNumber).padStart(3, '0')}</Text>
        </View>
      )}
    </View>
    <View style={styles.vocabColWord}>
      {right && <Text style={styles.vocabWord}>{right.word}</Text>}
    </View>
    <View style={styles.vocabColBlank}>
      {right && <View style={styles.vocabBlankLine} />}
    </View>
  </View>
);

// ===== 밑줄 단어 추출 =====
const extractUnderlinedWord = (passage: string): string | null => {
  const match = passage.match(/_([^_]+)_/);
  return match ? match[1] : null;
};

// ===== 단어장 프리뷰 행 =====
const VocaPreviewRowPDF = ({
  styles,
  left,
  right,
  showLeftNumber = true,
  showRightNumber = true,
}: {
  styles: ReturnType<typeof createStyles>;
  left: VocaPreviewWord;
  right: VocaPreviewWord | null;
  showLeftNumber?: boolean;
  showRightNumber?: boolean;
}) => (
  <View style={styles.vocaPreviewRow}>
    {/* 왼쪽 - 번호 */}
    <View style={styles.vocaPreviewColNum}>
      {showLeftNumber && (
        <Text style={styles.vocaPreviewNum}>{left.questionNumber}</Text>
      )}
    </View>
    {/* 왼쪽 - 단어 */}
    <View style={styles.vocaPreviewColWord}>
      <Text style={styles.vocaPreviewWord}>{left.word}</Text>
    </View>
    {/* 왼쪽 - 뜻 */}
    <View style={styles.vocaPreviewColMeaning}>
      <Text style={styles.vocaPreviewMeaning}>{left.meaning}</Text>
    </View>
    {/* 오른쪽 - 번호 */}
    <View style={styles.vocaPreviewColNum}>
      {right && showRightNumber && (
        <Text style={styles.vocaPreviewNum}>{right.questionNumber}</Text>
      )}
    </View>
    {/* 오른쪽 - 단어 */}
    <View style={styles.vocaPreviewColWord}>
      {right && <Text style={styles.vocaPreviewWord}>{right.word}</Text>}
    </View>
    {/* 오른쪽 - 뜻 */}
    <View style={styles.vocaPreviewColMeaning}>
      {right && <Text style={styles.vocaPreviewMeaning}>{right.meaning}</Text>}
    </View>
  </View>
);

// ===== Props 타입 =====
type QuestionPDFViewMode = 'question' | 'answer' | 'vocabulary' | 'vocaPreview';

interface QuestionPDFProps {
  data: QuestionItem[];
  headerInfo: HeaderInfo;
  viewMode?: QuestionPDFViewMode;
  unitNumber?: number;
  showPageNumber?: boolean;
  explanations?: Map<string, ExplanationData>;
  paletteColors?: PaletteColors;
  fontScale?: number;
  choiceDisplayMode?: 'both' | 'korean' | 'english';
  vocaPreviewWords?: VocaPreviewWord[];  // 단어장 프리뷰 데이터
}

// ===== 메인 QuestionPDF 컴포넌트 =====
export const QuestionPDF = ({
  data,
  headerInfo,
  viewMode = 'question',
  unitNumber,
  showPageNumber = true,
  explanations,
  paletteColors,
  fontScale = 1,
  choiceDisplayMode = 'both',
  vocaPreviewWords,
}: QuestionPDFProps) => {
  const palette = paletteColors || defaultPalette;
  const styles = createStyles(palette, fontScale);

  // 문제지 렌더링
  const renderQuestionMode = () => {
    const groupedQuestions = groupByInstruction(data);

    return groupedQuestions.map((group, groupIdx) => {
      // 그룹 내 첫 번째 문제의 유형으로 사이드바 결정
      const firstItem = group.items[0];

      return (
        <View key={groupIdx} style={styles.questionGroupLayout}>
          {/* 문제 컬럼 (60%) */}
          <View style={styles.questionsColumn}>
            {group.items.map((item, itemIdx) => (
              <QuestionCardPDF
                key={item.id}
                styles={styles}
                item={item}
                showAnswer={false}
                showInstruction={itemIdx === 0}
              />
            ))}
          </View>
          {/* 사이드바 컬럼 (40%) */}
          <View style={styles.sidebarColumn}>
            <AnalysisSidebar
              styles={styles}
              categoryMain={firstItem.categoryMain}
              categorySub={firstItem.categorySub}
            />
          </View>
        </View>
      );
    });
  };

  // 해설지 렌더링
  const renderAnswerMode = () => {
    const passageGroups = groupByPassage(data);

    // 전체 렌더링 개수 계산 (그룹은 1개로, 단일은 1개로)
    const totalRenderCount = passageGroups.length;
    let renderIndex = 0;

    return (
      <>
        {/* 헤더 + QUICK VER. */}
        <View style={styles.explanationHeader}>
          <View style={styles.header}>
            {unitNumber && (
              <Text style={styles.unitBadge}>Unit {unitNumber}</Text>
            )}
            <Text style={styles.headerTitle}>{headerInfo.headerTitle}</Text>
            {headerInfo.headerDescription && (
              <Text style={styles.headerDescription}>{headerInfo.headerDescription}</Text>
            )}
          </View>
          <QuickAnswerTablePDF styles={styles} questions={data} />
        </View>

        {/* 해설 카드들 - 같은 지문 그룹이면 GroupedExplanationCardPDF 사용 */}
        {passageGroups.map((group) => {
          const isLast = renderIndex === totalRenderCount - 1;
          renderIndex++;

          // 같은 지문을 공유하는 문제가 2개 이상이면 그룹 카드 사용
          if (group.items.length > 1) {
            return (
              <GroupedExplanationCardPDF
                key={group.items[0].id}
                styles={styles}
                group={group}
                explanations={explanations}
                choiceDisplayMode={choiceDisplayMode}
              />
            );
          }

          // 단일 문제는 기존 카드 사용
          const item = group.items[0];
          return (
            <ExplanationCardPDF
              key={item.id}
              styles={styles}
              item={item}
              explanation={explanations?.get(item.id)}
              choiceDisplayMode={choiceDisplayMode}
              isLast={isLast}
            />
          );
        })}
      </>
    );
  };

  // 어휘 문제지 렌더링
  const renderVocabularyMode = () => {
    const vocabQuestions = data.filter(q => q.categoryMain === '어휘');
    const vocabData = vocabQuestions.map(q => ({
      id: q.id,
      word: extractUnderlinedWord(q.passage) || '(단어 없음)',
      questionNumber: q.questionNumber,
    }));

    const pairedData: { left: typeof vocabData[0]; right: typeof vocabData[0] | null }[] = [];
    for (let i = 0; i < vocabData.length; i += 2) {
      pairedData.push({ left: vocabData[i], right: vocabData[i + 1] || null });
    }

    return pairedData.map((pair, idx) => (
      <VocabTestRowPDF key={idx} styles={styles} left={pair.left} right={pair.right} />
    ));
  };

  // 단어장 프리뷰 렌더링
  const renderVocaPreviewMode = () => {
    const words = vocaPreviewWords || [];
    if (words.length === 0) {
      return <Text style={{ color: '#999' }}>단어 데이터가 없습니다.</Text>;
    }

    // 2열로 배치
    const pairedData: { left: VocaPreviewWord; right: VocaPreviewWord | null }[] = [];
    for (let i = 0; i < words.length; i += 2) {
      pairedData.push({ left: words[i], right: words[i + 1] || null });
    }

    return pairedData.map((pair, idx) => (
      <VocaPreviewRowPDF
        key={idx}
        styles={styles}
        left={pair.left}
        right={pair.right}
      />
    ));
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 헤더 (해설지는 별도 처리) */}
        {viewMode !== 'answer' && headerInfo.headerTitle && (
          <View style={styles.header}>
            {unitNumber && (
              <Text style={styles.unitBadge}>Unit {unitNumber}</Text>
            )}
            <Text style={styles.headerTitle}>{headerInfo.headerTitle}</Text>
            {headerInfo.headerDescription && (
              <Text style={styles.headerDescription}>{headerInfo.headerDescription}</Text>
            )}
          </View>
        )}

        {/* Content */}
        {viewMode === 'question' && renderQuestionMode()}
        {viewMode === 'answer' && renderAnswerMode()}
        {viewMode === 'vocabulary' && renderVocabularyMode()}
        {viewMode === 'vocaPreview' && renderVocaPreviewMode()}

        {/* Footer */}
        {headerInfo.footerLeft && (
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{headerInfo.footerLeft}</Text>
          </View>
        )}

        {/* Page Number */}
        {showPageNumber && (
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        )}
      </Page>
    </Document>
  );
};

export default QuestionPDF;
export type { PaletteColors, QuestionPDFViewMode };
