# 测试注意事项

## Playwright 自动化测试 uniCloud 站点有防刷风险

headless Chromium 的 bot 特征（`navigator.webdriver`、UA、无鼠标轨迹）可能触发 uniCloud 防刷限流，即使 QPS 远低于上限也会返回 `[DCloud-clientDB]: 防刷限流异常-触发禁止访问规则`，IP 被临时封禁 360 秒。

### 2026-04-10 实际案例

统一平台（本项目）发布验证时用 Playwright 跑约 10 分钟自动化测试（2 分钟内约 10~15 个查询），IP 被临时封禁 360 秒，一度让用户以为"碑文数据丢了"。错误信息是 `[DCloud-clientDB]: 防刷限流异常-触发禁止访问规则`，不是 QPS 超限，而是 bot 检测规则。

### 使用前告知

在 uniCloud 项目上用 Playwright 前，**先告知用户风险**，让他决定是否接受。

### 缓解措施

- 自动化测试节奏放慢（每个操作之间隔 2~3 秒）
- 关键断言用 `browser_evaluate` 读 DOM 代替多次 snapshot
- 触发封禁后建议用户：
  1. 换 4G 网络立即恢复访问
  2. 等 6 分钟自动解封
  3. 到 uniCloud 控制台直接看数据表证明数据没丢

### 长期改进

到 uniCloud 控制台调整防刷规则的白名单或 bot 检测等级。
