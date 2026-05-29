// 飞机大战 - 游戏引擎（纯逻辑，不负责渲染）
// 由 vue 页面创建实例，每帧 update 后通过 getRenderState() 取快照

import { pickSkills, pickBoxReward } from './skills.js';

const PARTICLE_CAP = 30;     // 同屏粒子上限,DOM 渲染防爆炸
const FLOAT_TEXT_CAP = 12;

export function createEngine(opts) {
  const { onUpgrade, onGameOver, onStats, onFrame } = opts;
  let width = opts.width;
  let height = opts.height;
  const raf = opts.raf || ((cb) => requestAnimationFrame(cb));
  const caf = opts.caf || ((id) => cancelAnimationFrame(id));

  function unit() { return Math.min(width, height) / 30; }

  const player = {
    x: width / 2,
    y: height - unit() * 6,
    r: unit() * 1.1,
    hp: 3,
    maxHp: 3,
    speed: width / 30 * 20,
    fireInterval: 320,
    fireTimer: 0,
    bulletCount: 1,
    damage: 1,
    shield: 0,
    pierce: 0,
    xpRate: 1,
    invuln: 0,
    bulletSize: 1,    // 子弹半径倍率
    magnetRange: 0,   // 磁吸范围 (单位:unit 倍数)
  };

  const bullets = [];
  const enemyBullets = [];
  const enemies = [];
  const boxes = [];
  const particles = [];
  const floatTexts = [];

  let nextId = 1;
  function newId() { return nextId++; }

  let xp = 0;
  let level = 1;
  let xpNeed = 6;
  let kills = 0;
  let elapsed = 0;
  let spawnTimer = 0;
  let spawnInterval = 900;
  let running = false;
  let paused = false;
  let lastTs = 0;
  let rafId = null;
  let gameOver = false;
  let flash = 0;
  const skillLevels = {};

  const input = {
    target: null,
    keys: new Set(),
  };

  function setTarget(x, y) { input.target = { x, y }; }
  function clearTarget() { input.target = null; }
  function keyDown(k) { input.keys.add(k); }
  function keyUp(k) { input.keys.delete(k); }

  function spawnEnemy() {
    // tier 取消硬 cap,30s 升一档,无上限——5 分钟 tier 10,10 分钟 tier 20
    const tier = Math.floor(elapsed / 30000);
    const u = unit();
    // 体型上限 cap 8(tier*0.08),太大遮屏
    const sizeBoost = Math.min(0.8, tier * 0.08);
    const r = u * (0.7 + Math.random() * 0.3 + sizeBoost);
    const palette = ['#FF3D5A', '#FF9F1C', '#B14AED', '#2EC4B6', '#F72585'];
    // 精英概率随 tier 平滑增长,封顶 85%
    const eliteChance = Math.min(0.85, tier * 0.05);
    const isElite = Math.random() < eliteChance;
    // HP 无上限,每档 +1:tier 0→1, tier 5→6, tier 10→11; 精英再 +2
    const hp = 1 + tier + (isElite ? 2 : 0);
    // 速度有上限,tier>6 后不再加速避免乱飞
    const tierForSpeed = Math.min(6, tier);
    enemies.push({
      id: newId(),
      x: r + Math.random() * (width - r * 2),
      y: -r,
      r,
      vy: u * (5 + Math.random() * 3 + tierForSpeed * 1.5),
      vx: (Math.random() - 0.5) * u * 2,
      hp,
      maxHp: hp,
      xp: 1 + Math.floor(tier * 0.5) + (isElite ? 2 : 0),
      color: palette[Math.floor(Math.random() * palette.length)],
      elite: isElite,
      fireTimer: -800 - Math.random() * 800,
      // 精英开火频率随 tier 加快,封底 600ms
      fireInterval: Math.max(600, 1800 - tier * 100) + Math.random() * 400
    });
  }

  function spawnEnemyBullet(e) {
    const u = unit();
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = u * 18;
    enemyBullets.push({
      id: newId(),
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
    const bulletR = u * 0.28 * (player.bulletSize || 1);
    for (let i = 0; i < count; i++) {
      const ang = count === 1
        ? -Math.PI / 2
        : -Math.PI / 2 + ((i / (count - 1)) - 0.5) * (spread * count) * Math.PI / 180;
      bullets.push({
        id: newId(),
        x: player.x,
        y: player.y - player.r,
        vx: Math.cos(ang) * u * 36,
        vy: Math.sin(ang) * u * 36,
        r: bulletR,
        damage: player.damage,
        pierce: player.pierce,
        hits: new Set()
      });
    }
  }

  function spawnBox(x, y) {
    const u = unit();
    boxes.push({
      id: newId(),
      x, y, r: u * 0.85,
      vy: u * 4,
      rot: 0,
      reward: pickBoxReward()
    });
  }

  function spawnParticles(x, y, color, n = 6) {
    // cap 总量,过量则替换最老的
    const room = PARTICLE_CAP - particles.length;
    const want = Math.min(n, 8);
    const create = Math.min(want, Math.max(0, room));
    const overflow = want - create;
    if (overflow > 0) particles.splice(0, overflow);
    for (let i = 0; i < want; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 140;
      particles.push({
        id: newId(),
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 400 + Math.random() * 200,
        max: 600,
        color,
        r: 2 + Math.random() * 2
      });
    }
  }

  function addFloatText(x, y, text, color = '#FFE066') {
    if (floatTexts.length >= FLOAT_TEXT_CAP) floatTexts.shift();
    floatTexts.push({ id: newId(), x, y, text, color, life: 700, max: 700 });
  }

  function nuke() {
    for (const e of enemies) {
      spawnParticles(e.x, e.y, e.color, 6);
      gainXp(e.xp);
      kills++;
    }
    enemies.length = 0;
    enemyBullets.length = 0;
    flash = 200;
  }

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

  function update(dt) {
    if (paused || gameOver) return;
    elapsed += dt;
    player.invuln = Math.max(0, player.invuln - dt);

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
    let kx = 0, ky = 0;
    if (input.keys.has('left')) kx -= 1;
    if (input.keys.has('right')) kx += 1;
    if (input.keys.has('up')) ky -= 1;
    if (input.keys.has('down')) ky += 1;
    if (kx || ky) {
      const len = Math.hypot(kx, ky) || 1;
      player.x += (kx / len) * player.speed * dt / 1000;
      player.y += (ky / len) * player.speed * dt / 1000;
      input.target = null;
    }
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));

    player.fireTimer += dt;
    while (player.fireTimer >= player.fireInterval) {
      player.fireTimer -= player.fireInterval;
      spawnBullet();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt / 1000;
      b.y += b.vy * dt / 1000;
      if (b.y < -10 || b.y > height + 10 || b.x < -10 || b.x > width + 10) {
        bullets.splice(i, 1);
      }
    }

    spawnTimer += dt;
    // 起步 900ms 慢一点,衰减更平缓(/100 vs 原/60),触底放宽到 120ms;约 100s 接近底
    spawnInterval = Math.max(120, 900 - elapsed / 100);
    while (spawnTimer >= spawnInterval) {
      spawnTimer -= spawnInterval;
      spawnEnemy();
    }

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
          spawnParticles(b.x, b.y, '#FF3D5A', 4);
          hitPlayer();
        }
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.vy * dt / 1000;
      e.x += e.vx * dt / 1000;
      if (e.x < e.r || e.x > width - e.r) e.vx *= -1;
      if (e.y > height + e.r) {
        enemies.splice(i, 1);
        continue;
      }
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
          spawnParticles(b.x, b.y, e.color, 3);
          if (b.pierce <= 0 || b.hits.size > b.pierce) {
            bullets.splice(j, 1);
          }
          if (e.hp <= 0) {
            spawnParticles(e.x, e.y, e.color, 6);
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
      const pdx = e.x - player.x, pdy = e.y - player.y;
      if (player.invuln <= 0 && pdx * pdx + pdy * pdy < (e.r + player.r) * (e.r + player.r)) {
        hitPlayer();
        spawnParticles(e.x, e.y, e.color, 8);
        enemies.splice(i, 1);
      }
    }

    for (let i = boxes.length - 1; i >= 0; i--) {
      const bx = boxes[i];
      bx.rot += dt / 400;
      // 磁吸:在 magnetRange*u 范围内,宝箱直接朝玩家飞,距离越近吸力越强
      let moveY = bx.vy;
      let moveX = 0;
      if (player.magnetRange > 0) {
        const u = unit();
        const range = player.magnetRange * u;
        const dxp = player.x - bx.x;
        const dyp = player.y - bx.y;
        const d = Math.hypot(dxp, dyp);
        if (d < range && d > 1) {
          // pullSpeed 30 unit/s 满力,距离反比衰减
          const pullSpeed = u * 30;
          const blend = 1 - d / range;
          moveX = (dxp / d) * pullSpeed * blend;
          moveY = bx.vy * (1 - blend * 0.6) + (dyp / d) * pullSpeed * blend;
        }
      }
      bx.x += moveX * dt / 1000;
      bx.y += moveY * dt / 1000;
      if (bx.y > height + bx.r) {
        boxes.splice(i, 1);
        continue;
      }
      const dx = bx.x - player.x, dy = bx.y - player.y;
      if (dx * dx + dy * dy < (bx.r + player.r) * (bx.r + player.r)) {
        spawnParticles(bx.x, bx.y, '#FFD166', 8);
        applyBoxReward(bx.reward);
        boxes.splice(i, 1);
      }
    }

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

  function getRenderState() {
    return {
      width, height,
      player: {
        x: player.x, y: player.y, r: player.r,
        shield: player.shield,
        invuln: player.invuln,
        blink: player.invuln > 0 && Math.floor(player.invuln / 80) % 2 === 0,
      },
      enemies, bullets, enemyBullets, boxes, particles, floatTexts,
      flash, elapsed,
    };
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs;
    lastTs = ts;
    if (dt > 64) dt = 64;
    update(dt);
    onFrame && onFrame();
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
      xpRate: 1, invuln: 0,
      bulletSize: 1, magnetRange: 0
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
    getRenderState,
    get state() {
      return { hp: player.hp, maxHp: player.maxHp, shield: player.shield,
        xp, xpNeed, level, kills, time: Math.floor(elapsed / 1000) };
    }
  };
}
