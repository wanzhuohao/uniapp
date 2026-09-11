export const FIXTURE_SEED = 20260829;

export function xorshift32(seed = FIXTURE_SEED) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

const DATES = ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29'];

function practiceLogs(subject) {
  return Array.from({ length: 1000 }, (_, index) => ({
    id: `${subject}-log-${index}`,
    date: DATES[index % DATES.length],
    totalCount: 20,
    correctCount: index % 21,
  }));
}

function dueMistakes(subject, count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${subject}-wrong-${index}`,
    resolvable: index % 2 === 1,
    due: index % 2 === 1,
  })).filter(item => item.due);
}

function candidates(subject) {
  return Array.from({ length: 300 }, (_, index) => ({
    id: `${subject}-candidate-${index}`,
    subject,
    kind: 'input',
    prompt: `${subject}-${index}`,
    answer: String(index),
    due: index % 2 === 1,
    sourceRef: {
      question_id: `${subject}-candidate-${index}`,
      expr: `${index}+0`,
      answer: String(index),
      type: 'add',
    },
  }));
}

export function createLearningPerformanceFixtures() {
  const chineseLogs = practiceLogs('chinese');
  const englishLogs = practiceLogs('english');
  const mathHistory = Array.from({ length: 50 }, (_, index) => ({
    id: `math-log-${index}`,
    type: 'online',
    createdAt: `${DATES[index % DATES.length]}T12:00:00.000+08:00`,
    total: 15,
    correct: index % 16,
  }));
  const chineseDue = dueMistakes('chinese', 1000);
  const englishDue = dueMistakes('english', 1000);
  const mathDue = dueMistakes('math', 300);
  return {
    dashboard: {
      input: { chineseLogs, englishLogs, mathHistory, chineseDue, englishDue, mathDue, goal: { dailyTarget: 20 }, challenge: null },
      now: new Date('2026-08-29T12:00:00.000+08:00'),
    },
    paper: {
      stats: {
        math: { total: 750, correct: 365, dueCount: mathDue.length },
        chinese: { total: 20000, correct: 9990, dueCount: chineseDue.length },
        english: { total: 20000, correct: 9990, dueCount: englishDue.length },
      },
      candidates: { math: candidates('math'), chinese: candidates('chinese'), english: candidates('english') },
      count: 15,
      difficulty: 'medium',
      seed: '2026-08-29|15|medium',
    },
  };
}

function parent(name) {
  return {
    name,
    birth: { year: '1950', month: '01', day: '01' },
    death: { year: '2020', month: '12', day: '31' },
  };
}

function names() {
  return Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, item) => [
    (`称谓-${row}-${item}-` + '称'.repeat(64)).slice(0, 64),
    (`姓名-${row}-${item}-` + '名'.repeat(64)).slice(0, 64),
  ]));
}

export function createStelePerformanceFixtures() {
  const baseData = {
    selected: '0',
    father: parent('父亲'),
    mother: parent('母亲'),
    bigTitle: '永'.repeat(200),
    dateQingming: true,
    dateShowLunar: false,
    libei: ['2026', '08', '29'],
    names: names(),
  };
  const templates = Array.from({ length: 30 }, (_, index) => ({
    id: `fixture-template-${index}`,
    name: `固定模板${index}`,
    createdAt: '2026-08-29T00:00:00.000Z',
    updatedAt: '2026-08-29T00:00:00.000Z',
    data: structuredClone(baseData),
  }));
  return { templates, form: structuredClone(baseData) };
}
