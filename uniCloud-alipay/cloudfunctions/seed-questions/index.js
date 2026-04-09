'use strict'
const db = uniCloud.database()

const questionsData = [
  {
    "char": "入",
    "pinyin": "rù",
    "distractors": [
      "lù",
      "rǔ",
      "rū"
    ],
    "char_distractors": [
      "人",
      "八",
      "大"
    ],
    "unit": "2-1",
    "radical": "入",
    "structure": "独体",
    "strokeCount": 2,
    "type": "pinyin"
  },
  {
    "char": "花",
    "pinyin": "huā",
    "distractors": [
      "huà",
      "huá",
      "hā"
    ],
    "char_distractors": [
      "化",
      "画",
      "话"
    ],
    "unit": "2-1",
    "radical": "艹",
    "structure": "上下",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "鱼",
    "pinyin": "yú",
    "distractors": [
      "yǔ",
      "lú",
      "yū"
    ],
    "char_distractors": [
      "马",
      "鸟",
      "虫"
    ],
    "unit": "2-4",
    "radical": "鱼",
    "structure": "上下",
    "strokeCount": 8,
    "type": "pinyin"
  },
  {
    "char": "书",
    "pinyin": "shū",
    "distractors": [
      "shú",
      "sū",
      "shǔ"
    ],
    "char_distractors": [
      "本",
      "画",
      "写"
    ],
    "unit": "2-3",
    "radical": "乙",
    "structure": "独体",
    "strokeCount": 4,
    "type": "pinyin"
  },
  {
    "char": "文",
    "pinyin": "wén",
    "distractors": [
      "wèn",
      "wēn",
      "fén"
    ],
    "char_distractors": [
      "六",
      "大",
      "字"
    ],
    "unit": "2-1",
    "radical": "文",
    "structure": "独体",
    "strokeCount": 4,
    "type": "pinyin"
  },
  {
    "char": "把",
    "pinyin": "bǎ",
    "distractors": [
      "bā",
      "pǎ",
      "bà"
    ],
    "char_distractors": [
      "巴",
      "吧",
      "爸"
    ],
    "unit": "2-5",
    "radical": "扌",
    "structure": "左右",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "的",
    "pinyin": "de",
    "distractors": [
      "dē",
      "dì",
      "dí"
    ],
    "char_distractors": [
      "地",
      "白",
      "目"
    ],
    "unit": "2-2",
    "radical": "白",
    "structure": "左右",
    "strokeCount": 8,
    "type": "pinyin"
  },
  {
    "char": "地",
    "pinyin": "dì",
    "distractors": [
      "de",
      "dī",
      "tì"
    ],
    "char_distractors": [
      "的",
      "土",
      "田"
    ],
    "unit": "2-5",
    "radical": "土",
    "structure": "左右",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "春",
    "pinyin": "chūn",
    "distractors": [
      "chún",
      "cūn",
      "chǔn"
    ],
    "char_distractors": [
      "冬",
      "秋",
      "雪"
    ],
    "unit": "2-1",
    "radical": "日",
    "structure": "上下",
    "strokeCount": 9,
    "type": "pinyin"
  },
  {
    "char": "冬",
    "pinyin": "dōng",
    "distractors": [
      "dòng",
      "tōng",
      "dǒng"
    ],
    "char_distractors": [
      "春",
      "秋",
      "风"
    ],
    "unit": "2-1",
    "radical": "夂",
    "structure": "上下",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "雪",
    "pinyin": "xuě",
    "distractors": [
      "xuē",
      "xuè",
      "xué"
    ],
    "char_distractors": [
      "雨",
      "云",
      "冬"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "飞",
    "pinyin": "fēi",
    "distractors": [
      "féi",
      "fěi",
      "fèi"
    ],
    "char_distractors": [
      "风",
      "鸟",
      "气"
    ],
    "unit": "2-1",
    "radical": "—",
    "structure": "独体",
    "strokeCount": 3,
    "type": "pinyin"
  },
  {
    "char": "吃",
    "pinyin": "chī",
    "distractors": [
      "chì",
      "cī",
      "chǐ"
    ],
    "char_distractors": [
      "叫",
      "口",
      "呢"
    ],
    "unit": "2-4",
    "radical": "口",
    "structure": "左右",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "叫",
    "pinyin": "jiào",
    "distractors": [
      "jiāo",
      "jiǎo",
      "qiào"
    ],
    "char_distractors": [
      "吃",
      "口",
      "叶"
    ],
    "unit": "2-3",
    "radical": "口",
    "structure": "左右",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "走",
    "pinyin": "zǒu",
    "distractors": [
      "zōu",
      "zòu",
      "cǒu"
    ],
    "char_distractors": [
      "足",
      "跑",
      "是"
    ],
    "unit": "2-3",
    "radical": "走",
    "structure": "上下",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "跑",
    "pinyin": "pǎo",
    "distractors": [
      "páo",
      "bǎo",
      "pào"
    ],
    "char_distractors": [
      "走",
      "足",
      "路"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "也",
    "pinyin": "yě",
    "distractors": [
      "yē",
      "yè",
      "yé"
    ],
    "char_distractors": [
      "他",
      "她",
      "地"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "他",
    "pinyin": "tā",
    "distractors": [
      "tà",
      "dā",
      "tǎ"
    ],
    "char_distractors": [
      "她",
      "也",
      "们"
    ],
    "unit": "2-3",
    "radical": "亻",
    "structure": "左右",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "她",
    "pinyin": "tā",
    "distractors": [
      "tà",
      "dā",
      "tǎ"
    ],
    "char_distractors": [
      "他",
      "也",
      "妈"
    ],
    "unit": "2-7",
    "radical": "女",
    "structure": "左右",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "说",
    "pinyin": "shuō",
    "distractors": [
      "shuò",
      "suō",
      "shuó"
    ],
    "char_distractors": [
      "话",
      "请",
      "讲"
    ],
    "unit": "2-3",
    "radical": "讠",
    "structure": "左右",
    "strokeCount": 9,
    "type": "pinyin"
  },
  {
    "char": "话",
    "pinyin": "huà",
    "distractors": [
      "huā",
      "huá",
      "huǎ"
    ],
    "char_distractors": [
      "说",
      "讲",
      "花"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "你",
    "pinyin": "nǐ",
    "distractors": [
      "ní",
      "nī",
      "lǐ"
    ],
    "char_distractors": [
      "他",
      "她",
      "们"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "们",
    "pinyin": "men",
    "distractors": [
      "mén",
      "mēn",
      "mèn"
    ],
    "char_distractors": [
      "你",
      "他",
      "她"
    ],
    "unit": "2-3",
    "radical": "亻",
    "structure": "左右",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "红",
    "pinyin": "hóng",
    "distractors": [
      "hōng",
      "hǒng",
      "gōng"
    ],
    "char_distractors": [
      "绿",
      "纸",
      "细"
    ],
    "unit": "2-1",
    "radical": "纟",
    "structure": "左右",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "绿",
    "pinyin": "lǜ",
    "distractors": [
      "lǚ",
      "lū",
      "lù"
    ],
    "char_distractors": [
      "红",
      "色",
      "草"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "色",
    "pinyin": "sè",
    "distractors": [
      "sē",
      "shè",
      "cè"
    ],
    "char_distractors": [
      "巴",
      "红",
      "绿"
    ],
    "unit": "2-5",
    "radical": "色",
    "structure": "上下",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "听",
    "pinyin": "tīng",
    "distractors": [
      "tíng",
      "tǐng",
      "dīng"
    ],
    "char_distractors": [
      "说",
      "口",
      "叫"
    ],
    "unit": "2-6",
    "radical": "口",
    "structure": "左右",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "远",
    "pinyin": "yuǎn",
    "distractors": [
      "yuán",
      "yuàn",
      "yuān"
    ],
    "char_distractors": [
      "近",
      "还",
      "运"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "近",
    "pinyin": "jìn",
    "distractors": [
      "jīn",
      "jǐn",
      "qìn"
    ],
    "char_distractors": [
      "远",
      "还",
      "进"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "还",
    "pinyin": "hái",
    "distractors": [
      "huán",
      "hāi",
      "hǎi"
    ],
    "char_distractors": [
      "远",
      "近",
      "不"
    ],
    "unit": "2-7",
    "radical": "辶",
    "structure": "半包围",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "来",
    "pinyin": "lái",
    "distractors": [
      "lāi",
      "lǎi",
      "lài"
    ],
    "char_distractors": [
      "去",
      "大",
      "米"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "去",
    "pinyin": "qù",
    "distractors": [
      "qū",
      "qǔ",
      "jù"
    ],
    "char_distractors": [
      "来",
      "走",
      "土"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "多",
    "pinyin": "duō",
    "distractors": [
      "duǒ",
      "duò",
      "tuō"
    ],
    "char_distractors": [
      "少",
      "大",
      "小"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "爸",
    "pinyin": "bà",
    "distractors": [
      "bā",
      "pà",
      "bǎ"
    ],
    "char_distractors": [
      "妈",
      "把",
      "巴"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "妈",
    "pinyin": "mā",
    "distractors": [
      "má",
      "mǎ",
      "mà"
    ],
    "char_distractors": [
      "爸",
      "她",
      "好"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "全",
    "pinyin": "quán",
    "distractors": [
      "quān",
      "quǎn",
      "juán"
    ],
    "char_distractors": [
      "会",
      "合",
      "回"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "回",
    "pinyin": "huí",
    "distractors": [
      "huī",
      "huǐ",
      "huì"
    ],
    "char_distractors": [
      "口",
      "会",
      "全"
    ],
    "unit": "2-3",
    "radical": "口",
    "structure": "全包围",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "会",
    "pinyin": "huì",
    "distractors": [
      "huī",
      "huí",
      "kuì"
    ],
    "char_distractors": [
      "回",
      "全",
      "合"
    ],
    "unit": "2-2",
    "radical": "人",
    "structure": "上下",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "工",
    "pinyin": "gōng",
    "distractors": [
      "gòng",
      "kōng",
      "gǒng"
    ],
    "char_distractors": [
      "土",
      "王",
      "左"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "机",
    "pinyin": "jī",
    "distractors": [
      "jì",
      "qī",
      "jǐ"
    ],
    "char_distractors": [
      "几",
      "木",
      "本"
    ],
    "unit": "2-4",
    "radical": "木",
    "structure": "左右",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "几",
    "pinyin": "jǐ",
    "distractors": [
      "jī",
      "jì",
      "qǐ"
    ],
    "char_distractors": [
      "机",
      "九",
      "风"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "用",
    "pinyin": "yòng",
    "distractors": [
      "yōng",
      "yǒng",
      "rǒng"
    ],
    "char_distractors": [
      "月",
      "田",
      "目"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "问",
    "pinyin": "wèn",
    "distractors": [
      "wēn",
      "wěn",
      "mèn"
    ],
    "char_distractors": [
      "门",
      "间",
      "闻"
    ],
    "unit": "2-4",
    "radical": "门",
    "structure": "半包围",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "有",
    "pinyin": "yǒu",
    "distractors": [
      "yōu",
      "yòu",
      "yóu"
    ],
    "char_distractors": [
      "右",
      "友",
      "又"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "半",
    "pinyin": "bàn",
    "distractors": [
      "bān",
      "pàn",
      "bǎn"
    ],
    "char_distractors": [
      "牛",
      "羊",
      "午"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "从",
    "pinyin": "cóng",
    "distractors": [
      "cōng",
      "cǒng",
      "zòng"
    ],
    "char_distractors": [
      "人",
      "众",
      "入"
    ],
    "unit": "2-3",
    "radical": "人",
    "structure": "左右",
    "strokeCount": 4,
    "type": "pinyin"
  },
  {
    "char": "主",
    "pinyin": "zhǔ",
    "distractors": [
      "zhū",
      "zhù",
      "chǔ"
    ],
    "char_distractors": [
      "住",
      "王",
      "玉"
    ],
    "unit": "2-2",
    "radical": "一",
    "structure": "独体",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "住",
    "pinyin": "zhù",
    "distractors": [
      "zhū",
      "zhǔ",
      "chù"
    ],
    "char_distractors": [
      "主",
      "往",
      "注"
    ],
    "unit": "2-2",
    "radical": "亻",
    "structure": "左右",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "江",
    "pinyin": "jiāng",
    "distractors": [
      "jiàng",
      "qiāng",
      "jiǎng"
    ],
    "char_distractors": [
      "河",
      "湖",
      "工"
    ],
    "unit": "2-2",
    "radical": "氵",
    "structure": "左右",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "河",
    "pinyin": "hé",
    "distractors": [
      "hē",
      "hě",
      "gé"
    ],
    "char_distractors": [
      "江",
      "湖",
      "何"
    ],
    "unit": "2-3",
    "radical": "氵",
    "structure": "左右",
    "strokeCount": 8,
    "type": "pinyin"
  },
  {
    "char": "请",
    "pinyin": "qǐng",
    "distractors": [
      "qīng",
      "qìng",
      "jǐng"
    ],
    "char_distractors": [
      "情",
      "清",
      "晴"
    ],
    "unit": "2-1",
    "radical": "讠",
    "structure": "左右",
    "strokeCount": 10,
    "type": "pinyin"
  },
  {
    "char": "情",
    "pinyin": "qíng",
    "distractors": [
      "qīng",
      "jíng",
      "qǐng"
    ],
    "char_distractors": [
      "青",
      "清",
      "晴"
    ],
    "unit": "2-1",
    "radical": "忄",
    "structure": "左右",
    "strokeCount": 11,
    "type": "pinyin"
  },
  {
    "char": "生",
    "pinyin": "shēng",
    "distractors": [
      "shèng",
      "sēng",
      "shěng"
    ],
    "char_distractors": [
      "牛",
      "主",
      "王"
    ],
    "unit": "2-1",
    "radical": "—",
    "structure": "独体",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "里",
    "pinyin": "lǐ",
    "distractors": [
      "lī",
      "lì",
      "rǐ"
    ],
    "char_distractors": [
      "田",
      "目",
      "果"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "果",
    "pinyin": "guǒ",
    "distractors": [
      "guō",
      "guò",
      "kuǒ"
    ],
    "char_distractors": [
      "里",
      "田",
      "木"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "玩",
    "pinyin": "wán",
    "distractors": [
      "wān",
      "wǎn",
      "huán"
    ],
    "char_distractors": [
      "王",
      "完",
      "元"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "很",
    "pinyin": "hěn",
    "distractors": [
      "hēn",
      "hèn",
      "gěn"
    ],
    "char_distractors": [
      "根",
      "跟",
      "恨"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "当",
    "pinyin": "dāng",
    "distractors": [
      "dàng",
      "tāng",
      "dǎng"
    ],
    "char_distractors": [
      "尚",
      "常",
      "堂"
    ],
    "unit": "2-3",
    "radical": "彐",
    "structure": "上下",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "音",
    "pinyin": "yīn",
    "distractors": [
      "yín",
      "yǐn",
      "yìn"
    ],
    "char_distractors": [
      "立",
      "意",
      "暗"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "讲",
    "pinyin": "jiǎng",
    "distractors": [
      "jiāng",
      "jiàng",
      "qiǎng"
    ],
    "char_distractors": [
      "说",
      "话",
      "请"
    ],
    "unit": "2-5",
    "radical": "讠",
    "structure": "左右",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "许",
    "pinyin": "xǔ",
    "distractors": [
      "xū",
      "xù",
      "chǔ"
    ],
    "char_distractors": [
      "午",
      "牛",
      "计"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "思",
    "pinyin": "sī",
    "distractors": [
      "sì",
      "shī",
      "sǐ"
    ],
    "char_distractors": [
      "心",
      "想",
      "息"
    ],
    "unit": "2-5",
    "radical": "田",
    "structure": "上下",
    "strokeCount": 9,
    "type": "pinyin"
  },
  {
    "char": "床",
    "pinyin": "chuáng",
    "distractors": [
      "chuāng",
      "chuǎng",
      "zhuáng"
    ],
    "char_distractors": [
      "广",
      "庄",
      "窗"
    ],
    "unit": "2-5",
    "radical": "广",
    "structure": "半包围",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "前",
    "pinyin": "qián",
    "distractors": [
      "qiān",
      "qiǎn",
      "jiān"
    ],
    "char_distractors": [
      "后",
      "月",
      "门"
    ],
    "unit": "2-5",
    "radical": "刂",
    "structure": "上下",
    "strokeCount": 9,
    "type": "pinyin"
  },
  {
    "char": "光",
    "pinyin": "guāng",
    "distractors": [
      "guàng",
      "kuāng",
      "guǎng"
    ],
    "char_distractors": [
      "火",
      "大",
      "先"
    ],
    "unit": "2-2",
    "radical": "小",
    "structure": "上下",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "低",
    "pinyin": "dī",
    "distractors": [
      "dí",
      "dǐ",
      "tī"
    ],
    "char_distractors": [
      "你",
      "他",
      "住"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "故",
    "pinyin": "gù",
    "distractors": [
      "gū",
      "gǔ",
      "kù"
    ],
    "char_distractors": [
      "做",
      "古",
      "放"
    ],
    "unit": "2-5",
    "radical": "攵",
    "structure": "左右",
    "strokeCount": 9,
    "type": "pinyin"
  },
  {
    "char": "乡",
    "pinyin": "xiāng",
    "distractors": [
      "xiáng",
      "xiǎng",
      "xiàng"
    ],
    "char_distractors": [
      "香",
      "向",
      "多"
    ],
    "unit": "2-5",
    "radical": "—",
    "structure": "独体",
    "strokeCount": 3,
    "type": "pinyin"
  },
  {
    "char": "午",
    "pinyin": "wǔ",
    "distractors": [
      "wū",
      "wù",
      "hǔ"
    ],
    "char_distractors": [
      "牛",
      "半",
      "许"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "节",
    "pinyin": "jié",
    "distractors": [
      "jiē",
      "jiě",
      "qié"
    ],
    "char_distractors": [
      "草",
      "花",
      "叶"
    ],
    "unit": "2-4",
    "radical": "艹",
    "structure": "上下",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "叶",
    "pinyin": "yè",
    "distractors": [
      "yē",
      "yě",
      "yué"
    ],
    "char_distractors": [
      "草",
      "花",
      "节"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "快",
    "pinyin": "kuài",
    "distractors": [
      "kuāi",
      "guài",
      "kuǎi"
    ],
    "char_distractors": [
      "乐",
      "块",
      "决"
    ],
    "unit": "2-3",
    "radical": "忄",
    "structure": "左右",
    "strokeCount": 7,
    "type": "pinyin"
  },
  {
    "char": "乐",
    "pinyin": "lè",
    "distractors": [
      "lē",
      "yuè",
      "lě"
    ],
    "char_distractors": [
      "快",
      "了",
      "子"
    ],
    "unit": "2-3",
    "radical": "丿",
    "structure": "独体",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "吹",
    "pinyin": "chuī",
    "radical": "口",
    "structure": "左右",
    "strokeCount": 7,
    "distractors": [
      "cuī",
      "chuí",
      "chūi"
    ],
    "char_distractors": [
      "叫",
      "呢",
      "口"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "姓",
    "pinyin": "xìng",
    "radical": "女",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "xíng",
      "shèng",
      "xǐng"
    ],
    "char_distractors": [
      "性",
      "星",
      "牲"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "什",
    "pinyin": "shén",
    "radical": "亻",
    "structure": "左右",
    "strokeCount": 4,
    "distractors": [
      "shēn",
      "shěn",
      "shèn"
    ],
    "char_distractors": [
      "十",
      "计",
      "仁"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "么",
    "pinyin": "me",
    "radical": "丿",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "mē",
      "mó",
      "má"
    ],
    "char_distractors": [
      "公",
      "多",
      "少"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "古",
    "pinyin": "gǔ",
    "radical": "十",
    "structure": "上下",
    "strokeCount": 5,
    "distractors": [
      "gū",
      "gù",
      "kǔ"
    ],
    "char_distractors": [
      "故",
      "苦",
      "胡"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "胡",
    "pinyin": "hú",
    "radical": "月",
    "structure": "左右",
    "strokeCount": 9,
    "distractors": [
      "hū",
      "hǔ",
      "hù"
    ],
    "char_distractors": [
      "古",
      "湖",
      "葫"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "双",
    "pinyin": "shuāng",
    "radical": "又",
    "structure": "左右",
    "strokeCount": 4,
    "distractors": [
      "shuàng",
      "chuāng",
      "shuǎng"
    ],
    "char_distractors": [
      "对",
      "又",
      "欢"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "言",
    "pinyin": "yán",
    "radical": "—",
    "structure": "独体",
    "strokeCount": 7,
    "distractors": [
      "yǎn",
      "yàn",
      "yān"
    ],
    "char_distractors": [
      "语",
      "说",
      "话"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "青",
    "pinyin": "qīng",
    "radical": "青",
    "structure": "上下",
    "strokeCount": 8,
    "distractors": [
      "qíng",
      "jīng",
      "qǐng"
    ],
    "char_distractors": [
      "清",
      "晴",
      "情"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "清",
    "pinyin": "qīng",
    "radical": "氵",
    "structure": "左右",
    "strokeCount": 11,
    "distractors": [
      "qíng",
      "jīng",
      "qǐng"
    ],
    "char_distractors": [
      "青",
      "晴",
      "情"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "晴",
    "pinyin": "qíng",
    "radical": "日",
    "structure": "左右",
    "strokeCount": 12,
    "distractors": [
      "qīng",
      "jíng",
      "qǐng"
    ],
    "char_distractors": [
      "青",
      "清",
      "情"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "字",
    "pinyin": "zì",
    "radical": "宀",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "zī",
      "cì",
      "zǐ"
    ],
    "char_distractors": [
      "子",
      "学",
      "宇"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "动",
    "pinyin": "dòng",
    "radical": "力",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "dōng",
      "tòng",
      "dǒng"
    ],
    "char_distractors": [
      "功",
      "力",
      "助"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "万",
    "pinyin": "wàn",
    "radical": "一",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "wān",
      "wǎn",
      "mán"
    ],
    "char_distractors": [
      "方",
      "千",
      "百"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "无",
    "pinyin": "wú",
    "radical": "一",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "wū",
      "wǔ",
      "wù"
    ],
    "char_distractors": [
      "天",
      "元",
      "五"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "明",
    "pinyin": "míng",
    "radical": "日",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "mīng",
      "mǐng",
      "míng"
    ],
    "char_distractors": [
      "朋",
      "阳",
      "晴"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "卡",
    "pinyin": "kǎ",
    "radical": "卜",
    "structure": "上下",
    "strokeCount": 5,
    "distractors": [
      "kā",
      "kà",
      "gǎ"
    ],
    "char_distractors": [
      "下",
      "不",
      "半"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "片",
    "pinyin": "piàn",
    "radical": "片",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "piān",
      "biàn",
      "piǎn"
    ],
    "char_distractors": [
      "版",
      "牌",
      "爿"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "合",
    "pinyin": "hé",
    "radical": "人",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "gé",
      "hē",
      "hě"
    ],
    "char_distractors": [
      "会",
      "全",
      "回"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "共",
    "pinyin": "gòng",
    "radical": "八",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "gōng",
      "gǒng",
      "kòng"
    ],
    "char_distractors": [
      "工",
      "公",
      "供"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "产",
    "pinyin": "chǎn",
    "radical": "立",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "chān",
      "chàn",
      "shǎn"
    ],
    "char_distractors": [
      "生",
      "厂",
      "广"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "太",
    "pinyin": "tài",
    "radical": "大",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "tāi",
      "dài",
      "tǎi"
    ],
    "char_distractors": [
      "大",
      "天",
      "犬"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "阳",
    "pinyin": "yáng",
    "radical": "阝",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "yāng",
      "yǎng",
      "yàng"
    ],
    "char_distractors": [
      "阴",
      "阵",
      "防"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "井",
    "pinyin": "jǐng",
    "radical": "一",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "jīng",
      "jìng",
      "qǐng"
    ],
    "char_distractors": [
      "开",
      "升",
      "天"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "方",
    "pinyin": "fāng",
    "radical": "方",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "fáng",
      "fǎng",
      "pāng"
    ],
    "char_distractors": [
      "万",
      "放",
      "房"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "后",
    "pinyin": "hòu",
    "radical": "口",
    "structure": "半包围",
    "strokeCount": 6,
    "distractors": [
      "hōu",
      "hǒu",
      "gòu"
    ],
    "char_distractors": [
      "向",
      "同",
      "合"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "高",
    "pinyin": "gāo",
    "radical": "高",
    "structure": "独体",
    "strokeCount": 10,
    "distractors": [
      "gào",
      "hāo",
      "gǎo"
    ],
    "char_distractors": [
      "亮",
      "京",
      "商"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "北",
    "pinyin": "běi",
    "radical": "匕",
    "structure": "左右",
    "strokeCount": 5,
    "distractors": [
      "bēi",
      "bèi",
      "pěi"
    ],
    "char_distractors": [
      "比",
      "此",
      "化"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "京",
    "pinyin": "jīng",
    "radical": "亠",
    "structure": "上下",
    "strokeCount": 8,
    "distractors": [
      "jìng",
      "qīng",
      "jǐng"
    ],
    "char_distractors": [
      "高",
      "亮",
      "景"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "广",
    "pinyin": "guǎng",
    "radical": "广",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "guāng",
      "guàng",
      "kuǎng"
    ],
    "char_distractors": [
      "厂",
      "庄",
      "广"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "写",
    "pinyin": "xiě",
    "radical": "冖",
    "structure": "上下",
    "strokeCount": 5,
    "distractors": [
      "xiē",
      "xiè",
      "xié"
    ],
    "char_distractors": [
      "字",
      "与",
      "马"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "认",
    "pinyin": "rèn",
    "radical": "讠",
    "structure": "左右",
    "strokeCount": 4,
    "distractors": [
      "rēn",
      "rěn",
      "lèn"
    ],
    "char_distractors": [
      "让",
      "讲",
      "说"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "让",
    "pinyin": "ràng",
    "radical": "讠",
    "structure": "左右",
    "strokeCount": 5,
    "distractors": [
      "rāng",
      "rǎng",
      "làng"
    ],
    "char_distractors": [
      "认",
      "讲",
      "请"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "自",
    "pinyin": "zì",
    "radical": "自",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "zī",
      "cì",
      "zǐ"
    ],
    "char_distractors": [
      "白",
      "目",
      "百"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "已",
    "pinyin": "yǐ",
    "radical": "已",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "yī",
      "yì",
      "jǐ"
    ],
    "char_distractors": [
      "己",
      "巳",
      "也"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "好",
    "pinyin": "hǎo",
    "radical": "女",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "hāo",
      "hào",
      "hǎo"
    ],
    "char_distractors": [
      "如",
      "妈",
      "她"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "画",
    "pinyin": "huà",
    "radical": "一",
    "structure": "半包围",
    "strokeCount": 8,
    "distractors": [
      "huā",
      "huǎ",
      "guà"
    ],
    "char_distractors": [
      "书",
      "花",
      "话"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "毛",
    "pinyin": "máo",
    "radical": "毛",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "māo",
      "mǎo",
      "mào"
    ],
    "char_distractors": [
      "手",
      "牛",
      "尾"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "台",
    "pinyin": "tái",
    "radical": "口",
    "structure": "上下",
    "strokeCount": 5,
    "distractors": [
      "tāi",
      "tǎi",
      "dái"
    ],
    "char_distractors": [
      "合",
      "右",
      "石"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "唱",
    "pinyin": "chàng",
    "radical": "口",
    "structure": "左右",
    "strokeCount": 11,
    "distractors": [
      "chāng",
      "chǎng",
      "cháng"
    ],
    "char_distractors": [
      "口",
      "吹",
      "叫"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "伞",
    "pinyin": "sǎn",
    "radical": "人",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "sān",
      "sàn",
      "shǎn"
    ],
    "char_distractors": [
      "全",
      "合",
      "企"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "朵",
    "pinyin": "duǒ",
    "radical": "几",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "duō",
      "duò",
      "tuǒ"
    ],
    "char_distractors": [
      "花",
      "果",
      "木"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "美",
    "pinyin": "měi",
    "radical": "羊",
    "structure": "上下",
    "strokeCount": 9,
    "distractors": [
      "méi",
      "mēi",
      "mèi"
    ],
    "char_distractors": [
      "羊",
      "半",
      "丽"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "这",
    "pinyin": "zhè",
    "radical": "辶",
    "structure": "半包围",
    "strokeCount": 7,
    "distractors": [
      "zhē",
      "zhě",
      "zè"
    ],
    "char_distractors": [
      "过",
      "还",
      "进"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "看",
    "pinyin": "kàn",
    "radical": "手",
    "structure": "半包围",
    "strokeCount": 9,
    "distractors": [
      "kān",
      "kǎn",
      "gàn"
    ],
    "char_distractors": [
      "着",
      "见",
      "目"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "面",
    "pinyin": "miàn",
    "radical": "面",
    "structure": "独体",
    "strokeCount": 9,
    "distractors": [
      "miǎn",
      "biàn",
      "miān"
    ],
    "char_distractors": [
      "目",
      "自",
      "田"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "加",
    "pinyin": "jiā",
    "radical": "力",
    "structure": "左右",
    "strokeCount": 5,
    "distractors": [
      "jiǎ",
      "gā",
      "jiá"
    ],
    "char_distractors": [
      "力",
      "办",
      "功"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "豆",
    "pinyin": "dòu",
    "radical": "豆",
    "structure": "独体",
    "strokeCount": 7,
    "distractors": [
      "dōu",
      "tòu",
      "dǒu"
    ],
    "char_distractors": [
      "头",
      "斗",
      "互"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "斗",
    "pinyin": "dǒu",
    "radical": "斗",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "dōu",
      "dòu",
      "tǒu"
    ],
    "char_distractors": [
      "豆",
      "头",
      "升"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "米",
    "pinyin": "mǐ",
    "radical": "米",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "mī",
      "mì",
      "nǐ"
    ],
    "char_distractors": [
      "木",
      "禾",
      "来"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "间",
    "pinyin": "jiān",
    "radical": "门",
    "structure": "半包围",
    "strokeCount": 7,
    "distractors": [
      "jiǎn",
      "jiàn",
      "qiān"
    ],
    "char_distractors": [
      "门",
      "问",
      "闻"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "分",
    "pinyin": "fēn",
    "radical": "八",
    "structure": "上下",
    "strokeCount": 4,
    "distractors": [
      "fèn",
      "fěn",
      "fān"
    ],
    "char_distractors": [
      "八",
      "公",
      "半"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "肉",
    "pinyin": "ròu",
    "radical": "肉",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "rōu",
      "lòu",
      "ròng"
    ],
    "char_distractors": [
      "月",
      "内",
      "门"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "止",
    "pinyin": "zhǐ",
    "radical": "止",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "zhī",
      "zhì",
      "cǐ"
    ],
    "char_distractors": [
      "正",
      "步",
      "此"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "斤",
    "pinyin": "jīn",
    "radical": "斤",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "jìn",
      "jǐn",
      "qīn"
    ],
    "char_distractors": [
      "斗",
      "片",
      "近"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "寸",
    "pinyin": "cùn",
    "radical": "寸",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "cūn",
      "cǔn",
      "sùn"
    ],
    "char_distractors": [
      "才",
      "对",
      "村"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "千",
    "pinyin": "qiān",
    "radical": "十",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "qiǎn",
      "qiàn",
      "gān"
    ],
    "char_distractors": [
      "十",
      "万",
      "干"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "元",
    "pinyin": "yuán",
    "radical": "一",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "yuǎn",
      "yuàn",
      "yuān"
    ],
    "char_distractors": [
      "无",
      "天",
      "云"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "样",
    "pinyin": "yàng",
    "radical": "木",
    "structure": "左右",
    "strokeCount": 10,
    "distractors": [
      "yāng",
      "yǎng",
      "xiàng"
    ],
    "char_distractors": [
      "林",
      "杨",
      "标"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "笑",
    "pinyin": "xiào",
    "radical": "竹",
    "structure": "上下",
    "strokeCount": 10,
    "distractors": [
      "xiāo",
      "xiǎo",
      "shào"
    ],
    "char_distractors": [
      "哭",
      "乐",
      "竹"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "再",
    "pinyin": "zài",
    "radical": "一",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "zāi",
      "zǎi",
      "cài"
    ],
    "char_distractors": [
      "在",
      "有",
      "又"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "课",
    "pinyin": "kè",
    "radical": "讠",
    "structure": "左右",
    "strokeCount": 10,
    "distractors": [
      "kē",
      "kě",
      "gè"
    ],
    "char_distractors": [
      "读",
      "说",
      "话"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "坐",
    "pinyin": "zuò",
    "radical": "土",
    "structure": "独体",
    "strokeCount": 7,
    "distractors": [
      "zuō",
      "zuǒ",
      "cuò"
    ],
    "char_distractors": [
      "座",
      "左",
      "在"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "老",
    "pinyin": "lǎo",
    "radical": "老",
    "structure": "半包围",
    "strokeCount": 6,
    "distractors": [
      "lāo",
      "lào",
      "nǎo"
    ],
    "char_distractors": [
      "考",
      "教",
      "师"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "师",
    "pinyin": "shī",
    "radical": "巾",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "shì",
      "sī",
      "shǐ"
    ],
    "char_distractors": [
      "老",
      "帅",
      "市"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "国",
    "pinyin": "guó",
    "radical": "囗",
    "structure": "全包围",
    "strokeCount": 8,
    "distractors": [
      "guō",
      "guǒ",
      "kuó"
    ],
    "char_distractors": [
      "回",
      "园",
      "因"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "都",
    "pinyin": "dōu",
    "radical": "阝",
    "structure": "左右",
    "strokeCount": 10,
    "distractors": [
      "dū",
      "dǒu",
      "tōu"
    ],
    "char_distractors": [
      "部",
      "郑",
      "邮"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "百",
    "pinyin": "bǎi",
    "radical": "白",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "bāi",
      "bài",
      "pái"
    ],
    "char_distractors": [
      "白",
      "自",
      "目"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "时",
    "pinyin": "shí",
    "radical": "日",
    "structure": "左右",
    "strokeCount": 7,
    "distractors": [
      "shī",
      "shǐ",
      "chí"
    ],
    "char_distractors": [
      "日",
      "明",
      "晴"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "点",
    "pinyin": "diǎn",
    "radical": "灬",
    "structure": "上下",
    "strokeCount": 9,
    "distractors": [
      "diān",
      "diàn",
      "tiǎn"
    ],
    "char_distractors": [
      "占",
      "店",
      "黑"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "林",
    "pinyin": "lín",
    "radical": "木",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "líng",
      "lǐn",
      "lìn"
    ],
    "char_distractors": [
      "森",
      "木",
      "树"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "兴",
    "pinyin": "xìng",
    "radical": "八",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "xīng",
      "xǐng",
      "shìng"
    ],
    "char_distractors": [
      "光",
      "半",
      "关"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "往",
    "pinyin": "wǎng",
    "radical": "彳",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "wāng",
      "wàng",
      "fǎng"
    ],
    "char_distractors": [
      "住",
      "注",
      "彼"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "瓜",
    "pinyin": "guā",
    "radical": "瓜",
    "structure": "独体",
    "strokeCount": 5,
    "distractors": [
      "guà",
      "kuā",
      "guǎ"
    ],
    "char_distractors": [
      "爪",
      "西",
      "果"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "兔",
    "pinyin": "tù",
    "radical": "刀",
    "structure": "上下",
    "strokeCount": 8,
    "distractors": [
      "tú",
      "tǔ",
      "dù"
    ],
    "char_distractors": [
      "免",
      "象",
      "儿"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "进",
    "pinyin": "jìn",
    "radical": "辶",
    "structure": "半包围",
    "strokeCount": 7,
    "distractors": [
      "jīn",
      "jǐn",
      "qìn"
    ],
    "char_distractors": [
      "近",
      "还",
      "远"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "灯",
    "pinyin": "dēng",
    "radical": "火",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "dèng",
      "déng",
      "tēng"
    ],
    "char_distractors": [
      "灭",
      "烧",
      "火"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "车",
    "pinyin": "chē",
    "radical": "车",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "chè",
      "cē",
      "chě"
    ],
    "char_distractors": [
      "东",
      "转",
      "辆"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "站",
    "pinyin": "zhàn",
    "radical": "立",
    "structure": "左右",
    "strokeCount": 10,
    "distractors": [
      "zhān",
      "zhǎn",
      "chàn"
    ],
    "char_distractors": [
      "立",
      "竞",
      "端"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "空",
    "pinyin": "kōng",
    "radical": "穴",
    "structure": "上下",
    "strokeCount": 8,
    "distractors": [
      "kǒng",
      "kòng",
      "gōng"
    ],
    "char_distractors": [
      "穴",
      "宝",
      "宇"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "笔",
    "pinyin": "bǐ",
    "radical": "竹",
    "structure": "上下",
    "strokeCount": 10,
    "distractors": [
      "bī",
      "bì",
      "pǐ"
    ],
    "char_distractors": [
      "毛",
      "写",
      "画"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "知",
    "pinyin": "zhī",
    "radical": "矢",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "zhì",
      "zhǐ",
      "chī"
    ],
    "char_distractors": [
      "智",
      "矢",
      "石"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "道",
    "pinyin": "dào",
    "radical": "辶",
    "structure": "半包围",
    "strokeCount": 12,
    "distractors": [
      "dāo",
      "dǎo",
      "tào"
    ],
    "char_distractors": [
      "路",
      "通",
      "过"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "放",
    "pinyin": "fàng",
    "radical": "攵",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "fāng",
      "fǎng",
      "páng"
    ],
    "char_distractors": [
      "方",
      "做",
      "收"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "平",
    "pinyin": "píng",
    "radical": "干",
    "structure": "独体",
    "strokeCount": 5,
    "distractors": [
      "pīng",
      "pǐng",
      "bíng"
    ],
    "char_distractors": [
      "干",
      "半",
      "年"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "安",
    "pinyin": "ān",
    "radical": "宀",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "àn",
      "ǎn",
      "yān"
    ],
    "char_distractors": [
      "全",
      "家",
      "宝"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "干",
    "pinyin": "gān",
    "radical": "干",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "gàn",
      "kān",
      "gǎn"
    ],
    "char_distractors": [
      "千",
      "十",
      "大"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "身",
    "pinyin": "shēn",
    "radical": "身",
    "structure": "独体",
    "strokeCount": 7,
    "distractors": [
      "shěn",
      "chēn",
      "shèn"
    ],
    "char_distractors": [
      "体",
      "自",
      "长"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "星",
    "pinyin": "xīng",
    "radical": "日",
    "structure": "上下",
    "strokeCount": 9,
    "distractors": [
      "xìng",
      "shēng",
      "xǐng"
    ],
    "char_distractors": [
      "晴",
      "明",
      "阳"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "久",
    "pinyin": "jiǔ",
    "radical": "丿",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "jiū",
      "jiù",
      "qiǔ"
    ],
    "char_distractors": [
      "九",
      "及",
      "又"
    ],
    "unit": "2-7",
    "type": "pinyin"
  },
  {
    "char": "吓",
    "pinyin": "xià",
    "radical": "口",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "xiā",
      "xiǎ",
      "hè"
    ],
    "char_distractors": [
      "叫",
      "吹",
      "呢"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "为",
    "pinyin": "wéi",
    "radical": "丶",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "wèi",
      "wēi",
      "wěi"
    ],
    "char_distractors": [
      "力",
      "办",
      "方"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "怕",
    "pinyin": "pà",
    "radical": "忄",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "pā",
      "pǎ",
      "bà"
    ],
    "char_distractors": [
      "怪",
      "伯",
      "拍"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "家",
    "pinyin": "jiā",
    "radical": "宀",
    "structure": "上下",
    "strokeCount": 10,
    "distractors": [
      "jiǎ",
      "gā",
      "jiá"
    ],
    "char_distractors": [
      "宝",
      "安",
      "室"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "象",
    "pinyin": "xiàng",
    "radical": "豕",
    "structure": "独体",
    "strokeCount": 11,
    "distractors": [
      "xiāng",
      "xiǎng",
      "shàng"
    ],
    "char_distractors": [
      "像",
      "家",
      "豪"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "没",
    "pinyin": "méi",
    "radical": "氵",
    "structure": "左右",
    "strokeCount": 7,
    "distractors": [
      "mēi",
      "mèi",
      "mò"
    ],
    "char_distractors": [
      "每",
      "海",
      "河"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "到",
    "pinyin": "dào",
    "radical": "刂",
    "structure": "左右",
    "strokeCount": 8,
    "distractors": [
      "dāo",
      "dǎo",
      "tào"
    ],
    "char_distractors": [
      "道",
      "刀",
      "倒"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "向",
    "pinyin": "xiàng",
    "radical": "口",
    "structure": "半包围",
    "strokeCount": 6,
    "distractors": [
      "xiāng",
      "xiǎng",
      "shàng"
    ],
    "char_distractors": [
      "问",
      "同",
      "回"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "边",
    "pinyin": "biān",
    "radical": "辶",
    "structure": "半包围",
    "strokeCount": 5,
    "distractors": [
      "biǎn",
      "biàn",
      "piān"
    ],
    "char_distractors": [
      "过",
      "这",
      "远"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "行",
    "pinyin": "xíng",
    "radical": "彳",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "xīng",
      "xìng",
      "háng"
    ],
    "char_distractors": [
      "走",
      "很",
      "得"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "草",
    "pinyin": "cǎo",
    "radical": "艹",
    "structure": "上下",
    "strokeCount": 9,
    "distractors": [
      "cāo",
      "zǎo",
      "chǎo"
    ],
    "char_distractors": [
      "花",
      "苗",
      "药"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "赶",
    "pinyin": "gǎn",
    "radical": "走",
    "structure": "半包围",
    "strokeCount": 10,
    "distractors": [
      "gān",
      "gàn",
      "kǎn"
    ],
    "char_distractors": [
      "走",
      "起",
      "超"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "过",
    "pinyin": "guò",
    "radical": "辶",
    "structure": "半包围",
    "strokeCount": 6,
    "distractors": [
      "guō",
      "guǒ",
      "kuò"
    ],
    "char_distractors": [
      "这",
      "还",
      "进"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "找",
    "pinyin": "zhǎo",
    "radical": "扌",
    "structure": "左右",
    "strokeCount": 7,
    "distractors": [
      "zhāo",
      "zhào",
      "cǎo"
    ],
    "char_distractors": [
      "我",
      "打",
      "把"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "巾",
    "pinyin": "jīn",
    "radical": "巾",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "jǐn",
      "jìn",
      "qīn"
    ],
    "char_distractors": [
      "市",
      "师",
      "帅"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "洗",
    "pinyin": "xǐ",
    "radical": "氵",
    "structure": "左右",
    "strokeCount": 9,
    "distractors": [
      "xī",
      "xì",
      "shǐ"
    ],
    "char_distractors": [
      "选",
      "先",
      "冼"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "页",
    "pinyin": "yè",
    "radical": "页",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "yé",
      "yē",
      "yuè"
    ],
    "char_distractors": [
      "贝",
      "见",
      "百"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "户",
    "pinyin": "hù",
    "radical": "户",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "hū",
      "hǔ",
      "fù"
    ],
    "char_distractors": [
      "门",
      "斤",
      "片"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "角",
    "pinyin": "jiǎo",
    "radical": "角",
    "structure": "上下",
    "strokeCount": 7,
    "distractors": [
      "jiāo",
      "jiào",
      "gé"
    ],
    "char_distractors": [
      "用",
      "甩",
      "月"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "父",
    "pinyin": "fù",
    "radical": "父",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "fū",
      "fǔ",
      "bù"
    ],
    "char_distractors": [
      "爸",
      "爷",
      "大"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "义",
    "pinyin": "yì",
    "radical": "丶",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "yī",
      "yí",
      "yǐ"
    ],
    "char_distractors": [
      "又",
      "文",
      "之"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "文",
    "strokes": [
      "点",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 4,
    "unit": "2-1",
    "radical": "文",
    "structure": "独体",
    "type": "stroke"
  },
  {
    "char": "花",
    "strokes": [
      "横",
      "竖",
      "竖",
      "撇",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 7,
    "unit": "2-1",
    "radical": "艹",
    "structure": "上下",
    "type": "stroke"
  },
  {
    "char": "书",
    "strokes": [
      "横折",
      "横折钩",
      "竖",
      "点"
    ],
    "strokeCount": 4,
    "unit": "2-3",
    "radical": "乙",
    "structure": "独体",
    "type": "stroke"
  },
  {
    "char": "春",
    "strokes": [
      "横",
      "横",
      "横",
      "撇",
      "捺",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 9,
    "unit": "2-1",
    "radical": "日",
    "structure": "上下",
    "type": "stroke"
  },
  {
    "char": "冬",
    "strokes": [
      "撇",
      "横撇",
      "捺",
      "点",
      "点"
    ],
    "strokeCount": 5,
    "unit": "2-1",
    "radical": "夂",
    "structure": "上下",
    "type": "stroke"
  },
  {
    "char": "全",
    "strokes": [
      "撇",
      "捺",
      "横",
      "竖",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "飞",
    "strokes": [
      "横折弯钩",
      "撇",
      "点"
    ],
    "strokeCount": 3,
    "unit": "2-1",
    "radical": "—",
    "structure": "独体",
    "type": "stroke"
  },
  {
    "char": "吃",
    "strokes": [
      "竖",
      "横折",
      "横",
      "撇",
      "横折弯钩",
      "点"
    ],
    "strokeCount": 6,
    "unit": "2-4",
    "radical": "口",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "叫",
    "strokes": [
      "竖",
      "横折",
      "横",
      "竖",
      "横折钩"
    ],
    "strokeCount": 5,
    "unit": "2-3",
    "radical": "口",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "走",
    "strokes": [
      "横",
      "竖",
      "横",
      "竖",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 7,
    "unit": "2-3",
    "radical": "走",
    "structure": "上下",
    "type": "stroke"
  },
  {
    "char": "也",
    "strokes": [
      "横折钩",
      "竖",
      "竖弯钩"
    ],
    "strokeCount": 3,
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "他",
    "strokes": [
      "撇",
      "竖",
      "横折钩",
      "竖",
      "竖弯钩"
    ],
    "strokeCount": 5,
    "unit": "2-3",
    "radical": "亻",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "她",
    "strokes": [
      "撇点",
      "撇",
      "横",
      "横折钩",
      "竖",
      "竖弯钩"
    ],
    "strokeCount": 6,
    "unit": "2-7",
    "radical": "女",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "红",
    "strokes": [
      "撇折",
      "撇折",
      "提",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 6,
    "unit": "2-1",
    "radical": "纟",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "听",
    "strokes": [
      "竖",
      "横折",
      "横",
      "撇",
      "竖",
      "竖",
      "横"
    ],
    "strokeCount": 7,
    "unit": "2-6",
    "radical": "口",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "你",
    "strokes": [
      "撇",
      "竖",
      "撇",
      "横撇",
      "竖钩",
      "撇",
      "点"
    ],
    "strokeCount": 7,
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "回",
    "strokes": [
      "竖",
      "横折",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "unit": "2-3",
    "radical": "口",
    "structure": "全包围",
    "type": "stroke"
  },
  {
    "char": "会",
    "strokes": [
      "撇",
      "捺",
      "横折",
      "横",
      "撇折",
      "点"
    ],
    "strokeCount": 6,
    "unit": "2-2",
    "radical": "人",
    "structure": "上下",
    "type": "stroke"
  },
  {
    "char": "工",
    "strokes": [
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 3,
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "用",
    "strokes": [
      "撇",
      "横折钩",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 5,
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "问",
    "strokes": [
      "点",
      "竖",
      "横折钩",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 6,
    "unit": "2-4",
    "radical": "门",
    "structure": "半包围",
    "type": "stroke"
  },
  {
    "char": "有",
    "strokes": [
      "横",
      "撇",
      "竖",
      "横折钩",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "半",
    "strokes": [
      "点",
      "撇",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 5,
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "从",
    "strokes": [
      "撇",
      "捺",
      "撇",
      "捺"
    ],
    "strokeCount": 4,
    "unit": "2-3",
    "radical": "人",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "江",
    "strokes": [
      "点",
      "点",
      "提",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 6,
    "unit": "2-2",
    "radical": "氵",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "河",
    "strokes": [
      "点",
      "点",
      "提",
      "横",
      "竖",
      "横折",
      "横",
      "竖钩"
    ],
    "strokeCount": 8,
    "unit": "2-3",
    "radical": "氵",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "生",
    "strokes": [
      "撇",
      "横",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 5,
    "unit": "2-1",
    "radical": "—",
    "structure": "独体",
    "type": "stroke"
  },
  {
    "char": "里",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "竖",
      "横",
      "横"
    ],
    "strokeCount": 7,
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "果",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "横",
      "竖",
      "撇",
      "捺"
    ],
    "strokeCount": 8,
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "快",
    "strokes": [
      "点",
      "点",
      "竖",
      "横折",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 7,
    "unit": "2-3",
    "radical": "忄",
    "structure": "左右",
    "type": "stroke"
  },
  {
    "char": "乐",
    "strokes": [
      "撇",
      "竖折",
      "竖钩",
      "撇",
      "点"
    ],
    "strokeCount": 5,
    "unit": "2-3",
    "radical": "丿",
    "structure": "独体",
    "type": "stroke"
  },
  {
    "char": "午",
    "strokes": [
      "撇",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 4,
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "节",
    "strokes": [
      "横",
      "竖",
      "竖",
      "横折",
      "竖"
    ],
    "strokeCount": 5,
    "unit": "2-4",
    "radical": "艹",
    "structure": "上下",
    "type": "stroke"
  },
  {
    "char": "叶",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 5,
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "前",
    "strokes": [
      "点",
      "横",
      "撇",
      "竖",
      "横折钩",
      "横",
      "横",
      "竖",
      "竖"
    ],
    "strokeCount": 9,
    "unit": "2-5",
    "radical": "刂",
    "structure": "上下",
    "type": "stroke"
  },
  {
    "char": "吹",
    "strokes": [
      "竖",
      "横折",
      "横",
      "撇",
      "横折弯钩",
      "撇",
      "点"
    ],
    "strokeCount": 7,
    "radical": "口",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "姓",
    "strokes": [
      "撇点",
      "撇",
      "横",
      "撇",
      "横",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 8,
    "radical": "女",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "什",
    "strokes": [
      "撇",
      "竖",
      "横",
      "竖"
    ],
    "strokeCount": 4,
    "radical": "亻",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "么",
    "strokes": [
      "撇",
      "撇折",
      "点"
    ],
    "strokeCount": 3,
    "radical": "丿",
    "structure": "独体",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "古",
    "strokes": [
      "横",
      "竖",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 5,
    "radical": "十",
    "structure": "上下",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "胡",
    "strokes": [
      "横",
      "竖",
      "竖",
      "横折",
      "横",
      "竖",
      "横折钩",
      "横",
      "横"
    ],
    "strokeCount": 9,
    "radical": "月",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "双",
    "strokes": [
      "横撇",
      "捺",
      "横撇",
      "捺"
    ],
    "strokeCount": 4,
    "radical": "又",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "言",
    "strokes": [
      "点",
      "横",
      "横",
      "横",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 7,
    "radical": "—",
    "structure": "独体",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "青",
    "strokes": [
      "横",
      "横",
      "竖",
      "横",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 8,
    "radical": "青",
    "structure": "上下",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "清",
    "strokes": [
      "点",
      "点",
      "提",
      "横",
      "横",
      "竖",
      "横",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 11,
    "radical": "氵",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "晴",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "横",
      "横",
      "竖",
      "横",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 12,
    "radical": "日",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "情",
    "strokes": [
      "点",
      "点",
      "竖",
      "横",
      "横",
      "竖",
      "横",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 11,
    "radical": "忄",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "请",
    "strokes": [
      "点",
      "横折提",
      "横",
      "横",
      "竖",
      "横",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 10,
    "radical": "讠",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "字",
    "strokes": [
      "点",
      "点",
      "横撇",
      "横撇",
      "竖钩",
      "横"
    ],
    "strokeCount": 6,
    "radical": "宀",
    "structure": "上下",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "动",
    "strokes": [
      "横",
      "横",
      "撇折",
      "点",
      "横折钩",
      "撇"
    ],
    "strokeCount": 6,
    "radical": "力",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "万",
    "strokes": [
      "横",
      "横折钩",
      "撇"
    ],
    "strokeCount": 3,
    "radical": "一",
    "structure": "独体",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "无",
    "strokes": [
      "横",
      "横",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 4,
    "radical": "一",
    "structure": "独体",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "明",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "撇",
      "横折钩",
      "横",
      "横"
    ],
    "strokeCount": 8,
    "radical": "日",
    "structure": "左右",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "卡",
    "strokes": [
      "竖",
      "横",
      "横",
      "竖",
      "点"
    ],
    "strokeCount": 5,
    "radical": "卜",
    "structure": "上下",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "片",
    "strokes": [
      "撇",
      "竖",
      "横",
      "横折"
    ],
    "strokeCount": 4,
    "radical": "片",
    "structure": "独体",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "合",
    "strokes": [
      "撇",
      "捺",
      "横",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 6,
    "radical": "人",
    "structure": "上下",
    "unit": "2-1",
    "type": "stroke"
  },
  {
    "char": "共",
    "strokes": [
      "横",
      "竖",
      "竖",
      "横",
      "撇",
      "点"
    ],
    "strokeCount": 6,
    "radical": "八",
    "structure": "上下",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "产",
    "strokes": [
      "点",
      "横",
      "撇",
      "横",
      "撇",
      "横"
    ],
    "strokeCount": 6,
    "radical": "立",
    "structure": "独体",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "太",
    "strokes": [
      "横",
      "撇",
      "捺",
      "点"
    ],
    "strokeCount": 4,
    "radical": "大",
    "structure": "独体",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "阳",
    "strokes": [
      "横折折折钩",
      "竖",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "radical": "阝",
    "structure": "左右",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "光",
    "strokes": [
      "竖",
      "点",
      "撇",
      "横",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 6,
    "radical": "小",
    "structure": "上下",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "井",
    "strokes": [
      "横",
      "横",
      "撇",
      "竖"
    ],
    "strokeCount": 4,
    "radical": "一",
    "structure": "独体",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "主",
    "strokes": [
      "点",
      "横",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 5,
    "radical": "一",
    "structure": "独体",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "住",
    "strokes": [
      "撇",
      "竖",
      "点",
      "横",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 7,
    "radical": "亻",
    "structure": "左右",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "方",
    "strokes": [
      "点",
      "横",
      "横折钩",
      "撇"
    ],
    "strokeCount": 4,
    "radical": "方",
    "structure": "独体",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "后",
    "strokes": [
      "撇",
      "撇",
      "横",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 6,
    "radical": "口",
    "structure": "半包围",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "高",
    "strokes": [
      "点",
      "横",
      "竖",
      "横折",
      "横",
      "竖",
      "横折",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 10,
    "radical": "高",
    "structure": "独体",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "的",
    "strokes": [
      "撇",
      "竖",
      "横折",
      "横",
      "横",
      "撇",
      "横折钩",
      "点"
    ],
    "strokeCount": 8,
    "radical": "白",
    "structure": "左右",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "北",
    "strokes": [
      "竖",
      "横",
      "提",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 5,
    "radical": "匕",
    "structure": "左右",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "京",
    "strokes": [
      "点",
      "横",
      "竖",
      "横折",
      "横",
      "竖钩",
      "撇",
      "点"
    ],
    "strokeCount": 8,
    "radical": "亠",
    "structure": "上下",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "广",
    "strokes": [
      "点",
      "横",
      "撇"
    ],
    "strokeCount": 3,
    "radical": "广",
    "structure": "独体",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "写",
    "strokes": [
      "点",
      "横折",
      "横",
      "竖折折钩",
      "横"
    ],
    "strokeCount": 5,
    "radical": "冖",
    "structure": "上下",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "认",
    "strokes": [
      "点",
      "横折提",
      "撇",
      "捺"
    ],
    "strokeCount": 4,
    "radical": "讠",
    "structure": "左右",
    "unit": "2-2",
    "type": "stroke"
  },
  {
    "char": "说",
    "strokes": [
      "点",
      "横折提",
      "撇",
      "竖",
      "横折",
      "横",
      "横",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 9,
    "radical": "讠",
    "structure": "左右",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "让",
    "strokes": [
      "点",
      "横折提",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 5,
    "radical": "讠",
    "structure": "左右",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "自",
    "strokes": [
      "撇",
      "竖",
      "横折",
      "横",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "radical": "自",
    "structure": "独体",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "已",
    "strokes": [
      "横折",
      "横",
      "竖弯钩"
    ],
    "strokeCount": 3,
    "radical": "已",
    "structure": "独体",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "好",
    "strokes": [
      "撇点",
      "撇",
      "横",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 6,
    "radical": "女",
    "structure": "左右",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "们",
    "strokes": [
      "撇",
      "竖",
      "点",
      "竖",
      "横折钩"
    ],
    "strokeCount": 5,
    "radical": "亻",
    "structure": "左右",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "当",
    "strokes": [
      "竖",
      "点",
      "撇",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "radical": "彐",
    "structure": "上下",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "画",
    "strokes": [
      "横",
      "竖",
      "横折",
      "横",
      "竖",
      "横",
      "竖折",
      "竖"
    ],
    "strokeCount": 8,
    "radical": "一",
    "structure": "半包围",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "毛",
    "strokes": [
      "撇",
      "横",
      "竖弯钩",
      "撇"
    ],
    "strokeCount": 4,
    "radical": "毛",
    "structure": "独体",
    "unit": "2-3",
    "type": "stroke"
  },
  {
    "char": "机",
    "strokes": [
      "横",
      "竖",
      "撇",
      "点",
      "撇",
      "横折弯钩"
    ],
    "strokeCount": 6,
    "radical": "木",
    "structure": "左右",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "台",
    "strokes": [
      "撇折",
      "点",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 5,
    "radical": "口",
    "structure": "上下",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "唱",
    "strokes": [
      "竖",
      "横折",
      "横",
      "竖",
      "横折",
      "横",
      "竖",
      "横折",
      "横",
      "横",
      "横"
    ],
    "strokeCount": 11,
    "radical": "口",
    "structure": "左右",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "伞",
    "strokes": [
      "撇",
      "捺",
      "横",
      "横",
      "竖钩",
      "点"
    ],
    "strokeCount": 6,
    "radical": "人",
    "structure": "上下",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "朵",
    "strokes": [
      "撇",
      "横折弯",
      "横",
      "横",
      "撇",
      "竖"
    ],
    "strokeCount": 6,
    "radical": "几",
    "structure": "上下",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "美",
    "strokes": [
      "点",
      "撇",
      "横",
      "横",
      "竖",
      "横",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 9,
    "radical": "羊",
    "structure": "上下",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "这",
    "strokes": [
      "点",
      "横",
      "撇",
      "点",
      "点",
      "横折折撇",
      "捺"
    ],
    "strokeCount": 7,
    "radical": "辶",
    "structure": "半包围",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "看",
    "strokes": [
      "撇",
      "横",
      "横",
      "撇",
      "竖",
      "横折",
      "横",
      "横",
      "横"
    ],
    "strokeCount": 9,
    "radical": "手",
    "structure": "半包围",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "鱼",
    "strokes": [
      "撇",
      "横撇",
      "竖",
      "横折",
      "横",
      "竖",
      "横",
      "横"
    ],
    "strokeCount": 8,
    "radical": "鱼",
    "structure": "上下",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "面",
    "strokes": [
      "横",
      "撇",
      "竖",
      "横折",
      "横",
      "横",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 9,
    "radical": "面",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "加",
    "strokes": [
      "横折钩",
      "撇",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 5,
    "radical": "力",
    "structure": "左右",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "豆",
    "strokes": [
      "横",
      "竖",
      "横折",
      "横",
      "竖",
      "横",
      "点"
    ],
    "strokeCount": 7,
    "radical": "豆",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "斗",
    "strokes": [
      "点",
      "点",
      "横",
      "竖"
    ],
    "strokeCount": 4,
    "radical": "斗",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "米",
    "strokes": [
      "点",
      "撇",
      "横",
      "竖",
      "撇",
      "捺"
    ],
    "strokeCount": 6,
    "radical": "米",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "间",
    "strokes": [
      "点",
      "竖",
      "横折钩",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 7,
    "radical": "门",
    "structure": "半包围",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "分",
    "strokes": [
      "撇",
      "捺",
      "撇",
      "横折钩"
    ],
    "strokeCount": 4,
    "radical": "八",
    "structure": "上下",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "肉",
    "strokes": [
      "竖",
      "横折钩",
      "撇",
      "点",
      "撇",
      "点"
    ],
    "strokeCount": 6,
    "radical": "肉",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "止",
    "strokes": [
      "竖",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 4,
    "radical": "止",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "斤",
    "strokes": [
      "撇",
      "撇",
      "横",
      "竖"
    ],
    "strokeCount": 4,
    "radical": "斤",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "寸",
    "strokes": [
      "横",
      "竖钩",
      "点"
    ],
    "strokeCount": 3,
    "radical": "寸",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "千",
    "strokes": [
      "撇",
      "横",
      "竖"
    ],
    "strokeCount": 3,
    "radical": "十",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "元",
    "strokes": [
      "横",
      "横",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 4,
    "radical": "一",
    "structure": "独体",
    "unit": "2-4",
    "type": "stroke"
  },
  {
    "char": "思",
    "strokes": [
      "竖",
      "横折",
      "横",
      "竖",
      "横",
      "点",
      "斜钩",
      "点",
      "点"
    ],
    "strokeCount": 9,
    "radical": "田",
    "structure": "上下",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "床",
    "strokes": [
      "点",
      "横",
      "撇",
      "横",
      "竖",
      "撇",
      "捺"
    ],
    "strokeCount": 7,
    "radical": "广",
    "structure": "半包围",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "地",
    "strokes": [
      "横",
      "竖",
      "提",
      "横折钩",
      "竖",
      "竖弯钩"
    ],
    "strokeCount": 6,
    "radical": "土",
    "structure": "左右",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "故",
    "strokes": [
      "横",
      "竖",
      "竖",
      "横折",
      "横",
      "撇",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 9,
    "radical": "攵",
    "structure": "左右",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "乡",
    "strokes": [
      "撇折",
      "撇折",
      "撇"
    ],
    "strokeCount": 3,
    "radical": "—",
    "structure": "独体",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "色",
    "strokes": [
      "撇",
      "横折",
      "横",
      "竖弯钩",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 6,
    "radical": "色",
    "structure": "上下",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "把",
    "strokes": [
      "横",
      "竖钩",
      "提",
      "横折",
      "竖",
      "横",
      "竖弯钩"
    ],
    "strokeCount": 7,
    "radical": "扌",
    "structure": "左右",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "讲",
    "strokes": [
      "点",
      "横折提",
      "横",
      "竖",
      "横",
      "竖"
    ],
    "strokeCount": 6,
    "radical": "讠",
    "structure": "左右",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "样",
    "strokes": [
      "横",
      "竖",
      "撇",
      "点",
      "点",
      "撇",
      "横",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 10,
    "radical": "木",
    "structure": "左右",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "笑",
    "strokes": [
      "撇",
      "横",
      "点",
      "撇",
      "横",
      "点",
      "撇",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 10,
    "radical": "竹",
    "structure": "上下",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "再",
    "strokes": [
      "横",
      "竖",
      "横折钩",
      "竖",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "radical": "一",
    "structure": "独体",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "课",
    "strokes": [
      "点",
      "横折提",
      "竖",
      "横折",
      "横",
      "横",
      "横",
      "竖",
      "撇",
      "捺"
    ],
    "strokeCount": 10,
    "radical": "讠",
    "structure": "左右",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "坐",
    "strokes": [
      "撇",
      "捺",
      "撇",
      "捺",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 7,
    "radical": "土",
    "structure": "独体",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "老",
    "strokes": [
      "横",
      "竖",
      "横",
      "撇",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 6,
    "radical": "老",
    "structure": "半包围",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "师",
    "strokes": [
      "竖",
      "撇",
      "横",
      "竖",
      "横折钩",
      "竖"
    ],
    "strokeCount": 6,
    "radical": "巾",
    "structure": "左右",
    "unit": "2-5",
    "type": "stroke"
  },
  {
    "char": "国",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "竖",
      "横",
      "点",
      "横"
    ],
    "strokeCount": 8,
    "radical": "囗",
    "structure": "全包围",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "都",
    "strokes": [
      "横",
      "竖",
      "横",
      "撇",
      "竖",
      "横折",
      "横",
      "横",
      "横折折折钩",
      "竖"
    ],
    "strokeCount": 10,
    "radical": "阝",
    "structure": "左右",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "百",
    "strokes": [
      "横",
      "撇",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 6,
    "radical": "白",
    "structure": "独体",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "时",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "横",
      "竖钩",
      "点"
    ],
    "strokeCount": 7,
    "radical": "日",
    "structure": "左右",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "点",
    "strokes": [
      "竖",
      "横",
      "竖",
      "横折",
      "横",
      "点",
      "点",
      "点",
      "点"
    ],
    "strokeCount": 9,
    "radical": "灬",
    "structure": "上下",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "林",
    "strokes": [
      "横",
      "竖",
      "撇",
      "点",
      "横",
      "竖",
      "撇",
      "捺"
    ],
    "strokeCount": 8,
    "radical": "木",
    "structure": "左右",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "兴",
    "strokes": [
      "点",
      "点",
      "撇",
      "横",
      "撇",
      "点"
    ],
    "strokeCount": 6,
    "radical": "八",
    "structure": "上下",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "往",
    "strokes": [
      "撇",
      "撇",
      "竖",
      "点",
      "横",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 8,
    "radical": "彳",
    "structure": "左右",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "瓜",
    "strokes": [
      "撇",
      "撇",
      "竖提",
      "捺",
      "点"
    ],
    "strokeCount": 5,
    "radical": "瓜",
    "structure": "独体",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "兔",
    "strokes": [
      "撇",
      "横折",
      "竖",
      "横折",
      "横",
      "撇",
      "竖弯钩",
      "点"
    ],
    "strokeCount": 8,
    "radical": "刀",
    "structure": "上下",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "进",
    "strokes": [
      "横",
      "横",
      "撇",
      "竖",
      "点",
      "横折折撇",
      "捺"
    ],
    "strokeCount": 7,
    "radical": "辶",
    "structure": "半包围",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "灯",
    "strokes": [
      "点",
      "撇",
      "撇",
      "点",
      "横",
      "竖钩"
    ],
    "strokeCount": 6,
    "radical": "火",
    "structure": "左右",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "车",
    "strokes": [
      "横",
      "撇折",
      "横",
      "竖"
    ],
    "strokeCount": 4,
    "radical": "车",
    "structure": "独体",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "站",
    "strokes": [
      "点",
      "横",
      "点",
      "撇",
      "横",
      "竖",
      "横折",
      "横",
      "横",
      "横"
    ],
    "strokeCount": 10,
    "radical": "立",
    "structure": "左右",
    "unit": "2-6",
    "type": "stroke"
  },
  {
    "char": "空",
    "strokes": [
      "点",
      "点",
      "横撇",
      "撇",
      "点",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 8,
    "radical": "穴",
    "structure": "上下",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "还",
    "strokes": [
      "横",
      "撇",
      "竖",
      "点",
      "点",
      "横折折撇",
      "捺"
    ],
    "strokeCount": 7,
    "radical": "辶",
    "structure": "半包围",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "笔",
    "strokes": [
      "撇",
      "横",
      "点",
      "撇",
      "横",
      "点",
      "横折钩",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 10,
    "radical": "竹",
    "structure": "上下",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "知",
    "strokes": [
      "撇",
      "横",
      "横",
      "撇",
      "点",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 8,
    "radical": "矢",
    "structure": "左右",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "道",
    "strokes": [
      "点",
      "撇",
      "竖",
      "横折",
      "横",
      "横",
      "横",
      "撇",
      "点",
      "点",
      "横折折撇",
      "捺"
    ],
    "strokeCount": 12,
    "radical": "辶",
    "structure": "半包围",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "放",
    "strokes": [
      "点",
      "横",
      "横折钩",
      "撇",
      "撇",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 8,
    "radical": "攵",
    "structure": "左右",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "平",
    "strokes": [
      "横",
      "点",
      "撇",
      "横",
      "竖"
    ],
    "strokeCount": 5,
    "radical": "干",
    "structure": "独体",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "安",
    "strokes": [
      "点",
      "点",
      "横撇",
      "撇点",
      "撇",
      "横"
    ],
    "strokeCount": 6,
    "radical": "宀",
    "structure": "上下",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "干",
    "strokes": [
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 3,
    "radical": "干",
    "structure": "独体",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "身",
    "strokes": [
      "撇",
      "竖",
      "横折钩",
      "横",
      "横",
      "横",
      "撇"
    ],
    "strokeCount": 7,
    "radical": "身",
    "structure": "独体",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "星",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "撇",
      "横",
      "横",
      "竖",
      "横"
    ],
    "strokeCount": 9,
    "radical": "日",
    "structure": "上下",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "久",
    "strokes": [
      "撇",
      "横折弯钩",
      "捺"
    ],
    "strokeCount": 3,
    "radical": "丿",
    "structure": "独体",
    "unit": "2-7",
    "type": "stroke"
  },
  {
    "char": "吓",
    "strokes": [
      "竖",
      "横折",
      "横",
      "横",
      "竖",
      "点"
    ],
    "strokeCount": 6,
    "radical": "口",
    "structure": "左右",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "为",
    "strokes": [
      "点",
      "撇",
      "横折钩",
      "点"
    ],
    "strokeCount": 4,
    "radical": "丶",
    "structure": "独体",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "怕",
    "strokes": [
      "点",
      "点",
      "竖",
      "撇",
      "竖",
      "横折",
      "横",
      "横"
    ],
    "strokeCount": 8,
    "radical": "忄",
    "structure": "左右",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "家",
    "strokes": [
      "点",
      "点",
      "横撇",
      "横",
      "撇",
      "弯钩",
      "撇",
      "撇",
      "撇",
      "捺"
    ],
    "strokeCount": 10,
    "radical": "宀",
    "structure": "上下",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "象",
    "strokes": [
      "撇",
      "横折",
      "横",
      "横",
      "横",
      "竖",
      "横",
      "竖",
      "横",
      "撇",
      "捺"
    ],
    "strokeCount": 11,
    "radical": "豕",
    "structure": "独体",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "没",
    "strokes": [
      "点",
      "点",
      "提",
      "撇",
      "横折弯钩",
      "撇",
      "捺"
    ],
    "strokeCount": 7,
    "radical": "氵",
    "structure": "左右",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "到",
    "strokes": [
      "横",
      "撇折",
      "点",
      "横",
      "竖",
      "提",
      "竖",
      "竖钩"
    ],
    "strokeCount": 8,
    "radical": "刂",
    "structure": "左右",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "向",
    "strokes": [
      "撇",
      "竖",
      "横折钩",
      "竖",
      "横折",
      "横"
    ],
    "strokeCount": 6,
    "radical": "口",
    "structure": "半包围",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "边",
    "strokes": [
      "横折钩",
      "撇",
      "点",
      "横折折撇",
      "捺"
    ],
    "strokeCount": 5,
    "radical": "辶",
    "structure": "半包围",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "行",
    "strokes": [
      "撇",
      "撇",
      "竖",
      "横",
      "横",
      "竖钩"
    ],
    "strokeCount": 6,
    "radical": "彳",
    "structure": "左右",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "草",
    "strokes": [
      "横",
      "竖",
      "竖",
      "竖",
      "横折",
      "横",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 9,
    "radical": "艹",
    "structure": "上下",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "赶",
    "strokes": [
      "横",
      "竖",
      "横",
      "竖",
      "横",
      "撇",
      "捺",
      "横",
      "横",
      "竖"
    ],
    "strokeCount": 10,
    "radical": "走",
    "structure": "半包围",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "过",
    "strokes": [
      "横",
      "竖钩",
      "点",
      "点",
      "横折折撇",
      "捺"
    ],
    "strokeCount": 6,
    "radical": "辶",
    "structure": "半包围",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "找",
    "strokes": [
      "横",
      "竖钩",
      "提",
      "撇",
      "竖",
      "撇",
      "点"
    ],
    "strokeCount": 7,
    "radical": "扌",
    "structure": "左右",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "巾",
    "strokes": [
      "竖",
      "横折钩",
      "竖"
    ],
    "strokeCount": 3,
    "radical": "巾",
    "structure": "独体",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "洗",
    "strokes": [
      "点",
      "点",
      "提",
      "撇",
      "竖",
      "横",
      "竖",
      "撇",
      "捺"
    ],
    "strokeCount": 9,
    "radical": "氵",
    "structure": "左右",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "页",
    "strokes": [
      "横",
      "撇",
      "竖",
      "横折",
      "撇",
      "点"
    ],
    "strokeCount": 6,
    "radical": "页",
    "structure": "独体",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "户",
    "strokes": [
      "点",
      "横",
      "撇",
      "竖弯钩"
    ],
    "strokeCount": 4,
    "radical": "户",
    "structure": "独体",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "角",
    "strokes": [
      "撇",
      "横折",
      "撇",
      "横折",
      "竖",
      "横",
      "横"
    ],
    "strokeCount": 7,
    "radical": "角",
    "structure": "上下",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "父",
    "strokes": [
      "撇",
      "点",
      "撇",
      "捺"
    ],
    "strokeCount": 4,
    "radical": "父",
    "structure": "独体",
    "unit": "2-8",
    "type": "stroke"
  },
  {
    "char": "义",
    "strokes": [
      "点",
      "撇",
      "捺"
    ],
    "strokeCount": 3,
    "radical": "丶",
    "structure": "独体",
    "unit": "2-8",
    "type": "stroke"
  }
]

async function seed() {
  if (questionsData.length === 0) {
    console.log('暂无题目数据')
    return { code: 1, msg: 'no data' }
  }

  console.log('开始上传 ' + questionsData.length + ' 道题目...')

  let success = 0
  let skip = 0
  let fail = 0

  for (const q of questionsData) {
    try {
      const existing = await db.collection('questions')
        .where({ type: q.type, char: q.char })
        .limit(1)
        .get()

      if (existing.data && existing.data.length > 0) {
        // 已存在则更新
        await db.collection('questions').doc(existing.data[0]._id).update(q)
        skip++
        continue
      }

      await db.collection('questions').add(q)
      success++
    } catch (e) {
      console.error('上传失败: ' + q.char, e)
      fail++
    }
  }

  console.log('上传完成：新增 ' + success + '，更新 ' + skip + '，失败 ' + fail)
  return { code: 0, msg: 'done', success, skip, fail }
}

exports.main = async (event, context) => {
  return await seed()
}
