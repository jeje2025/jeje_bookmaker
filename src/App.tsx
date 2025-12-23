import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Eye, LayoutGrid, Table2, List, FileText, FileCheck, Edit3, BookOpen, Clock, FileSpreadsheet, FileQuestion, Shuffle, Image, Save, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { type PaletteKey, pantoneColors, ColorPaletteSelector, applyPalette } from './components/ColorPaletteSelector';
import { type FontSizeKey, FontSizeSelector, applyFontSize, fontSizes } from './components/FontSizeSelector';
import { UnitSplitButton } from './components/UnitSplitButton';
import { VocabularyCover } from './components/VocabularyCover';
import { VocabularyInput } from './components/VocabularyInput';
import { VocabularyView } from './components/VocabularyView';
import { GrammarSelector, type GrammarItem, GRAMMAR_TYPES } from './components/GrammarSelector';
import { GrammarTable } from './components/GrammarTable';
import { QuestionInput } from './components/QuestionInput';
import { QuestionView } from './components/QuestionView';
import { VocaPreviewInput } from './components/VocaPreviewInput';
import { SessionManager } from './components/SessionManager';
import type { QuestionItem, HeaderInfo as QuestionHeaderInfo, ViewMode as QuestionViewMode, ExplanationData, VocaPreviewWord, SavedSession, PdfPreviewState, EditedFieldMap, EditedField } from './types/question';
import { generateExplanations, generateVocaPreview } from './services/geminiExplanation';
import { saveSession } from './services/sessionStorage';
// import { PDFSaveModal } from './components/PDFSaveModal'; // 모달 없이 바로 저장으로 변경
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Separator } from './components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { AdminDashboard } from './components/AdminDashboard';
import { downloadPDF, downloadQuestionPDF } from './utils/pdfDownload';

const vocabularyData = [
  {
    id: 1,
    word: "serendipity",
    pronunciation: "/ˌserənˈdɪpɪti/",
    partOfSpeech: "n.",
    meaning: "우연히 좋은 것을 발견하는 능력, 뜻밖의 행운",
    definition: "finding valuable things by chance",
    synonyms: ["fortune", "luck", "chance"],
    antonyms: ["misfortune", "bad luck"],
    derivatives: [
      { word: "serendipitous", meaning: "우연한, 뜻밖의" },
      { word: "serendipitously", meaning: "우연히, 뜻밖에" }
    ],
    example: "Finding that rare book in a small bookstore was pure serendipity.",
    translation: "그 작은 서점에서 희귀한 책을 발견한 것은 순전히 뜻밖의 행운이었다.",
    translationHighlight: "뜻밖의 행운",
    etymology: "1754년 영국 작가 Horace Walpole이 페르시아 동화에서 만든 단어."
  },
  {
    id: 2,
    word: "ephemeral",
    pronunciation: "/ɪˈfemərəl/",
    partOfSpeech: "adj.",
    meaning: "일시적인, 덧없는, 짧은 수명의",
    definition: "lasting for a very short time",
    synonyms: ["transient", "fleeting", "temporary"],
    antonyms: ["permanent", "eternal", "lasting"],
    derivatives: [
      { word: "ephemerally", meaning: "일시적으로" },
      { word: "ephemerality", meaning: "덧없음, 일시성" }
    ],
    example: "The beauty of cherry blossoms is ephemeral, lasting only a few weeks.",
    translation: "벚꽃의 아름다움은 일시적이어서 단 몇 주만 지속된다.",
    translationHighlight: "일시적",
    etymology: "그리스어 'ephemeros'에서 유래. '하루 동안만 지속되는'이라는 의미."
  },
  {
    id: 3,
    word: "resilience",
    pronunciation: "/rɪˈzɪliəns/",
    partOfSpeech: "n.",
    meaning: "회복력, 탄력성, 역경을 이겨내는 힘",
    definition: "ability to recover quickly from difficulties",
    synonyms: ["toughness", "flexibility", "adaptability"],
    antonyms: ["fragility", "weakness", "vulnerability"],
    derivatives: [
      { word: "resilient", meaning: "회복력 있는, 탄력적인" },
      { word: "resiliently", meaning: "탄력적으로" }
    ],
    example: "Her resilience in the face of adversity inspired everyone around her.",
    translation: "역경 속에서도 그녀의 회복력은 주변 모든 이를 고무시켰다.",
    translationHighlight: "회복력",
    etymology: "라틴어 'resilire'에서 유래. '다시 튀어오르다'라는 의미."
  },
  {
    id: 4,
    word: "eloquent",
    pronunciation: "/ˈeləkwənt/",
    partOfSpeech: "adj.",
    meaning: "웅변적인, 설득력 있는, 유창한",
    definition: "fluent and persuasive in speaking or writing",
    synonyms: ["articulate", "expressive", "fluent"],
    antonyms: ["inarticulate", "hesitant", "tongue-tied"],
    derivatives: [
      { word: "eloquence", meaning: "웅변, 설득력" },
      { word: "eloquently", meaning: "웅변적으로, 유창하게" }
    ],
    example: "The speaker delivered an eloquent speech that moved the audience.",
    translation: "연사는 중 전체를 감동시킨 웅변적인 연설을 했다.",
    translationHighlight: "웅변적인",
    etymology: "라틴어 'eloquens'에서 유래. '효과적으로 말하다'라는 의미."
  },
  {
    id: 5,
    word: "ubiquitous",
    pronunciation: "/juːˈbɪkwɪtəs/",
    partOfSpeech: "adj.",
    meaning: "어디에나 있는, 편재하는",
    definition: "present everywhere at the same time",
    synonyms: ["omnipresent", "everywhere", "pervasive"],
    antonyms: ["rare", "scarce", "absent"],
    derivatives: [
      { word: "ubiquitously", meaning: "어디에나" },
      { word: "ubiquity", meaning: "편재, 도처에 있음" }
    ],
    example: "Smartphones have become ubiquitous in modern society.",
    translation: "스마트폰은 현대 사회에서 어디에나 있게 되었다.",
    translationHighlight: "어디에나 있게",
    etymology: "라틴어 'ubique'(어디에나)에서 유래한 단어."
  },
  {
    id: 6,
    word: "paradigm",
    pronunciation: "/ˈpærədaɪm/",
    partOfSpeech: "n.",
    meaning: "패러다임, 전형적인 예, 사고의 틀",
    definition: "a typical example or pattern of something",
    synonyms: ["model", "pattern", "framework"],
    antonyms: ["anomaly", "exception"],
    derivatives: [
      { word: "paradigmatic", meaning: "전형적인, 모범적인" },
      { word: "paradigmatically", meaning: "전형적으로" }
    ],
    example: "The discovery caused a paradigm shift in scientific thinking.",
    translation: "그 발견은 과학적인 사고의 패러다임 전환을 일으켰다.",
    translationHighlight: "패러다임",
    etymology: "그리스어 'paradeigma'에서 유래. '패턴, 모델'이라는 의미."
  },
  {
    id: 7,
    word: "ambivalent",
    pronunciation: "/æmˈbɪvələnt/",
    partOfSpeech: "adj.",
    meaning: "양가감정의, 상반된 감정을 동시에 가진",
    definition: "having mixed feelings about something",
    synonyms: ["conflicted", "uncertain", "hesitant"],
    antonyms: ["certain", "decisive", "sure"],
    derivatives: [
      { word: "ambivalence", meaning: "양가감정, 상반된 감정" },
      { word: "ambivalently", meaning: "양가감정을 가지고" }
    ],
    example: "She felt ambivalent about accepting the job offer in another city.",
    translation: "그녀는 다른 도시의 일자리 제안을 받아들이는 것에 대해 양가감정을 느꼈다.",
    translationHighlight: "양가감정",
    etymology: "라틴어 'ambi'(양쪽)와 'valentia'(힘)의 결합."
  },
  {
    id: 8,
    word: "meticulous",
    pronunciation: "/məˈtɪkjələs/",
    partOfSpeech: "adj.",
    meaning: "꼼꼼한, 세심한, 정밀한",
    definition: "showing great attention to detail",
    synonyms: ["thorough", "careful", "precise"],
    antonyms: ["careless", "sloppy", "negligent"],
    derivatives: [
      { word: "meticulously", meaning: "꼼꼼하게, 세심하게" },
      { word: "meticulousness", meaning: "꼼꼼함, 세심함" }
    ],
    example: "The artist's meticulous attention to detail made her work extraordinary.",
    translation: "예술가의 세심한 디테일에 대한 주의가 그녀의 작품을 특별하게 만들었다.",
    translationHighlight: "세심한",
    etymology: "라틴어 'meticulosus'에서 유래. '두려워하는'에서 '조심스러운'으로 의미 변화."
  },
  {
    id: 9,
    word: "nostalgia",
    pronunciation: "/nɒˈstældʒə/",
    partOfSpeech: "n.",
    meaning: "향수, 그리움, 과거에 대한 감상적인 그리움",
    definition: "sentimental longing for the past",
    synonyms: ["longing", "yearning", "reminiscence"],
    antonyms: ["indifference", "present-mindedness"],
    derivatives: [
      { word: "nostalgic", meaning: "향수를 불러일으키" },
      { word: "nostalgically", meaning: "향수에 젖어" }
    ],
    example: "The old photographs filled her with nostalgia for her childhood.",
    translation: "오래된 사진들은 그녀를 어린 시절에 대한 향수로 가득 채웠다.",
    translationHighlight: "향수",
    etymology: "그리스어 'nostos'(귀향)와 'algos'(고통)의 결합. 원래는 '향수병'을 의미."
  },
  {
    id: 10,
    word: "pragmatic",
    pronunciation: "/præɡˈmætɪk/",
    partOfSpeech: "adj.",
    meaning: "용적인, 실천적인, 현실적인",
    definition: "practical and realistic",
    synonyms: ["practical", "realistic", "sensible"],
    antonyms: ["idealistic", "impractical", "theoretical"],
    derivatives: [
      { word: "pragmatically", meaning: "실용적으로" },
      { word: "pragmatism", meaning: "실용주의" }
    ],
    example: "We need to take a pragmatic approach to solving this problem.",
    translation: "우리는 이 문제를 해결하기 위해 실용적인 접근이 필요하다.",
    translationHighlight: "실용적인",
    etymology: "그리스어 'pragma'(행동, 일)에서 유래."
  }
];

export default function App() {
  const [headerInfo, setHeaderInfo] = useState({ headerTitle: 'JEJEVOCA', headerDescription: '', footerLeft: '' });
  const [vocabularyList, setVocabularyList] = useState(vocabularyData);
  const [viewMode, setViewMode] = useState<'input' | 'table' | 'card' | 'tableSimple' | 'tableSimpleTest' | 'test' | 'testDefinition' | 'testAnswer' | 'testDefinitionAnswer' | 'cover'>('card');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isFullscreenInputOpen, setIsFullscreenInputOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isGeneratedData, setIsGeneratedData] = useState(false); // AI 생성 데이터 여부
  const [coverVariant, setCoverVariant] = useState<'photo' | 'gradient' | 'minimal'>('photo'); // 표지 스타일
  const [coverPhoto, setCoverPhoto] = useState<string>(''); // 표지 사진
  const [coverAuthorName, setCoverAuthorName] = useState<string>(''); // 표지 저자명
  const [testQuestionCount, setTestQuestionCount] = useState<number | null>(null); // 테스트 문제 수 (null = 전체)
  // const [isPDFModalOpen, setIsPDFModalOpen] = useState(false); // PDF 저장 모달 - 사용 안 함
  const [isPDFLoading, setIsPDFLoading] = useState(false); // PDF 생성 로딩 상태
  const [pdfProgress, setPdfProgress] = useState({ progress: 0, message: '' }); // PDF 진행률
  const [unitSize, setUnitSize] = useState<number | null>(null); // 유닛당 단어 수 (null = 분할 안 함)
  const [currentUnit, setCurrentUnit] = useState<number>(1); // 현재 보고 있는 유닛 번호
  const [colorPalette, setColorPalette] = useState<PaletteKey>('viva-magenta'); // 배경색 팔레트 (기본: 비바 마젠타)
  const [fontSize, setFontSize] = useState<FontSizeKey>('medium'); // 글씨 크기 (기본: 보통)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // 사이드바 접기
  const [appMode, setAppMode] = useState<'vocabulary' | 'grammar' | 'question'>('question'); // 단어장 / 구문교재 / 문제집 모드
  const [selectedGrammarItems, setSelectedGrammarItems] = useState<GrammarItem[]>([]); // 선택된 구문 문장들
  const [grammarHeaderInfo, setGrammarHeaderInfo] = useState({ headerTitle: '구문교재', headerDescription: '', footerLeft: '' }); // 구문교재 헤더
  const [grammarViewMode, setGrammarViewMode] = useState<'question' | 'answer'>('question'); // 구문교재 뷰모드: 문제지/해설지
  // 문제집 모드 상태
  const [questionList, setQuestionList] = useState<QuestionItem[]>([]); // 문제 리스트
  const [questionHeaderInfo, setQuestionHeaderInfo] = useState<QuestionHeaderInfo>({ headerTitle: '2025 동국대 편입', headerDescription: '', footerLeft: '' }); // 문제집 헤더
  const [questionViewMode, setQuestionViewMode] = useState<QuestionViewMode>('question'); // 문제집 뷰모드: 문제지/해설지
  const [questionExplanations, setQuestionExplanations] = useState<Map<string, ExplanationData>>(new Map()); // 해설 데이터
  const [isGeneratingExplanations, setIsGeneratingExplanations] = useState(false); // 해설 생성 중
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null); // 해설 생성 진행률
  const [vocaPreviewWords, setVocaPreviewWords] = useState<VocaPreviewWord[]>([]); // 단어장 데이터
  const [isGeneratingVocaPreview, setIsGeneratingVocaPreview] = useState(false); // 단어장 생성 중
  const [vocaPreviewStatus, setVocaPreviewStatus] = useState<string>(''); // 단어장 생성 상태 메시지
  const [showChoiceEnglish, setShowChoiceEnglish] = useState<'both' | 'korean' | 'english'>('both'); // 보기 표시 설정: both(영어+한글), korean(한글만), english(영어만)
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; // Gemini API 키 (환경 변수)
  // PDF 미리보기 상태 (T019-T021)
  const [usePdfPreview, setUsePdfPreview] = useState(false); // PDF 미리보기 모드 토글 (기본: 기존 뷰 사용)
  const [pdfPreviewState, setPdfPreviewState] = useState<PdfPreviewState>({
    status: 'idle',
    totalPages: 0,
    currentPage: 1,
    pageImages: new Map(),
    editableRegions: [],
    scale: 2.0,
  });
  const [editedFields, setEditedFields] = useState<Map<string, EditedFieldMap>>(new Map()); // 편집된 필드 상태
  const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0); // 세션 목록 갱신 트리거
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 앱 시작 시 기본 팔레트 및 글씨 크기 적용
  useEffect(() => {
    applyPalette(colorPalette);
    applyFontSize(fontSize);
  }, []);

  // 최근 로그 가져오기
  useEffect(() => {
    // localStorage 정리 (5개 초과 시 자동 삭제)
    cleanupLocalStorage();
    fetchRecentLogs();
  }, []);

  // localStorage 정리 함수 (최근 5개만 유지)
  const cleanupLocalStorage = () => {
    try {
      const logs = localStorage.getItem('vocabulary-recent-logs');
      if (logs) {
        const parsedLogs = JSON.parse(logs);
        if (parsedLogs.length > 5) {
          // 최신순으로 정렬하고 최근 5개만 유지
          const sortedLogs = parsedLogs.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ).slice(0, 5);
          // 정리된 데이터를 다시 저장
          localStorage.setItem('vocabulary-recent-logs', JSON.stringify(sortedLogs));
          console.log(`localStorage 정리 완료: ${parsedLogs.length}개 → 5개`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      // localStorage와 Supabase 데이터 모두 가져오기
      const localLogs: any[] = [];
      const supabaseLogs: any[] = [];

      // 1. localStorage에서 가져오기
      const localData = localStorage.getItem('vocabulary-recent-logs');
      if (localData) {
        const parsedLogs = JSON.parse(localData);
        localLogs.push(...parsedLogs);
      }

      // 2. Supabase에서 가져오기
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/logs`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.logs && Array.isArray(data.logs)) {
            supabaseLogs.push(...data.logs);
          }
        }
      } catch (supabaseError) {
        console.error('Failed to fetch from Supabase:', supabaseError);
      }

      // 3. 두 소스의 데이터 합치기 (headerTitle + 분 단위 기준 중복 제거)
      const allLogsMap = new Map();

      // 분 단위로 키 생성
      const getKey = (log: any) => {
        const ts = new Date(log.timestamp);
        return `${log.headerTitle || ''}_${ts.toISOString().slice(0, 16)}`; // YYYY-MM-DDTHH:mm
      };

      // localStorage 데이터 먼저 추가
      localLogs.forEach((log: any) => {
        allLogsMap.set(getKey(log), log);
      });

      // Supabase 데이터 추가 (같은 키면 덮어쓰기)
      supabaseLogs.forEach((log: any) => {
        allLogsMap.set(getKey(log), log);
      });

      // 4. Map을 배열로 변환하고 최신순 정렬 후 최근 5개만 선택
      const mergedLogs = Array.from(allLogsMap.values())
        .sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 5);

      // 5. 메타데이터만 추출해서 상태 업데이트
      setRecentLogs(mergedLogs.map((log: any) => ({
        id: log.id || log.timestamp,
        timestamp: log.timestamp,
        headerTitle: log.headerTitle,
        headerDescription: log.headerDescription,
        viewMode: log.viewMode,
        wordCount: log.wordCount
      })));
    } catch (error) {
      console.error('Failed to load recent logs:', error);
      setRecentLogs([]);
    }
  };

  const handleLoadLog = async (logId: string) => {
    try {
      let foundLog: any = null;

      // Supabase에서 직접 로드 (load-log API 사용 - vocabularyList 포함)
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/load-log/${encodeURIComponent(logId)}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.log) {
            foundLog = data.log;
          }
        }
      } catch (supabaseError) {
        console.error('Failed to load from Supabase:', supabaseError);
      }

      // 로그를 찾았는지 확인
      if (!foundLog || !foundLog.vocabularyList || foundLog.vocabularyList.length === 0) {
        toast.error('데이터를 찾을 수 없습니다.', { duration: 1000 });
        return;
      }

      // 데이터 불러오기
      setVocabularyList(foundLog.vocabularyList);
      setHeaderInfo({
        headerTitle: foundLog.headerTitle || '',
        headerDescription: foundLog.headerDescription || '',
        footerLeft: foundLog.footerLeft || ''
      });
      setIsGeneratedData(true);
      toast.success('데이터를 불러왔습니다!', { duration: 1000 });
    } catch (error) {
      console.error('Failed to load log:', error);
      toast.error('데이터를 불러오는데 실패했습니다.', { duration: 1000 });
    }
  };
  
  const handleSavePDF = async () => {
    // 제목 필수 체크
    if (!headerInfo.headerTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // PDF 저장 시에는 로그를 저장하지 않음 (생성 버튼 클릭 시에만 저장)
    window.print();
  };

  const handleAdminClick = () => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 4) {
      setShowPasswordDialog(true);
      clickCountRef.current = 0;
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === '1111') {
      setShowPasswordDialog(false);
      setIsAdminOpen(true);
      setPassword('');
    } else {
      alert('비밀번호가 틀렸습니다.');
      setPassword('');
    }
  };

  const handleVocabularySave = async (data: typeof vocabularyData, tokenInfo?: { inputTokens: number, outputTokens: number }) => {
    // ⭐ 제목 체크 제거 - VocabularyInput.tsx에서 이미 처리함
    
    setVocabularyList(data);
    setIsGeneratedData(true); // AI로 생성된 데이터로 표시
    
    // 로그 데이터 준비
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp: timestamp,
      headerTitle: headerInfo.headerTitle,
      headerDescription: headerInfo.headerDescription,
      footerLeft: headerInfo.footerLeft,
      footerRight: '', // 현재 사용하지 않는 필드
      viewMode: viewMode,
      wordCount: data.length,
      vocabularyList: data, // ⚡ 전체 단어 데이터 저장 (모든 단어 정보 포함)
      inputTokens: tokenInfo?.inputTokens || 0,
      outputTokens: tokenInfo?.outputTokens || 0
    };

    // ⚡ 바로 Supabase에 저장 (localStorage 저장 없이)
    console.log('📤 Saving log to Supabase...', logData);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/log`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(logData),
        }
      );

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to save log to Supabase:', response.status, errorText);
        toast.error('로그 저장 실패: ' + errorText, { duration: 1000 });
      } else {
        const result = await response.json();
        console.log('✅ Log saved to Supabase successfully:', result);
        
        // localStorage에는 메타데이터만 저장 (메모리 최적화 - vocabularyList 제외)
        try {
          const existingLogs = localStorage.getItem('vocabulary-recent-logs');
          let logs: any[] = existingLogs ? JSON.parse(existingLogs) : [];

          // 새 로그 추가 (vocabularyList 제외 - Supabase에만 저장)
          logs.push({
            id: timestamp,
            timestamp: timestamp,
            headerTitle: headerInfo.headerTitle,
            headerDescription: headerInfo.headerDescription,
            footerLeft: headerInfo.footerLeft,
            viewMode: viewMode,
            wordCount: data.length,
            // vocabularyList 제외 - 메모리 최적화
            inputTokens: tokenInfo?.inputTokens || 0,
            outputTokens: tokenInfo?.outputTokens || 0
          });

          // 최신순으로 정렬하고 최근 5개만 유지
          logs = logs.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ).slice(0, 5);

          // localStorage에 저장
          localStorage.setItem('vocabulary-recent-logs', JSON.stringify(logs));
        } catch (localError) {
          console.error('Failed to save to localStorage:', localError);
        }
        
        // Supabase 저장 성공 후, 최근 로그 목록 새로고침
        fetchRecentLogs();
      }
    } catch (error) {
      console.error('Failed to save log to Supabase:', error);
      toast.error('로그 저장 중 오류가 발생했습니다.', { duration: 1000 });
    }
  };

  const handleWordUpdate = useCallback((id: number, field: string, value: any) => {
    setVocabularyList(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  // 유닛별 데이터 계산
  const totalWords = useMemo(() => vocabularyList.length, [vocabularyList]);
  const totalUnits = unitSize ? Math.ceil(totalWords / unitSize) : 1;
  const currentUnitData = useMemo(() => {
    if (!unitSize) return vocabularyList;
    const start = (currentUnit - 1) * unitSize;
    const end = Math.min(start + unitSize, vocabularyList.length);
    return vocabularyList.slice(start, end);
  }, [vocabularyList, unitSize, currentUnit]);
  const unitNumber = useMemo(() => unitSize ? currentUnit : undefined, [unitSize, currentUnit]);

  // currentUnit이 totalUnits를 초과하지 않도록
  useEffect(() => {
    if (currentUnit > totalUnits) {
      setCurrentUnit(Math.max(1, totalUnits));
    }
  }, [totalUnits, currentUnit]);

  // 유닛 분할 콜백 (메모이제이션)
  const handleUnitApply = useCallback((size: number) => {
    setUnitSize(size);
    setCurrentUnit(1);
    toast.success(`${size}개씩 유닛 분할 설정됨`, { duration: 1000 });
  }, []);

  const handleUnitReset = useCallback(() => {
    setUnitSize(null);
    setCurrentUnit(1);
  }, []);

  // 헤더 변경 콜백 (메모이제이션)
  const handleHeaderChange = useCallback((updated: { headerTitle?: string; headerDescription?: string; footerLeft?: string }) => {
    setHeaderInfo((prev: { headerTitle: string; headerDescription: string; footerLeft: string }) => ({ ...prev, ...updated }));
  }, []);

  // PDF 저장 핸들러
  const handleSavePDFClick = useCallback(async () => {
    // 문제집 모드일 경우 별도 처리
    if (appMode === 'question') {
      // 제목 필수 체크
      if (!questionHeaderInfo.headerTitle.trim()) {
        toast.error('제목을 입력해주세요.', { duration: 1000 });
        return;
      }

      // 단어장 프리뷰 모드 체크
      if (questionViewMode === 'vocaPreview') {
        if (!vocaPreviewWords || vocaPreviewWords.length === 0) {
          toast.error('단어 데이터가 없습니다.', { duration: 1000 });
          return;
        }
      } else {
        // 문제 데이터 체크
        if (questionList.length === 0) {
          toast.error('문제 데이터가 없습니다.', { duration: 1000 });
          return;
        }
      }

      // viewMode별 한글 이름 매핑
      const viewModeNames: Record<string, string> = {
        question: '문제지',
        answer: '해설지',
        vocabulary: '어휘문제지',
        vocaPreview: '단어장',
      };
      const viewModeName = viewModeNames[questionViewMode] || questionViewMode;

      setIsPDFLoading(true);
      setPdfProgress({ progress: 0, message: '' });

      try {
        const filename = `${questionHeaderInfo.headerTitle} - ${viewModeName}`;
        await downloadQuestionPDF(
          questionList,
          questionHeaderInfo,
          questionViewMode,
          filename,
          undefined,
          (progress, message) => {
            setPdfProgress({ progress, message });
          },
          pantoneColors[colorPalette],
          fontSizes[fontSize].scale,
          questionExplanations,
          showChoiceEnglish,
          vocaPreviewWords
        );
        toast.success('PDF 다운로드 완료!', { duration: 1000 });
      } catch (error) {
        console.error('PDF 생성 오류:', error);
        toast.error('PDF 생성에 실패했습니다.', { duration: 1000 });
      } finally {
        setIsPDFLoading(false);
      }
      return;
    }

    // 단어장 모드
    // 제목 필수 체크
    if (!headerInfo.headerTitle.trim()) {
      toast.error('제목을 입력해주세요.', { duration: 1000 });
      return;
    }

    // 표지는 PDF 저장 지원 안 함
    if (viewMode === 'cover' || viewMode === 'input') {
      toast.error('이 화면은 PDF 저장을 지원하지 않습니다.', { duration: 1000 });
      return;
    }

    // viewMode별 한글 이름 매핑
    const viewModeNames: Record<string, string> = {
      card: '카드형',
      table: '표버전',
      tableSimple: '간단',
      tableSimpleTest: '테스트용 간단버전',
      test: '동의어 테스트',
      testDefinition: '영영 테스트',
      testAnswer: '동의어 답지',
      testDefinitionAnswer: '영영 답지',
    };
    const viewModeName = viewModeNames[viewMode] || viewMode;

    // 유닛 분할 여부에 따라 PDF 생성
    setIsPDFLoading(true);
    setPdfProgress({ progress: 0, message: '' });

    try {
      if (unitSize) {
        // 유닛별로 순차 생성
        const unitsCount = Math.ceil(vocabularyList.length / unitSize);

        for (let i = 0; i < unitsCount; i++) {
          const start = i * unitSize;
          const end = Math.min(start + unitSize, vocabularyList.length);
          const unitData = vocabularyList.slice(start, end);
          const unitNum = i + 1;
          const unitFilename = `${headerInfo.headerTitle} - ${viewModeName} - Unit ${unitNum}`;

          await downloadPDF(unitData, headerInfo, viewMode, unitFilename, unitNum, (progress, message) => {
            // 전체 진행률 계산: (완료 유닛 + 현재 유닛 진행률) / 전체 유닛
            const overallProgress = Math.round(((i + progress / 100) / unitsCount) * 100);
            setPdfProgress({ progress: overallProgress, message: `Unit ${unitNum}/${unitsCount}: ${message}` });
          }, pantoneColors[colorPalette], fontSizes[fontSize].scale);

          // 다음 파일 전 딜레이
          if (i < unitsCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        toast.success(`${unitsCount}개 유닛 PDF 다운로드 완료!`, { duration: 1000 });
      } else {
        // 전체 저장
        const filename = `${headerInfo.headerTitle} - ${viewModeName}`;
        await downloadPDF(vocabularyList, headerInfo, viewMode, filename, undefined, (progress, message) => {
          setPdfProgress({ progress, message });
        }, pantoneColors[colorPalette], fontSizes[fontSize].scale);
        toast.success('PDF 다운로드 완료!', { duration: 1000 });
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      toast.error('PDF 생성에 실패했습니다.', { duration: 1000 });
    } finally {
      setIsPDFLoading(false);
    }
  }, [appMode, headerInfo, viewMode, unitSize, vocabularyList, colorPalette, fontSize, questionHeaderInfo, questionViewMode, questionList, questionExplanations, showChoiceEnglish, vocaPreviewWords]);

  // AI 해설 데이터 localStorage에 저장 (최근 2개만 유지) - sessionStorage 서비스 사용
  const saveExplanationsToLocalStorage = (explanations: Map<string, ExplanationData>, questions: QuestionItem[], vocaWords?: VocaPreviewWord[]) => {
    try {
      const timestamp = new Date().toISOString();
      const session: SavedSession = {
        id: timestamp,
        createdAt: timestamp,
        headerTitle: questionHeaderInfo.headerTitle || undefined, // 교재 제목 저장
        questionCount: questions.length,
        questions: questions,
        explanations: Array.from(explanations.entries()), // Map -> Array of tuples
        vocabularyList: vocaWords // 단어장 데이터도 저장
      };

      // sessionStorage 서비스를 통해 저장 (FIFO, 최대 2개)
      const success = saveSession(session);
      if (success) {
        console.log('📦 세션 저장 완료 (최근 2개 유지)');
        toast.success('세션이 저장되었습니다.', { duration: 1000 });
        setSessionRefreshTrigger((prev: number) => prev + 1); // 세션 목록 갱신
      } else {
        console.error('세션 저장 실패');
        toast.error('저장소 용량이 부족합니다.', { duration: 2000 });
      }
    } catch (error) {
      console.error('세션 저장 실패:', error);
      toast.error('세션 저장에 실패했습니다.', { duration: 2000 });
    }
  };

  // AI 해설 생성 핸들러 (내부 함수) - 해설 + 단어장 동시 생성
  const doGenerateExplanations = async (questions: QuestionItem[], apiKey: string) => {
    setIsGeneratingExplanations(true);
    setGenerationProgress({ current: 0, total: questions.length });
    toast.info(`${questions.length}개 문제 해설 생성 시작...`, { duration: 2000 });

    try {
      // 1. 해설 생성
      const explanations = await generateExplanations(
        questions,
        apiKey,
        (current, total) => {
          setGenerationProgress({ current, total });
        }
      );

      setQuestionExplanations(explanations);
      toast.success(`${explanations.size}개 해설 생성 완료!`, { duration: 1000 });

      // 2. 단어장도 함께 생성
      setIsGeneratingVocaPreview(true);
      setVocaPreviewStatus('단어장 생성 중...');
      toast.info('단어장 자동 생성 시작...', { duration: 1500 });

      try {
        const words = await generateVocaPreview(
          questions,
          apiKey,
          (status) => setVocaPreviewStatus(status)
        );
        setVocaPreviewWords(words);
        toast.success(`${words.length}개 단어 추출 완료!`, { duration: 1000 });

        // 해설 + 단어장 모두 완료 후 localStorage에 저장
        saveExplanationsToLocalStorage(explanations, questions, words);
      } catch (vocaError) {
        console.error('단어장 생성 실패:', vocaError);
        toast.error('단어장 생성에 실패했습니다.', { duration: 1000 });
        // 단어장 실패해도 해설은 저장
        saveExplanationsToLocalStorage(explanations, questions);
      } finally {
        setIsGeneratingVocaPreview(false);
        setVocaPreviewStatus('');
      }

    } catch (error) {
      console.error('해설 생성 실패:', error);
      toast.error('해설 생성에 실패했습니다.', { duration: 1000 });
    } finally {
      setIsGeneratingExplanations(false);
      setGenerationProgress(null);
    }
  };

  // AI 해설 생성 핸들러 (외부 호출용)
  const handleGenerateExplanations = useCallback((questions: QuestionItem[]) => {
    if (!geminiApiKey) {
      toast.error('.env 파일에 VITE_GEMINI_API_KEY를 설정해주세요.', { duration: 2000 });
      return;
    }
    doGenerateExplanations(questions, geminiApiKey);
  }, [geminiApiKey]);

  // 해설지 지문 번역 편집 핸들러
  const handlePassageTranslationEdit = useCallback((questionId: string, newPassage: string) => {
    setQuestionExplanations(prev => {
      const newMap = new Map(prev);
      const existingExplanation = newMap.get(questionId);
      if (existingExplanation) {
        newMap.set(questionId, {
          ...existingExplanation,
          passageTranslation: newPassage,
        });
      }
      return newMap;
    });
  }, []);

  // 해설 필드 편집 핸들러 (동의어 해설, 동의어 목록 등)
  const handleExplanationEdit = useCallback((questionId: string, field: string, value: string | { english: string; korean: string }[]) => {
    setQuestionExplanations(prev => {
      const newMap = new Map(prev);
      const existingExplanation = newMap.get(questionId);
      if (existingExplanation) {
        newMap.set(questionId, {
          ...existingExplanation,
          [field]: value,
        });
      }
      return newMap;
    });
  }, []);

  // T038: 필드 편집 핸들러 (PDF 오버레이 편집용)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFieldEdit = useCallback((questionId: string, fieldType: string, newValue: string, index?: number) => {
    // 1. editedFields 상태 업데이트
    setEditedFields((prev: Map<string, EditedFieldMap>) => {
      const newMap = new Map(prev);
      let fieldMap = newMap.get(questionId);
      if (!fieldMap) {
        fieldMap = new Map<string, EditedField>();
      } else {
        fieldMap = new Map(fieldMap);
      }

      const fieldKey = index !== undefined ? `${fieldType}_${index}` : fieldType;
      const existingField = fieldMap.get(fieldKey);

      // 원본 값 보존 (첫 편집 시에만)
      const originalValue = existingField?.originalValue ?? newValue;

      // 빈 값이면 원본 복원 (FR-011)
      const finalValue = newValue.trim() === '' ? originalValue : newValue;

      fieldMap.set(fieldKey, {
        fieldType: fieldType as EditedField['fieldType'],
        index,
        originalValue,
        currentValue: finalValue,
        lastEditedAt: new Date().toISOString(),
      });

      newMap.set(questionId, fieldMap);
      return newMap;
    });

    // 2. ExplanationData도 업데이트 (실제 PDF에 반영되도록)
    setQuestionExplanations((prev: Map<string, ExplanationData>) => {
      const newMap = new Map(prev);
      const explanation = newMap.get(questionId);
      if (!explanation) return prev;

      // 빈 값이면 원본 값을 찾아서 복원
      const existingFieldMap = editedFields.get(questionId);
      const fieldKey = index !== undefined ? `${fieldType}_${index}` : fieldType;
      const existingField = existingFieldMap?.get(fieldKey);
      const originalValue = existingField?.originalValue;
      const finalValue = newValue.trim() === '' && originalValue ? originalValue : newValue;

      // 필드 타입에 따라 해당 필드 업데이트
      const updatedExplanation: ExplanationData = { ...explanation };

      switch (fieldType) {
        case 'passageTranslation':
          updatedExplanation.passageTranslation = finalValue;
          break;
        case 'wordExplanation':
          if (updatedExplanation.type === 'vocabulary') {
            updatedExplanation.wordExplanation = finalValue;
          }
          break;
        case 'answerChange':
          if (updatedExplanation.type === 'grammar') {
            updatedExplanation.answerChange = finalValue;
          }
          break;
        case 'testPoint':
          if (updatedExplanation.type === 'grammar') {
            updatedExplanation.testPoint = finalValue;
          }
          break;
        case 'correctExplanation':
          if (updatedExplanation.type === 'grammar' || updatedExplanation.type === 'mainIdea' || updatedExplanation.type === 'insertion') {
            updatedExplanation.correctExplanation = finalValue;
          }
          break;
        case 'wrongExplanation':
          if ((updatedExplanation.type === 'grammar' || updatedExplanation.type === 'mainIdea') && index !== undefined) {
            const arr = [...updatedExplanation.wrongExplanations];
            arr[index] = finalValue;
            updatedExplanation.wrongExplanations = arr;
          }
          break;
        case 'step1Targeting':
          if (updatedExplanation.type === 'logic') {
            updatedExplanation.step1Targeting = finalValue;
          }
          break;
        case 'step2Evidence':
          if (updatedExplanation.type === 'logic') {
            updatedExplanation.step2Evidence = finalValue;
          }
          break;
        case 'step3Choice':
          if (updatedExplanation.type === 'logic' && index !== undefined) {
            const arr = [...updatedExplanation.step3Choices];
            arr[index] = finalValue;
            updatedExplanation.step3Choices = arr;
          }
          break;
        case 'passageAnalysis':
          if (updatedExplanation.type === 'mainIdea') {
            updatedExplanation.passageAnalysis = finalValue;
          }
          break;
        case 'positionExplanation':
          if (updatedExplanation.type === 'insertion' && index !== undefined) {
            const arr = [...updatedExplanation.positionExplanations];
            arr[index] = finalValue;
            updatedExplanation.positionExplanations = arr;
          }
          break;
        case 'firstParagraph':
          if (updatedExplanation.type === 'order') {
            updatedExplanation.firstParagraph = finalValue;
          }
          break;
        case 'splitPoint':
          if (updatedExplanation.type === 'order') {
            updatedExplanation.splitPoint = finalValue;
          }
          break;
        case 'conclusion':
          if (updatedExplanation.type === 'order') {
            updatedExplanation.conclusion = finalValue;
          }
          break;
        case 'mainTopic':
          if (updatedExplanation.type === 'wordAppropriateness') {
            updatedExplanation.mainTopic = finalValue;
          }
          break;
        case 'choiceExplanation':
          if (updatedExplanation.type === 'wordAppropriateness' && index !== undefined) {
            const arr = [...updatedExplanation.choiceExplanations];
            arr[index] = finalValue;
            updatedExplanation.choiceExplanations = arr;
          }
          break;
      }

      newMap.set(questionId, updatedExplanation);
      return newMap;
    });
  }, [editedFields]);

  // 영어 지문 편집 핸들러
  const handleEnglishPassageEdit = useCallback((questionId: string, newPassage: string) => {
    setQuestionList((prev: QuestionItem[]) =>
      prev.map((q: QuestionItem) => q.id === questionId ? { ...q, passage: newPassage } : q)
    );
  }, []);

  // 보기 편집 핸들러
  const handleChoiceEdit = useCallback((questionId: string, choiceIndex: number, newChoice: string) => {
    setQuestionList((prev: QuestionItem[]) =>
      prev.map((q: QuestionItem) => {
        if (q.id !== questionId) return q;
        const newChoices = [...q.choices];
        newChoices[choiceIndex] = newChoice;
        return { ...q, choices: newChoices };
      })
    );
  }, []);

  // 발문 편집 핸들러
  const handleInstructionEdit = useCallback((questionId: string, newInstruction: string) => {
    setQuestionList((prev: QuestionItem[]) =>
      prev.map((q: QuestionItem) => q.id === questionId ? { ...q, instruction: newInstruction } : q)
    );
  }, []);

  // 단어 순서 랜덤 섞기 (ID는 1부터 유지)
  const handleShuffleWords = () => {
    const shuffled = [...vocabularyList];
    // Fisher-Yates 알고리즘으로 섞기
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // ID를 1부터 재할당
    const reindexed = shuffled.map((item, index) => ({
      ...item,
      id: index + 1
    }));
    setVocabularyList(reindexed);
  };

  return (
    <div className="flex h-screen bg-gray-50 print:bg-white print:block overflow-hidden">
      {/* Left Sidebar - 단어 입력창 - 인쇄 시 숨김 */}
      <div
        className="bg-white border-r border-gray-200 flex flex-col print:hidden overflow-hidden flex-shrink-0 transition-all duration-300"
        style={{ width: isSidebarCollapsed ? 0 : 420, minWidth: isSidebarCollapsed ? 0 : 420, borderRightWidth: isSidebarCollapsed ? 0 : 1 }}
      >
        {/* 헤더 - 고정, 높이 정확히 맞춤 */}
        <div className="px-6 border-b border-gray-200 flex-shrink-0 relative" style={{ height: '73px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* 앱 모드 전환 탭 */}
          <div className="flex items-center gap-1 mb-1">
            <button
              onClick={() => setAppMode('question')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                appMode === 'question'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              문제집
            </button>
            <button
              onClick={() => setAppMode('vocabulary')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                appMode === 'vocabulary'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              단어장
            </button>
            <button
              onClick={() => setAppMode('grammar')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                appMode === 'grammar'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              구문교재
            </button>
          </div>
          <p className="text-slate-500 text-xs">크롬 권장 · Made By 제제샘</p>
          {/* 접기 버튼 */}
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="사이드바 접기"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* 단어 입력 + 최근 생성 영역 - 함께 스크롤 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {appMode === 'vocabulary' ? (
            <>
              {/* 단어 입력 영역 */}
              <div className="p-4">
                <VocabularyInput
                  onSave={handleVocabularySave}
                  data={vocabularyList}
                  fullscreen={true}
                  headerInfo={headerInfo}
                  onHeaderChange={setHeaderInfo}
                  onChange={(updatedData) => {
                    // 사이드바에서 엑셀 수정 시 실시간으로 PDF 미리보기에 반영
                    setVocabularyList(updatedData);
                  }}
                />
              </div>

              {/* 최근 생성 영역 */}
              <div className="border-t border-gray-200 bg-slate-50">
                <div className="p-3 border-b border-gray-200 bg-white sticky top-0">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-600" />
                    <h3 className="text-sm text-slate-700">최근 생성</h3>
                  </div>
                </div>
                {recentLogs.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    아직 생성된 단어장이 없습니다
                  </div>
                ) : (
                  <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                    {recentLogs.map((log, index) => (
                      <button
                        key={log.id || index}
                        onClick={() => handleLoadLog(log.id)}
                        className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                      >
                        <p className="text-xs text-slate-900 font-medium truncate">
                          {log.headerTitle || '제목 없음'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-slate-500">
                            {new Date(log.timestamp).toLocaleDateString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-slate-600 font-medium">
                            {log.wordCount || 0}개
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : appMode === 'question' ? (
            /* 문제집 모드 */
            questionViewMode === 'vocaPreview' ? (
              /* 단어장 모드 - 단어 데이터 입력 UI */
              <div className="p-4 h-full">
                <VocaPreviewInput
                  data={vocaPreviewWords}
                  onSave={setVocaPreviewWords}
                  headerInfo={questionHeaderInfo}
                  onHeaderChange={setQuestionHeaderInfo}
                />
              </div>
            ) : (
              /* 문제집 모드 - 문제 데이터 입력 UI */
              <>
                <div className="p-4">
                  <QuestionInput
                    onSave={setQuestionList}
                    data={questionList}
                    headerInfo={questionHeaderInfo}
                    onHeaderChange={setQuestionHeaderInfo}
                    onGenerateExplanations={handleGenerateExplanations}
                    isGenerating={isGeneratingExplanations}
                    explanations={questionExplanations}
                    generationProgress={generationProgress ?? undefined}
                  />
                </div>
                {/* 저장된 세션 관리 */}
                <div className="border-t border-gray-200 p-4">
                  <SessionManager
                    refreshTrigger={sessionRefreshTrigger}
                    onLoadSession={(questions, explanations, headerTitle, vocaWords) => {
                      setQuestionList(questions);
                      setQuestionExplanations(explanations);
                      setQuestionHeaderInfo((prev: QuestionHeaderInfo) => ({ ...prev, headerTitle }));
                      if (vocaWords && vocaWords.length > 0) {
                        setVocaPreviewWords(vocaWords);
                      }
                      toast.success('세션을 불러왔습니다!', { duration: 1000 });
                    }}
                  />
                </div>
              </>
            )
          ) : (
            /* 구문교재 모드 - 문법 요소 선택 UI */
            <GrammarSelector
              onSelectionChange={setSelectedGrammarItems}
              headerInfo={grammarHeaderInfo}
              onHeaderChange={setGrammarHeaderInfo}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - 인쇄 시 숨김, 한 줄로 표시 */}
        <div
          className="bg-white border-b border-gray-200 px-3 py-2 print:hidden flex-shrink-0 flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 사이드바 펼치기 버튼 - 접혀있을 때만 표시 */}
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="사이드바 펼치기"
            >
              <PanelLeft size={18} />
            </button>
          )}

          {/* 단어장 모드 - 뷰 모드 버튼들 */}
          {appMode === 'vocabulary' && (
            <>
              <button
                onClick={() => setViewMode('card')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'card'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText size={14} />
                카드형
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Table2 size={14} />
                표버전
              </button>
              <button
                onClick={() => setViewMode('tableSimple')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'tableSimple'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileSpreadsheet size={14} />
                간단
              </button>
              <button
                onClick={() => setViewMode('tableSimpleTest')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'tableSimpleTest'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileSpreadsheet size={14} />
                간단 테스트
              </button>
              <button
                onClick={() => setViewMode('test')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'test'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileQuestion size={14} />
                동의어 테스트
              </button>
              <button
                onClick={() => setViewMode('testDefinition')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'testDefinition'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <BookOpen size={14} />
                영영 테스트
              </button>
              <button
                onClick={() => setViewMode('testAnswer')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'testAnswer'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileCheck size={14} />
                동의어 답지
              </button>
              <button
                onClick={() => setViewMode('testDefinitionAnswer')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'testDefinitionAnswer'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileCheck size={14} />
                영영 답지
              </button>
              <button
                onClick={() => setViewMode('cover')}
                className={`shrink-0 pl-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'cover'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Image size={14} />
                표지
              </button>


              {/* 단어 섞기 버튼 - 테스트에서만 표시 */}
              {viewMode === 'test' && (
                <button
                  onClick={() => {
                    handleShuffleWords();
                    toast.success('문제 순서가 섞였습니다!', { duration: 1000 });
                  }}
                  className="shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 text-slate-400 hover:text-slate-600"
                >
                  <Shuffle size={14} />
                  랜덤
                </button>
              )}

              {/* 표지 설정 - 표지에서만 표시 */}
              {viewMode === 'cover' && (
                <Select
                  value={coverVariant}
                  onValueChange={(value: 'photo' | 'gradient' | 'minimal') => setCoverVariant(value)}
                >
                  <SelectTrigger className="shrink-0 w-24 h-8 text-xs border-0 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">사진</SelectItem>
                    <SelectItem value="gradient">그라디언트</SelectItem>
                    <SelectItem value="minimal">미니멀</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* 구분선 */}
              <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />
            </>
          )}

          {/* 문제집 모드 - 뷰모드 전환 버튼 */}
          {appMode === 'question' && (
            <>
              <button
                onClick={() => setQuestionViewMode('question')}
                className={`shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  questionViewMode === 'question'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText size={14} />
                문제지
              </button>
              <button
                onClick={() => setQuestionViewMode('answer')}
                className={`shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  questionViewMode === 'answer'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileCheck size={14} />
                해설지
              </button>
              <button
                onClick={() => setQuestionViewMode('vocabulary')}
                className={`shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  questionViewMode === 'vocabulary'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List size={14} />
                어휘 문제지
              </button>
              <button
                onClick={() => setQuestionViewMode('vocaPreview')}
                className={`shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  questionViewMode === 'vocaPreview'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <BookOpen size={14} />
                단어장
              </button>
              <div className="shrink-0 px-3 py-1.5 text-sm text-slate-600">
                <span className="font-medium">{questionList.length}</span>개 문제
              </div>
              {/* 해설지 보기 표시 설정 */}
              {questionViewMode === 'answer' && (
                <>
                  <Select
                    value={showChoiceEnglish}
                    onValueChange={(value: 'both' | 'korean' | 'english') => setShowChoiceEnglish(value)}
                  >
                    <SelectTrigger className="shrink-0 w-28 h-8 text-xs border-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">영어+한글</SelectItem>
                      <SelectItem value="english">영어만</SelectItem>
                      <SelectItem value="korean">한글만</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                      isEditMode
                        ? 'text-blue-600 font-semibold'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Edit3 size={14} />
                    {isEditMode ? '편집중' : '편집'}
                  </button>
                </>
              )}
            </>
          )}

          {/* 구문교재 모드 - 뷰모드 전환 버튼 */}
          {appMode === 'grammar' && (
            <>
              <button
                onClick={() => setGrammarViewMode('question')}
                className={`shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  grammarViewMode === 'question'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText size={14} />
                문제지
              </button>
              <button
                onClick={() => setGrammarViewMode('answer')}
                className={`shrink-0 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1.5 ${
                  grammarViewMode === 'answer'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileCheck size={14} />
                해설지
              </button>
              <div className="shrink-0 px-3 py-1.5 text-sm text-slate-600">
                <span className="font-medium">{selectedGrammarItems.length}</span>개 선택
              </div>
            </>
          )}

          {/* 유닛 분할 */}
          <div className="shrink-0">
            <UnitSplitButton
              totalWords={totalWords}
              currentUnitSize={unitSize}
              onApply={handleUnitApply}
              onReset={handleUnitReset}
            />
          </div>

          {/* 컬러 팔레트 */}
          <div className="shrink-0">
            <ColorPaletteSelector
              currentPalette={colorPalette}
              onPaletteChange={setColorPalette}
            />
          </div>

          {/* 글씨 크기 */}
          <div className="shrink-0">
            <FontSizeSelector
              currentSize={fontSize}
              onSizeChange={setFontSize}
            />
          </div>

          {/* 구분선 */}
          <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />

          {/* PDF 저장 */}
          <Button
            onClick={handleSavePDFClick}
            disabled={isPDFLoading}
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2 justify-center"
            size="sm"
          >
            <Save size={14} />
            {isPDFLoading ? '생성 중...' : 'PDF 저장'}
          </Button>

          {/* 관리자 버튼 */}
          <button
            onClick={handleAdminClick}
            className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100"
            title="관리자"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-100 print:bg-white print:overflow-visible">
          <div className="py-8 print:py-0">
            <div className="page-container">
              {/* 유닛 선택 UI */}
              {unitSize && totalUnits > 1 && (
                <div className="flex items-center justify-center gap-2 mb-4 print:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentUnit(Math.max(1, currentUnit - 1))}
                    disabled={currentUnit === 1}
                  >
                    ◀ 이전
                  </Button>
                  <span className="px-4 py-1 bg-slate-800 text-white rounded font-medium">
                    Unit {currentUnit} / {totalUnits}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentUnit(Math.min(totalUnits, currentUnit + 1))}
                    disabled={currentUnit === totalUnits}
                  >
                    다음 ▶
                  </Button>
                </div>
              )}

              {appMode === 'vocabulary' ? (
                // 단어장 모드
                viewMode === 'cover' ? (
                  <VocabularyCover
                    data={vocabularyList}
                    headerInfo={headerInfo}
                    photo={coverPhoto}
                    authorName={coverAuthorName}
                    variant={coverVariant}
                    onPhotoUpload={(photoUrl) => setCoverPhoto(photoUrl)}
                    onHeaderInfoChange={(info) => setHeaderInfo(info)}
                    onAuthorNameChange={(name) => setCoverAuthorName(name)}
                  />
                ) : (
                  <VocabularyView
                    viewMode={viewMode as 'card' | 'table' | 'tableSimple' | 'tableSimpleTest' | 'test' | 'testDefinition' | 'testAnswer' | 'testDefinitionAnswer'}
                    data={currentUnitData}
                    headerInfo={headerInfo}
                    isEditMode={isEditMode}
                    unitNumber={unitNumber}
                    onWordUpdate={handleWordUpdate}
                    onHeaderChange={handleHeaderChange}
                  />
                )
              ) : appMode === 'question' ? (
                // 문제집 모드
                (questionList.length > 0 || (questionViewMode === 'vocaPreview' && vocaPreviewWords.length > 0)) ? (
                  <QuestionView
                    viewMode={questionViewMode}
                    data={questionList}
                    headerInfo={questionHeaderInfo}
                    explanations={questionExplanations}
                    onHeaderChange={setQuestionHeaderInfo}
                    vocaPreviewWords={vocaPreviewWords}
                    onVocaPreviewWordsChange={setVocaPreviewWords}
                    choiceDisplayMode={showChoiceEnglish}
                    onPassageTranslationEdit={handlePassageTranslationEdit}
                    onExplanationEdit={handleExplanationEdit}
                    onEnglishPassageEdit={handleEnglishPassageEdit}
                    onChoiceEdit={handleChoiceEdit}
                    onInstructionEdit={handleInstructionEdit}
                    isEditMode={isEditMode}
                  />
                ) : questionViewMode === 'vocaPreview' ? (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                      <p className="text-lg mb-2">단어장 데이터가 없습니다</p>
                      <p className="text-sm">왼쪽에서 AI 단어장 생성 버튼을 클릭하거나 직접 입력하세요</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                      <p className="text-lg mb-2">문제 데이터를 입력해주세요</p>
                      <p className="text-sm">왼쪽에서 TSV 데이터를 붙여넣거나 파일을 업로드하세요</p>
                    </div>
                  </div>
                )
              ) : (
                // 구문교재 모드
                selectedGrammarItems.length > 0 ? (
                  <GrammarTable
                    data={selectedGrammarItems}
                    headerInfo={grammarHeaderInfo}
                    showAnswer={grammarViewMode === 'answer'}
                    unitInfo={(() => {
                      // 선택된 문장들의 문법 유형 추출
                      const grammarType = selectedGrammarItems[0]?.grammarType;
                      const grammarLabel = GRAMMAR_TYPES.find(t => t.id === grammarType)?.label || grammarType;
                      return grammarLabel ? `Unit1 | ${grammarLabel}` : undefined;
                    })()}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                      <p className="text-lg mb-2">문장을 선택해주세요</p>
                      <p className="text-sm">왼쪽에서 문법 요소를 선택하고 문장을 체크하세요</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 관리자 대시보드 */}
      {isAdminOpen && (
        <AdminDashboard 
          onClose={() => setIsAdminOpen(false)} 
          onLoad={(log) => {
            // 로그 데이터를 불러오기
            if (log.vocabularyList) {
              setVocabularyList(log.vocabularyList);
              setHeaderInfo({
                headerTitle: log.headerTitle || '',
                headerDescription: log.headerDescription || '',
                footerLeft: log.footerLeft || ''
              });
              setIsGeneratedData(true);
              toast.success('데이터를 불러왔습니다!', { duration: 1000 });
              setIsAdminOpen(false); // 대시보드 닫기
            }
          }}
        />
      )}

      {/* 전체화면 단어 입력 모달 */}
      <Dialog open={isFullscreenInputOpen} onOpenChange={setIsFullscreenInputOpen}>
        <DialogContent className="max-w-[99vw] w-[99vw] h-[96vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200">
            <DialogTitle>단어 입력 - 전체화면</DialogTitle>
            <DialogDescription>엑셀처럼 단어 데이터를 입력하세요</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-2">
            <VocabularyInput 
              onSave={(data, tokenInfo) => {
                handleVocabularySave(data, tokenInfo);
                setIsFullscreenInputOpen(false);
              }} 
              data={vocabularyList}
              fullscreen={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 입력 모달 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 입력</DialogTitle>
            <DialogDescription>관리자 비밀번호를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
            <Button 
              onClick={handlePasswordSubmit} 
              className="w-full"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF 로딩 모달 */}
      {isPDFLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid var(--badge-border, #e5e7eb)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            {/* 상단 뱃지 */}
            <div className="flex justify-center mb-4">
              <div
                className="inline-flex items-center justify-center px-3 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--badge-bg, #f1f5f9)',
                  boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)'
                }}
              >
                <p className="uppercase tracking-tight font-medium text-center" style={{ fontSize: '10px', color: 'var(--badge-text, #475569)' }}>
                  PDF
                </p>
              </div>
            </div>

            {/* 제목 */}
            <h2 className="text-center mb-1" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--badge-text, #000)' }}>
              PDF 생성 중
            </h2>
            <p className="text-gray-500 text-xs text-center mb-4">
              {pdfProgress.message || `${vocabularyList.length}개 단어를 처리하고 있습니다`}
            </p>

            {/* 진행률 바 */}
            <div
              className="w-full h-2 rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${pdfProgress.progress}%`,
                  backgroundColor: 'var(--badge-text, #475569)'
                }}
              />
            </div>

            {/* 퍼센트 */}
            <p className="text-center font-semibold" style={{ fontSize: '13px', color: 'var(--badge-text, #475569)' }}>
              {pdfProgress.progress}%
            </p>
          </div>
        </div>
      )}

      {/* 알림 토스트 */}
      <Toaster />
    </div>
  );
}