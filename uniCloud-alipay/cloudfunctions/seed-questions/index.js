'use strict'
const db = uniCloud.database()

const questionsData = [
  {
    "char": "入",
    "pinyin": "rù",
    "distractors": [
      "lù",
      "rū",
      "rú"
    ],
    "char_distractors": [
      "人",
      "如",
      "八"
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
      "huá",
      "huǎ",
      "huà"
    ],
    "char_distractors": [
      "化",
      "华",
      "草"
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
      "yū",
      "yǔ",
      "yù"
    ],
    "char_distractors": [
      "角",
      "余",
      "鸟"
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
      "sū",
      "shú",
      "shǔ"
    ],
    "char_distractors": [
      "画",
      "输",
      "本"
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
      "wéng",
      "wēn",
      "wěn"
    ],
    "char_distractors": [
      "又",
      "闻",
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
      "pǎ",
      "bā",
      "bá"
    ],
    "char_distractors": [
      "巴",
      "爸",
      "打"
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
      "te",
      "dē",
      "dé"
    ],
    "char_distractors": [
      "白",
      "地",
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
      "tì",
      "dī",
      "dí"
    ],
    "char_distractors": [
      "也",
      "的",
      "场"
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
      "cūn",
      "chōng",
      "chún"
    ],
    "char_distractors": [
      "舍",
      "出",
      "秋"
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
      "dūn",
      "tōng",
      "dóng"
    ],
    "char_distractors": [
      "夂",
      "东",
      "春"
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
      "xué",
      "xuè"
    ],
    "char_distractors": [
      "雨",
      "学",
      "霜"
    ],
    "unit": "2-1",
    "radical": "雨",
    "structure": "上下",
    "type": "pinyin"
  },
  {
    "char": "飞",
    "pinyin": "fēi",
    "distractors": [
      "hēi",
      "féi",
      "fěi"
    ],
    "char_distractors": [
      "风",
      "非",
      "气"
    ],
    "unit": "2-1",
    "radical": "飞",
    "structure": "独体",
    "strokeCount": 3,
    "type": "pinyin"
  },
  {
    "char": "吃",
    "pinyin": "chī",
    "distractors": [
      "cī",
      "chí",
      "chǐ"
    ],
    "char_distractors": [
      "叫",
      "池",
      "喝"
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
      "qiào",
      "jiāo",
      "jiáo"
    ],
    "char_distractors": [
      "吃",
      "教",
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
      "zhǒu",
      "zōu",
      "zóu"
    ],
    "char_distractors": [
      "足",
      "奏",
      "跑"
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
      "bǎo",
      "pāo",
      "páo"
    ],
    "char_distractors": [
      "炮",
      "刨",
      "走"
    ],
    "unit": "2-2",
    "radical": "足",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "也",
    "pinyin": "yě",
    "distractors": [
      "yē",
      "yé",
      "yè"
    ],
    "char_distractors": [
      "他",
      "业",
      "她"
    ],
    "unit": "2-3",
    "radical": "乙",
    "structure": "独体",
    "type": "pinyin"
  },
  {
    "char": "他",
    "pinyin": "tā",
    "distractors": [
      "dā",
      "tá",
      "tǎ"
    ],
    "char_distractors": [
      "她",
      "它",
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
      "dā",
      "tá",
      "tǎ"
    ],
    "char_distractors": [
      "他",
      "它",
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
      "suō",
      "shuó",
      "shuǒ"
    ],
    "char_distractors": [
      "话",
      "硕",
      "请"
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
      "花",
      "画",
      "说"
    ],
    "unit": "2-3",
    "radical": "讠",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "你",
    "pinyin": "nǐ",
    "distractors": [
      "lǐ",
      "nī",
      "ní"
    ],
    "char_distractors": [
      "他",
      "泥",
      "们"
    ],
    "unit": "2-3",
    "radical": "亻",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "们",
    "pinyin": "men",
    "distractors": [
      "meng",
      "mēn",
      "mén"
    ],
    "char_distractors": [
      "门",
      "闷",
      "你"
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
      "hún",
      "hōng",
      "hǒng"
    ],
    "char_distractors": [
      "虹",
      "洪",
      "绿"
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
      "nǜ",
      "lù",
      "lǖ"
    ],
    "char_distractors": [
      "录",
      "律",
      "红"
    ],
    "unit": "2-4",
    "radical": "纟",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "色",
    "pinyin": "sè",
    "distractors": [
      "shè",
      "sē",
      "sé"
    ],
    "char_distractors": [
      "巴",
      "瑟",
      "红"
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
      "dīng",
      "tíng",
      "tǐng"
    ],
    "char_distractors": [
      "厅",
      "停",
      "说"
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
      "yuān",
      "yuán",
      "yuàn"
    ],
    "char_distractors": [
      "还",
      "圆",
      "近"
    ],
    "unit": "2-4",
    "radical": "辶",
    "structure": "半包围",
    "type": "pinyin"
  },
  {
    "char": "近",
    "pinyin": "jìn",
    "distractors": [
      "jìng",
      "qìn",
      "jīn"
    ],
    "char_distractors": [
      "远",
      "进",
      "斤"
    ],
    "unit": "2-4",
    "radical": "辶",
    "structure": "半包围",
    "type": "pinyin"
  },
  {
    "char": "还",
    "pinyin": "hái",
    "distractors": [
      "hāi",
      "hǎi",
      "hài"
    ],
    "char_distractors": [
      "不",
      "孩",
      "远"
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
      "nái",
      "lāi",
      "lǎi"
    ],
    "char_distractors": [
      "米",
      "赖",
      "去"
    ],
    "unit": "2-4",
    "radical": "木",
    "structure": "独体",
    "type": "pinyin"
  },
  {
    "char": "去",
    "pinyin": "qù",
    "distractors": [
      "jù",
      "qū",
      "qú"
    ],
    "char_distractors": [
      "云",
      "趣",
      "来"
    ],
    "unit": "2-4",
    "radical": "厶",
    "structure": "上下",
    "type": "pinyin"
  },
  {
    "char": "多",
    "pinyin": "duō",
    "distractors": [
      "tuō",
      "duó",
      "duǒ"
    ],
    "char_distractors": [
      "夕",
      "朵",
      "少"
    ],
    "unit": "2-4",
    "radical": "夕",
    "structure": "上下",
    "type": "pinyin"
  },
  {
    "char": "爸",
    "pinyin": "bà",
    "distractors": [
      "pà",
      "bā",
      "bá"
    ],
    "char_distractors": [
      "把",
      "怕",
      "妈"
    ],
    "unit": "2-5",
    "radical": "父",
    "structure": "上下",
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
      "马",
      "麻",
      "爸"
    ],
    "unit": "2-5",
    "radical": "女",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "全",
    "pinyin": "quán",
    "distractors": [
      "juán",
      "quān",
      "quǎn"
    ],
    "char_distractors": [
      "金",
      "权",
      "会"
    ],
    "unit": "2-5",
    "radical": "入",
    "structure": "上下",
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
      "灰",
      "国"
    ],
    "unit": "2-3",
    "radical": "囗",
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
      "huǐ"
    ],
    "char_distractors": [
      "合",
      "汇",
      "回"
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
      "gūn",
      "kōng",
      "góng"
    ],
    "char_distractors": [
      "土",
      "攻",
      "王"
    ],
    "unit": "2-6",
    "radical": "工",
    "structure": "独体",
    "type": "pinyin"
  },
  {
    "char": "机",
    "pinyin": "jī",
    "distractors": [
      "qī",
      "jí",
      "jǐ"
    ],
    "char_distractors": [
      "几",
      "鸡",
      "木"
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
      "qǐ",
      "jī",
      "jí"
    ],
    "char_distractors": [
      "机",
      "己",
      "九"
    ],
    "unit": "2-6",
    "radical": "几",
    "structure": "独体",
    "type": "pinyin"
  },
  {
    "char": "用",
    "pinyin": "yòng",
    "distractors": [
      "yùn",
      "yōng",
      "yóng"
    ],
    "char_distractors": [
      "月",
      "拥",
      "田"
    ],
    "unit": "2-6",
    "radical": "用",
    "structure": "独体",
    "type": "pinyin"
  },
  {
    "char": "问",
    "pinyin": "wèn",
    "distractors": [
      "wèng",
      "wēn",
      "wén"
    ],
    "char_distractors": [
      "门",
      "闻",
      "间"
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
      "yóu",
      "yòu"
    ],
    "char_distractors": [
      "友",
      "又",
      "右"
    ],
    "unit": "2-6",
    "radical": "月",
    "structure": "上下",
    "type": "pinyin"
  },
  {
    "char": "半",
    "pinyin": "bàn",
    "distractors": [
      "bàng",
      "pàn",
      "bān"
    ],
    "char_distractors": [
      "牛",
      "伴",
      "午"
    ],
    "unit": "2-6",
    "radical": "十",
    "structure": "独体",
    "type": "pinyin"
  },
  {
    "char": "从",
    "pinyin": "cóng",
    "distractors": [
      "chóng",
      "cún",
      "cōng"
    ],
    "char_distractors": [
      "人",
      "丛",
      "众"
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
      "zǔ",
      "zhū",
      "zhú"
    ],
    "char_distractors": [
      "住",
      "猪",
      "王"
    ],
    "unit": "2-2",
    "radical": "丶",
    "structure": "独体",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "住",
    "pinyin": "zhù",
    "distractors": [
      "zù",
      "zhū",
      "zhú"
    ],
    "char_distractors": [
      "主",
      "注",
      "往"
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
      "jiān",
      "qiāng",
      "jiáng"
    ],
    "char_distractors": [
      "河",
      "姜",
      "湖"
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
      "hè"
    ],
    "char_distractors": [
      "何",
      "贺",
      "江"
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
      "qǐn",
      "jǐng",
      "qīng"
    ],
    "char_distractors": [
      "情",
      "清",
      "青"
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
      "qín",
      "jíng",
      "qīng"
    ],
    "char_distractors": [
      "请",
      "晴",
      "清"
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
      "sēng",
      "shēn",
      "shéng"
    ],
    "char_distractors": [
      "牛",
      "声",
      "主"
    ],
    "unit": "2-1",
    "radical": "生",
    "structure": "独体",
    "strokeCount": 5,
    "type": "pinyin"
  },
  {
    "char": "里",
    "pinyin": "lǐ",
    "distractors": [
      "nǐ",
      "rǐ",
      "lī"
    ],
    "char_distractors": [
      "理",
      "力",
      "田"
    ],
    "unit": "2-7",
    "radical": "里",
    "structure": "上下",
    "type": "pinyin"
  },
  {
    "char": "果",
    "pinyin": "guǒ",
    "distractors": [
      "kuǒ",
      "guō",
      "guó"
    ],
    "char_distractors": [
      "里",
      "过",
      "木"
    ],
    "unit": "2-7",
    "radical": "木",
    "structure": "上下",
    "type": "pinyin"
  },
  {
    "char": "玩",
    "pinyin": "wán",
    "distractors": [
      "wáng",
      "wān",
      "wǎn"
    ],
    "char_distractors": [
      "完",
      "晚",
      "王"
    ],
    "unit": "2-7",
    "radical": "王",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "很",
    "pinyin": "hěn",
    "distractors": [
      "hěng",
      "fěn",
      "hēn"
    ],
    "char_distractors": [
      "恨",
      "跟",
      "根"
    ],
    "unit": "2-5",
    "radical": "彳",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "当",
    "pinyin": "dāng",
    "distractors": [
      "dān",
      "tāng",
      "dáng"
    ],
    "char_distractors": [
      "尚",
      "挡",
      "常"
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
      "yīng",
      "yín",
      "yǐn"
    ],
    "char_distractors": [
      "意",
      "因",
      "暗"
    ],
    "unit": "2-8",
    "radical": "音",
    "structure": "上下",
    "type": "pinyin"
  },
  {
    "char": "讲",
    "pinyin": "jiǎng",
    "distractors": [
      "jiǎn",
      "qiǎng",
      "jiāng"
    ],
    "char_distractors": [
      "井",
      "奖",
      "说"
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
      "xú",
      "xù"
    ],
    "char_distractors": [
      "午",
      "续",
      "计"
    ],
    "unit": "2-8",
    "radical": "讠",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "思",
    "pinyin": "sī",
    "distractors": [
      "shī",
      "sí",
      "sǐ"
    ],
    "char_distractors": [
      "田",
      "丝",
      "想"
    ],
    "unit": "2-5",
    "radical": "心",
    "structure": "上下",
    "strokeCount": 9,
    "type": "pinyin"
  },
  {
    "char": "床",
    "pinyin": "chuáng",
    "distractors": [
      "chuán",
      "chuāng",
      "chuǎng"
    ],
    "char_distractors": [
      "庄",
      "窗",
      "广"
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
      "qiáng",
      "jián",
      "qiān"
    ],
    "char_distractors": [
      "月",
      "钱",
      "后"
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
      "guān",
      "kuāng",
      "guáng"
    ],
    "char_distractors": [
      "先",
      "广",
      "火"
    ],
    "unit": "2-2",
    "radical": "儿",
    "structure": "上下",
    "strokeCount": 6,
    "type": "pinyin"
  },
  {
    "char": "低",
    "pinyin": "dī",
    "distractors": [
      "tī",
      "dí",
      "dǐ"
    ],
    "char_distractors": [
      "底",
      "的",
      "你"
    ],
    "unit": "2-8",
    "radical": "亻",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "故",
    "pinyin": "gù",
    "distractors": [
      "kù",
      "gū",
      "gú"
    ],
    "char_distractors": [
      "古",
      "顾",
      "做"
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
      "xiān",
      "xiáng",
      "xiǎng"
    ],
    "char_distractors": [
      "香",
      "想",
      "多"
    ],
    "unit": "2-5",
    "radical": "乙",
    "structure": "独体",
    "strokeCount": 3,
    "type": "pinyin"
  },
  {
    "char": "午",
    "pinyin": "wǔ",
    "distractors": [
      "wū",
      "wú",
      "wù"
    ],
    "char_distractors": [
      "牛",
      "五",
      "半"
    ],
    "unit": "2-7",
    "radical": "十",
    "structure": "独体",
    "type": "pinyin"
  },
  {
    "char": "节",
    "pinyin": "jié",
    "distractors": [
      "qié",
      "jiē",
      "jiě"
    ],
    "char_distractors": [
      "草",
      "结",
      "花"
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
      "yé",
      "yě"
    ],
    "char_distractors": [
      "叫",
      "也",
      "草"
    ],
    "unit": "2-7",
    "radical": "口",
    "structure": "左右",
    "type": "pinyin"
  },
  {
    "char": "快",
    "pinyin": "kuài",
    "distractors": [
      "guài",
      "kuāi",
      "kuái"
    ],
    "char_distractors": [
      "块",
      "筷",
      "乐"
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
      "nè",
      "lē",
      "lé"
    ],
    "char_distractors": [
      "了",
      "勒",
      "快"
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
      "chuǐ"
    ],
    "char_distractors": [
      "次",
      "炒",
      "叫"
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
      "xìn",
      "xīng",
      "xíng"
    ],
    "char_distractors": [
      "性",
      "星",
      "好"
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
      "sén",
      "shéng",
      "shēn"
    ],
    "char_distractors": [
      "十",
      "神",
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
      "mé",
      "mě"
    ],
    "char_distractors": [
      "公",
      "末",
      "多"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "古",
    "pinyin": "gǔ",
    "radical": "口",
    "structure": "上下",
    "strokeCount": 5,
    "distractors": [
      "kǔ",
      "gū",
      "gú"
    ],
    "char_distractors": [
      "故",
      "苦",
      "十"
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
      "fú",
      "hū",
      "hǔ"
    ],
    "char_distractors": [
      "湖",
      "糊",
      "月"
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
      "shuān",
      "shuáng",
      "shuǎng"
    ],
    "char_distractors": [
      "对",
      "爽",
      "又"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "言",
    "pinyin": "yán",
    "radical": "言",
    "structure": "独体",
    "strokeCount": 7,
    "distractors": [
      "yáng",
      "yān",
      "yǎn"
    ],
    "char_distractors": [
      "说",
      "眼",
      "语"
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
      "qīn",
      "jīng",
      "qíng"
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
      "qīn",
      "jīng",
      "qíng"
    ],
    "char_distractors": [
      "青",
      "请",
      "晴"
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
      "qín",
      "jíng",
      "qīng"
    ],
    "char_distractors": [
      "睛",
      "情",
      "清"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "字",
    "pinyin": "zì",
    "radical": "子",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "zhì",
      "zī",
      "zí"
    ],
    "char_distractors": [
      "子",
      "自",
      "学"
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
      "dùn",
      "tòng",
      "dōng"
    ],
    "char_distractors": [
      "功",
      "冬",
      "力"
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
      "wàng",
      "wān",
      "wán"
    ],
    "char_distractors": [
      "方",
      "晚",
      "千"
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
      "午",
      "元"
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
      "mín",
      "mīng",
      "mǐng"
    ],
    "char_distractors": [
      "朋",
      "名",
      "阳"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "卡",
    "pinyin": "kǎ",
    "radical": "丨",
    "structure": "上下",
    "strokeCount": 5,
    "distractors": [
      "gǎ",
      "kā",
      "ká"
    ],
    "char_distractors": [
      "下",
      "咖",
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
      "biàn",
      "piān",
      "pián"
    ],
    "char_distractors": [
      "版",
      "偏",
      "斤"
    ],
    "unit": "2-1",
    "type": "pinyin"
  },
  {
    "char": "合",
    "pinyin": "hé",
    "radical": "口",
    "structure": "上中下",
    "strokeCount": 6,
    "distractors": [
      "hē",
      "hě",
      "hè"
    ],
    "char_distractors": [
      "会",
      "河",
      "全"
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
      "gùn",
      "kòng",
      "gōng"
    ],
    "char_distractors": [
      "工",
      "拱",
      "公"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "产",
    "pinyin": "chǎn",
    "radical": "亠",
    "structure": "独体",
    "strokeCount": 6,
    "distractors": [
      "cǎn",
      "chǎng",
      "chān"
    ],
    "char_distractors": [
      "厂",
      "铲",
      "生"
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
      "dài",
      "tāi",
      "tái"
    ],
    "char_distractors": [
      "大",
      "台",
      "天"
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
      "yán",
      "yāng",
      "yǎng"
    ],
    "char_distractors": [
      "阴",
      "羊",
      "阵"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "井",
    "pinyin": "jǐng",
    "radical": "二",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "jǐn",
      "qǐng",
      "jīng"
    ],
    "char_distractors": [
      "开",
      "景",
      "升"
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
      "fān",
      "hāng",
      "fáng"
    ],
    "char_distractors": [
      "万",
      "房",
      "放"
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
      "fòu",
      "hōu",
      "hóu"
    ],
    "char_distractors": [
      "向",
      "候",
      "前"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "高",
    "pinyin": "gāo",
    "radical": "高",
    "structure": "上下",
    "strokeCount": 10,
    "distractors": [
      "kāo",
      "gáo",
      "gǎo"
    ],
    "char_distractors": [
      "亮",
      "告",
      "京"
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
      "biě",
      "pěi",
      "bēi"
    ],
    "char_distractors": [
      "比",
      "背",
      "此"
    ],
    "unit": "2-2",
    "type": "pinyin"
  },
  {
    "char": "京",
    "pinyin": "jīng",
    "radical": "亠",
    "structure": "上中下",
    "strokeCount": 8,
    "distractors": [
      "jīn",
      "qīng",
      "jíng"
    ],
    "char_distractors": [
      "高",
      "经",
      "亮"
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
      "guǎn",
      "kuǎng",
      "guāng"
    ],
    "char_distractors": [
      "厂",
      "逛",
      "庄"
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
      "xié",
      "xiè"
    ],
    "char_distractors": [
      "与",
      "泻",
      "字"
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
      "rèng",
      "rēn",
      "rén"
    ],
    "char_distractors": [
      "让",
      "人",
      "讲"
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
      "ràn",
      "làng",
      "rāng"
    ],
    "char_distractors": [
      "认",
      "壤",
      "讲"
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
      "zhì",
      "zī",
      "zí"
    ],
    "char_distractors": [
      "白",
      "字",
      "目"
    ],
    "unit": "2-3",
    "type": "pinyin"
  },
  {
    "char": "已",
    "pinyin": "yǐ",
    "radical": "己",
    "structure": "独体",
    "strokeCount": 3,
    "distractors": [
      "yī",
      "yí",
      "yì"
    ],
    "char_distractors": [
      "己",
      "以",
      "巳"
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
      "háo",
      "hào"
    ],
    "char_distractors": [
      "如",
      "号",
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
      "huá",
      "huǎ"
    ],
    "char_distractors": [
      "书",
      "化",
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
      "猫",
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
      "dái",
      "tāi",
      "tǎi"
    ],
    "char_distractors": [
      "合",
      "太",
      "右"
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
      "càng",
      "chàn",
      "chāng"
    ],
    "char_distractors": [
      "昌",
      "常",
      "吹"
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
      "shǎn",
      "sǎng",
      "sān"
    ],
    "char_distractors": [
      "全",
      "散",
      "合"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "朵",
    "pinyin": "duǒ",
    "radical": "木",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "tuǒ",
      "duō",
      "duó"
    ],
    "char_distractors": [
      "花",
      "蹲",
      "果"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "美",
    "pinyin": "měi",
    "radical": "八",
    "structure": "上下",
    "strokeCount": 9,
    "distractors": [
      "miě",
      "mēi",
      "méi"
    ],
    "char_distractors": [
      "羊",
      "每",
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
      "zè",
      "zhē",
      "zhé"
    ],
    "char_distractors": [
      "过",
      "遮",
      "还"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "看",
    "pinyin": "kàn",
    "radical": "目",
    "structure": "上下",
    "strokeCount": 9,
    "distractors": [
      "kàng",
      "gàn",
      "kān"
    ],
    "char_distractors": [
      "着",
      "刊",
      "见"
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
      "miān",
      "mián",
      "miǎn"
    ],
    "char_distractors": [
      "目",
      "棉",
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
      "qiā",
      "jiá",
      "jiǎ"
    ],
    "char_distractors": [
      "力",
      "家",
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
      "tòu",
      "dōu",
      "dóu"
    ],
    "char_distractors": [
      "头",
      "读",
      "斗"
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
      "tǒu",
      "dōu",
      "dóu"
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
      "mí",
      "mì"
    ],
    "char_distractors": [
      "木",
      "迷",
      "禾"
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
      "jiāng",
      "qiān",
      "jián"
    ],
    "char_distractors": [
      "门",
      "件",
      "问"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "分",
    "pinyin": "fēn",
    "radical": "刀",
    "structure": "上下",
    "strokeCount": 4,
    "distractors": [
      "fēng",
      "hēn",
      "fén"
    ],
    "char_distractors": [
      "八",
      "份",
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
      "lòu",
      "rōu",
      "róu"
    ],
    "char_distractors": [
      "内",
      "柔",
      "月"
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
      "zǐ",
      "zhī",
      "zhí"
    ],
    "char_distractors": [
      "正",
      "只",
      "步"
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
      "jīng",
      "qīn",
      "jín"
    ],
    "char_distractors": [
      "斗",
      "巾",
      "片"
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
      "chùn",
      "còng",
      "cūn"
    ],
    "char_distractors": [
      "才",
      "村",
      "对"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "千",
    "pinyin": "qiān",
    "radical": "十",
    "structure": "上下",
    "strokeCount": 3,
    "distractors": [
      "qiāng",
      "jiān",
      "qián"
    ],
    "char_distractors": [
      "十",
      "迁",
      "万"
    ],
    "unit": "2-4",
    "type": "pinyin"
  },
  {
    "char": "元",
    "pinyin": "yuán",
    "radical": "二",
    "structure": "独体",
    "strokeCount": 4,
    "distractors": [
      "yuān",
      "yuǎn",
      "yuàn"
    ],
    "char_distractors": [
      "无",
      "圆",
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
      "yàn",
      "yāng",
      "yáng"
    ],
    "char_distractors": [
      "杨",
      "养",
      "林"
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
      "xiáo",
      "xiǎo"
    ],
    "char_distractors": [
      "竹",
      "小",
      "哭"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "再",
    "pinyin": "zài",
    "radical": "冂",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "zhài",
      "zāi",
      "zái"
    ],
    "char_distractors": [
      "在",
      "才",
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
      "gè",
      "kē",
      "ké"
    ],
    "char_distractors": [
      "读",
      "棵",
      "说"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "坐",
    "pinyin": "zuò",
    "radical": "土",
    "structure": "上下",
    "strokeCount": 7,
    "distractors": [
      "zhuò",
      "zuō",
      "zuó"
    ],
    "char_distractors": [
      "座",
      "做",
      "左"
    ],
    "unit": "2-5",
    "type": "pinyin"
  },
  {
    "char": "老",
    "pinyin": "lǎo",
    "radical": "耂",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "nǎo",
      "rǎo",
      "lāo"
    ],
    "char_distractors": [
      "考",
      "姥",
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
      "sī",
      "shí",
      "shǐ"
    ],
    "char_distractors": [
      "帅",
      "诗",
      "老"
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
      "kuó",
      "guō",
      "guǒ"
    ],
    "char_distractors": [
      "回",
      "过",
      "园"
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
      "tōu",
      "dóu",
      "dǒu"
    ],
    "char_distractors": [
      "部",
      "读",
      "郑"
    ],
    "unit": "2-6",
    "type": "pinyin"
  },
  {
    "char": "百",
    "pinyin": "bǎi",
    "radical": "白",
    "structure": "上下",
    "strokeCount": 6,
    "distractors": [
      "pǎi",
      "bāi",
      "bái"
    ],
    "char_distractors": [
      "白",
      "柏",
      "自"
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
      "sí",
      "shī",
      "shǐ"
    ],
    "char_distractors": [
      "日",
      "十",
      "明"
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
      "tiǎn",
      "diān",
      "dián"
    ],
    "char_distractors": [
      "占",
      "电",
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
      "nín",
      "līn"
    ],
    "char_distractors": [
      "木",
      "邻",
      "森"
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
      "xìn",
      "xīng",
      "xíng"
    ],
    "char_distractors": [
      "光",
      "星",
      "半"
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
      "wǎn",
      "wāng",
      "wáng"
    ],
    "char_distractors": [
      "住",
      "忘",
      "注"
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
      "kuā",
      "guá",
      "guǎ"
    ],
    "char_distractors": [
      "爪",
      "挂",
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
      "dù",
      "tū",
      "tú"
    ],
    "char_distractors": [
      "免",
      "吐",
      "象"
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
      "jìng",
      "qìn",
      "jīn"
    ],
    "char_distractors": [
      "近",
      "金",
      "还"
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
      "dēn",
      "tēng",
      "déng"
    ],
    "char_distractors": [
      "灭",
      "等",
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
      "cē",
      "ché",
      "chě"
    ],
    "char_distractors": [
      "东",
      "扯",
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
      "zàn",
      "zhàng",
      "zhān"
    ],
    "char_distractors": [
      "立",
      "战",
      "竞"
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
      "kūn",
      "gōng",
      "kóng"
    ],
    "char_distractors": [
      "穴",
      "孔",
      "宝"
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
      "pǐ",
      "bī",
      "bí"
    ],
    "char_distractors": [
      "竹",
      "比",
      "写"
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
      "zī",
      "zhí",
      "zhǐ"
    ],
    "char_distractors": [
      "矢",
      "只",
      "智"
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
      "tào",
      "dāo",
      "dáo"
    ],
    "char_distractors": [
      "首",
      "到",
      "路"
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
      "fàn",
      "hàng",
      "fāng"
    ],
    "char_distractors": [
      "方",
      "房",
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
      "pín",
      "bíng",
      "pīng"
    ],
    "char_distractors": [
      "干",
      "评",
      "半"
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
      "āng",
      "án",
      "ǎn"
    ],
    "char_distractors": [
      "家",
      "暗",
      "全"
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
      "gāng",
      "kān",
      "gán"
    ],
    "char_distractors": [
      "千",
      "赶",
      "十"
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
      "sēn",
      "shēng",
      "shén"
    ],
    "char_distractors": [
      "自",
      "深",
      "体"
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
      "xīn",
      "xíng",
      "xǐng"
    ],
    "char_distractors": [
      "晴",
      "姓",
      "明"
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
      "qiǔ",
      "jiū",
      "jiú"
    ],
    "char_distractors": [
      "九",
      "旧",
      "及"
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
      "xiá",
      "xiǎ"
    ],
    "char_distractors": [
      "叫",
      "下",
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
      "wēi",
      "wěi",
      "wèi"
    ],
    "char_distractors": [
      "办",
      "围",
      "力"
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
      "bà",
      "pā",
      "pá"
    ],
    "char_distractors": [
      "伯",
      "拍",
      "怪"
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
      "qiā",
      "jiá",
      "jiǎ"
    ],
    "char_distractors": [
      "安",
      "假",
      "宝"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "象",
    "pinyin": "xiàng",
    "radical": "豕",
    "structure": "上下",
    "strokeCount": 11,
    "distractors": [
      "xiàn",
      "xiāng",
      "xiáng"
    ],
    "char_distractors": [
      "像",
      "向",
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
      "mié",
      "mēi",
      "měi"
    ],
    "char_distractors": [
      "每",
      "梅",
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
      "tào",
      "dāo",
      "dáo"
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
      "xiàn",
      "xiāng",
      "xiáng"
    ],
    "char_distractors": [
      "问",
      "象",
      "同"
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
      "piān",
      "bián",
      "biǎn"
    ],
    "char_distractors": [
      "过",
      "变",
      "还"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "行",
    "pinyin": "xíng",
    "radical": "行",
    "structure": "左右",
    "strokeCount": 6,
    "distractors": [
      "xín",
      "xīng",
      "xǐng"
    ],
    "char_distractors": [
      "走",
      "形",
      "很"
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
      "chǎo",
      "cāo",
      "cáo"
    ],
    "char_distractors": [
      "花",
      "早",
      "苗"
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
      "gǎng",
      "kǎn",
      "gān"
    ],
    "char_distractors": [
      "起",
      "敢",
      "走"
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
      "kuò",
      "guō",
      "guó"
    ],
    "char_distractors": [
      "这",
      "锅",
      "还"
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
      "zǎo",
      "zhāo",
      "zháo"
    ],
    "char_distractors": [
      "我",
      "招",
      "打"
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
      "jīng",
      "qīn",
      "jín"
    ],
    "char_distractors": [
      "市",
      "斤",
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
      "xí",
      "xì"
    ],
    "char_distractors": [
      "选",
      "喜",
      "河"
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
      "yē",
      "yé",
      "yě"
    ],
    "char_distractors": [
      "贝",
      "叶",
      "见"
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
      "fù",
      "hū",
      "hú"
    ],
    "char_distractors": [
      "门",
      "护",
      "斤"
    ],
    "unit": "2-8",
    "type": "pinyin"
  },
  {
    "char": "角",
    "pinyin": "jiǎo",
    "radical": "角",
    "structure": "独体",
    "strokeCount": 7,
    "distractors": [
      "qiǎo",
      "jiāo",
      "jiáo"
    ],
    "char_distractors": [
      "用",
      "脚",
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
      "hù",
      "fū",
      "fú"
    ],
    "char_distractors": [
      "爸",
      "付",
      "爷"
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
      "议",
      "文"
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
