import type { OrderForm, ParentDate, QualityIssue, QualityResult } from '../../types/order';

function normalize(value: unknown): string { return typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/g, ' ') : ''; }
function issue(level: 'blocker'|'warning', code: string, field: string, message: string): QualityIssue { return { level, code, field, message }; }

function inspectDate(value: ParentDate, field: string, label: string, warnings: QualityIssue[]) {
  const parts = [normalize(value?.year), normalize(value?.month), normalize(value?.day)];
  const filled = parts.filter(Boolean).length;
  if (filled > 0 && filled < 3) { warnings.push(issue('warning', 'DATE_INCOMPLETE', field, `${label}日期不完整`)); return null; }
  if (filled === 0) return null;
  const [year, month, day] = parts.map(Number);
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    warnings.push(issue('warning', 'DATE_INVALID', field, `${label}日期无效`)); return null;
  }
  return year * 10000 + month * 100 + day;
}

export function checkSteleQuality(form: OrderForm): QualityResult {
  const blockers: QualityIssue[] = [], warnings: QualityIssue[] = [];
  const fatherApplies = form.selected === '0' || form.selected === '1';
  const motherApplies = form.selected === '0' || form.selected === '2';
  if (fatherApplies && !normalize(form.father?.name)) blockers.push(issue('blocker', 'FATHER_NAME_REQUIRED', 'father.name', '请填写父亲姓名'));
  if (motherApplies && !normalize(form.mother?.name)) blockers.push(issue('blocker', 'MOTHER_NAME_REQUIRED', 'mother.name', '请填写母亲姓名'));
  if (!normalize(form.bigTitle)) blockers.push(issue('blocker', 'BIG_TITLE_REQUIRED', 'bigTitle', '请填写横批'));

  let validNames = 0, nonEmptyRows = 0;
  const seen = new Set<string>();
  for (let rowIndex = 0; rowIndex < (Array.isArray(form.names) ? form.names.length : 0); rowIndex++) {
    const row = Array.isArray(form.names[rowIndex]) ? form.names[rowIndex] : [];
    let rowValid = 0, rowNonEmpty = false;
    for (let itemIndex = 0; itemIndex < row.length; itemIndex++) {
      const title = normalize(row[itemIndex]?.[0]), name = normalize(row[itemIndex]?.[1]);
      if (title || name) rowNonEmpty = true;
      if (!!title !== !!name) warnings.push(issue('warning', 'NAME_ITEM_INCOMPLETE', `names.${rowIndex}.${itemIndex}`, `第${rowIndex+1}排第${itemIndex+1}项称谓或姓名缺失`));
      if (!title || !name) continue;
      const key = `${title}::${name}`.toLocaleLowerCase();
      if (seen.has(key)) warnings.push(issue('warning', 'NAME_DUPLICATED', `names.${rowIndex}.${itemIndex}`, `名单中“${title} ${name}”重复`));
      seen.add(key); rowValid++; validNames++;
    }
    if (rowNonEmpty) nonEmptyRows++;
    if (rowValid > 8) warnings.push(issue('warning', 'ROW_NAME_LIMIT', `names.${rowIndex}`, `第${rowIndex+1}排有效姓名超过 8 人`));
  }
  if (validNames === 0) blockers.push(issue('blocker', 'VALID_NAME_REQUIRED', 'names', '请至少填写一项完整的称谓和姓名'));
  if (nonEmptyRows > 8) warnings.push(issue('warning', 'ROW_LIMIT', 'names', '非空名单超过 8 排'));
  if (validNames > 50) warnings.push(issue('warning', 'TOTAL_NAME_LIMIT', 'names', '有效姓名总数超过 50 人'));

  for (const [applies, parent, field, label] of [[fatherApplies, form.father, 'father', '父亲'], [motherApplies, form.mother, 'mother', '母亲']] as const) {
    if (!applies) continue;
    const birth = inspectDate(parent.birth, `${field}.birth`, `${label}出生`, warnings);
    const death = inspectDate(parent.death, `${field}.death`, `${label}去世`, warnings);
    if (birth !== null && death !== null && birth > death) warnings.push(issue('warning', 'LIFESPAN_REVERSED', field, `${label}生卒倒置`));
  }
  return { blockers, warnings, metrics: { validNames, nonEmptyRows } };
}
