/**
 * 碑文生成共用工具函数
 * 从 stele/detail.vue 和 stele/index.vue 提取的共用代码
 */

// ==================== 常量 ====================

/** 称呼选项 */
export const appellationOptions = [
  '子', '女', '媳', '婿',
  '孙子', '孙女', '孙媳', '孙婿',
  '外孙子', '外孙女', '外孙媳', '外孙婿',
  '曾孙子', '重孙子', '曾孙女', '重孙女', '曾孙媳', '重孙媳', '曾孙婿', '重孙婿',
  '外曾孙子', '外重孙子', '外曾孙女', '外重孙女', '外曾孙媳', '外重孙媳', '外曾孙婿', '外重孙婿',
  '曾外孙子', '重外孙子', '曾外孙女', '重外孙女', '曾外孙媳', '重外孙媳', '曾外孙婿', '重外孙婿',
  '玄孙子', '玄孙女', '玄孙媳', '玄孙婿',
];

/** 农历月份别名 → 数字 1–12 */
export const LUNAR_MONTH: Record<string, number> = {
  '正月': 1, '一月': 1, '二月': 2, '三月': 3, '四月': 4, '五月': 5, '六月': 6,
  '七月': 7, '八月': 8, '九月': 9, '十月': 10, '冬月': 11, '十一月': 11, '腊月': 12, '十二月': 12
};

/** 数字转汉字映射 */
export const numToChinese = {
  year: ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
  month: ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'],
  day: ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十', '卅一']
};

// ==================== 日期解析 ====================

/** 中文日 → 数字 1–31（初一、廿一、卅一等） */
export function parseChineseDay(s: string): number | '' {
  if (!s || !s.trim()) return '';
  const t = s.trim();
  const match = t.match(/^初([一二三四五六七八九十])$/);
  if (match) {
    const map: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
    return map[match[1]] ?? '';
  }
  if (/^十[一二三四五六七八九]$/.test(t)) return 10 + ({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 } as Record<string, number>)[t[1]];
  if (t === '二十' || t === '廿') return 20;
  if (/^廿[一二三四五六七八九]$/.test(t)) return 20 + ({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 } as Record<string, number>)[t[1]];
  if (t === '三十' || t === '卅') return 30;
  if (t === '卅一' || t === '三十一') return 31;
  const num = parseInt(t.replace(/[日號号]/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= 31) return num;
  return '';
}

/** 生卒日期宽松解析：支持 1991-1-1、1月1日、腊月23日、冬月廿一日、八月初一日、三月卅一日 等 */
export function parseFlexibleDate(str: string): [string, string, string] {
  if (!str || typeof str !== 'string') return ['', '', ''];
  const trimmed = str.trim();
  if (!trimmed) return ['', '', ''];

  const yearPrefix = trimmed.match(/^(\d{4})年?/);
  const yearStr = yearPrefix ? yearPrefix[1] : '';
  const rest = yearPrefix ? trimmed.slice(yearPrefix[0].length).trim() : trimmed;

  const monthKeys = Object.keys(LUNAR_MONTH).sort((a, b) => b.length - a.length);
  let monthNum = '';
  let monthKeyMatched = '';
  for (const key of monthKeys) {
    if (rest.startsWith(key)) {
      monthNum = String(LUNAR_MONTH[key]);
      monthKeyMatched = key;
      break;
    }
  }
  if (!monthKeyMatched) {
    const numMonthMatch = rest.match(/^(\d{1,2})月/);
    if (numMonthMatch) {
      const m = parseInt(numMonthMatch[1], 10);
      if (m >= 1 && m <= 12) {
        monthNum = String(m);
        monthKeyMatched = numMonthMatch[0];
      }
    }
  }
  if (monthKeyMatched) {
    const dayPartRaw = rest.slice(monthKeyMatched.length).trim();
    const chDay = dayPartRaw.replace(/日|號|号/g, '').trim();
    let dayNum = '';
    const n = parseChineseDay(chDay);
    if (n !== '') dayNum = String(n);
    if (!dayNum) {
      const numDayMatch = dayPartRaw.match(/^(\d{1,2})/);
      if (numDayMatch) {
        const d = parseInt(numDayMatch[1], 10);
        if (d >= 1 && d <= 31) dayNum = String(d);
      }
    }
    return [yearStr, monthNum, dayNum];
  }

  const parts = trimmed.split(/\D+/).filter(Boolean);
  if (parts.length >= 2 && /^\d{4}$/.test(parts[0])) {
    const y = parts[0];
    const m = parts[1] ? String(Number(parts[1])) : '';
    const d = parts[2] ? String(Number(parts[2])) : '';
    return [y, m, d];
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 8) {
    const y = digitsOnly.slice(0, 4);
    const m = digitsOnly.slice(4, 6);
    const d = digitsOnly.slice(6, 8);
    return [y, m ? String(Number(m)) : '', d ? String(Number(d)) : ''];
  }
  // 7位数字有歧义（1991121 可能是 1月21日 或 12月1日），只取年份
  if (digitsOnly.length === 7) {
    return [digitsOnly.slice(0, 4), '', ''];
  }
  if (digitsOnly.length === 6) {
    const y = digitsOnly.slice(0, 4);
    const m = digitsOnly.slice(4, 6);
    return [y, m ? String(Number(m)) : '', ''];
  }
  if (digitsOnly.length === 5) {
    const y = digitsOnly.slice(0, 4);
    const m = digitsOnly.slice(4, 5) ? String(Number(digitsOnly.slice(4, 5))) : '';
    return [y, m, ''];
  }
  if (digitsOnly.length === 4) return [digitsOnly.slice(0, 4), '', ''];
  if (parts.length >= 1 && /^\d{4}$/.test(parts[0])) {
    const y = parts[0];
    const m = parts[1] ? String(Number(parts[1])) : '';
    const d = parts[2] ? String(Number(parts[2])) : '';
    return [y, m, d];
  }
  return ['', '', ''];
}

/** 生卒日期数组转显示用字符串，月日不补零（仅用于输入框展示） */
export function arrToDisplay(arr: string[]): string {
  if (!arr || !arr[0]) return '';
  const y = arr[0];
  const m = arr[1] ? String(Number(arr[1])) : '';
  const d = arr[2] ? String(Number(arr[2])) : '';
  if (!m && !d) return y;
  if (!d) return `${y}-${m}`;
  return `${y}-${m}-${d}`;
}

/** 解析结果转成碑文/存储用格式：月、日补成两位（01-12, 01-31），保证碑文格式一致 */
export function toStorageDate(arr: [string, string, string]): [string, string, string] {
  const padTwo = (s: string) => {
    if (!s) return '';
    const n = parseInt(String(Number(s)), 10);
    if (isNaN(n) || n < 0) return s;
    return n < 10 ? '0' + n : String(n);
  };
  return [arr[0] || '', padTwo(arr[1]), padTwo(arr[2])];
}

// ==================== 辅助函数 ====================

/** 称呼的合并键：前缀相同才合并（孙子/孙女→孙，外孙子/外孙女→外孙；媳/婿→同组） */
export function getTitleMergePrefix(title: string): string {
  if (!title || !String(title).trim()) return '';
  const t = String(title).trim();
  if (t.startsWith('玄孙')) return '玄孙';
  if (t.startsWith('外曾孙') || t.startsWith('外重孙')) return '外曾孙';
  if (t.startsWith('曾外孙') || t.startsWith('重外孙')) return '曾外孙';
  if (t.startsWith('曾孙') || t.startsWith('重孙')) return '曾孙';
  if (t.startsWith('外孙')) return '外孙';
  if (t.startsWith('孙')) return '孙';
  if (t === '媳' || t === '婿') return '姻';
  return t;
}

/** 子女与孙辈做映射：子→媳、女→婿；孙子/孙女→孙媳/孙婿，外孙/曾孙等同理；已是婿/媳等则新行留空 */
export function titleToSpouse(title: string): string {
  if (!title) return '';
  if (title.endsWith('媳') || title.endsWith('婿')) return '';
  if (title.endsWith('子')) return title.slice(0, -1) + '媳';
  if (title.endsWith('女')) return title.slice(0, -1) + '婿';
  return '';
}

/** 数字转汉字函数 */
export function convertToChinese(num: number, type: 'year' | 'month' | 'day'): string {
  if (type === 'year') {
    return String(num).split('').map(n => numToChinese.year[Number(n)]).join('\n');
  }
  if (type === 'month') {
    const n = Number(num);
    if (isNaN(n) || n < 1 || n > 12) return '  ';
    return numToChinese.month[n - 1] || '  ';
  }
  if (type === 'day') {
    const n = Number(num);
    if (isNaN(n) || n < 1 || n > 31) return '  ';
    const day = numToChinese.day[n - 1];
    return day ? day.split('').join('\n') : '  ';
  }
  return '';
}

/** 阶段1：先合并（同字+同前缀）；阶段2：仅当某称呼在整排中一个人都没有时，才把该称呼的贡献改成 2 空格 */
export function compressConsecutiveChars(lineArr: string[], row: string[][]): string {
  if (!lineArr || !lineArr.length) return '';
  const len = row.length;
  const titleAtCol = (col: number) => ((row[len - 1 - col] && row[len - 1 - col][0]) ? String(row[len - 1 - col][0]).trim() : '');
  const hasNameAtCol = (col: number) => (((row[len - 1 - col] && row[len - 1 - col][1]) != null) ? String(row[len - 1 - col][1]).trim() : '') !== '';
  const titleHasPerson: Record<string, boolean> = {};
  for (let c = 0; c < len; c++) {
    const t = titleAtCol(c);
    if (titleHasPerson[t] !== true) titleHasPerson[t] = false;
    if (hasNameAtCol(c)) titleHasPerson[t] = true;
  }
  const colContrib: string[] = [];
  let j = 0;
  while (j < lineArr.length) {
    const char = lineArr[j];
    if (char === '  ') {
      colContrib.push(char);
      j++;
      continue;
    }
    const prefix = getTitleMergePrefix(titleAtCol(j));
    let runLength = 1;
    while (j + runLength < lineArr.length && lineArr[j + runLength] === char &&
      getTitleMergePrefix(titleAtCol(j + runLength)) === prefix) {
      runLength++;
    }
    const merged = runLength >= 2
      ? ' '.repeat(runLength - 1) + char + ' '.repeat(runLength - 1)
      : char;
    const total = runLength >= 2 ? 2 * runLength - 1 : 1;
    for (let k = 0; k < runLength; k++) {
      const start = Math.floor((k * total) / runLength);
      const end = Math.floor(((k + 1) * total) / runLength);
      colContrib.push(merged.slice(start, end));
    }
    j += runLength;
  }
  for (let c = 0; c < colContrib.length; c++) {
    if (!titleHasPerson[titleAtCol(c)]) {
      let w = 0;
      for (const ch of colContrib[c]) {
        w += ch.charCodeAt(0) > 127 ? 2 : 1;
      }
      colContrib[c] = ' '.repeat(w);
    }
  }
  return colContrib.join('');
}

// ==================== 碑文生成 ====================

export interface ParentDate {
  year: string;
  month: string;
  day: string;
}

export interface ParentInfo {
  name: string;
  birth: ParentDate;
  death: ParentDate;
}

/** 表单数据接口（碑文生成所需的字段） */
export interface SteleForm {
  selected: string;
  father: ParentInfo;
  mother: ParentInfo;
  bigTitle: string;
  dateQingming: boolean;
  dateShowLunar: boolean;
  libei: string[];
  names: string[][][];
  user?: string;
  remark?: string;
}

/** 生成大字内容 */
export function generateBig(form: SteleForm): string {
  const isDouble = form.selected === '0';
  const fatherName = form.father.name || '';
  const motherName = form.mother.name || '';

  const formatNames = (father: string, mother: string) => {
    if (!father && !mother) return '名名\n字字';
    if (!father) {
      const motherChars = mother.split('');
      return motherChars.map(c => `${c} `).join('\n');
    }
    if (!mother) {
      const fatherChars = father.split('');
      return fatherChars.map(c => ` ${c}`).join('\n');
    }
    const motherChars = mother.split('');
    const fatherChars = father.split('');
    const maxLength = Math.max(motherChars.length, fatherChars.length);
    const nameArr = [new Array(maxLength).fill(' '), new Array(maxLength).fill(' ')];
    if (motherChars.length === maxLength) {
      motherChars.forEach((char, i) => { nameArr[0][i] = char; });
    } else {
      nameArr[0][0] = motherChars[0];
      for (let i = 1; i < maxLength - motherChars.length + 1; i++) nameArr[0][i] = ' ';
      for (let i = 1; i < motherChars.length; i++) nameArr[0][maxLength - motherChars.length + i] = motherChars[i];
    }
    if (fatherChars.length === maxLength) {
      fatherChars.forEach((char, i) => { nameArr[1][i] = char; });
    } else {
      nameArr[1][0] = fatherChars[0];
      for (let i = 1; i < maxLength - fatherChars.length + 1; i++) nameArr[1][i] = ' ';
      for (let i = 1; i < fatherChars.length; i++) nameArr[1][maxLength - fatherChars.length + i] = fatherChars[i];
    }
    let result = '';
    for (let i = 0; i < maxLength; i++) result += `${nameArr[0][i]}${nameArr[1][i]}\n`;
    return result.slice(0, -1);
  };

  if (isDouble) {
    const names = formatNames(fatherName, motherName);
    return ` 故\n 先\n妣考\n${names}\n 老\n孺大\n 人\n 之\n 墓`;
  }
  const name = form.selected === '1' ? fatherName : motherName;
  const prefix = form.selected === '1' ? '考' : '妣';
  const formatted = name ? name.split('').join('\n') : '某\n某';
  if (form.selected === '2') {
    return `故\n先\n${prefix}\n${formatted}\n老\n孺\n人\n之\n墓`;
  }
  return `故\n先\n${prefix}\n${formatted}\n老\n大\n人\n之\n墓`;
}

/** 生成立碑日期 */
export function generateDate(form: SteleForm, qingmingYear: string, currentYear: number): string {
  if (form.dateQingming) {
    const y = qingmingYear || String(currentYear);
    return `${convertToChinese(Number(y), 'year')}\n年\n清\n明\n节\n\n敬\n立`;
  }
  const [year, month, day] = form.libei;
  const yearVal = year || String(currentYear);
  const chineseYear = convertToChinese(Number(yearVal), 'year');
  if (!year && !month && !day) return `${chineseYear}\n年\n\n敬\n立`;
  if (!year) {
    const hasMonthDay = !!(month && day);
    const mid = form.dateShowLunar ? '\n农\n历' : '';
    if (!hasMonthDay) return `${chineseYear}\n年${mid}\n\n敬\n立`;
    const chineseMonth = convertToChinese(Number(month), 'month');
    const chineseDay = convertToChinese(Number(day), 'day');
    const mid2 = form.dateShowLunar ? '农\n历\n' : '';
    return `${chineseYear}\n年\n${mid2}${chineseMonth}\n月\n${chineseDay}\n日\n\n敬\n立`;
  }
  const hasMonthDay = !!(month && day);
  const mid = form.dateShowLunar ? '\n农\n历' : '';
  if (!hasMonthDay) return `${chineseYear}\n年${mid}\n\n敬\n立`;
  const chineseMonth = convertToChinese(Number(month), 'month');
  const chineseDay = convertToChinese(Number(day), 'day');
  const mid2 = form.dateShowLunar ? '农\n历\n' : '';
  return `${chineseYear}\n年\n${mid2}${chineseMonth}\n月\n${chineseDay}\n日\n\n敬\n立`;
}

/** 生成生卒日期 */
export function generateBirth(form: SteleForm): string {
  const isDouble = form.selected === '0';
  const fBirthArr = [form.father.birth.year, form.father.birth.month, form.father.birth.day];
  const fDeathArr = [form.father.death.year, form.father.death.month, form.father.death.day];
  const mBirthArr = [form.mother.birth.year, form.mother.birth.month, form.mother.birth.day];
  const mDeathArr = [form.mother.death.year, form.mother.death.month, form.mother.death.day];
  const emptyDatePlaceholder = '  \n  \n  \n  \n  \n  ';
  const formatDate = (date: string[]) => {
    if (!date[0] && !date[1] && !date[2]) return emptyDatePlaceholder;
    if (!date[0]) return emptyDatePlaceholder;
    const year = convertToChinese(Number(date[0]), 'year');
    if (!date[1] && !date[2]) return `${year}\n年`;
    const month = date[1] ? convertToChinese(Number(date[1]), 'month') : '  ';
    const day = date[2] ? convertToChinese(Number(date[2]), 'day') : '  ';
    return `${year}\n年\n${month}\n月\n${day}\n日`;
  };
  if (isDouble) {
    const fatherBirthStr = formatDate(fBirthArr);
    const fatherDeathStr = formatDate(fDeathArr);
    const motherBirthStr = formatDate(mBirthArr);
    const motherDeathStr = formatDate(mDeathArr);
    const splitDate = (str: string) => str.split('\n');
    const pad = (arr: string[], len: number) => Array.from({ length: len }, (_, i) => arr[i] ?? '  ');
    const birthMax = Math.max(splitDate(motherBirthStr).length, splitDate(fatherBirthStr).length);
    const deathMax = Math.max(splitDate(motherDeathStr).length, splitDate(fatherDeathStr).length);
    const mBirth = pad(splitDate(motherBirthStr), birthMax);
    const fBirth = pad(splitDate(fatherBirthStr), birthMax);
    const mDeath = pad(splitDate(motherDeathStr), deathMax);
    const fDeath = pad(splitDate(fatherDeathStr), deathMax);
    let birthStr = '';
    for (let i = 0; i < birthMax; i++) birthStr += `${mBirth[i]}${fBirth[i]}\n`;
    let deathStr = '';
    for (let i = 0; i < deathMax; i++) deathStr += `${mDeath[i]}${fDeath[i]}\n`;
    return `母父\n生生\n于于\n${birthStr.slice(0, -1)}\n\n卒卒\n于于\n${deathStr.slice(0, -1)}`;
  }
  const birth = form.selected === '1' ? fBirthArr : mBirthArr;
  const death = form.selected === '1' ? fDeathArr : mDeathArr;
  const birthStr = formatDate(birth);
  const deathStr = formatDate(death);
  const prefix = form.selected === '1' ? '父' : '母';
  return `${prefix}\n生\n于\n${birthStr}\n\n卒\n于\n${deathStr}`;
}

/** 生成小字（名单） */
export function generateSmall(form: SteleForm): string {
  if (!form.names || form.names.length === 0) return '';
  const maxRowLength = Math.max(...form.names.map(row => row.length));
  const formatRow = (row: string[][]) => {
    const maxTitleLength = Math.max(1, ...row.map(item => (item[0] || '').length));
    const maxNameLength = Math.max(1, ...row.map(item => (item[1] || '').length));
    const titleArr = new Array(maxTitleLength).fill(null).map(() => new Array(row.length).fill('  '));
    const nameArr = new Array(maxNameLength).fill(null).map(() => new Array(row.length).fill('  '));
    row.forEach((item, index) => {
      const title = (item[0] || '').trim();
      const name = (item[1] || '').trim();
      const reverseIndex = row.length - 1 - index;
      if (!title) {
        for (let i = 0; i < maxTitleLength; i++) titleArr[i][reverseIndex] = '  ';
      } else if (title.length === maxTitleLength) {
        title.split('').forEach((char, charIndex) => { titleArr[charIndex][reverseIndex] = char; });
      } else {
        titleArr[0][reverseIndex] = title[0];
        for (let i = 1; i < maxTitleLength - title.length + 1; i++) titleArr[i][reverseIndex] = '  ';
        for (let i = 1; i < title.length; i++) titleArr[maxTitleLength - title.length + i][reverseIndex] = title[i];
      }
      if (!name) {
        for (let i = 0; i < maxNameLength; i++) nameArr[i][reverseIndex] = '  ';
      } else if (name.length === maxNameLength) {
        name.split('').forEach((char, charIndex) => { nameArr[charIndex][reverseIndex] = char; });
      } else {
        nameArr[0][reverseIndex] = name[0];
        for (let i = 1; i < maxNameLength - name.length + 1; i++) nameArr[i][reverseIndex] = '  ';
        for (let i = 1; i < name.length; i++) nameArr[maxNameLength - name.length + i][reverseIndex] = name[i];
      }
    });
    let result = '';
    const indentSpaces = ' '.repeat(maxRowLength - row.length);
    for (let i = 0; i < maxTitleLength; i++) {
      result += (indentSpaces + compressConsecutiveChars(titleArr[i], row)).trimEnd() + '\n';
    }
    for (let i = 0; i < maxNameLength; i++) {
      result += (indentSpaces + nameArr[i].join('')).trimEnd() + '\n';
    }
    return result.slice(0, -1);
  };
  const result = form.names.map(formatRow).join('\n');
  // 过滤全空格行（半角空格、全角空格）
  return result.split('\n').filter(line => line.replace(/[\s\u3000]/g, '').length > 0).join('\n');
}

// ==================== 文本指令解析 ====================

/** 称谓别名 → 内部称谓（用于逐行指令模式） */
const TITLE_ALIASES: Record<string, string> = {
  '儿子': '子', '儿': '子', '女儿': '女',
  '儿媳': '媳', '媳妇': '媳', '女婿': '婿',
  '孙媳妇': '孙媳', '孙女婿': '孙婿',
};
for (const t of appellationOptions) {
  if (!TITLE_ALIASES[t]) TITLE_ALIASES[t] = t;
}
const SORTED_TITLE_KEYS = Object.keys(TITLE_ALIASES).sort((a, b) => b.length - a.length);

/** 家谱式称谓映射表（从长到短排列，贪心匹配） */
const FAMILY_TITLE_MAP: [string, string][] = [
  ['外曾孙媳妇', '外曾孙媳'], ['外曾孙女婿', '外曾孙婿'], ['外曾孙媳', '外曾孙媳'], ['外曾孙婿', '外曾孙婿'],
  ['外重孙媳妇', '外重孙媳'], ['外重孙女婿', '外重孙婿'], ['外重孙媳', '外重孙媳'], ['外重孙婿', '外重孙婿'],
  ['曾外孙媳妇', '曾外孙媳'], ['曾外孙女婿', '曾外孙婿'], ['曾外孙媳', '曾外孙媳'], ['曾外孙婿', '曾外孙婿'],
  ['重外孙媳妇', '重外孙媳'], ['重外孙女婿', '重外孙婿'], ['重外孙媳', '重外孙媳'], ['重外孙婿', '重外孙婿'],
  ['外曾孙女', '外曾孙女'], ['外曾孙子', '外曾孙子'], ['外曾孙', '外曾孙子'],
  ['外重孙女', '外重孙女'], ['外重孙子', '外重孙子'], ['外重孙', '外重孙子'],
  ['曾外孙女', '曾外孙女'], ['曾外孙子', '曾外孙子'], ['曾外孙', '曾外孙子'],
  ['重外孙女', '重外孙女'], ['重外孙子', '重外孙子'], ['重外孙', '重外孙子'],
  ['曾孙媳妇', '曾孙媳'], ['曾孙女婿', '曾孙婿'], ['曾孙媳', '曾孙媳'], ['曾孙婿', '曾孙婿'],
  ['重孙媳妇', '重孙媳'], ['重孙女婿', '重孙婿'], ['重孙媳', '重孙媳'], ['重孙婿', '重孙婿'],
  ['曾孙女', '曾孙女'], ['曾孙子', '曾孙子'], ['曾孙', '曾孙子'],
  ['重孙女', '重孙女'], ['重孙子', '重孙子'], ['重孙', '重孙子'],
  ['外孙媳妇', '外孙媳'], ['外孙女婿', '外孙婿'], ['外孙媳', '外孙媳'], ['外孙婿', '外孙婿'],
  ['外孙女', '外孙女'], ['外孙子', '外孙子'], ['外孙', '外孙子'],
  ['孙媳妇', '孙媳'], ['孙女婿', '孙婿'], ['孙媳', '孙媳'], ['孙婿', '孙婿'],
  ['孙女', '孙女'], ['孙子', '孙子'],
  ['玄孙媳妇', '玄孙媳'], ['玄孙女婿', '玄孙婿'], ['玄孙媳', '玄孙媳'], ['玄孙婿', '玄孙婿'],
  ['玄孙女', '玄孙女'], ['玄孙子', '玄孙子'], ['玄孙', '玄孙子'],
  ['儿媳妇', '媳'], ['儿媳', '媳'], ['媳妇', '媳'],
  ['女婿', '婿'], ['女儿', '女'], ['儿子', '子'],
  ['外甥女', '外孙女'], ['外甥', '外孙子'],
  ['侄媳妇', '孙媳'], ['侄媳', '孙媳'], ['侄女婿', '孙婿'],
  ['侄女', '孙女'], ['侄子', '孙子'],
  ['媳', '媳'], ['婿', '婿'], ['女', '女'], ['子', '子'],
];

/** 根据称谓自动计算排组号：同辈+同角色 → 同一排 */
export function getTitleRowGroup(title: string): number {
  const isSpouse = title.endsWith('媳') || title.endsWith('婿');
  let gen = 1;
  if (title.includes('玄孙')) gen = 4;
  else if (title.includes('曾孙') || title.includes('重孙') || title.includes('曾外') || title.includes('重外')) gen = 3;
  else if (title.includes('孙')) gen = 2;
  return (gen - 1) * 2 + (isSpouse ? 1 : 0);
}

/** 解析单个"排行+称谓+姓名"项，如"长儿子赵德君" */
function parseFamilyItem(raw: string): { type: 'father' | 'mother' | 'name', title?: string, name: string } | null {
  let s = raw.trim();
  if (!s) return null;
  // 父/母（支持 "父亲：万氏老祖" 或 "父万氏老祖"）
  const fMatch = s.match(/^父亲?[：:\s]*(.+)$/);
  if (fMatch && fMatch[1].trim()) return { type: 'father', name: fMatch[1].trim() };
  const mMatch = s.match(/^母亲?[：:\s]*(.+)$/);
  if (mMatch && mMatch[1].trim()) return { type: 'mother', name: mMatch[1].trim() };
  // 去排行前缀：长、大、二、三、老大、老二…
  s = s.replace(/^(?:老[大二三四五六七八九十]|[长大小幺次二三四五六七八九十])/, '');
  // 匹配称谓（支持 "儿子：万成运" 或 "儿子万成运"）
  for (const [pattern, internal] of FAMILY_TITLE_MAP) {
    if (s.startsWith(pattern)) {
      const name = s.slice(pattern.length).replace(/^[：:\s]+/, '').trim();
      // "无"表示该位置没有人，保留空占位
      if (name === '无') return { type: 'name', title: internal, name: '' };
      if (name) return { type: 'name', title: internal, name };
    }
  }
  // 独立的"无" → 继承上一个称谓的空占位
  if (/^无$/.test(raw.trim())) return { type: 'name', title: '__empty__', name: '' };
  return null;
}

/** 用于自动检测家谱式输入的关键词 */
const FAMILY_DETECT_KEYWORDS = ['儿子', '女儿', '儿媳', '女婿', '孙子', '孙女', '外甥', '外孙', '曾孙', '重孙', '玄孙', '侄子', '侄女'];

/**
 * 解析家谱式名单文本（自由格式）
 * 支持多种输入：
 *   1. 名单父赵显德、母亲唐玉兰；长儿子赵德君、儿媳妇王彦华；
 *   2. 朱明付生于1955年农历三月初三！卒于2016年！大女儿朱琳 女婿黄才元
 * 自动按辈分+角色分排
 */
export function parseNameListText(text: string, form: SteleForm): string[] {
  const logs: string[] = [];
  let cleaned = text.replace(/^名单/, '').trim();

  // 预编译称谓正则
  const titles = FAMILY_TITLE_MAP.map(([p]) => p).sort((a, b) => b.length - a.length);
  const escaped = titles.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const ordinal = '(?:老[大二三四五六七八九十]|[长大小幺次二三四五六七八九十])?';
  const titleRe = new RegExp(`(${ordinal}(?:${escaped.join('|')}))`, 'g');

  /** 对单行文本做预处理并拆分为项 */
  function preprocessLine(line: string): string[] {
    let s = line.replace(/[！!；;·，,]/g, '、');
    s = s.replace(/([\u4e00-\u9fff])(父亲?(?=[\u4e00-\u9fff]))/g, '$1、$2');
    s = s.replace(/([\u4e00-\u9fff])(母亲?(?=[\u4e00-\u9fff]))/g, '$1、$2');
    s = s.replace(titleRe, '、$1');
    s = s.replace(/、+/g, '、').replace(/^、|、$/g, '');
    return s.split('、').map(x => x.trim()).filter(Boolean);
  }

  // 按行拆分（保留行结构用于分排）
  const inputLines = cleaned.split(/\n/).map(l => l.trim()).filter(Boolean);

  let parentIndex = 0;
  let lastTitle = '';
  const lineRows: [string, string][][] = []; // 每行的名单项
  const allNameItems: [string, string][] = [];

  /** 解析单个项目（横批/日期/生卒/父母/名单），返回是否为名单项 */
  function parseItem(item: string): [string, string] | null {
    // 横批
    const hpMatch = item.match(/^横批[是为：:\s]*(.+)$/);
    if (hpMatch) { form.bigTitle = hpMatch[1].trim(); logs.push(`横批：${form.bigTitle}`); return null; }
    // 立碑日期
    const lbMatch = item.match(/^立碑[日期]*[是为：:\s]*(.+)$/);
    if (lbMatch) {
      const val = lbMatch[1].trim();
      if (val.includes('清明')) { form.dateQingming = true; logs.push('立碑日期：清明节'); }
      else { form.dateQingming = false; form.libei = toStorageDate(parseFlexibleDate(val)) as any; logs.push(`立碑日期：${val}`); }
      return null;
    }
    // 生于
    const birthMatch = item.match(/^([\u4e00-\u9fff]{2,4})[：:\s]*生于[：:\s]*(.+)$/);
    if (birthMatch) {
      const [, name, dateStr] = birthMatch;
      const parsed = toStorageDate(parseFlexibleDate(dateStr.replace(/农历/, '')));
      if (/^[父母]亲?$/.test(name)) {
        const isFather = name.startsWith('父');
        const p = isFather ? form.father : form.mother;
        p.birth.year = parsed[0]; p.birth.month = parsed[1]; p.birth.day = parsed[2];
        logs.push(`${isFather ? '父亲' : '母亲'}出生：${parsed.filter(Boolean).join('-')}`);
      } else {
        const p = parentIndex === 0 ? form.father : form.mother;
        p.name = name;
        p.birth.year = parsed[0]; p.birth.month = parsed[1]; p.birth.day = parsed[2];
        logs.push(`${parentIndex === 0 ? '父亲' : '母亲'}：${name}，出生：${parsed.filter(Boolean).join('-')}`);
      }
      return null;
    }
    // 父亲卒于/母亲卒于
    const parentDeathMatch = item.match(/^([父母]亲?)[：:\s]*卒于[：:\s]*(.+)$/);
    if (parentDeathMatch) {
      const isFather = parentDeathMatch[1].startsWith('父');
      const parsed = toStorageDate(parseFlexibleDate(parentDeathMatch[2].replace(/农历/, '')));
      const p = isFather ? form.father : form.mother;
      p.death.year = parsed[0]; p.death.month = parsed[1]; p.death.day = parsed[2];
      logs.push(`${isFather ? '父亲' : '母亲'}去世：${parsed.filter(Boolean).join('-')}`);
      return null;
    }
    // 生于（无名字前缀，如"生于1933-12-05"，属于当前父/母）
    const standaloneBirthMatch = item.match(/^生于[：:\s]*(.+)$/);
    if (standaloneBirthMatch) {
      const parsed = toStorageDate(parseFlexibleDate(standaloneBirthMatch[1].replace(/农历/, '')));
      const p = parentIndex === 0 ? form.father : form.mother;
      p.birth.year = parsed[0]; p.birth.month = parsed[1]; p.birth.day = parsed[2];
      logs.push(`${parentIndex === 0 ? '父亲' : '母亲'}出生：${parsed.filter(Boolean).join('-')}`);
      return null;
    }
    // 卒于（无前缀）
    const deathMatch = item.match(/^卒于[：:\s]*(.+)$/);
    if (deathMatch) {
      const parsed = toStorageDate(parseFlexibleDate(deathMatch[1].replace(/农历/, '')));
      const p = parentIndex === 0 ? form.father : form.mother;
      p.death.year = parsed[0]; p.death.month = parsed[1]; p.death.day = parsed[2];
      logs.push(`${parentIndex === 0 ? '父亲' : '母亲'}去世：${parsed.filter(Boolean).join('-')}`);
      parentIndex = 1;
      return null;
    }
    // 父/母姓名
    const familyParsed = parseFamilyItem(item);
    if (familyParsed) {
      if (familyParsed.type === 'father') { form.father.name = familyParsed.name; logs.push(`父亲：${familyParsed.name}`); return null; }
      if (familyParsed.type === 'mother') { form.mother.name = familyParsed.name; logs.push(`母亲：${familyParsed.name}`); return null; }
      if (familyParsed.type === 'name' && familyParsed.title) {
        // "无"独立出现 → 继承上一个称谓做空占位
        if (familyParsed.title === '__empty__' && lastTitle) {
          return [lastTitle, ''];
        }
        if (familyParsed.title !== '__empty__') {
          lastTitle = familyParsed.title;
        }
        return [familyParsed.title === '__empty__' ? lastTitle : familyParsed.title, familyParsed.name];
      }
    }
    // 裸名字 → 继承上一个称谓
    const bareName = item.replace(/\s+/g, '').trim();
    if (lastTitle && /^[\u4e00-\u9fff]{2,4}$/.test(bareName)) {
      return [lastTitle, bareName];
    }
    return null;
  }

  // 逐行处理
  for (const line of inputLines) {
    const items = preprocessLine(line);
    const lineNameItems: [string, string][] = [];
    for (const item of items) {
      const nameItem = parseItem(item);
      if (nameItem) {
        lineNameItems.push(nameItem);
        allNameItems.push(nameItem);
      }
    }
    if (lineNameItems.length > 0) {
      lineRows.push(lineNameItems);
    }
  }

  if (allNameItems.length === 0) {
    if (logs.length === 0) logs.push('未解析到数据');
    return logs;
  }

  // 分排策略：
  // 如果某一行包含多种不同称谓（如"儿子+媳"在同一行）→ 说明用户手动控制了分排，按行分排
  // 否则 → 按辈分自动合并（默认，兼容AI不听话的情况）
  const hasManualGrouping = lineRows.some(row => {
    const groups = new Set(row.map(([t]) => getTitleRowGroup(t)));
    return groups.size > 1;
  });

  if (hasManualGrouping) {
    // 用户手动控制：每行 = 碑面一排
    form.names = lineRows;
  } else {
    // 自动按辈分+角色分排
    const rowMap: Record<number, [string, string][]> = {};
    for (const [title, name] of allNameItems) {
      const group = getTitleRowGroup(title);
      if (!rowMap[group]) rowMap[group] = [];
      rowMap[group].push([title, name]);
    }
    const sortedGroups = Object.keys(rowMap).map(Number).sort((a, b) => a - b);
    form.names = sortedGroups.map(g => rowMap[g]);
  }

  for (let i = 0; i < form.names.length; i++) {
    const row = form.names[i];
    const rowTitles = [...new Set(row.map(r => r[0]))];
    logs.push(`第${i + 1}排(${rowTitles.join('/')}): ${row.map(r => r[1]).join(' ')}`);
  }
  logs.push(`共${allNameItems.length}人，${form.names.length}排`);
  return logs;
}

/**
 * 配偶行补齐：子3人媳2人 → 自动补 [媳,""] 使数量对齐
 * 遍历相邻的"人物排+配偶排"，按称谓对应关系补齐空位
 */
export function padSpouseRows(form: SteleForm): void {
  const names = form.names;
  for (let i = 0; i + 1 < names.length; i++) {
    const row = names[i];
    const nextRow = names[i + 1];
    // 判断 row 是人物排（偶数组）、nextRow 是配偶排（奇数组）
    const rowGroups = row.map(([t]) => getTitleRowGroup(t));
    const nextGroups = nextRow.map(([t]) => getTitleRowGroup(t));
    const allPersonRow = rowGroups.length > 0 && rowGroups.every(g => g % 2 === 0);
    const allSpouseRow = nextGroups.length > 0 && nextGroups.every(g => g % 2 === 1);
    if (!allPersonRow || !allSpouseRow) continue;

    // 统计人物排每种称谓的数量
    const personCounts: Record<string, number> = {};
    for (const [t] of row) { personCounts[t] = (personCounts[t] || 0) + 1; }

    // 统计配偶排每种称谓的数量
    const spouseCounts: Record<string, number> = {};
    for (const [t] of nextRow) { spouseCounts[t] = (spouseCounts[t] || 0) + 1; }

    // 对每种人物称谓，检查对应配偶是否数量一致
    for (const [personTitle, count] of Object.entries(personCounts)) {
      const spouseTitle = titleToSpouse(personTitle);
      if (!spouseTitle) continue;
      const currentCount = spouseCounts[spouseTitle] || 0;
      if (currentCount < count) {
        // 在该配偶称谓组末尾补空项
        let insertIdx = nextRow.length;
        for (let k = nextRow.length - 1; k >= 0; k--) {
          if (nextRow[k][0] === spouseTitle) { insertIdx = k + 1; break; }
        }
        for (let j = 0; j < count - currentCount; j++) {
          nextRow.splice(insertIdx, 0, [spouseTitle, '']);
          insertIdx++;
        }
        spouseCounts[spouseTitle] = count;
      }
    }
  }
}

/**
 * 解析结构化文本指令，修改表单数据
 * - 以"名单"开头 → 家谱式解析（自动分排）
 * - 否则逐行解析：父亲 张新礼 / 儿子 张三 李四 / 把X改成Y / 横批 永垂千古 …
 */
export function applyTextCommands(text: string, form: SteleForm): string[] {
  const trimmed = text.trim();

  // 家谱式名单：以"名单"开头，或包含家谱称谓关键词
  if (trimmed.startsWith('名单') || FAMILY_DETECT_KEYWORDS.some(kw => trimmed.includes(kw))) {
    return parseNameListText(trimmed, form);
  }

  // 逐行指令模式
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  const logs: string[] = [];

  for (const line of lines) {
    // 1. 把X改成/改为Y
    const replaceMatch = line.match(/^把(.+?)改[成为](.+)$/);
    if (replaceMatch) {
      const [, from, to] = replaceMatch;
      let count = 0;
      for (const row of form.names) {
        for (const item of row) {
          if (item[1] && item[1].includes(from)) {
            item[1] = item[1].replace(from, to);
            count++;
          }
        }
      }
      if (form.father.name && form.father.name.includes(from)) { form.father.name = form.father.name.replace(from, to); count++; }
      if (form.mother.name && form.mother.name.includes(from)) { form.mother.name = form.mother.name.replace(from, to); count++; }
      logs.push(count > 0 ? `已将"${from}"改为"${to}"（${count}处）` : `未找到"${from}"`);
      continue;
    }

    // 2. 父亲/母亲 生卒日期
    const parentDateMatch = line.match(/^(父亲?|母亲?)[的]?(生于|出生|生日|卒于|去世|逝世|过世)[是为：:\s]*(.+)$/);
    if (parentDateMatch) {
      const [, parent, type, dateStr] = parentDateMatch;
      const isFather = parent.startsWith('父');
      const isBirth = ['生于', '出生', '生日'].includes(type);
      const parsed = toStorageDate(parseFlexibleDate(dateStr.trim()));
      const p = isFather ? form.father : form.mother;
      if (isBirth) { p.birth.year = parsed[0]; p.birth.month = parsed[1]; p.birth.day = parsed[2]; }
      else { p.death.year = parsed[0]; p.death.month = parsed[1]; p.death.day = parsed[2]; }
      const label = `${isFather ? '父亲' : '母亲'}${isBirth ? '出生' : '去世'}`;
      logs.push(`${label}：${parsed.filter(Boolean).join('-') || '(空)'}`);
      continue;
    }

    // 3. 父亲/母亲姓名
    const parentNameMatch = line.match(/^(父亲?|母亲?)[的]?(?:姓名|名字|名|叫)?[是为：:\s]\s*(.+)$/);
    if (parentNameMatch) {
      const [, parent, name] = parentNameMatch;
      if (parent.startsWith('父')) { form.father.name = name.trim(); logs.push(`父亲姓名：${name.trim()}`); }
      else { form.mother.name = name.trim(); logs.push(`母亲姓名：${name.trim()}`); }
      continue;
    }

    // 4. 横批
    const titleMatch = line.match(/^横批[是为：:\s]\s*(.+)$/);
    if (titleMatch) {
      form.bigTitle = titleMatch[1].trim();
      logs.push(`横批：${form.bigTitle}`);
      continue;
    }

    // 5. 立碑日期
    const libeiMatch = line.match(/^立碑[日期]*[是为：:\s]\s*(.+)$/);
    if (libeiMatch) {
      const val = libeiMatch[1].trim();
      if (val.includes('清明')) {
        form.dateQingming = true;
        logs.push('立碑日期：清明节');
      } else {
        form.dateQingming = false;
        const parsed = toStorageDate(parseFlexibleDate(val));
        form.libei = [parsed[0], parsed[1], parsed[2]];
        logs.push(`立碑日期：${parsed.filter(Boolean).join('-')}`);
      }
      continue;
    }

    // 6. 农历/公历
    if (/^(显示)?农历$/.test(line)) { form.dateShowLunar = true; logs.push('显示农历'); continue; }
    if (/^(显示)?公历$/.test(line) || line === '不显示农历') { form.dateShowLunar = false; logs.push('不显示农历'); continue; }

    // 7. 双亲/仅父/仅母
    if (line === '双亲' || line === '双人') { form.selected = '0'; logs.push('模式：双亲'); continue; }
    if (line === '仅父亲' || line === '只有父亲') { form.selected = '1'; logs.push('模式：仅父亲'); continue; }
    if (line === '仅母亲' || line === '只有母亲') { form.selected = '2'; logs.push('模式：仅母亲'); continue; }

    // 8. 名单修改：称谓 名字1 名字2
    let matched = false;
    for (const titleKey of SORTED_TITLE_KEYS) {
      const re = new RegExp(`^${titleKey}[是有为：:\\s]\\s*(.+)$`);
      const m = line.match(re);
      if (m) {
        const internalTitle = TITLE_ALIASES[titleKey];
        const names = m[1].trim().split(/[、，,\s]+/).filter(Boolean);
        let targetRow = -1;
        for (let r = 0; r < form.names.length; r++) {
          if (form.names[r].some(item => item[0] === internalTitle)) { targetRow = r; break; }
        }
        if (targetRow >= 0) {
          form.names[targetRow] = form.names[targetRow].filter(item => item[0] !== internalTitle);
          for (const name of names) form.names[targetRow].push([internalTitle, name]);
          if (form.names[targetRow].length === 0) form.names.splice(targetRow, 1);
        } else {
          form.names.push(names.map(name => [internalTitle, name]));
        }
        logs.push(`${internalTitle}：${names.join('、')}`);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    logs.push(`未识别：${line}`);
  }
  return logs;
}
