import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import {
  appellationOptions, titleToSpouse,
  parseFlexibleDate, arrToDisplay, toStorageDate,
  generateBig, generateSmall, generateDate, generateBirth,
} from '../../utils/stele/stele-utils';
import type { OrderForm, PreviewData, SavePayload, ParentInfo } from '../../types/order';

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
    if (fatherBirth.value) {
      const arr = toStorageDate(parseFlexibleDate(fatherBirth.value));
      form.father.birth.year = arr[0]; form.father.birth.month = arr[1]; form.father.birth.day = arr[2];
    }
    if (fatherDeath.value) {
      const arr = toStorageDate(parseFlexibleDate(fatherDeath.value));
      form.father.death.year = arr[0]; form.father.death.month = arr[1]; form.father.death.day = arr[2];
    }
    if (motherBirth.value) {
      const arr = toStorageDate(parseFlexibleDate(motherBirth.value));
      form.mother.birth.year = arr[0]; form.mother.birth.month = arr[1]; form.mother.birth.day = arr[2];
    }
    if (motherDeath.value) {
      const arr = toStorageDate(parseFlexibleDate(motherDeath.value));
      form.mother.death.year = arr[0]; form.mother.death.month = arr[1]; form.mother.death.day = arr[2];
    }
    form.libei = toStorageDate(parseFlexibleDate(libeiDate.value || ''));
    if (form.dateQingming) form.libei = [qingmingYear.value, '', ''];
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
  /** 返回 false 表示失败，返回 PreviewData 表示数据库有已保存的预览文案 */
  async function fetchAndFill(orderId: string): Promise<false | PreviewData | true> {
    if (!orderId) return false;
    try {
      const res = await uniCloud.callFunction({
        name: 'order-query',
        data: { id: orderId }
      });
      const result = res.result as { data?: any[] };
      if (!result?.data?.length) {
        ElMessage.error('获取详情失败：无数据');
        return false;
      }
      // 兼容嵌套数组和平铺两种结构
      const raw = result.data[0];
      const detailData = Array.isArray(raw) ? raw[0] : raw;
      if (!detailData) return false;

      const info = detailData.info || {};
      form.selected = typeof info.selected !== 'undefined' ? String(info.selected) : '0';
      const fatherInfo = safeParentInfo(info.father);
      form.father.name = fatherInfo.name;
      form.father.birth.year = fatherInfo.birth.year;
      form.father.birth.month = fatherInfo.birth.month;
      form.father.birth.day = fatherInfo.birth.day;
      form.father.death.year = fatherInfo.death.year;
      form.father.death.month = fatherInfo.death.month;
      form.father.death.day = fatherInfo.death.day;
      const motherInfo = safeParentInfo(info.mother);
      form.mother.name = motherInfo.name;
      form.mother.birth.year = motherInfo.birth.year;
      form.mother.birth.month = motherInfo.birth.month;
      form.mother.birth.day = motherInfo.birth.day;
      form.mother.death.year = motherInfo.death.year;
      form.mother.death.month = motherInfo.death.month;
      form.mother.death.day = motherInfo.death.day;
      form.bigTitle = info.bigTitle ?? '永垂千古';
      form.dateQingming = !!info.dateQingming;
      form.dateShowLunar = !!info.dateShowLunar;

      const rawLibei = Array.isArray(info.libei) && info.libei.length === 3
        ? (info.libei as any[]).map((x: any) => x == null ? '' : String(x)).slice(0, 3) as [string, string, string]
        : [String(currentYear), '', ''];
      form.libei = toStorageDate(rawLibei);

      form.names = safeNames(info.names);
      form.user = detailData.user || '';
      form.remark = detailData.remark || '';

      // 日期补零
      normalizeParentDates(form.father);
      normalizeParentDates(form.mother);

      // 同步到日期输入框
      fatherBirth.value = arrToDisplay([form.father.birth.year, form.father.birth.month, form.father.birth.day]);
      fatherDeath.value = arrToDisplay([form.father.death.year, form.father.death.month, form.father.death.day]);
      motherBirth.value = arrToDisplay([form.mother.birth.year, form.mother.birth.month, form.mother.birth.day]);
      motherDeath.value = arrToDisplay([form.mother.death.year, form.mother.death.month, form.mother.death.day]);

      if (form.dateQingming) {
        qingmingYear.value = form.libei[0] ?? String(currentYear);
      } else {
        libeiDate.value = arrToDisplay(form.libei);
        lastCustomLibei.value = [form.libei[0] ?? '', form.libei[1] ?? '', form.libei[2] ?? ''];
      }

      // 如果数据库有已保存的预览文案，返回它
      if (detailData.big || detailData.title || detailData.small) {
        return {
          title: detailData.title || '',
          big: detailData.big || '',
          small: detailData.small || '',
          date: detailData.date || '',
          birth: detailData.birth || '',
        };
      }
      return true;
    } catch (e) {
      ElMessage.error('获取详情失败');
      return false;
    }
  }

  // --- 碑文校验（返回警告列表，不阻止保存） ---
  function validateWarnings(): string[] {
    const warnings: string[] = [];
    const sel = form.selected;
    // 父亲生卒日期逻辑检查
    if (sel === '0' || sel === '1') {
      const fb = form.father.birth;
      const fd = form.father.death;
      if (fb.year && fd.year) {
        const birthNum = Number(fb.year) * 10000 + Number(fb.month || 0) * 100 + Number(fb.day || 0);
        const deathNum = Number(fd.year) * 10000 + Number(fd.month || 0) * 100 + Number(fd.day || 0);
        if (birthNum > deathNum) warnings.push('父亲出生日期晚于去世日期，请检查');
      }
    }
    // 母亲生卒日期逻辑检查
    if (sel === '0' || sel === '2') {
      const mb = form.mother.birth;
      const md = form.mother.death;
      if (mb.year && md.year) {
        const birthNum = Number(mb.year) * 10000 + Number(mb.month || 0) * 100 + Number(mb.day || 0);
        const deathNum = Number(md.year) * 10000 + Number(md.month || 0) * 100 + Number(md.day || 0);
        if (birthNum > deathNum) warnings.push('母亲出生日期晚于去世日期，请检查');
      }
    }
    // 名单排版提醒
    let totalNames = 0;
    for (let r = 0; r < form.names.length; r++) {
      const rowCount = form.names[r].filter(([, name]) => name?.trim()).length;
      totalNames += rowCount;
      if (rowCount > 8) warnings.push(`第${r + 1}排有 ${rowCount} 人，碑面空间有限请注意排版`);
    }
    if (form.names.length > 8) warnings.push(`名单共 ${form.names.length} 排，碑面空间有限请注意排版`);
    if (totalNames > 50) warnings.push(`名单共 ${totalNames} 人，碑面空间有限请注意排版`);

    return warnings;
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
    const res = await uniCloud.callFunction({
      name: 'order-update',
      data: payload,
    });
    if (res.result?.code !== 0) {
      throw new Error(res.result?.msg || '保存失败');
    }
    return res.result?.id;
  }

  // --- 草稿自动保存 ---
  const DRAFT_KEY = 'stele-draft';

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
    // 日期
    syncDatesToForm,
    // 校验
    validateWarnings,
    // 草稿
    saveDraft, loadDraft, clearDraft,
    // 预览
    buildPreview,
    // 数据回显
    fetchAndFill,
    // 保存
    buildSavePayload, doSave,
  };
}
