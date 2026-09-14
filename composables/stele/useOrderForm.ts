import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  appellationOptions, titleToSpouse,
  parseFlexibleDate, arrToDisplay, toStorageDate,
  generateBig, generateSmall, generateDate, generateBirth,
} from '../../utils/stele/stele-utils';
import { callOrderFunction } from '../../utils/stele/order-api';
import type { OrderForm, PreviewData, SavePayload, ParentInfo } from '../../types/order';
import type { SteleTemplateData } from '../../types/order';
import { STELE_STORAGE_KEYS } from '../../utils/stele/storage-registry';

export interface OrderSnapshot {
  form: OrderForm;
  preview?: PreviewData;
}

/** 从 URL 中获取指定参数 */
export function getUrlParam(key: string): string {
  if (typeof getCurrentPages === 'function') {
    const pages = getCurrentPages();
    const cp = pages[pages.length - 1] as any;
    if (cp?.options?.[key]) return cp.options[key];
    if (cp?.$page?.options?.[key]) return cp.$page.options[key];
  }
  if (typeof window !== 'undefined') {
    const m = window.location.href.match(new RegExp('[?&]' + key + '=([^&]+)'));
    if (m) return decodeURIComponent(m[1]);
  }
  return '';
}

/** 创建默认表单 */
export function createDefaultForm(): OrderForm {
  return {
    selected: '0',
    father: { name: '', birth: { year: '', month: '', day: '' }, death: { year: '', month: '', day: '' } },
    mother: { name: '', birth: { year: '', month: '', day: '' }, death: { year: '', month: '', day: '' } },
    bigTitle: '永垂千古',
    dateQingming: true,
    dateShowLunar: false,
    libei: [String(new Date().getFullYear()), '', ''],
    names: [[['子', '']]],
    user: '',
    remark: '',
  };
}

/** 将 ParentInfo 中的日期补零 */
function normalizeParentDates(parent: ParentInfo): void {
  const fb = toStorageDate([parent.birth.year, parent.birth.month, parent.birth.day]);
  parent.birth.year = fb[0]; parent.birth.month = fb[1]; parent.birth.day = fb[2];
  const fd = toStorageDate([parent.death.year, parent.death.month, parent.death.day]);
  parent.death.year = fd[0]; parent.death.month = fd[1]; parent.death.day = fd[2];
}

/** 安全解析父母信息：兼容旧数组格式和新对象格式 */
function safeParentInfo(raw: unknown): ParentInfo {
  const empty: ParentInfo = { name: '', birth: { year: '', month: '', day: '' }, death: { year: '', month: '', day: '' } };
  if (!raw) return empty;
  // 旧数组格式: [姓, 名, 生年, 生月, 生日, 卒年, 卒月, 卒日]
  if (Array.isArray(raw) && raw.length === 8) {
    const a = raw.map((x: any) => x == null ? '' : String(x));
    return {
      name: a[1],
      birth: { year: a[2], month: a[3], day: a[4] },
      death: { year: a[5], month: a[6], day: a[7] },
    };
  }
  // 新对象格式
  if (typeof raw === 'object' && raw !== null && 'name' in raw) {
    const obj = raw as any;
    return {
      name: obj.name == null ? '' : String(obj.name),
      birth: {
        year: obj.birth?.year == null ? '' : String(obj.birth.year),
        month: obj.birth?.month == null ? '' : String(obj.birth.month),
        day: obj.birth?.day == null ? '' : String(obj.birth.day),
      },
      death: {
        year: obj.death?.year == null ? '' : String(obj.death.year),
        month: obj.death?.month == null ? '' : String(obj.death.month),
        day: obj.death?.day == null ? '' : String(obj.death.day),
      },
    };
  }
  return empty;
}

/** 安全解析 names 三维数组 */
function safeNames(raw: unknown, fallback: string[][][] = [[['', '']]]): string[][][] {
  if (!Array.isArray(raw) || !raw.length) return fallback;
  return raw.map((group: any) =>
    Array.isArray(group) && group.length
      ? group.map((item: any) =>
          Array.isArray(item) && item.length >= 2
            ? [item[0] == null ? '' : String(item[0]), item[1] == null ? '' : String(item[1])]
            : ['', '']
        )
      : [['', '']]
  );
}

/**
 * 按现有称谓顺序分辈，子女（子/女）归到同排、配偶（媳/婿）归到下一排分工；
 * 只重排，不增删或改写人员。
 */
export function organizeNameRows(names: string[][][]): string[][][] {
  const normalizeTitle = (title: string) => title.trim().replace(/重/g, '曾');
  const knownTitles = new Set(appellationOptions.map(normalizeTitle));
  const familyOrder = [...new Set(appellationOptions.map(title => normalizeTitle(title).slice(0, -1)))];
  const byTitle = new Map<string, string[][]>();
  const other: string[][] = [];
  for (const row of names) {
    for (const person of row) {
      const copy = [...person];
      const title = normalizeTitle(person[0] || '');
      if (!knownTitles.has(title)) { other.push(copy); continue; }
      if (!byTitle.has(title)) byTitle.set(title, []);
      byTitle.get(title)!.push(copy);
    }
  }
  const rows: string[][][] = [];
  for (const family of familyOrder) {
    const childrenRow: string[][] = [];
    const spouseRow: string[][] = [];
    for (const suffix of ['子', '女']) {
      const title = family + suffix;
      const children = byTitle.get(title) || [];
      const spouses = byTitle.get(titleToSpouse(title)) || [];
      // 子女（子/女）放同一排；配偶（媳/婿）放另一排。同列位置对齐原录入顺序，配偶空项占位保持。
      for (let index = 0; index < Math.max(children.length, spouses.length); index++) {
        if (children[index]) childrenRow.push(children[index]);
        if (spouses[index]) spouseRow.push(spouses[index]);
      }
    }
    if (childrenRow.length) rows.push(childrenRow);
    if (spouseRow.length) rows.push(spouseRow);
  }
  if (other.length) rows.push(other);
  return rows.length ? rows : names.map(row => row.map(person => [...person]));
}

/**
 * 核心 composable：订单表单管理
 * 封装 form 初始化、数据回显、日期同步、名单操作、预览生成、保存
 */
export function useOrderForm() {
  const currentYear = new Date().getFullYear();
  const form = reactive<OrderForm>(createDefaultForm());

  const fatherBirth = ref('');
  const fatherDeath = ref('');
  const motherBirth = ref('');
  const motherDeath = ref('');
  const libeiDate = ref('');
  const qingmingYear = ref(String(currentYear));
  const lastCustomLibei = ref<[string, string, string]>(['', '', '']);

  // --- 名单操作 ---
  const namesBeforeOrganize = ref<string[][][] | null>(null);
  const organizedNamesSnapshot = ref('');
  const canUndoNamesOrganize = computed(() => namesBeforeOrganize.value !== null
    && JSON.stringify(form.names) === organizedNamesSnapshot.value);

  function organizeNames(): boolean {
    const next = organizeNameRows(form.names);
    const nextSnapshot = JSON.stringify(next);
    if (nextSnapshot === JSON.stringify(form.names)) return false;
    namesBeforeOrganize.value = form.names.map(row => row.map(person => [...person]));
    form.names = next;
    organizedNamesSnapshot.value = nextSnapshot;
    return true;
  }

  function undoNamesOrganize(): boolean {
    // 后续已经编辑或拖动时不回退旧快照，避免丢失人工修改。
    if (!canUndoNamesOrganize.value || !namesBeforeOrganize.value) return false;
    form.names = namesBeforeOrganize.value;
    namesBeforeOrganize.value = null;
    organizedNamesSnapshot.value = '';
    return true;
  }

  function addCol(rowIdx: number, colIdx?: number) {
    const insertIdx = typeof colIdx === 'number' ? colIdx + 1 : form.names[rowIdx].length;
    const prevTitle = form.names[rowIdx][insertIdx - 1]?.[0] || '';
    form.names[rowIdx].splice(insertIdx, 0, [prevTitle, '']);
  }

  function removeCol(rowIdx: number, colIdx: number) {
    if (form.names[rowIdx].length > 1) {
      form.names[rowIdx].splice(colIdx, 1);
    } else if (form.names.length > 1) {
      // 本排只剩一个人，删除整排（但至少保留一排）
      form.names.splice(rowIdx, 1);
    } else {
      // 最后一排最后一个人，重置为空项而非删除
      form.names[0][0] = ['', ''];
    }
  }

  function addGroup(rowIdx?: number) {
    const insertIdx = typeof rowIdx === 'number' ? rowIdx + 1 : form.names.length;
    const refRow = typeof rowIdx === 'number' ? form.names[rowIdx] : null;
    let newRow: [string, string][];
    if (refRow && refRow.length > 0) {
      const hasChildType = refRow.some(([t]) => titleToSpouse(t || '') !== '');
      // 排内已有配偶称谓（如同时有子和媳），说明配偶关系已在本排，新增空行
      const hasSpouseInRow = refRow.some(([t]) => {
        const title = (t || '').trim();
        return title.endsWith('媳') || title.endsWith('婿');
      });
      if (hasChildType && !hasSpouseInRow) {
        // 只有子女没配偶，自动生成配偶行
        newRow = refRow.map(([title]) => [titleToSpouse(title || ''), '']);
      } else {
        newRow = [['', '']];
      }
    } else {
      newRow = [['', '']];
    }
    form.names.splice(insertIdx, 0, newRow);
  }

  function removeGroup(rowIdx: number) {
    if (form.names.length > 1) form.names.splice(rowIdx, 1);
  }

  /** 配偶补齐：为每排有直系称谓但缺配偶的人自动添加配偶行 */
  function padSpouse() {
    let added = 0;
    for (let r = 0; r < form.names.length; r++) {
      const row = form.names[r];
      const spouseRow: [string, string][] = [];
      for (const [title, name] of row) {
        const spouse = titleToSpouse(title || '');
        if (spouse && name?.trim()) {
          // 检查是否已有该配偶
          const exists = form.names.some(rr => rr.some(([t]) => t === spouse));
          if (!exists) {
            spouseRow.push([spouse, '']);
            added++;
          }
        }
      }
      if (spouseRow.length) {
        form.names.splice(r + 1, 0, spouseRow);
        r++; // 跳过新插入的行
      }
    }
    return added;
  }

  // --- 日期同步 ---
  /** 将日期输入框的值同步到 form 对象中 */
  function syncDatesToForm() {
    const syncParentDate = (input: string, target: { year: string; month: string; day: string }) => {
      const arr = toStorageDate(parseFlexibleDate(input || ''));
      target.year = arr[0]; target.month = arr[1]; target.day = arr[2];
    };
    syncParentDate(fatherBirth.value, form.father.birth);
    syncParentDate(fatherDeath.value, form.father.death);
    syncParentDate(motherBirth.value, form.mother.birth);
    syncParentDate(motherDeath.value, form.mother.death);
    form.libei = toStorageDate(parseFlexibleDate(libeiDate.value || ''));
    if (form.dateQingming) form.libei = [qingmingYear.value, '', ''];
  }

  /** 普通模式也通过命令切换，避免页面 watcher 延迟改写日期状态。 */
  function setNormalErectDateMode(qingming: boolean) {
    if (qingming === form.dateQingming) return;
    if (qingming) {
      const parsed = toStorageDate(parseFlexibleDate(libeiDate.value || ''));
      if (parsed.some(Boolean)) lastCustomLibei.value = parsed;
      form.dateQingming = true;
      form.dateShowLunar = false;
      qingmingYear.value = parsed[0] || form.libei[0] || String(currentYear);
      form.libei = [qingmingYear.value, '', ''];
      libeiDate.value = '';
      return;
    }
    form.dateQingming = false;
    form.dateShowLunar = true;
    const restored = lastCustomLibei.value.some(Boolean)
      ? [...lastCustomLibei.value]
      : [form.libei[0] || String(currentYear), '', ''];
    form.libei = restored;
    libeiDate.value = arrToDisplay(restored);
  }

  // --- 预览生成 ---
  function buildPreview(): PreviewData {
    return {
      title: form.bigTitle.split('').reverse().join(''),
      big: generateBig(form),
      small: generateSmall(form),
      date: generateDate(form, qingmingYear.value, currentYear),
      birth: generateBirth(form),
    };
  }

  // --- 数据回显 ---
  /** 只读取并构造快照，不修改当前表单；页面按 loadEpoch 决定是否提交。 */
  async function fetchOrderSnapshot(orderId: string): Promise<false | OrderSnapshot> {
    if (!orderId) return false;
    try {
      const res = await callOrderFunction('order-query', { id: orderId });
      const result = res.result as { code?: number; data?: any[]; msg?: string };
      if (result?.code !== 0) {
        ElMessage.error(result?.msg || '获取详情失败');
        return false;
      }
      if (!result?.data?.length) {
        ElMessage.error('获取详情失败：无数据');
        return false;
      }
      // 兼容嵌套数组和平铺两种结构
      const raw = result.data[0];
      const detailData = Array.isArray(raw) ? raw[0] : raw;
      if (!detailData) return false;

      const info = detailData.info || {};
      const next = createDefaultForm();
      next.selected = typeof info.selected !== 'undefined' ? String(info.selected) : '0';
      next.father = safeParentInfo(info.father);
      next.mother = safeParentInfo(info.mother);
      next.bigTitle = info.bigTitle ?? '永垂千古';
      next.dateQingming = !!info.dateQingming;
      next.dateShowLunar = !!info.dateShowLunar;

      const rawLibei = Array.isArray(info.libei) && info.libei.length === 3
        ? (info.libei as any[]).map((x: any) => x == null ? '' : String(x)).slice(0, 3) as [string, string, string]
        : [String(currentYear), '', ''];
      next.libei = toStorageDate(rawLibei);
      next.names = safeNames(info.names);
      next.user = detailData.user || '';
      next.remark = detailData.remark || '';

      // 日期补零
      normalizeParentDates(next.father);
      normalizeParentDates(next.mother);

      // 如果数据库有已保存的预览文案，返回它
      if (detailData.big || detailData.title || detailData.small) {
        return { form: next, preview: {
          title: detailData.title || '',
          big: detailData.big || '',
          small: detailData.small || '',
          date: detailData.date || '',
          birth: detailData.birth || '',
        } };
      }
      return { form: next };
    } catch (e) {
      ElMessage.error('获取详情失败');
      return false;
    }
  }

  function commitOrderSnapshot(snapshot: OrderSnapshot): void {
    const next = snapshot.form;
    form.selected = next.selected;
    form.father = safeParentInfo(next.father);
    form.mother = safeParentInfo(next.mother);
    form.bigTitle = next.bigTitle;
    form.dateQingming = next.dateQingming;
    form.dateShowLunar = next.dateShowLunar;
    form.libei = toStorageDate(next.libei as [string, string, string]);
    form.names = safeNames(next.names);
    form.user = next.user;
    form.remark = next.remark;
    fatherBirth.value = arrToDisplay([form.father.birth.year, form.father.birth.month, form.father.birth.day]);
    fatherDeath.value = arrToDisplay([form.father.death.year, form.father.death.month, form.father.death.day]);
    motherBirth.value = arrToDisplay([form.mother.birth.year, form.mother.birth.month, form.mother.birth.day]);
    motherDeath.value = arrToDisplay([form.mother.death.year, form.mother.death.month, form.mother.death.day]);
    if (form.dateQingming) {
      qingmingYear.value = form.libei[0] || String(currentYear);
      libeiDate.value = '';
    } else {
      libeiDate.value = arrToDisplay(form.libei);
      qingmingYear.value = form.libei[0] || String(currentYear);
      lastCustomLibei.value = [form.libei[0] || '', form.libei[1] || '', form.libei[2] || ''];
    }
  }

  /** 兼容旧调用；新页面应优先使用快照 API。 */
  async function fetchAndFill(orderId: string): Promise<false | PreviewData | true> {
    const snapshot = await fetchOrderSnapshot(orderId);
    if (!snapshot) return false;
    commitOrderSnapshot(snapshot);
    return snapshot.preview || true;
  }

  function applyTemplateData(data: SteleTemplateData): void {
    form.selected = data.selected;
    Object.assign(form.father, safeParentInfo(data.father));
    Object.assign(form.mother, safeParentInfo(data.mother));
    form.bigTitle = data.bigTitle;
    form.dateQingming = data.dateQingming;
    form.dateShowLunar = data.dateShowLunar;
    form.libei = toStorageDate(data.libei);
    form.names = safeNames(data.names);
    fatherBirth.value = arrToDisplay([form.father.birth.year, form.father.birth.month, form.father.birth.day]);
    fatherDeath.value = arrToDisplay([form.father.death.year, form.father.death.month, form.father.death.day]);
    motherBirth.value = arrToDisplay([form.mother.birth.year, form.mother.birth.month, form.mother.birth.day]);
    motherDeath.value = arrToDisplay([form.mother.death.year, form.mother.death.month, form.mother.death.day]);
    libeiDate.value = arrToDisplay(form.libei);
    qingmingYear.value = form.libei[0] || String(currentYear);
  }

  // --- 构建保存 payload ---
  function buildSavePayload(editId?: string): SavePayload {
    syncDatesToForm();
    const pd = buildPreview();
    const payload: SavePayload = {
      big: pd.big,
      title: pd.title,
      small: pd.small,
      birth: pd.birth,
      date: pd.date,
      time: Date.now(),
      info: {
        selected: form.selected,
        father: form.father,
        mother: form.mother,
        bigTitle: form.bigTitle,
        libei: form.libei,
        dateQingming: form.dateQingming,
        dateShowLunar: form.dateShowLunar,
        names: form.names,
      },
      user: form.user,
      remark: form.remark || '',
    };
    if (editId) payload.id = editId;
    return payload;
  }

  /** 执行保存云函数调用 */
  async function doSave(payload: SavePayload): Promise<string | undefined> {
    const res = await callOrderFunction('order-update', payload as unknown as Record<string, unknown>);
    if (res.result?.code !== 0) {
      throw new Error(res.result?.msg || '保存失败');
    }
    return res.result?.id;
  }

  // --- 草稿自动保存 ---
  const DRAFT_KEY = STELE_STORAGE_KEYS.draft;

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        form: { ...form, father: { ...form.father, birth: { ...form.father.birth }, death: { ...form.father.death } }, mother: { ...form.mother, birth: { ...form.mother.birth }, death: { ...form.mother.death } } },
        fatherBirth: fatherBirth.value, fatherDeath: fatherDeath.value,
        motherBirth: motherBirth.value, motherDeath: motherDeath.value,
        libeiDate: libeiDate.value, qingmingYear: qingmingYear.value,
        lastCustomLibei: lastCustomLibei.value,
      }));
    } catch (_) {}
  }

  function loadDraft(): boolean {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft?.form) return false;
      Object.assign(form, draft.form);
      // 确保 names 至少有一排一列，否则用户无法添加第一排
      form.names = safeNames(draft.form.names);
      fatherBirth.value = draft.fatherBirth || '';
      fatherDeath.value = draft.fatherDeath || '';
      motherBirth.value = draft.motherBirth || '';
      motherDeath.value = draft.motherDeath || '';
      libeiDate.value = draft.libeiDate || '';
      qingmingYear.value = draft.qingmingYear || String(currentYear);
      if (draft.lastCustomLibei) lastCustomLibei.value = draft.lastCustomLibei;
      return true;
    } catch (_) { return false; }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
  }

  return {
    form,
    currentYear,
    fatherBirth, fatherDeath, motherBirth, motherDeath,
    libeiDate, qingmingYear, lastCustomLibei,
    // 名单操作
    addCol, removeCol, addGroup, removeGroup, padSpouse,
    organizeNames, undoNamesOrganize, canUndoNamesOrganize,
    // 日期
    syncDatesToForm, setNormalErectDateMode,
    // 模板
    applyTemplateData,
    // 草稿
    saveDraft, loadDraft, clearDraft,
    // 预览
    buildPreview,
    // 数据回显
    fetchAndFill, fetchOrderSnapshot, commitOrderSnapshot,
    // 保存
    buildSavePayload, doSave,
  };
}
