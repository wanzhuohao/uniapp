// 飞机大战 - 游戏引擎（与 Vue 解耦的纯 JS）
// 由 vue 页面创建实例，传入 canvas ctx / 尺寸 / 回调

import { pickSkills, pickBoxReward } from './skills.js';

export function createEngine(opts) {
  const { ctx, dpr = 1, onUpgrade, onGameOver, onStats } = opts;
  let width = opts.width;
  let height = opts.height;
  const raf = opts.raf || ((cb) => requestAnimationFrame(cb));
  const caf = opts.caf || ((id) => cancelAnimationFrame(id));

  // 尺寸基准：取屏宽/屏高较小值的 1/30，确保横竖屏元素大小一致
  function unit() { return Math.min(width, height) / 30; }

  // 玩家
  const player = {
    x: width / 2,
    y: height - unit() * 6,
    r: unit() * 1.1,
    hp: 3,
    maxHp: 3,
    speed: width / 30 * 20,  // ~ 20 unit/s
    fireInterval: 320,    // ms
    fireTimer: 0,
    bulletCount: 1,
    damage: 1,
    shield: 0,
    pierce: 0,
    xpRate: 1,
    invuln: 0,            // 受击无敌时间 ms
  };

  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const boxes = [];
  const particles = [];
  const floatTexts = [];

  let xp = 0;
  let level = 1;
  let xpNeed = 6;
  let kills = 0;
  let elapsed = 0;       // ms
  let spawnTimer = 0;
  let spawnInterval = 900;
  let running = false;
  let paused = false;
  let lastTs = 0;
  let rafId = null;
  let gameOver = false;
  const skillLevels = {};

  // 输入
  const input = {
    target: null,        // 触屏拖拽目标 {x,y}
    keys: new Set(),     // 键盘
  };

  function setTarget(x, y) {
    input.target = { x, y };
  }
  function clearTarget() {
    input.target = null;
  }
  function keyDown(k) { input.keys.add(k); }
  function keyUp(k) { input.keys.delete(k); }

  // 实体工厂
  function spawnEnemy() {
    // tier 切换：0-20s tier0; 20-40s tier1; 40-60s tier2; 60s+ tier3
    const tier = Math.min(3, Math.floor(elapsed / 20000));
    const u = unit();
    const r = u * (0.7 + Math.random() * 0.3 + tier * 0.12);
    const palette = ['#FF3D5A', '#FF9F1C', '#B14AED', '#2EC4B6', '#F72585'];
    // 精英怪概率：tier1=30%, tier2=50%, tier3=70%
    const eliteChance = [0, 0.3, 0.5, 0.7][tier];
    const isElite = Math.random() < eliteChance;
    enemies.push({
      x: r + Math.random() * (width - r * 2),
      y: -r,
      r,
      vy: u * (5 + Math.random() * 3 + tier * 1.8),
      vx: (Math.random() - 0.5) * u * 2,
      hp: 1 + tier + (isElite ? 1 : 0),
      maxHp: 1 + tier + (isElite ? 1 : 0),
      xp: 1 + tier + (isElite ? 1 : 0),
      color: palette[Math.floor(Math.random() * palette.length)],
      elite: isElite,
      fireTimer: -800 - Math.random() * 800, // 错开首次开火时机
      fireInterval: 1800 + Math.random() * 800 - tier * 150
    });
  }

  function spawnEnemyBullet(e) {
    const u = unit();
    // 朝玩家方向发射
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = u * 18;
    enemyBullets.push({
      x: e.x,
      y: e.y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      r: u * 0.3
    });
  }

  function spawnBullet() {
    const count = player.bulletCount;
    const spread = 14;
    const u = unit();
    for (let i = 0; i < count; i++) {
      const ang = count === 1
        ? -Math.PI / 2
        : -Math.PI / 2 + ((i / (count - 1)) - 0.5) * (spread * count) * Math.PI / 180;
      bullets.push({
        x: player.x,
        y: player.y - player.r,
        vx: Math.cos(ang) * u * 36,
        vy: Math.sin(ang) * u * 36,
        r: u * 0.28,
        damage: player.damage,
        pierce: player.pierce,
        hits: new Set()
      });
    }
  }

  function spawnBox(x, y) {
    const u = unit();
    boxes.push({
      x, y, r: u * 0.85,
      vy: u * 4,
      rot: 0,
      reward: pickBoxReward()
    });
  }

  function spawnParticles(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 140;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 400 + Math.random() * 200,
        max: 600,
        color,
        r: 1 + Math.random() * 2
      });
    }
  }

  function addFloatText(x, y, text, color = '#FFE066') {
    floatTexts.push({ x, y, text, color, life: 700, max: 700 });
  }

  // 全屏爆炸
  function nuke() {
    for (const e of enemies) {
      spawnParticles(e.x, e.y, e.color, 14);
      gainXp(e.xp);
      kills++;
    }
    enemies.length = 0;
    enemyBullets.length = 0;
    flash = 200;
  }
  let flash = 0;

  // 经验
  function gainXp(amount) {
    xp += amount * player.xpRate;
    while (xp >= xpNeed) {
      xp -= xpNeed;
      level++;
      xpNeed = Math.floor(xpNeed * 1.5 + 2);
      triggerUpgrade();
    }
  }

  function triggerUpgrade() {
    const choices = pickSkills(skillLevels, 3);
    if (!choices.length) return;
    paused = true;
    onUpgrade && onUpgrade(choices);
  }

  function applySkill(skillOrId) {
    // 兼容 id 字符串
    let skill = skillOrId;
    if (typeof skillOrId === 'string') {
      const found = pickSkills({}, 99).find(s => s.id === skillOrId);
      if (found) skill = found;
    }
    if (!skill || !skill.apply) return;
    skill.apply(player);
    skillLevels[skill.id] = (skillLevels[skill.id] || 0) + 1;
    paused = false;
    addFloatText(player.x, player.y - 30, skill.name, skill.color);
    pushStats();
  }

  function applyBoxReward(reward) {
    if (reward.id === 'bomb') {
      nuke();
      addFloatText(width / 2, height / 2, '全屏爆破!', '#FFE066');
    } else if (reward.id === 'levelup') {
      triggerUpgrade();
    } else if (reward.id === 'heal') {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      addFloatText(player.x, player.y - 30, '+1 HP', '#06D6A0');
    }
    pushStats();
  }

  // 更新
  function update(dt) {
    if (paused || gameOver) return;
    elapsed += dt;
    player.invuln = Math.max(0, player.invuln - dt);

    // 输入 → 玩家位置
    if (input.target) {
      const dx = input.target.x - player.x;
      const dy = input.target.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const step = Math.min(dist, player.speed * dt / 1000);
        player.x += (dx / dist) * step;
        player.y += (dy / dist) * step;
      }
    }
    // 键盘
    let kx = 0, ky = 0;
    if (input.keys.has('left')) kx -= 1;
    if (input.keys.has('right')) kx += 1;
    if (input.keys.has('up')) ky -= 1;
    if (input.keys.has('down')) ky += 1;
    if (kx || ky) {
      const len = Math.hypot(kx, ky) || 1;
      player.x += (kx / len) * player.speed * dt / 1000;
      player.y += (ky / len) * player.speed * dt / 1000;
      input.target = null; // 键盘优先
    }
    // 边界：飞机中点距离 ≥ r
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));

    // 自动开火
    player.fireTimer += dt;
    while (player.fireTimer >= player.fireInterval) {
      player.fireTimer -= player.fireInterval;
      spawnBullet();
    }

    // 子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt / 1000;
      b.y += b.vy * dt / 1000;
      if (b.y < -10 || b.y > height + 10 || b.x < -10 || b.x > width + 10) {
        bullets.splice(i, 1);
      }
    }

    // 敌人生成（加快节奏：上限 220ms / 起点 800ms / 衰减 /60）
    spawnTimer += dt;
    spawnInterval = Math.max(220, 800 - elapsed / 60);
    while (spawnTimer >= spawnInterval) {
      spawnTimer -= spawnInterval;
      spawnEnemy();
    }

    // 敌弹移动 + 撞玩家
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      b.x += b.vx * dt / 1000;
      b.y += b.vy * dt / 1000;
      if (b.x < -20 || b.x > width + 20 || b.y < -20 || b.y > height + 20) {
        enemyBullets.splice(i, 1);
        continue;
      }
      if (player.invuln <= 0) {
        const dx = b.x - player.x, dy = b.y - player.y;
        if (dx * dx + dy * dy < (b.r + player.r) * (b.r + player.r)) {
          enemyBullets.splice(i, 1);
          spawnParticles(b.x, b.y, '#FF3D5A', 6);
          hitPlayer();
        }
      }
    }

    // 敌人移动 & 与子弹碰撞 & 精英开火
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.vy * dt / 1000;
      e.x += e.vx * dt / 1000;
      if (e.x < e.r || e.x > width - e.r) e.vx *= -1;
      if (e.y > height + e.r) {
        enemies.splice(i, 1);
        continue;
      }
      // 精英怪开火（要求 y > 0 才能开始开火，避免画面外开枪）
      if (e.elite && e.y > 0) {
        e.fireTimer += dt;
        if (e.fireTimer >= e.fireInterval) {
          e.fireTimer = 0;
          spawnEnemyBullet(e);
        }
      }
      let killed = false;
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.hits.has(e)) continue;
        const dx = e.x - b.x, dy = e.y - b.y;
        if (dx * dx + dy * dy < (e.r + b.r) * (e.r + b.r)) {
          e.hp -= b.damage;
          b.hits.add(e);
          spawnParticles(b.x, b.y, e.color, 4);
          if (b.pierce <= 0 || b.hits.size > b.pierce) {
            bullets.splice(j, 1);
          }
          if (e.hp <= 0) {
            spawnParticles(e.x, e.y, e.color, 12);
            gainXp(e.xp);
            kills++;
            if (Math.random() < 0.08) spawnBox(e.x, e.y);
            enemies.splice(i, 1);
            killed = true;
            break;
          }
        }
      }
      if (killed) continue;
      // 玩家碰撞
      const pdx = e.x - player.x, pdy = e.y - player.y;
      if (player.invuln <= 0 && pdx * pdx + pdy * pdy < (e.r + player.r) * (e.r + player.r)) {
        hitPlayer();
        spawnParticles(e.x, e.y, e.color, 14);
        enemies.splice(i, 1);
      }
    }

    // 宝箱
    for (let i = boxes.length - 1; i >= 0; i--) {
      const bx = boxes[i];
      bx.y += bx.vy * dt / 1000;
      bx.rot += dt / 400;
      if (bx.y > height + bx.r) {
        boxes.splice(i, 1);
        continue;
      }
      const dx = bx.x - player.x, dy = bx.y - player.y;
      if (dx * dx + dy * dy < (bx.r + player.r) * (bx.r + player.r)) {
        spawnParticles(bx.x, bx.y, '#FFD166', 16);
        applyBoxReward(bx.reward);
        boxes.splice(i, 1);
      }
    }

    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const t = floatTexts[i];
      t.life -= dt;
      t.y -= dt * 0.04;
      if (t.life <= 0) floatTexts.splice(i, 1);
    }
    if (flash > 0) flash = Math.max(0, flash - dt);

    pushStats();
  }

  function hitPlayer() {
    player.invuln = 800;
    if (player.shield > 0) {
      player.shield--;
      addFloatText(player.x, player.y - 30, '护盾 -1', '#118AB2');
      return;
    }
    player.hp--;
    addFloatText(player.x, player.y - 30, '-1 HP', '#EF476F');
    if (player.hp <= 0) {
      gameOver = true;
      running = false;
      onGameOver && onGameOver({
        kills, level, time: Math.floor(elapsed / 1000)
      });
    }
  }

  function pushStats() {
    onStats && onStats({
      hp: player.hp,
      maxHp: player.maxHp,
      shield: player.shield,
      xp, xpNeed, level, kills,
      time: Math.floor(elapsed / 1000)
    });
  }

  // 绘制
  function draw() {
    // 背景：深紫蓝渐变 + 中央光晕
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, '#1A0E3D');
    g.addColorStop(0.5, '#0B1840');
    g.addColorStop(1, '#04081F');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // 中央径向光晕
    const rg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.6);
    rg.addColorStop(0, 'rgba(94, 80, 200, 0.18)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, width, height);

    // 星空（两层：远小近大）
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 97) % width;
      const sy = ((i * 53 + elapsed * 0.04) % height + height) % height;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }
    ctx.fillStyle = 'rgba(180, 220, 255, 0.9)';
    for (let i = 0; i < 18; i++) {
      const sx = (i * 167) % width;
      const sy = ((i * 89 + elapsed * 0.12) % height + height) % height;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // 粒子
    for (const p of particles) {
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 宝箱
    for (const bx of boxes) {
      ctx.save();
      ctx.translate(bx.x, bx.y);
      ctx.rotate(bx.rot);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(-bx.r, -bx.r, bx.r * 2, bx.r * 2);
      ctx.strokeStyle = '#B7791F';
      ctx.lineWidth = 2;
      ctx.strokeRect(-bx.r, -bx.r, bx.r * 2, bx.r * 2);
      ctx.fillStyle = '#B7791F';
      ctx.fillRect(-bx.r, -3, bx.r * 2, 6);
      ctx.restore();
    }

    // 敌人（六边形 + 内圈高光，精英怪带外圈光环）
    for (const e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      // 精英外圈光环
      if (e.elite) {
        ctx.strokeStyle = `rgba(255,224,102,${0.5 + Math.sin(elapsed / 150) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.r * 1.35, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 外形
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 2;
        const px = Math.cos(a) * e.r, py = Math.sin(a) * e.r;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = e.color;
      ctx.fill();
      ctx.strokeStyle = e.elite ? '#FFE066' : 'rgba(255,255,255,0.7)';
      ctx.lineWidth = e.elite ? 1.8 : 1.2;
      ctx.stroke();
      // 内圈
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();
      ctx.restore();
      // hp bar
      if (e.hp < e.maxHp) {
        const w = e.r * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(e.x - e.r, e.y - e.r - 6, w, 3);
        ctx.fillStyle = '#06D6A0';
        ctx.fillRect(e.x - e.r, e.y - e.r - 6, w * (e.hp / e.maxHp), 3);
      }
    }

    // 玩家子弹（黄色 + 光晕）
    for (const b of bullets) {
      ctx.save();
      ctx.shadowColor = '#FFE066';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFF1A8';
      const w = b.r, h = b.r * 2.4;
      ctx.fillRect(b.x - w / 2, b.y - h / 2, w, h);
      ctx.restore();
    }

    // 敌弹（紫红光球）
    for (const b of enemyBullets) {
      ctx.save();
      ctx.shadowColor = '#FF3D5A';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FF6B8A';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 玩家战机：机翼 + 机身 + 引擎尾焰
    const blink = player.invuln > 0 && Math.floor(player.invuln / 80) % 2 === 0;
    if (!blink) {
      ctx.save();
      ctx.translate(player.x, player.y);
      // 尾焰
      const flameLen = 8 + Math.random() * 5;
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.moveTo(-5, player.r);
      ctx.lineTo(0, player.r + flameLen);
      ctx.lineTo(5, player.r);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFE066';
      ctx.beginPath();
      ctx.moveTo(-2.5, player.r);
      ctx.lineTo(0, player.r + flameLen * 0.6);
      ctx.lineTo(2.5, player.r);
      ctx.closePath();
      ctx.fill();
      // 机翼
      ctx.fillStyle = '#2A5C8A';
      ctx.beginPath();
      ctx.moveTo(-player.r * 1.2, player.r * 0.2);
      ctx.lineTo(-player.r * 0.3, -player.r * 0.2);
      ctx.lineTo(-player.r * 0.3, player.r * 0.7);
      ctx.lineTo(-player.r * 0.7, player.r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(player.r * 1.2, player.r * 0.2);
      ctx.lineTo(player.r * 0.3, -player.r * 0.2);
      ctx.lineTo(player.r * 0.3, player.r * 0.7);
      ctx.lineTo(player.r * 0.7, player.r * 0.8);
      ctx.closePath();
      ctx.fill();
      // 机身
      const grad = ctx.createLinearGradient(0, -player.r, 0, player.r);
      grad.addColorStop(0, '#7FE7FF');
      grad.addColorStop(1, '#1689B8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -player.r);
      ctx.lineTo(player.r * 0.5, player.r * 0.6);
      ctx.lineTo(0, player.r * 0.85);
      ctx.lineTo(-player.r * 0.5, player.r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // 驾驶舱
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(0, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      // 护盾
      if (player.shield > 0) {
        ctx.strokeStyle = `rgba(94, 200, 255, ${0.6 + Math.sin(elapsed / 200) * 0.25})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, player.r + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('x' + player.shield, 0, -player.r - 14);
      }
      ctx.restore();
    }

    // 浮动文字
    for (const t of floatTexts) {
      ctx.globalAlpha = Math.max(0, t.life / t.max);
      ctx.fillStyle = t.color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    // 闪屏
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash / 400})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs;
    lastTs = ts;
    if (dt > 64) dt = 64; // 防止后台切换后大跳
    update(dt);
    draw();
    rafId = raf(loop);
  }

  function start() {
    running = true;
    paused = false;
    gameOver = false;
    lastTs = 0;
    rafId = raf(loop);
    pushStats();
  }

  function stop() {
    running = false;
    if (rafId) caf(rafId);
    rafId = null;
  }

  function reset() {
    stop();
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    boxes.length = 0;
    particles.length = 0;
    floatTexts.length = 0;
    const u = unit();
    Object.assign(player, {
      x: width / 2, y: height - u * 6, r: u * 1.1,
      hp: 3, maxHp: 3, speed: u * 20,
      fireInterval: 320, fireTimer: 0,
      bulletCount: 1, damage: 1, shield: 0, pierce: 0,
      xpRate: 1, invuln: 0
    });
    Object.keys(skillLevels).forEach(k => delete skillLevels[k]);
    xp = 0; level = 1; xpNeed = 6; kills = 0; elapsed = 0;
    spawnTimer = 0; spawnInterval = 900;
    flash = 0;
    start();
  }

  function pause() { paused = true; }
  function resume() { paused = false; }

  function resize(w, h) {
    width = w;
    height = h;
    // 重算依赖屏幕尺寸的属性
    const u = unit();
    player.r = u * 1.1;
    player.speed = u * 20;
    player.x = Math.min(Math.max(player.r, player.x), width - player.r);
    player.y = Math.min(Math.max(player.r, player.y), height - player.r);
  }

  return {
    start, stop, reset, pause, resume, resize,
    setTarget, clearTarget, keyDown, keyUp,
    applySkill, applyBoxReward,
    get state() {
      return { hp: player.hp, maxHp: player.maxHp, shield: player.shield,
        xp, xpNeed, level, kills, time: Math.floor(elapsed / 1000) };
    }
  };
}
