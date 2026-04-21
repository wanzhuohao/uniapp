<template>
  <div class="help-page">
    <div class="paper-noise" />

    <header class="help-top-bar">
      <el-button text @click="onBack" class="back-btn">← 返回列表</el-button>
    </header>

    <div class="help-scroll">
      <!-- 卷轴上端 -->
      <div class="scroll-rod scroll-rod-top">
        <span class="rod-seal">说</span>
      </div>

      <div class="help-body">
        <div class="help-title-block">
          <h2 class="help-title">碑文录入操作说明</h2>
          <p class="help-subtitle">Stele · Artcut Manual</p>
          <p class="help-lead">订单提交后，需要将碑文文案录入到文泰刻绘软件（Artcut）中进行排版和刻字输出。以下为完整操作步骤。</p>
        </div>

        <section class="help-section" v-for="(sec, idx) in sections" :key="idx">
          <div class="section-head">
            <span class="section-no">{{ sec.no }}</span>
            <h3 class="section-title">{{ sec.title }}</h3>
            <span class="section-line" />
          </div>
          <div class="section-body">
            <p v-if="sec.p" v-html="sec.p"></p>
            <div v-if="sec.img" class="help-img-wrap">
              <img :src="sec.img" :alt="sec.title" />
            </div>
            <table v-if="sec.table" class="help-table">
              <tr v-for="(tr, i) in sec.table" :key="i">
                <template v-if="i === 0">
                  <th v-for="(c, j) in tr" :key="j">{{ c }}</th>
                </template>
                <template v-else>
                  <td v-for="(c, j) in tr" :key="j">{{ c }}</td>
                </template>
              </tr>
            </table>
            <ol v-if="sec.ol">
              <li v-for="(item, i) in sec.ol" :key="i" v-html="item"></li>
            </ol>
            <div v-if="sec.warn" class="help-warn">
              <span class="warn-label">注</span>
              <span>{{ sec.warn }}</span>
            </div>
          </div>
        </section>

        <div class="help-signature">
          <span class="sig-dash">·</span>
          <span class="sig-txt">以上为全部流程</span>
          <span class="sig-dash">·</span>
        </div>
      </div>

      <!-- 卷轴下端 -->
      <div class="scroll-rod scroll-rod-bottom" />
    </div>
  </div>
</template>

<script lang="ts" setup>
function onBack() {
  uni.redirectTo({ url: '/pages/stele/list' });
}

const sections = [
  {
    no: '壹',
    title: '找到订单',
    p: '打开碑文系统，在订单列表中找到目标订单，点击<b>「编辑」</b>进入编辑页。可通过搜索框输入客户名称或逝者姓名快速定位。',
    img: 'https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553275040-ghm50g.jpg',
  },
  {
    no: '貳',
    title: '复制碑文文案',
    p: '进入编辑页后，右侧预览区上方有一排复制按钮，按顺序逐个复制：',
    img: 'https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553277661-hu1sh3.jpg',
    table: [
      ['顺序', '内容', '复制按钮'],
      ['1', '大字（碑面主文）', '大字'],
      ['2', '横批（碑顶）', '横批'],
      ['3', '小字（立碑人名单）', '小字'],
      ['4', '生卒日期', '生卒'],
      ['5', '立碑日期', '立碑日期'],
    ],
  },
  {
    no: '叄',
    title: '打开文泰快速录入',
    p: '打开文泰刻绘 2009，点击菜单栏<b>「文本」→「Q 快速录入」</b>（或按 <code>Ctrl + Q</code>）。',
    img: 'https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553279662-4mlycn.jpg',
  },
  {
    no: '肆',
    title: '粘贴文字并确认',
    p: '在弹出的「文字快速录入」对话框中，按 <code>Ctrl + V</code> 粘贴刚才复制的文案，然后点击<b>「确认」</b>。文字会出现在画布上。',
    img: 'https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553281017-3agxna.jpg',
  },
  {
    no: '伍',
    title: '取消选中，录入下一段',
    p: '文字出现在画布后，先调整位置和字体大小，然后：',
    ol: [
      '点击右侧工具栏顶部的<b>箭头工具</b>（见图中红色箭头）',
      '在画布空白处<b>点击一下</b>取消选中',
      '按 <code>Ctrl + Q</code> 打开录入框，粘贴下一段文案',
      '重复以上步骤，直到 5 段文案全部录入完毕',
    ],
    img: 'https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553282265-2g3lp8.jpg',
    warn: '每录入一段文字后，必须先点空白处取消选中，否则 Ctrl+Q 无法打开新的录入框。箭头工具只需在第一次切换，之后不用再点。',
  },
  {
    no: '陸',
    title: '录入完成',
    p: '所有文字块录入完毕后，在文泰中拖动各文字块到碑面对应位置进行排版，然后输出刻字。',
  },
];
</script>

<style scoped>
.help-page {
  position: relative;
  padding: 32px 16px 64px;
  background:
    radial-gradient(ellipse at top left, #F3ECE0 0%, transparent 55%),
    radial-gradient(ellipse at bottom right, #EFE8DC 0%, transparent 60%),
    #F6F1E8;
  min-height: 100vh;
}
.paper-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.588  0 0 0 0 0.439  0 0 0 0 0.039  0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

.help-top-bar {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}
.help-top-bar .back-btn {
  color: var(--color-primary) !important;
  font-size: 14px;
  font-family: var(--font-display);
  letter-spacing: 2px;
}

/* ===== 卷轴容器 ===== */
.help-scroll {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
}

/* 卷轴杆 */
.scroll-rod {
  position: relative;
  height: 20px;
  margin: 0 -6px;
  background:
    linear-gradient(180deg, #8B6914 0%, #B8860B 30%, #96700A 70%, #6B5010 100%);
  border-radius: 10px;
  box-shadow:
    0 3px 10px rgba(44, 36, 32, 0.25),
    0 0 0 1px rgba(44, 36, 32, 0.15) inset;
}
.scroll-rod::before,
.scroll-rod::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #D4A528, #96700A 60%, #4A3708);
  transform: translateY(-50%);
  box-shadow: 0 4px 12px rgba(44, 36, 32, 0.35);
}
.scroll-rod::before { left: -10px; }
.scroll-rod::after { right: -10px; }

.scroll-rod-top {
  border-radius: 10px 10px 0 0;
  box-shadow:
    0 -2px 8px rgba(44, 36, 32, 0.2),
    0 0 0 1px rgba(44, 36, 32, 0.15) inset;
}

.rod-seal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border: 2px solid #A13732;
  background: #FDF8EC;
  color: #A13732;
  font-family: var(--font-display);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

/* ===== 卷轴正文：宣纸 ===== */
.help-body {
  position: relative;
  background: #FFFDF5;
  padding: 48px 48px 56px;
  box-shadow:
    0 1px 0 rgba(150, 112, 10, 0.2) inset,
    0 -1px 0 rgba(150, 112, 10, 0.2) inset,
    0 8px 24px rgba(44, 36, 32, 0.08),
    inset 0 0 80px rgba(150, 112, 10, 0.04);
  border-left: 1px solid rgba(150, 112, 10, 0.2);
  border-right: 1px solid rgba(150, 112, 10, 0.2);
  animation: unroll 0.8s ease both;
}
/* 竖向边栏装饰线 */
.help-body::before,
.help-body::after {
  content: "";
  position: absolute;
  top: 24px;
  bottom: 24px;
  width: 1px;
  background: rgba(150, 112, 10, 0.15);
}
.help-body::before { left: 24px; }
.help-body::after { right: 24px; }

.help-title-block {
  text-align: center;
  padding-bottom: 32px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(150, 112, 10, 0.2);
  position: relative;
}
.help-title-block::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 8px;
  background: #FFFDF5;
  border-bottom: 1px solid rgba(150, 112, 10, 0.2);
}
.help-title {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 500;
  color: #2C2420;
  font-family: var(--font-display);
  letter-spacing: 8px;
}
.help-subtitle {
  margin: 0 0 20px;
  font-size: 13px;
  color: #96700A;
  font-style: italic;
  letter-spacing: 4px;
  text-transform: uppercase;
  opacity: 0.7;
}
.help-lead {
  margin: 0 auto;
  font-size: 15px;
  color: #5C4E42;
  line-height: 1.9;
  letter-spacing: 1px;
  max-width: 600px;
  text-align: left;
  text-indent: 2em;
}

/* ===== 章节 ===== */
.help-section {
  margin-bottom: 36px;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.section-no {
  width: 44px;
  height: 44px;
  border: 2px solid #A13732;
  background: #FDF8EC;
  color: #A13732;
  font-family: var(--font-display);
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transform: rotate(-2deg);
  flex-shrink: 0;
}
.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  color: #2C2420;
  font-family: var(--font-display);
  letter-spacing: 4px;
}
.section-line {
  flex: 1;
  height: 10px;
  background-image: var(--brush-line-url);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  margin-left: 8px;
  opacity: 0.8;
}
.section-body {
  padding-left: 60px;
}
.section-body p {
  margin: 0 0 12px;
  line-height: 2;
  color: #3C342E;
  font-size: 15px;
  letter-spacing: 1px;
  text-indent: 2em;
}
.section-body ol {
  margin: 12px 0;
  padding-left: 20px;
}
.section-body ol li {
  line-height: 2;
  color: #3C342E;
  font-size: 15px;
  letter-spacing: 1px;
  padding-left: 6px;
}
.section-body ol li::marker {
  color: #A13732;
  font-family: var(--font-display);
}

.section-body code {
  background: #F6EFE0;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 13px;
  color: #A13732;
  font-family: Consolas, Monaco, monospace;
  border: 1px solid rgba(161, 55, 50, 0.2);
}

.help-img-wrap {
  margin: 16px 0;
  padding: 8px;
  background: #FAF3E4;
  border: 1px solid rgba(150, 112, 10, 0.25);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(44, 36, 32, 0.06);
}
.help-img-wrap img {
  width: 100%;
  display: block;
  border-radius: 2px;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-family: var(--font-display);
}
.help-table th,
.help-table td {
  border: 1px solid rgba(150, 112, 10, 0.3);
  padding: 10px 14px;
  text-align: left;
  letter-spacing: 2px;
}
.help-table th {
  background: #F6EFE0;
  color: var(--color-primary);
  font-weight: 500;
  font-size: 14px;
}
.help-table td {
  font-size: 14px;
  color: #3C342E;
}
.help-table tr:nth-child(even) td { background: rgba(246, 239, 224, 0.3); }

.help-warn {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 14px 18px;
  background: rgba(161, 55, 50, 0.05);
  border-left: 3px solid #A13732;
  border-radius: 2px;
  color: #6E2824;
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 1px;
}
.warn-label {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: #A13732;
  color: #FDF8EC;
  font-family: var(--font-display);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.help-signature {
  margin-top: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(150, 112, 10, 0.6);
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 6px;
}
.sig-dash { opacity: 0.5; }

.scroll-rod-bottom {
  border-radius: 0 0 10px 10px;
  box-shadow:
    0 2px 8px rgba(44, 36, 32, 0.2),
    0 0 0 1px rgba(44, 36, 32, 0.15) inset;
}

@keyframes unroll {
  from {
    opacity: 0;
    transform: scaleY(0.92);
    transform-origin: top;
  }
  to {
    opacity: 1;
    transform: scaleY(1);
    transform-origin: top;
  }
}

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .help-page { padding: 16px 8px 40px; }
  .help-body {
    padding: 32px 20px 40px;
  }
  .help-body::before,
  .help-body::after { display: none; }
  .help-title { font-size: 24px; letter-spacing: 6px; }
  .help-subtitle { font-size: 11px; }
  .help-lead { font-size: 14px; }
  .section-head { gap: 12px; }
  .section-no { width: 36px; height: 36px; font-size: 18px; }
  .section-title { font-size: 18px; letter-spacing: 3px; }
  .section-body { padding-left: 0; }
  .section-body p, .section-body ol li { font-size: 14px; }
  .help-table th, .help-table td { padding: 8px 10px; font-size: 13px; }
  .scroll-rod { height: 16px; }
  .scroll-rod::before, .scroll-rod::after { width: 24px; height: 24px; }
  .rod-seal { width: 26px; height: 26px; font-size: 14px; }
}
</style>
