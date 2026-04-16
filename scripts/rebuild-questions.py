# -*- coding: utf-8 -*-
"""
重建题库数据：只保留4/5/6单元，unit格式改为 2-X-Y（含课号）
"""
import json
import os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ---- 读取现有数据 ----
with open('static/data/pinyin.json', encoding='utf-8') as f:
    old_pinyin = json.load(f)
with open('static/data/strokes.json', encoding='utf-8') as f:
    old_strokes = json.load(f)

# 建索引 {char: entry}
pinyin_map = {e['char']: e for e in old_pinyin}
strokes_map = {e['char']: e for e in old_strokes}

# ---- 单元-课号-字表 定义 ----
unit_lessons = {
    # 第四单元
    '2-4-7': list('思床前地故乡'),
    '2-4-8': list('色把讲样笑再'),
    '2-4-9': list('节米间分吃肉'),
    '2-4-0': list('册支电衣'),
    # 第五单元
    '2-5-5': list('物造运欢房网'),
    '2-5-6': list('对今雪细夕语'),
    '2-5-7': list('打皮跑足沙包'),
    '2-5-8': list('近习远学玉义'),
    '2-5-0': list('饱抱'),
    # 第六单元
    '2-6-10': list('首池采尖角早'),
    '2-6-11': list('玩眼泪它贝气'),
    '2-6-12': list('机台唱伞朵美'),
    '2-6-13': list('这看鱼面问加'),
    '2-6-0': list('豆斗'),
}

# ---- 新字数据（不在现有数据中的字） ----
new_chars_data = {
    # ---- 第五单元新字 ----
    '物': {
        'pinyin': 'wù', 'radical': '牜', 'structure': '左右', 'strokeCount': 8,
        'distractors': ['wū', 'wú', 'wǔ'],
        'char_distractors': ['牛', '勿', '初'],
        'strokes': ['撇', '横', '竖', '提', '撇', '横折钩', '撇', '撇'],
    },
    '造': {
        'pinyin': 'zào', 'radical': '辶', 'structure': '半包围', 'strokeCount': 10,
        'distractors': ['cào', 'zǎo', 'zāo'],
        'char_distractors': ['告', '遭', '道'],
        'strokes': ['撇', '横', '竖', '横折', '横', '竖', '横', '点', '横折折撇', '捺'],
    },
    '运': {
        'pinyin': 'yùn', 'radical': '辶', 'structure': '半包围', 'strokeCount': 7,
        'distractors': ['yún', 'yūn', 'yǔn'],
        'char_distractors': ['云', '远', '连'],
        'strokes': ['横', '横', '撇折', '点', '点', '横折折撇', '捺'],
    },
    '欢': {
        'pinyin': 'huān', 'radical': '又', 'structure': '左右', 'strokeCount': 6,
        'distractors': ['huán', 'huǎn', 'huàn'],
        'char_distractors': ['次', '吹', '观'],
        'strokes': ['横撇', '点', '撇', '横撇', '撇', '捺'],
    },
    '房': {
        'pinyin': 'fáng', 'radical': '户', 'structure': '半包围', 'strokeCount': 8,
        'distractors': ['fāng', 'fǎng', 'fàng'],
        'char_distractors': ['方', '放', '防'],
        'strokes': ['点', '横折', '横', '撇', '点', '横', '横折钩', '撇'],
    },
    '网': {
        'pinyin': 'wǎng', 'radical': '冂', 'structure': '半包围', 'strokeCount': 6,
        'distractors': ['wáng', 'wāng', 'wàng'],
        'char_distractors': ['同', '冈', '往'],
        'strokes': ['竖', '横折钩', '撇', '点', '撇', '点'],
    },
    '对': {
        'pinyin': 'duì', 'radical': '寸', 'structure': '左右', 'strokeCount': 5,
        'distractors': ['duī', 'duí', 'duǐ'],
        'char_distractors': ['又', '寸', '村'],
        'strokes': ['横撇', '点', '横', '竖钩', '点'],
    },
    '今': {
        'pinyin': 'jīn', 'radical': '人', 'structure': '上下', 'strokeCount': 4,
        'distractors': ['jǐn', 'jìn', 'jín'],
        'char_distractors': ['令', '金', '全'],
        'strokes': ['撇', '捺', '点', '横撇'],
    },
    '细': {
        'pinyin': 'xì', 'radical': '纟', 'structure': '左右', 'strokeCount': 8,
        'distractors': ['xī', 'xí', 'xǐ'],
        'char_distractors': ['组', '红', '纸'],
        'strokes': ['撇折', '撇折', '提', '竖', '横折', '横', '竖', '横'],
    },
    '夕': {
        'pinyin': 'xī', 'radical': '夕', 'structure': '独体', 'strokeCount': 3,
        'distractors': ['xí', 'xǐ', 'xì'],
        'char_distractors': ['多', '外', '名'],
        'strokes': ['撇', '横撇', '点'],
    },
    '语': {
        'pinyin': 'yǔ', 'radical': '讠', 'structure': '左右', 'strokeCount': 9,
        'distractors': ['yū', 'yú', 'yù'],
        'char_distractors': ['话', '说', '许'],
        'strokes': ['点', '横折提', '横', '竖', '横折', '横', '竖', '横折', '横'],
    },
    '打': {
        'pinyin': 'dǎ', 'radical': '扌', 'structure': '左右', 'strokeCount': 5,
        'distractors': ['dā', 'dá', 'dà'],
        'char_distractors': ['丁', '订', '拍'],
        'strokes': ['横', '竖钩', '提', '横', '竖'],
    },
    '皮': {
        'pinyin': 'pí', 'radical': '皮', 'structure': '独体', 'strokeCount': 5,
        'distractors': ['pī', 'pǐ', 'pì'],
        'char_distractors': ['波', '披', '被'],
        'strokes': ['横钩', '撇', '竖', '横撇', '捺'],
    },
    '足': {
        'pinyin': 'zú', 'radical': '足', 'structure': '独体', 'strokeCount': 7,
        'distractors': ['zū', 'zǔ', 'zù'],
        'char_distractors': ['走', '是', '正'],
        'strokes': ['竖', '横折', '横', '竖', '横', '撇', '捺'],
    },
    '沙': {
        'pinyin': 'shā', 'radical': '氵', 'structure': '左右', 'strokeCount': 7,
        'distractors': ['shá', 'shǎ', 'shà'],
        'char_distractors': ['少', '砂', '纱'],
        'strokes': ['点', '点', '提', '竖', '撇', '点', '撇'],
    },
    '包': {
        'pinyin': 'bāo', 'radical': '勹', 'structure': '半包围', 'strokeCount': 5,
        'distractors': ['báo', 'bǎo', 'bào'],
        'char_distractors': ['饱', '抱', '跑'],
        'strokes': ['撇', '横折钩', '竖', '横折', '横'],
    },
    '习': {
        'pinyin': 'xí', 'radical': '乙', 'structure': '独体', 'strokeCount': 3,
        'distractors': ['xī', 'xǐ', 'xì'],
        'char_distractors': ['羽', '飞', '刁'],
        'strokes': ['横折钩', '点', '提'],
    },
    '学': {
        'pinyin': 'xué', 'radical': '子', 'structure': '上下', 'strokeCount': 8,
        'distractors': ['xuē', 'xuě', 'xuè'],
        'char_distractors': ['字', '写', '觉'],
        'strokes': ['点', '点', '撇', '点', '横撇', '竖', '横', '横'],
    },
    '玉': {
        'pinyin': 'yù', 'radical': '玉', 'structure': '独体', 'strokeCount': 5,
        'distractors': ['yū', 'yú', 'yǔ'],
        'char_distractors': ['王', '主', '宝'],
        'strokes': ['横', '横', '竖', '横', '点'],
    },
    '饱': {
        'pinyin': 'bǎo', 'radical': '饣', 'structure': '左右', 'strokeCount': 8,
        'distractors': ['bāo', 'báo', 'bào'],
        'char_distractors': ['包', '抱', '跑'],
        'strokes': ['撇', '横钩', '竖提', '撇', '横折钩', '竖', '横折', '横'],
    },
    '抱': {
        'pinyin': 'bào', 'radical': '扌', 'structure': '左右', 'strokeCount': 8,
        'distractors': ['bāo', 'báo', 'bǎo'],
        'char_distractors': ['包', '饱', '跑'],
        'strokes': ['横', '竖钩', '提', '撇', '横折钩', '竖', '横折', '横'],
    },
    # ---- 第六单元新字 ----
    '首': {
        'pinyin': 'shǒu', 'radical': '首', 'structure': '上下', 'strokeCount': 9,
        'distractors': ['shōu', 'shóu', 'shòu'],
        'char_distractors': ['手', '道', '自'],
        'strokes': ['点', '撇', '横', '横', '横', '撇', '竖', '横折', '横'],
    },
    '池': {
        'pinyin': 'chí', 'radical': '氵', 'structure': '左右', 'strokeCount': 6,
        'distractors': ['chī', 'chǐ', 'chì'],
        'char_distractors': ['地', '他', '她'],
        'strokes': ['点', '点', '提', '横折钩', '竖', '竖弯钩'],
    },
    '采': {
        'pinyin': 'cǎi', 'radical': '采', 'structure': '上下', 'strokeCount': 8,
        'distractors': ['cāi', 'cái', 'cài'],
        'char_distractors': ['彩', '菜', '踩'],
        'strokes': ['撇', '点', '点', '撇', '横', '竖', '撇', '捺'],
    },
    '尖': {
        'pinyin': 'jiān', 'radical': '小', 'structure': '上下', 'strokeCount': 6,
        'distractors': ['jiǎn', 'jiàn', 'jīn'],
        'char_distractors': ['小', '大', '尘'],
        'strokes': ['竖', '撇', '点', '横', '撇', '捺'],
    },
    '早': {
        'pinyin': 'zǎo', 'radical': '日', 'structure': '上下', 'strokeCount': 6,
        'distractors': ['zāo', 'záo', 'zào'],
        'char_distractors': ['草', '星', '日'],
        'strokes': ['竖', '横折', '横', '横', '横', '竖'],
    },
    '眼': {
        'pinyin': 'yǎn', 'radical': '目', 'structure': '左右', 'strokeCount': 11,
        'distractors': ['yān', 'yán', 'yàn'],
        'char_distractors': ['目', '看', '睛'],
        'strokes': ['竖', '横折', '横', '横', '横', '横折', '横', '横', '竖提', '撇', '捺'],
    },
    '泪': {
        'pinyin': 'lèi', 'radical': '氵', 'structure': '左右', 'strokeCount': 8,
        'distractors': ['lēi', 'léi', 'lěi'],
        'char_distractors': ['目', '泉', '泥'],
        'strokes': ['点', '点', '提', '竖', '横折', '横', '横', '横'],
    },
    '它': {
        'pinyin': 'tā', 'radical': '宀', 'structure': '上下', 'strokeCount': 5,
        'distractors': ['tà', 'tǎ', 'tá'],
        'char_distractors': ['他', '她', '宝'],
        'strokes': ['点', '点', '横撇', '撇', '竖弯钩'],
    },
    '贝': {
        'pinyin': 'bèi', 'radical': '贝', 'structure': '独体', 'strokeCount': 4,
        'distractors': ['bēi', 'béi', 'běi'],
        'char_distractors': ['见', '页', '目'],
        'strokes': ['竖', '横折', '撇', '点'],
    },
    '气': {
        'pinyin': 'qì', 'radical': '气', 'structure': '独体', 'strokeCount': 4,
        'distractors': ['qī', 'qí', 'qǐ'],
        'char_distractors': ['汽', '七', '乞'],
        'strokes': ['撇', '横', '横', '横折弯钩'],
    },
    # ---- 补充：原pinyin有但strokes缺失的字 ----
    '雪': {
        'pinyin': 'xuě', 'radical': '雨', 'structure': '上下', 'strokeCount': 11,
        'distractors': ['xuē', 'xué', 'xuè'],
        'char_distractors': ['雨', '雷', '霜'],
        'strokes': ['横', '点', '横撇', '竖', '点', '点', '点', '点', '横折', '横', '横'],
    },
    '跑': {
        'pinyin': 'pǎo', 'radical': '足', 'structure': '左右', 'strokeCount': 12,
        'distractors': ['pāo', 'páo', 'pào'],
        'char_distractors': ['泡', '炮', '抱'],
        'strokes': ['竖', '横折', '横', '竖', '横', '竖', '提', '撇', '横折钩', '横折', '横', '竖弯钩'],
    },
    '近': {
        'pinyin': 'jìn', 'radical': '辶', 'structure': '半包围', 'strokeCount': 7,
        'distractors': ['jīn', 'jín', 'jǐn'],
        'char_distractors': ['进', '远', '还'],
        'strokes': ['撇', '撇', '横', '竖', '点', '横折折撇', '捺'],
    },
    '远': {
        'pinyin': 'yuǎn', 'radical': '辶', 'structure': '半包围', 'strokeCount': 7,
        'distractors': ['yuān', 'yuán', 'yuàn'],
        'char_distractors': ['近', '运', '还'],
        'strokes': ['横', '横', '撇', '竖弯钩', '点', '横折折撇', '捺'],
    },
    '玩': {
        'pinyin': 'wán', 'radical': '王', 'structure': '左右', 'strokeCount': 8,
        'distractors': ['wān', 'wǎn', 'wàn'],
        'char_distractors': ['完', '院', '元'],
        'strokes': ['横', '横', '竖', '提', '横', '横', '撇', '竖弯钩'],
    },
}

# 收集被分配到4/5/6单元的字
assigned_chars = set()
for chars in unit_lessons.values():
    assigned_chars.update(chars)

# ---- 生成 pinyin.json ----
new_pinyin = []

# 先放4/5/6单元（按课文顺序）
for unit_key, chars in unit_lessons.items():
    for ch in chars:
        if ch in pinyin_map:
            entry = dict(pinyin_map[ch])
            entry.pop('type', None)
            entry['unit'] = unit_key
        elif ch in new_chars_data:
            nd = new_chars_data[ch]
            entry = {
                'char': ch,
                'pinyin': nd['pinyin'],
                'distractors': nd['distractors'],
                'char_distractors': nd['char_distractors'],
                'unit': unit_key,
                'radical': nd['radical'],
                'structure': nd['structure'],
                'strokeCount': nd['strokeCount'],
            }
        else:
            print(f"WARNING: missing data for char '{ch}'")
            continue
        new_pinyin.append(entry)

# 再放其他字（原2-0改为2-0-0）
for e in old_pinyin:
    if e['char'] not in assigned_chars and e.get('unit', '') in ('2-0', '2-0-0'):
        entry = dict(e)
        entry.pop('type', None)
        entry['unit'] = '2-0-0'
        new_pinyin.append(entry)

# ---- 生成 strokes.json ----
new_strokes = []

# 先放4/5/6单元
for unit_key, chars in unit_lessons.items():
    for ch in chars:
        if ch in strokes_map:
            entry = dict(strokes_map[ch])
            entry.pop('type', None)
            entry['unit'] = unit_key
        elif ch in new_chars_data:
            nd = new_chars_data[ch]
            entry = {
                'char': ch,
                'strokes': nd['strokes'],
                'strokeCount': nd['strokeCount'],
                'radical': nd['radical'],
                'structure': nd['structure'],
                'unit': unit_key,
            }
        else:
            print(f"WARNING: missing strokes data for char '{ch}'")
            continue
        new_strokes.append(entry)

# 再放其他字（原2-0改为2-0-0）
for e in old_strokes:
    if e['char'] not in assigned_chars and e.get('unit', '') in ('2-0', '2-0-0'):
        entry = dict(e)
        entry.pop('type', None)
        entry['unit'] = '2-0-0'
        new_strokes.append(entry)

# ---- 写文件 ----
with open('static/data/pinyin.json', 'w', encoding='utf-8') as f:
    json.dump(new_pinyin, f, ensure_ascii=False, indent=2)

with open('static/data/strokes.json', 'w', encoding='utf-8') as f:
    json.dump(new_strokes, f, ensure_ascii=False, indent=2)

# ---- 生成 seed-questions 云函数 ----
seed_data = []
for e in new_pinyin:
    entry = dict(e)
    entry['type'] = 'pinyin'
    seed_data.append(entry)
for e in new_strokes:
    entry = dict(e)
    entry['type'] = 'stroke'
    seed_data.append(entry)

seed_js_head = """'use strict'
const db = uniCloud.database()

const questionsData = """
seed_js_tail = """

async function seed() {
  if (questionsData.length === 0) {
    return { code: 1, msg: 'no data' }
  }
  console.log('开始上传 ' + questionsData.length + ' 道题目...')
  let added = 0
  let updated = 0
  let fail = 0
  for (const q of questionsData) {
    try {
      const existing = await db.collection('questions')
        .where({ type: q.type, char: q.char })
        .limit(1)
        .get()
      if (existing.data && existing.data.length > 0) {
        await db.collection('questions').doc(existing.data[0]._id).update(q)
        updated++
        continue
      }
      await db.collection('questions').add(q)
      added++
    } catch (e) {
      console.error('上传失败: ' + q.char, e)
      fail++
    }
  }
  console.log('上传完成：新增 ' + added + '，更新 ' + updated + '，失败 ' + fail)
  return { code: 0, msg: 'done', added, updated, fail }
}

exports.main = async (event, context) => {
  return await seed()
}
"""

seed_json = json.dumps(seed_data, ensure_ascii=False, indent=2)
seed_js = seed_js_head + seed_json + seed_js_tail

with open('uniCloud-alipay/cloudfunctions/seed-questions/index.js', 'w', encoding='utf-8') as f:
    f.write(seed_js)

print(f"seed-questions/index.js: {len(seed_data)} entries ({len(new_pinyin)} pinyin + {len(new_strokes)} stroke)")

# ---- 统计 ----
print(f"pinyin.json: {len(new_pinyin)} entries")
print(f"strokes.json: {len(new_strokes)} entries")

# 按单元统计
from collections import Counter
pc = Counter(e['unit'] for e in new_pinyin)
sc = Counter(e['unit'] for e in new_strokes)
print("\npinyin.json by unit:")
for k in sorted(pc.keys()):
    print(f"  {k}: {pc[k]}")
print("\nstrokes.json by unit:")
for k in sorted(sc.keys()):
    print(f"  {k}: {sc[k]}")

# 检查哪些字缺strokes数据
pinyin_chars = {e['char'] for e in new_pinyin}
strokes_chars = {e['char'] for e in new_strokes}
missing = pinyin_chars - strokes_chars
if missing:
    print(f"\nWARNING: chars in pinyin but not in strokes: {missing}")
extra = strokes_chars - pinyin_chars
if extra:
    print(f"\nWARNING: chars in strokes but not in pinyin: {extra}")
