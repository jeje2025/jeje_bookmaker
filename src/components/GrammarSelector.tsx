import { useState, useMemo } from 'react';
import { Check, Filter, Calendar, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

// 문법 요소 타입
export interface GrammarItem {
  id: number;
  sentence: string;      // 영어 구문/문장
  translation: string;   // 한글 해석
  grammarType: string;   // 문법 요소 (명사절, 분사구문 등)
  source: string;        // 출처 (2024년 6월 평가원 등)
  year: number;          // 연도
  month: number;         // 월 (3, 6, 9, 11)
  examType: 'mockExam' | 'csat';  // 평가원 / 수능
}

// 문법 요소 목록
export const GRAMMAR_TYPES = [
  { id: 'noun-clause', label: '명사절', description: 'that절, whether/if절, 의문사절' },
  { id: 'participle', label: '분사구문', description: '현재분사/과거분사 구문' },
  { id: 'relative', label: '관계사', description: '관계대명사, 관계부사' },
  { id: 'subjunctive', label: '가정법', description: '가정법 과거, 과거완료' },
  { id: 'comparison', label: '비교구문', description: '원급, 비교급, 최상급' },
  { id: 'emphasis', label: '강조/도치', description: '강조구문, 도치구문' },
];

// 더미 데이터 (나중에 DB로 교체)
const DUMMY_SENTENCES: GrammarItem[] = [
  // 명사절
  { id: 1, sentence: "What most researchers have consistently found throughout decades of extensive studies is that maintaining a balanced diet combined with regular physical exercise significantly reduces the risk of developing chronic diseases in later life.", translation: "수십 년간의 광범위한 연구를 통해 대부분의 연구자들이 일관되게 발견한 것은 균형 잡힌 식단과 규칙적인 신체 운동을 병행하면 노년기에 만성 질환이 발생할 위험이 크게 줄어든다는 것이다.", grammarType: 'noun-clause', source: '2024년 6월 평가원', year: 2024, month: 6, examType: 'mockExam' },
  { id: 2, sentence: "It is widely believed among educational psychologists that children who are exposed to multiple languages during their early developmental years tend to demonstrate superior cognitive flexibility and enhanced problem-solving abilities throughout their academic careers.", translation: "교육 심리학자들 사이에서는 초기 발달기에 여러 언어에 노출된 아이들이 학업 기간 내내 뛰어난 인지적 유연성과 향상된 문제 해결 능력을 보이는 경향이 있다고 널리 믿어진다.", grammarType: 'noun-clause', source: '2024년 3월 평가원', year: 2024, month: 3, examType: 'mockExam' },
  { id: 3, sentence: "Whether the newly proposed environmental regulations will effectively address the urgent challenges posed by climate change or merely serve as symbolic gestures without substantial impact remains a subject of intense debate among policymakers and scientists alike.", translation: "새로 제안된 환경 규제가 기후 변화로 인한 긴급한 과제를 효과적으로 해결할 것인지, 아니면 실질적인 영향 없이 상징적인 제스처에 불과할 것인지는 정책 입안자들과 과학자들 사이에서 여전히 치열한 논쟁의 대상으로 남아 있다.", grammarType: 'noun-clause', source: '2023년 수능', year: 2023, month: 11, examType: 'csat' },
  { id: 4, sentence: "The undeniable fact that modern technology has fundamentally transformed the way we communicate, work, and interact with one another has led many sociologists to reconsider traditional theories about human social behavior and community formation.", translation: "현대 기술이 우리가 소통하고, 일하고, 서로 상호작용하는 방식을 근본적으로 변화시켰다는 부인할 수 없는 사실은 많은 사회학자들로 하여금 인간의 사회적 행동과 공동체 형성에 관한 전통적인 이론을 재고하게 만들었다.", grammarType: 'noun-clause', source: '2023년 9월 평가원', year: 2023, month: 9, examType: 'mockExam' },
  { id: 5, sentence: "I often wonder if the decisions we make during our formative years, which seem relatively insignificant at the time, actually have profound and lasting effects on the trajectory of our personal and professional lives in ways we cannot fully comprehend until much later.", translation: "나는 종종 우리가 성장기에 내리는 결정들이, 당시에는 상대적으로 사소해 보이지만, 실제로는 훨씬 나중에야 완전히 이해할 수 있는 방식으로 우리의 개인적, 직업적 삶의 궤적에 깊고 지속적인 영향을 미치는지 궁금해한다.", grammarType: 'noun-clause', source: '2023년 6월 평가원', year: 2023, month: 6, examType: 'mockExam' },
  { id: 6, sentence: "That he managed to overcome seemingly insurmountable obstacles and achieve remarkable success despite facing severe financial hardships, social discrimination, and repeated failures throughout his early career was nothing short of inspirational to everyone who witnessed his journey.", translation: "그가 초기 경력 내내 심각한 재정적 어려움, 사회적 차별, 반복되는 실패에 직면했음에도 불구하고 극복할 수 없어 보이는 장애물을 이겨내고 놀라운 성공을 거두었다는 것은 그의 여정을 지켜본 모든 사람에게 영감 그 자체였다.", grammarType: 'noun-clause', source: '2022년 수능', year: 2022, month: 11, examType: 'csat' },
  { id: 7, sentence: "What the distinguished professor emphasized repeatedly during her compelling lecture on sustainable development was the critical importance of integrating environmental considerations into every aspect of economic planning and corporate decision-making processes.", translation: "저명한 교수가 지속 가능한 발전에 관한 설득력 있는 강의에서 반복적으로 강조한 것은 경제 계획과 기업 의사 결정 과정의 모든 측면에 환경적 고려를 통합하는 것의 중요성이었다.", grammarType: 'noun-clause', source: '2022년 9월 평가원', year: 2022, month: 9, examType: 'mockExam' },
  { id: 8, sentence: "It still remains entirely unclear to investigators and forensic experts how the sophisticated security system, which had been specifically designed to prevent unauthorized access and had functioned flawlessly for over a decade, could have been compromised so easily without triggering any alarms.", translation: "수사관들과 법의학 전문가들에게는 무단 접근을 방지하기 위해 특별히 설계되었고 10년 넘게 완벽하게 작동해온 정교한 보안 시스템이 어떻게 경보를 울리지 않고 그렇게 쉽게 뚫릴 수 있었는지 여전히 완전히 불분명하다.", grammarType: 'noun-clause', source: '2022년 6월 평가원', year: 2022, month: 6, examType: 'mockExam' },
  { id: 9, sentence: "Nobody in the scientific community can accurately predict when the next major breakthrough in quantum computing will occur, although many experts believe that we are on the verge of discoveries that could revolutionize fields ranging from cryptography to drug development.", translation: "과학계의 누구도 양자 컴퓨팅의 다음 주요 돌파구가 언제 일어날지 정확하게 예측할 수 없지만, 많은 전문가들은 우리가 암호학에서 신약 개발에 이르는 분야를 혁신할 수 있는 발견의 문턱에 와 있다고 믿는다.", grammarType: 'noun-clause', source: '2021년 수능', year: 2021, month: 11, examType: 'csat' },
  { id: 10, sentence: "The fundamental question that philosophers and cognitive scientists have grappled with for centuries is whether human consciousness can ever be fully explained through purely materialistic and mechanistic frameworks, or whether it requires an entirely different conceptual approach.", translation: "철학자들과 인지 과학자들이 수 세기 동안 씨름해온 근본적인 질문은 인간의 의식이 순전히 유물론적이고 기계론적인 틀로 완전히 설명될 수 있는지, 아니면 완전히 다른 개념적 접근이 필요한지이다.", grammarType: 'noun-clause', source: '2021년 9월 평가원', year: 2021, month: 9, examType: 'mockExam' },
  { id: 11, sentence: "I simply cannot understand why the board of directors chose to approve such a risky investment strategy when all the available market data and financial indicators were clearly suggesting that the economic conditions were highly unfavorable for such aggressive expansion plans.", translation: "나는 이사회가 왜 모든 가용 시장 데이터와 금융 지표가 경제 상황이 그러한 공격적인 확장 계획에 매우 불리하다는 것을 분명히 시사하고 있을 때 그토록 위험한 투자 전략을 승인하기로 선택했는지 도무지 이해할 수 없다.", grammarType: 'noun-clause', source: '2024년 9월 평가원', year: 2024, month: 9, examType: 'mockExam' },
  { id: 12, sentence: "It is absolutely essential for the long-term sustainability of our democratic institutions that every citizen, regardless of their socioeconomic background, educational level, or political affiliation, understand the fundamental principles upon which our constitutional framework was established.", translation: "사회경제적 배경, 교육 수준, 정치적 성향에 관계없이 모든 시민이 우리 헌법 체계가 수립된 근본 원칙을 이해하는 것은 민주주의 제도의 장기적 지속가능성을 위해 절대적으로 필수적이다.", grammarType: 'noun-clause', source: '2020년 수능', year: 2020, month: 11, examType: 'csat' },
  { id: 13, sentence: "The revolutionary idea that ordinary individuals could harness the power of artificial intelligence to automate complex tasks that once required years of specialized training seemed utterly impossible just two decades ago, yet it has now become an integral part of our daily reality.", translation: "평범한 개인들이 한때 수년간의 전문 훈련이 필요했던 복잡한 작업을 자동화하기 위해 인공지능의 힘을 활용할 수 있다는 혁명적인 생각은 불과 20년 전만 해도 완전히 불가능해 보였지만, 이제는 우리 일상의 필수적인 부분이 되었다.", grammarType: 'noun-clause', source: '2020년 6월 평가원', year: 2020, month: 6, examType: 'mockExam' },
  { id: 14, sentence: "What genuinely surprised the entire research team was how rapidly the experimental subjects adapted to the artificially created environment and began exhibiting behavioral patterns that had never been observed in any previous controlled laboratory studies.", translation: "전체 연구팀을 진정으로 놀라게 한 것은 실험 대상들이 인위적으로 만들어진 환경에 얼마나 빠르게 적응하고 이전의 어떤 통제된 실험실 연구에서도 관찰된 적 없는 행동 패턴을 보이기 시작했는지였다.", grammarType: 'noun-clause', source: '2021년 6월 평가원', year: 2021, month: 6, examType: 'mockExam' },
  { id: 15, sentence: "It is far from clear at this point whether the recently implemented policy changes will produce the desired outcomes in terms of reducing income inequality, improving access to quality healthcare, and creating sustainable employment opportunities for marginalized communities.", translation: "최근 시행된 정책 변화가 소득 불평등 감소, 양질의 의료 서비스 접근성 향상, 소외된 지역사회를 위한 지속 가능한 고용 기회 창출 측면에서 원하는 결과를 가져올 것인지는 현시점에서 전혀 명확하지 않다.", grammarType: 'noun-clause', source: '2024년 수능', year: 2024, month: 11, examType: 'csat' },
  { id: 16, sentence: "Whoever successfully develops a commercially viable method for capturing and storing atmospheric carbon dioxide at scale while maintaining reasonable production costs will undoubtedly play a pivotal role in humanity's collective effort to combat the existential threat of climate change.", translation: "합리적인 생산 비용을 유지하면서 대기 중 이산화탄소를 대규모로 포집하고 저장하는 상업적으로 실현 가능한 방법을 성공적으로 개발하는 사람은 누구든지 기후 변화라는 실존적 위협에 맞서는 인류의 공동 노력에서 중추적인 역할을 할 것이 틀림없다.", grammarType: 'noun-clause', source: '2023년 3월 평가원', year: 2023, month: 3, examType: 'mockExam' },
  { id: 17, sentence: "The uncomfortable truth that many people in positions of power are reluctant to acknowledge is that systemic changes in our economic and social structures are absolutely necessary if we genuinely hope to address the root causes of persistent poverty and widening inequality.", translation: "권력의 자리에 있는 많은 사람들이 인정하기 꺼리는 불편한 진실은 지속적인 빈곤과 심화되는 불평등의 근본 원인을 진정으로 해결하고자 한다면 경제적, 사회적 구조의 체계적인 변화가 절대적으로 필요하다는 것이다.", grammarType: 'noun-clause', source: '2022년 3월 평가원', year: 2022, month: 3, examType: 'mockExam' },
  { id: 18, sentence: "I have always been deeply curious about what actually transpired during those crucial hours between the initial emergency report and the eventual deployment of rescue teams, as the official accounts seem to contain several significant inconsistencies that have never been satisfactorily explained.", translation: "나는 항상 최초 긴급 보고와 최종 구조대 배치 사이의 그 결정적인 시간 동안 실제로 무슨 일이 일어났는지 깊이 궁금해해 왔는데, 공식 기록에는 결코 만족스럽게 설명되지 않은 몇 가지 중요한 불일치가 포함되어 있는 것 같기 때문이다.", grammarType: 'noun-clause', source: '2021년 3월 평가원', year: 2021, month: 3, examType: 'mockExam' },
  { id: 19, sentence: "That the Earth revolves around the Sun rather than the other way around, which we now accept as basic scientific knowledge, was once considered such a dangerous and heretical idea that those who publicly advocated for it risked imprisonment, torture, or even execution.", translation: "지금은 기본적인 과학 지식으로 받아들이는, 지구가 그 반대가 아니라 태양 주위를 돈다는 것은 한때 너무나 위험하고 이단적인 생각으로 여겨져서 공개적으로 이를 주장한 사람들은 투옥, 고문, 심지어 처형의 위험을 감수해야 했다.", grammarType: 'noun-clause', source: '2020년 9월 평가원', year: 2020, month: 9, examType: 'mockExam' },
  { id: 20, sentence: "It ultimately doesn't matter how many times you fail or how slowly you progress toward your goals, as long as you maintain your determination, learn from each setback, and refuse to abandon the pursuit of what you believe is truly important and meaningful in your life.", translation: "얼마나 많이 실패하거나 목표를 향해 얼마나 천천히 나아가는지는 궁극적으로 중요하지 않다. 결심을 유지하고, 각각의 좌절에서 배우며, 인생에서 진정으로 중요하고 의미 있다고 믿는 것의 추구를 포기하지 않는 한 말이다.", grammarType: 'noun-clause', source: '2020년 3월 평가원', year: 2020, month: 3, examType: 'mockExam' },

  // 분사구문
  { id: 21, sentence: "Walking through the forest, I heard the sound of birds singing.", translation: "숲을 걷다가, 나는 새들이 노래하는 소리를 들었다.", grammarType: 'participle', source: '2024년 6월 평가원', year: 2024, month: 6, examType: 'mockExam' },
  { id: 22, sentence: "Having finished his homework, he went out to play.", translation: "숙제를 끝낸 후, 그는 놀러 나갔다.", grammarType: 'participle', source: '2024년 3월 평가원', year: 2024, month: 3, examType: 'mockExam' },
  { id: 23, sentence: "Surprised by the news, she couldn't say a word.", translation: "그 소식에 놀라서, 그녀는 한마디도 할 수 없었다.", grammarType: 'participle', source: '2023년 수능', year: 2023, month: 11, examType: 'csat' },
  { id: 24, sentence: "Not knowing what to do, I asked my teacher for advice.", translation: "무엇을 해야 할지 몰라서, 나는 선생님에게 조언을 구했다.", grammarType: 'participle', source: '2023년 9월 평가원', year: 2023, month: 9, examType: 'mockExam' },
  { id: 25, sentence: "The movie, based on a true story, touched many hearts.", translation: "실화를 바탕으로 한 그 영화는 많은 마음을 감동시켰다.", grammarType: 'participle', source: '2023년 6월 평가원', year: 2023, month: 6, examType: 'mockExam' },
  { id: 26, sentence: "Considering his age, he is remarkably fit.", translation: "그의 나이를 고려하면, 그는 놀라울 정도로 건강하다.", grammarType: 'participle', source: '2022년 수능', year: 2022, month: 11, examType: 'csat' },
  { id: 27, sentence: "Written in simple English, the book is easy to understand.", translation: "쉬운 영어로 쓰여진 그 책은 이해하기 쉽다.", grammarType: 'participle', source: '2022년 9월 평가원', year: 2022, month: 9, examType: 'mockExam' },
  { id: 28, sentence: "Having been raised in a bilingual family, she speaks both languages fluently.", translation: "이중 언어 가정에서 자라서, 그녀는 두 언어를 유창하게 한다.", grammarType: 'participle', source: '2022년 6월 평가원', year: 2022, month: 6, examType: 'mockExam' },
  { id: 29, sentence: "Left alone in the house, the child started to cry.", translation: "집에 혼자 남겨지자, 그 아이는 울기 시작했다.", grammarType: 'participle', source: '2021년 수능', year: 2021, month: 11, examType: 'csat' },
  { id: 30, sentence: "Generally speaking, exercise is good for your health.", translation: "일반적으로 말해서, 운동은 건강에 좋다.", grammarType: 'participle', source: '2021년 9월 평가원', year: 2021, month: 9, examType: 'mockExam' },
  { id: 31, sentence: "Tired from the long journey, they decided to rest.", translation: "긴 여행으로 지쳐서, 그들은 쉬기로 결정했다.", grammarType: 'participle', source: '2024년 9월 평가원', year: 2024, month: 9, examType: 'mockExam' },
  { id: 32, sentence: "Being a vegetarian, she doesn't eat meat.", translation: "채식주의자이기 때문에, 그녀는 고기를 먹지 않는다.", grammarType: 'participle', source: '2020년 수능', year: 2020, month: 11, examType: 'csat' },
  { id: 33, sentence: "Judging from his accent, he must be from England.", translation: "그의 억양으로 판단하건대, 그는 영국 출신임에 틀림없다.", grammarType: 'participle', source: '2020년 6월 평가원', year: 2020, month: 6, examType: 'mockExam' },
  { id: 34, sentence: "Having never traveled abroad, he was excited about the trip.", translation: "해외여행을 해본 적이 없어서, 그는 여행에 대해 흥분했다.", grammarType: 'participle', source: '2021년 6월 평가원', year: 2021, month: 6, examType: 'mockExam' },
  { id: 35, sentence: "The problem solved, we could move on to the next task.", translation: "문제가 해결되어서, 우리는 다음 과제로 넘어갈 수 있었다.", grammarType: 'participle', source: '2024년 수능', year: 2024, month: 11, examType: 'csat' },
  { id: 36, sentence: "Sitting by the window, I watched the rain fall.", translation: "창가에 앉아서, 나는 비가 내리는 것을 지켜보았다.", grammarType: 'participle', source: '2023년 3월 평가원', year: 2023, month: 3, examType: 'mockExam' },
  { id: 37, sentence: "Encouraged by his success, she decided to try again.", translation: "그의 성공에 고무되어, 그녀는 다시 시도하기로 결정했다.", grammarType: 'participle', source: '2022년 3월 평가원', year: 2022, month: 3, examType: 'mockExam' },
  { id: 38, sentence: "Not having slept well, I felt tired all day.", translation: "잠을 잘 자지 못해서, 나는 하루 종일 피곤했다.", grammarType: 'participle', source: '2021년 3월 평가원', year: 2021, month: 3, examType: 'mockExam' },
  { id: 39, sentence: "All things considered, it was a successful event.", translation: "모든 것을 고려하면, 그것은 성공적인 행사였다.", grammarType: 'participle', source: '2020년 9월 평가원', year: 2020, month: 9, examType: 'mockExam' },
  { id: 40, sentence: "Having studied hard, she passed the exam with flying colors.", translation: "열심히 공부해서, 그녀는 시험에 우수한 성적으로 합격했다.", grammarType: 'participle', source: '2020년 3월 평가원', year: 2020, month: 3, examType: 'mockExam' },

  // 관계사
  { id: 41, sentence: "The book which I borrowed from the library was very interesting.", translation: "내가 도서관에서 빌린 책은 매우 흥미로웠다.", grammarType: 'relative', source: '2024년 6월 평가원', year: 2024, month: 6, examType: 'mockExam' },
  { id: 42, sentence: "This is the place where we first met.", translation: "여기가 우리가 처음 만난 장소이다.", grammarType: 'relative', source: '2024년 3월 평가원', year: 2024, month: 3, examType: 'mockExam' },
  { id: 43, sentence: "The reason why he quit his job remains unknown.", translation: "그가 직장을 그만둔 이유는 알려지지 않았다.", grammarType: 'relative', source: '2023년 수능', year: 2023, month: 11, examType: 'csat' },
  { id: 44, sentence: "She is the only person who understands me.", translation: "그녀는 나를 이해하는 유일한 사람이다.", grammarType: 'relative', source: '2023년 9월 평가원', year: 2023, month: 9, examType: 'mockExam' },
  { id: 45, sentence: "The way in which he solved the problem was brilliant.", translation: "그가 문제를 해결한 방식은 훌륭했다.", grammarType: 'relative', source: '2023년 6월 평가원', year: 2023, month: 6, examType: 'mockExam' },
  { id: 46, sentence: "I remember the day when we graduated from high school.", translation: "나는 우리가 고등학교를 졸업한 날을 기억한다.", grammarType: 'relative', source: '2022년 수능', year: 2022, month: 11, examType: 'csat' },
  { id: 47, sentence: "The scientist whose discovery changed the world received the Nobel Prize.", translation: "세계를 변화시킨 발견을 한 과학자가 노벨상을 받았다.", grammarType: 'relative', source: '2022년 9월 평가원', year: 2022, month: 9, examType: 'mockExam' },
  { id: 48, sentence: "What you need is more practice and patience.", translation: "당신에게 필요한 것은 더 많은 연습과 인내이다.", grammarType: 'relative', source: '2022년 6월 평가원', year: 2022, month: 6, examType: 'mockExam' },
  { id: 49, sentence: "The house in which I grew up was torn down last year.", translation: "내가 자란 집이 작년에 철거되었다.", grammarType: 'relative', source: '2021년 수능', year: 2021, month: 11, examType: 'csat' },
  { id: 50, sentence: "He is not the man that he used to be.", translation: "그는 예전의 그가 아니다.", grammarType: 'relative', source: '2021년 9월 평가원', year: 2021, month: 9, examType: 'mockExam' },
  { id: 51, sentence: "The city where I was born has changed a lot.", translation: "내가 태어난 도시는 많이 변했다.", grammarType: 'relative', source: '2024년 9월 평가원', year: 2024, month: 9, examType: 'mockExam' },
  { id: 52, sentence: "This is all that I have.", translation: "이것이 내가 가진 전부이다.", grammarType: 'relative', source: '2020년 수능', year: 2020, month: 11, examType: 'csat' },
  { id: 53, sentence: "The moment when I realized my mistake, it was too late.", translation: "내 실수를 깨달은 순간, 이미 너무 늦었다.", grammarType: 'relative', source: '2020년 6월 평가원', year: 2020, month: 6, examType: 'mockExam' },
  { id: 54, sentence: "She married a man whom she had known for only three months.", translation: "그녀는 3개월밖에 알지 못한 남자와 결혼했다.", grammarType: 'relative', source: '2021년 6월 평가원', year: 2021, month: 6, examType: 'mockExam' },
  { id: 55, sentence: "There is nothing that I wouldn't do for my family.", translation: "가족을 위해서라면 못할 것이 없다.", grammarType: 'relative', source: '2024년 수능', year: 2024, month: 11, examType: 'csat' },
  { id: 56, sentence: "The hotel where we stayed had an amazing view.", translation: "우리가 묵었던 호텔은 놀라운 전망을 가지고 있었다.", grammarType: 'relative', source: '2023년 3월 평가원', year: 2023, month: 3, examType: 'mockExam' },
  { id: 57, sentence: "I don't like people who are always complaining.", translation: "나는 항상 불평하는 사람들을 좋아하지 않는다.", grammarType: 'relative', source: '2022년 3월 평가원', year: 2022, month: 3, examType: 'mockExam' },
  { id: 58, sentence: "The company for which I work is expanding rapidly.", translation: "내가 일하는 회사는 빠르게 확장하고 있다.", grammarType: 'relative', source: '2021년 3월 평가원', year: 2021, month: 3, examType: 'mockExam' },
  { id: 59, sentence: "That's the reason why I decided to change my career.", translation: "그것이 내가 직업을 바꾸기로 결정한 이유이다.", grammarType: 'relative', source: '2020년 9월 평가원', year: 2020, month: 9, examType: 'mockExam' },
  { id: 60, sentence: "The teacher who inspired me the most was Mr. Kim.", translation: "나에게 가장 영감을 준 선생님은 김 선생님이었다.", grammarType: 'relative', source: '2020년 3월 평가원', year: 2020, month: 3, examType: 'mockExam' },

  // 가정법
  { id: 61, sentence: "If I were you, I would accept the job offer.", translation: "내가 너라면, 그 일자리 제안을 받아들일 텐데.", grammarType: 'subjunctive', source: '2024년 6월 평가원', year: 2024, month: 6, examType: 'mockExam' },
  { id: 62, sentence: "If I had studied harder, I would have passed the exam.", translation: "더 열심히 공부했다면, 시험에 합격했을 텐데.", grammarType: 'subjunctive', source: '2024년 3월 평가원', year: 2024, month: 3, examType: 'mockExam' },
  { id: 63, sentence: "I wish I could speak five languages fluently.", translation: "다섯 개의 언어를 유창하게 할 수 있었으면 좋겠다.", grammarType: 'subjunctive', source: '2023년 수능', year: 2023, month: 11, examType: 'csat' },
  { id: 64, sentence: "If only I had listened to my parents' advice.", translation: "부모님의 충고를 들었더라면.", grammarType: 'subjunctive', source: '2023년 9월 평가원', year: 2023, month: 9, examType: 'mockExam' },
  { id: 65, sentence: "Had I known about the problem, I would have helped.", translation: "그 문제를 알았더라면, 도왔을 텐데.", grammarType: 'subjunctive', source: '2023년 6월 평가원', year: 2023, month: 6, examType: 'mockExam' },
  { id: 66, sentence: "If it were not for water, no living things could exist.", translation: "물이 없다면, 어떤 생명체도 존재할 수 없을 것이다.", grammarType: 'subjunctive', source: '2022년 수능', year: 2022, month: 11, examType: 'csat' },
  { id: 67, sentence: "I would rather you didn't tell anyone about this.", translation: "이것에 대해 아무에게도 말하지 않았으면 한다.", grammarType: 'subjunctive', source: '2022년 9월 평가원', year: 2022, month: 9, examType: 'mockExam' },
  { id: 68, sentence: "Without your help, I couldn't have finished the project.", translation: "당신의 도움이 없었다면, 프로젝트를 끝내지 못했을 것이다.", grammarType: 'subjunctive', source: '2022년 6월 평가원', year: 2022, month: 6, examType: 'mockExam' },
  { id: 69, sentence: "If he should call, please let me know immediately.", translation: "혹시 그가 전화하면, 즉시 알려주세요.", grammarType: 'subjunctive', source: '2021년 수능', year: 2021, month: 11, examType: 'csat' },
  { id: 70, sentence: "It's time we started thinking about the future.", translation: "이제 미래에 대해 생각하기 시작할 때이다.", grammarType: 'subjunctive', source: '2021년 9월 평가원', year: 2021, month: 9, examType: 'mockExam' },
  { id: 71, sentence: "If I had more time, I would travel around the world.", translation: "시간이 더 있다면, 세계 일주를 할 텐데.", grammarType: 'subjunctive', source: '2024년 9월 평가원', year: 2024, month: 9, examType: 'mockExam' },
  { id: 72, sentence: "I wish I had met you earlier.", translation: "당신을 더 일찍 만났더라면 좋았을 텐데.", grammarType: 'subjunctive', source: '2020년 수능', year: 2020, month: 11, examType: 'csat' },
  { id: 73, sentence: "If it weren't for his guidance, I wouldn't be where I am today.", translation: "그의 안내가 없었다면, 나는 오늘날 여기에 있지 못했을 것이다.", grammarType: 'subjunctive', source: '2020년 6월 평가원', year: 2020, month: 6, examType: 'mockExam' },
  { id: 74, sentence: "Suppose you won the lottery, what would you do?", translation: "복권에 당첨된다고 가정하면, 무엇을 하겠는가?", grammarType: 'subjunctive', source: '2021년 6월 평가원', year: 2021, month: 6, examType: 'mockExam' },
  { id: 75, sentence: "But for your support, I would have given up.", translation: "당신의 지원이 없었다면, 나는 포기했을 것이다.", grammarType: 'subjunctive', source: '2024년 수능', year: 2024, month: 11, examType: 'csat' },
  { id: 76, sentence: "If I were in your shoes, I would apologize first.", translation: "내가 네 입장이라면, 먼저 사과할 텐데.", grammarType: 'subjunctive', source: '2023년 3월 평가원', year: 2023, month: 3, examType: 'mockExam' },
  { id: 77, sentence: "I'd rather you came with me tomorrow.", translation: "내일 나와 함께 왔으면 한다.", grammarType: 'subjunctive', source: '2022년 3월 평가원', year: 2022, month: 3, examType: 'mockExam' },
  { id: 78, sentence: "Were I to start over, I would choose a different path.", translation: "다시 시작한다면, 다른 길을 선택할 텐데.", grammarType: 'subjunctive', source: '2021년 3월 평가원', year: 2021, month: 3, examType: 'mockExam' },
  { id: 79, sentence: "If it had not been for the traffic jam, I would have arrived on time.", translation: "교통 체증이 없었다면, 제시간에 도착했을 텐데.", grammarType: 'subjunctive', source: '2020년 9월 평가원', year: 2020, month: 9, examType: 'mockExam' },
  { id: 80, sentence: "I wish the weather were better for our picnic.", translation: "우리 소풍을 위해 날씨가 더 좋았으면 좋겠다.", grammarType: 'subjunctive', source: '2020년 3월 평가원', year: 2020, month: 3, examType: 'mockExam' },

  // 비교구문
  { id: 81, sentence: "The more you practice, the better you become.", translation: "연습을 많이 할수록, 더 나아진다.", grammarType: 'comparison', source: '2024년 6월 평가원', year: 2024, month: 6, examType: 'mockExam' },
  { id: 82, sentence: "This book is three times as expensive as that one.", translation: "이 책은 저것보다 세 배 비싸다.", grammarType: 'comparison', source: '2024년 3월 평가원', year: 2024, month: 3, examType: 'mockExam' },
  { id: 83, sentence: "No other city in Korea is as populous as Seoul.", translation: "한국에서 서울만큼 인구가 많은 도시는 없다.", grammarType: 'comparison', source: '2023년 수능', year: 2023, month: 11, examType: 'csat' },
  { id: 84, sentence: "He is not so much a teacher as a mentor.", translation: "그는 선생님이라기보다는 멘토이다.", grammarType: 'comparison', source: '2023년 9월 평가원', year: 2023, month: 9, examType: 'mockExam' },
  { id: 85, sentence: "The sooner you start, the earlier you will finish.", translation: "빨리 시작할수록, 더 일찍 끝낼 것이다.", grammarType: 'comparison', source: '2023년 6월 평가원', year: 2023, month: 6, examType: 'mockExam' },
  { id: 86, sentence: "Nothing is more precious than time.", translation: "시간보다 소중한 것은 없다.", grammarType: 'comparison', source: '2022년 수능', year: 2022, month: 11, examType: 'csat' },
  { id: 87, sentence: "She is by far the most talented singer in the group.", translation: "그녀는 그룹에서 단연 가장 재능 있는 가수이다.", grammarType: 'comparison', source: '2022년 9월 평가원', year: 2022, month: 9, examType: 'mockExam' },
  { id: 88, sentence: "The less you worry, the happier you will be.", translation: "걱정을 적게 할수록, 더 행복할 것이다.", grammarType: 'comparison', source: '2022년 6월 평가원', year: 2022, month: 6, examType: 'mockExam' },
  { id: 89, sentence: "This problem is no less important than that one.", translation: "이 문제는 저것 못지않게 중요하다.", grammarType: 'comparison', source: '2021년 수능', year: 2021, month: 11, examType: 'csat' },
  { id: 90, sentence: "He is more of a poet than a novelist.", translation: "그는 소설가라기보다는 시인에 가깝다.", grammarType: 'comparison', source: '2021년 9월 평가원', year: 2021, month: 9, examType: 'mockExam' },
  { id: 91, sentence: "The situation is getting worse and worse.", translation: "상황이 점점 더 나빠지고 있다.", grammarType: 'comparison', source: '2024년 9월 평가원', year: 2024, month: 9, examType: 'mockExam' },
  { id: 92, sentence: "I would rather die than betray my country.", translation: "나라를 배신하느니 차라리 죽겠다.", grammarType: 'comparison', source: '2020년 수능', year: 2020, month: 11, examType: 'csat' },
  { id: 93, sentence: "No sooner had he arrived than it started to rain.", translation: "그가 도착하자마자 비가 내리기 시작했다.", grammarType: 'comparison', source: '2020년 6월 평가원', year: 2020, month: 6, examType: 'mockExam' },
  { id: 94, sentence: "This smartphone is far superior to the previous model.", translation: "이 스마트폰은 이전 모델보다 훨씬 우수하다.", grammarType: 'comparison', source: '2021년 6월 평가원', year: 2021, month: 6, examType: 'mockExam' },
  { id: 95, sentence: "I prefer reading books to watching TV.", translation: "나는 TV 보는 것보다 책 읽는 것을 더 좋아한다.", grammarType: 'comparison', source: '2024년 수능', year: 2024, month: 11, examType: 'csat' },
  { id: 96, sentence: "The older I get, the wiser I become.", translation: "나이가 들수록, 더 현명해진다.", grammarType: 'comparison', source: '2023년 3월 평가원', year: 2023, month: 3, examType: 'mockExam' },
  { id: 97, sentence: "She is as intelligent as she is beautiful.", translation: "그녀는 아름다운 만큼 지적이다.", grammarType: 'comparison', source: '2022년 3월 평가원', year: 2022, month: 3, examType: 'mockExam' },
  { id: 98, sentence: "He is one of the greatest scientists that have ever lived.", translation: "그는 역사상 가장 위대한 과학자 중 한 명이다.", grammarType: 'comparison', source: '2021년 3월 평가원', year: 2021, month: 3, examType: 'mockExam' },
  { id: 99, sentence: "This is the most exciting game I have ever watched.", translation: "이것은 내가 본 것 중 가장 흥미진진한 경기이다.", grammarType: 'comparison', source: '2020년 9월 평가원', year: 2020, month: 9, examType: 'mockExam' },
  { id: 100, sentence: "Health is more important than wealth.", translation: "건강은 부보다 더 중요하다.", grammarType: 'comparison', source: '2020년 3월 평가원', year: 2020, month: 3, examType: 'mockExam' },

  // 강조/도치
  { id: 101, sentence: "It was not until midnight that she finished her work.", translation: "자정이 되어서야 그녀는 일을 끝냈다.", grammarType: 'emphasis', source: '2024년 6월 평가원', year: 2024, month: 6, examType: 'mockExam' },
  { id: 102, sentence: "Never have I seen such a beautiful sunset.", translation: "그렇게 아름다운 일몰을 본 적이 없다.", grammarType: 'emphasis', source: '2024년 3월 평가원', year: 2024, month: 3, examType: 'mockExam' },
  { id: 103, sentence: "Only after the meeting did I realize my mistake.", translation: "회의가 끝난 후에야 나는 내 실수를 깨달았다.", grammarType: 'emphasis', source: '2023년 수능', year: 2023, month: 11, examType: 'csat' },
  { id: 104, sentence: "Little did he know that his life was about to change.", translation: "그는 자신의 인생이 바뀌려 한다는 것을 거의 알지 못했다.", grammarType: 'emphasis', source: '2023년 9월 평가원', year: 2023, month: 9, examType: 'mockExam' },
  { id: 105, sentence: "What I need is more time to prepare.", translation: "내가 필요한 것은 준비할 시간이 더 필요하다는 것이다.", grammarType: 'emphasis', source: '2023년 6월 평가원', year: 2023, month: 6, examType: 'mockExam' },
  { id: 106, sentence: "Not only is she intelligent, but she is also hardworking.", translation: "그녀는 지적일 뿐만 아니라 근면하기도 하다.", grammarType: 'emphasis', source: '2022년 수능', year: 2022, month: 11, examType: 'csat' },
  { id: 107, sentence: "It is you that I want to talk to.", translation: "내가 이야기하고 싶은 사람은 바로 너야.", grammarType: 'emphasis', source: '2022년 9월 평가원', year: 2022, month: 9, examType: 'mockExam' },
  { id: 108, sentence: "Hardly had I entered the room when the phone rang.", translation: "방에 들어가자마자 전화가 울렸다.", grammarType: 'emphasis', source: '2022년 6월 평가원', year: 2022, month: 6, examType: 'mockExam' },
  { id: 109, sentence: "Not a single word did he say during the meeting.", translation: "그는 회의 중에 한마디도 하지 않았다.", grammarType: 'emphasis', source: '2021년 수능', year: 2021, month: 11, examType: 'csat' },
  { id: 110, sentence: "It was in Paris that they first met.", translation: "그들이 처음 만난 곳은 바로 파리였다.", grammarType: 'emphasis', source: '2021년 9월 평가원', year: 2021, month: 9, examType: 'mockExam' },
  { id: 111, sentence: "Only when we lose something do we realize its value.", translation: "무언가를 잃어버렸을 때에야 비로소 그 가치를 깨닫는다.", grammarType: 'emphasis', source: '2024년 9월 평가원', year: 2024, month: 9, examType: 'mockExam' },
  { id: 112, sentence: "Seldom does he make such mistakes.", translation: "그는 좀처럼 그런 실수를 하지 않는다.", grammarType: 'emphasis', source: '2020년 수능', year: 2020, month: 11, examType: 'csat' },
  { id: 113, sentence: "So beautiful was the view that I took many photos.", translation: "경치가 너무 아름다워서 사진을 많이 찍었다.", grammarType: 'emphasis', source: '2020년 6월 평가원', year: 2020, month: 6, examType: 'mockExam' },
  { id: 114, sentence: "What matters is not how you start but how you finish.", translation: "중요한 것은 어떻게 시작하느냐가 아니라 어떻게 끝내느냐이다.", grammarType: 'emphasis', source: '2021년 6월 평가원', year: 2021, month: 6, examType: 'mockExam' },
  { id: 115, sentence: "It was his determination that led him to success.", translation: "그를 성공으로 이끈 것은 바로 그의 결단력이었다.", grammarType: 'emphasis', source: '2024년 수능', year: 2024, month: 11, examType: 'csat' },
  { id: 116, sentence: "Scarcely had the game begun when it started to rain.", translation: "경기가 시작되자마자 비가 내리기 시작했다.", grammarType: 'emphasis', source: '2023년 3월 평가원', year: 2023, month: 3, examType: 'mockExam' },
  { id: 117, sentence: "Under no circumstances should you give up.", translation: "어떤 상황에서도 포기해서는 안 된다.", grammarType: 'emphasis', source: '2022년 3월 평가원', year: 2022, month: 3, examType: 'mockExam' },
  { id: 118, sentence: "Here comes the bus we have been waiting for.", translation: "우리가 기다리던 버스가 온다.", grammarType: 'emphasis', source: '2021년 3월 평가원', year: 2021, month: 3, examType: 'mockExam' },
  { id: 119, sentence: "It was not money but love that she wanted.", translation: "그녀가 원한 것은 돈이 아니라 사랑이었다.", grammarType: 'emphasis', source: '2020년 9월 평가원', year: 2020, month: 9, examType: 'mockExam' },
  { id: 120, sentence: "At no time did I doubt your loyalty.", translation: "나는 어떤 때도 당신의 충성심을 의심하지 않았다.", grammarType: 'emphasis', source: '2020년 3월 평가원', year: 2020, month: 3, examType: 'mockExam' },
];

interface GrammarSelectorProps {
  onSelectionChange: (selectedItems: GrammarItem[]) => void;
  headerInfo: { headerTitle: string; headerDescription: string; footerLeft: string };
  onHeaderChange: (info: { headerTitle: string; headerDescription: string; footerLeft: string }) => void;
}

export function GrammarSelector({ onSelectionChange, headerInfo, onHeaderChange }: GrammarSelectorProps) {
  const [selectedGrammarType, setSelectedGrammarType] = useState<string>('noun-clause');
  const [yearFilter, setYearFilter] = useState<string>('5'); // 최근 5년
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [displayCount, setDisplayCount] = useState<number>(20);

  // 현재 연도 계산
  const currentYear = new Date().getFullYear();

  // 필터링된 문장들
  const filteredSentences = useMemo(() => {
    let filtered = DUMMY_SENTENCES.filter(s => s.grammarType === selectedGrammarType);

    // 연도 필터
    if (yearFilter !== 'all') {
      const yearsBack = parseInt(yearFilter);
      const minYear = currentYear - yearsBack;
      filtered = filtered.filter(s => s.year >= minYear);
    }

    // 최신순 정렬
    filtered.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    return filtered.slice(0, displayCount);
  }, [selectedGrammarType, yearFilter, displayCount, currentYear]);

  // 문법 타입 변경 시 선택 초기화
  const handleGrammarTypeChange = (type: string) => {
    setSelectedGrammarType(type);
    setSelectedIds(new Set());
    onSelectionChange([]);
  };

  // 체크박스 토글
  const handleToggle = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);

    // 선택된 항목들 전달
    const selectedItems = DUMMY_SENTENCES.filter(s => newSelected.has(s.id));
    onSelectionChange(selectedItems);
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedIds.size === filteredSentences.length) {
      setSelectedIds(new Set());
      onSelectionChange([]);
    } else {
      const allIds = new Set(filteredSentences.map(s => s.id));
      setSelectedIds(allIds);
      onSelectionChange(filteredSentences);
    }
  };

  const selectedGrammarInfo = GRAMMAR_TYPES.find(g => g.id === selectedGrammarType);

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 입력 */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">제목</label>
          <input
            type="text"
            value={headerInfo.headerTitle}
            onChange={(e) => onHeaderChange({ ...headerInfo, headerTitle: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="구문교재 제목"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">부제목</label>
          <input
            type="text"
            value={headerInfo.headerDescription}
            onChange={(e) => onHeaderChange({ ...headerInfo, headerDescription: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="부제목 (선택)"
          />
        </div>
      </div>

      {/* 문법 요소 선택 */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-xs text-slate-500 mb-2">문법 요소 선택</label>
        <div className="grid grid-cols-2 gap-2">
          {GRAMMAR_TYPES.map((grammar) => (
            <button
              key={grammar.id}
              onClick={() => handleGrammarTypeChange(grammar.id)}
              className={`px-3 py-2 text-left rounded-lg border transition-all ${
                selectedGrammarType === grammar.id
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-200 hover:border-slate-400 text-slate-700'
              }`}
            >
              <div className="text-sm font-medium">{grammar.label}</div>
              <div className={`text-xs mt-0.5 ${selectedGrammarType === grammar.id ? 'text-slate-300' : 'text-slate-400'}`}>
                {grammar.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">최근 3년</SelectItem>
              <SelectItem value="5">최근 5년</SelectItem>
              <SelectItem value="10">최근 10년</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <Select value={displayCount.toString()} onValueChange={(v) => setDisplayCount(parseInt(v))}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개</SelectItem>
              <SelectItem value="20">20개</SelectItem>
              <SelectItem value="30">30개</SelectItem>
              <SelectItem value="50">50개</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <span className="text-xs text-slate-500">
          {selectedIds.size}개 선택됨
        </span>
      </div>

      {/* 문장 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {/* 전체 선택 헤더 */}
        <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-gray-200 flex items-center gap-3">
          <Checkbox
            id="select-all"
            checked={selectedIds.size === filteredSentences.length && filteredSentences.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-xs text-slate-600 cursor-pointer">
            전체 선택 ({filteredSentences.length}개)
          </label>
        </div>

        {/* 문장 항목들 */}
        <div className="divide-y divide-gray-100">
          {filteredSentences.map((item) => (
            <div
              key={item.id}
              className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                selectedIds.has(item.id) ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleToggle(item.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => handleToggle(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {item.sentence}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.translation}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                      {item.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSentences.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            선택한 조건에 맞는 문장이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
