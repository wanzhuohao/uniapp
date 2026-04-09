<template>
  <div class="help-page">
    <header class="help-top-bar">
      <el-button text @click="onBack" class="back-btn">← 返回列表</el-button>
      <h2 class="help-title">碑文录入操作说明</h2>
    </header>

    <div class="help-body">
      <section class="help-section">
        <p>订单提交后，需要将碑文文案录入到文泰刻绘软件（Artcut）中进行排版和刻字输出。以下是完整操作步骤。</p>
      </section>

      <section class="help-section">
        <h3>一、找到订单</h3>
        <p>打开碑文系统，在订单列表中找到目标订单，点击「编辑」进入编辑页。可通过搜索框输入客户名称或逝者姓名快速定位。</p>
        <div class="help-img-wrap">
          <img src="https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553275040-ghm50g.jpg" alt="订单列表页" />
        </div>
      </section>

      <section class="help-section">
        <h3>二、复制碑文文案</h3>
        <p>进入编辑页后，右侧预览区上方有一排复制按钮，按顺序逐个复制：</p>
        <div class="help-img-wrap">
          <img src="https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553277661-hu1sh3.jpg" alt="编辑页复制按钮" />
        </div>
        <table class="help-table">
          <tr><th>顺序</th><th>内容</th><th>复制按钮</th></tr>
          <tr><td>1</td><td>大字（碑面主文）</td><td>大字</td></tr>
          <tr><td>2</td><td>横批（碑顶）</td><td>横批</td></tr>
          <tr><td>3</td><td>小字（立碑人名单）</td><td>小字</td></tr>
          <tr><td>4</td><td>生卒日期</td><td>生卒</td></tr>
          <tr><td>5</td><td>立碑日期</td><td>立碑日期</td></tr>
        </table>
      </section>

      <section class="help-section">
        <h3>三、打开文泰快速录入</h3>
        <p>打开文泰刻绘2009，点击菜单栏「文本」→「Q快速录入」（或按 <code>Ctrl + Q</code>）。</p>
        <div class="help-img-wrap">
          <img src="https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553279662-4mlycn.jpg" alt="文泰快速录入菜单" />
        </div>
      </section>

      <section class="help-section">
        <h3>四、粘贴文字并确认</h3>
        <p>在弹出的「文字快速录入」对话框中，按 <code>Ctrl + V</code> 粘贴刚才复制的文案，然后点击「确认」。文字会出现在画布上。</p>
        <div class="help-img-wrap">
          <img src="https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553281017-3agxna.jpg" alt="粘贴文字并确认" />
        </div>
      </section>

      <section class="help-section">
        <h3>五、取消选中，录入下一段</h3>
        <p>文字出现在画布后，先调整位置和字体大小，然后：</p>
        <ol>
          <li>点击右侧工具栏顶部的<b>箭头工具</b>（见图中红色箭头）</li>
          <li>在画布空白处<b>点击一下</b>取消选中</li>
          <li>按 <code>Ctrl + Q</code> 打开录入框，粘贴下一段文案</li>
          <li>重复以上步骤，直到 5 段文案全部录入完毕</li>
        </ol>
        <div class="help-img-wrap">
          <img src="https://env-00jxhanvoaj1.normal.cloudstatic.cn/photos/1775553282265-2g3lp8.jpg" alt="取消选中" />
        </div>
        <div class="help-warn">每录入一段文字后，必须先点空白处取消选中，否则 Ctrl+Q 无法打开新的录入框。箭头工具只需在第一次切换，之后不用再点。</div>
      </section>

      <section class="help-section">
        <h3>录入完成后</h3>
        <p>所有文字块录入完毕后，在文泰中拖动各文字块到碑面对应位置进行排版，然后输出刻字。</p>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
function onBack() {
  uni.redirectTo({ url: '/pages/stele/list' });
}
</script>

<style scoped>
.help-page {
  padding: 24px;
  background: linear-gradient(180deg, #EDE8E2 0%, var(--color-bg-blue-light) 100%);
  min-height: 100vh;
}
.help-top-bar {
  display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 12px 0;
}
.help-top-bar .back-btn { color: var(--color-primary); font-size: 14px; }
.help-title { margin: 0; font-size: 18px; font-weight: 600; color: var(--color-primary); }
.help-body {
  background: #fff; padding: 24px; border-radius: 12px;
  box-shadow: 0 4px 16px rgba(184, 134, 11, 0.1);
  border: 1px solid var(--color-border); max-width: 900px;
}
.help-section { margin-bottom: 32px; }
.help-section:last-child { margin-bottom: 0; }
.help-section h3 {
  font-size: 16px; font-weight: 600; color: var(--color-primary);
  margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid var(--color-border);
}
.help-section ol, .help-section ul { padding-left: 20px; margin: 8px 0; line-height: 2; }
.help-section p { margin: 8px 0; line-height: 1.8; }
.help-section code {
  background: var(--color-bg-blue-light); padding: 2px 6px;
  border-radius: 4px; font-size: 13px; color: var(--color-primary);
}
.help-img-wrap { margin: 12px 0; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
.help-img-wrap img { width: 100%; display: block; }
.help-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
.help-table th, .help-table td { border: 1px solid var(--color-border); padding: 8px 12px; text-align: left; }
.help-table th { background: var(--color-bg-blue-light); color: var(--color-primary); font-weight: 600; }
.help-warn {
  margin-top: 8px; padding: 8px 12px; background: #fff7e6;
  border: 1px solid #ffe58f; border-radius: 6px; color: #d46b08; font-size: 13px;
}
</style>
