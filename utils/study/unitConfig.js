// 单元-课程配置
export const UNIT_CONFIG = {
  '2-4': {
    label: '第四单元',
    lessons: [
      { key: '2-4-7', label: '阅读7' },
      { key: '2-4-8', label: '阅读8' },
      { key: '2-4-9', label: '阅读9' },
      { key: '2-4-0', label: '语文园地' },
    ]
  },
  '2-5': {
    label: '第五单元',
    lessons: [
      { key: '2-5-5', label: '识字5' },
      { key: '2-5-6', label: '识字6' },
      { key: '2-5-7', label: '识字7' },
      { key: '2-5-8', label: '识字8' },
      { key: '2-5-0', label: '语文园地' },
    ]
  },
  '2-6': {
    label: '第六单元',
    lessons: [
      { key: '2-6-10', label: '阅读10' },
      { key: '2-6-11', label: '阅读11' },
      { key: '2-6-12', label: '阅读12' },
      { key: '2-6-13', label: '阅读13' },
      { key: '2-6-0', label: '语文园地' },
    ]
  },
  '2-0': {
    label: '未分类',
    lessons: [
      { key: '2-0-0', label: '全部' },
    ]
  },
}

// 所有可用单元key
export const UNIT_KEYS = Object.keys(UNIT_CONFIG)

// 获取某个单元下所有课程key
export function getLessonKeys(unitKey) {
  return (UNIT_CONFIG[unitKey]?.lessons || []).map(l => l.key)
}
