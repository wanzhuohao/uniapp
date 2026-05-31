// 飞机大战 - 游戏引擎（纯逻辑，不负责渲染）
// 由 vue 页面创建实例，每帧 update 后通过 getRenderState() 取快照

import { pickSkills, pickBoxReward } from './skills.js';

const PARTICLE_CAP = 16;     // 同屏粒子上限,DOM 渲染防爆炸
const FLOAT_TEXT_CAP = 10;
const ENEMY_CAP = 40;        // 同屏敌人硬上限
const BULLET_CAP = 80;       // 玩家子弹硬上限
const ENEMY_BULLET_CAP = 60; // 敌弹硬上限

export function createEngine(opts) {
  const { onUpgrade, onGameOver, onRevive, onStats, onFrame } = opts;
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
  let nextBossAt = 120000;  // 第一个 boss 在 120s 出现,之后每 75s 一个
  const skillLevels = {};
  let burnTimer = 0;       // 全局灼烧剩余 ms
  let freezeTimer = 0;     // 全局冰冻剩余 ms
  let starTimer = 0;       // 无敌星剩余 ms
  let canRevive = true;    // 是否还有复活机会

  const input = {
    target: null,
    keys: new Set(),
  };

  function setTarget(x, y) { input.target = { x, y }; }
  function clearTarget() { input.target = null; }
  function keyDown(k) { input.keys.add(k); }
  function keyUp(k) { input.keys.delete(k); }

  function spawnEnemy() {
    if (enemies.length >= ENEMY_CAP) return;
    // tier 20s 一档,无上限——3 分钟 tier 9,5 分钟 tier 15
    const tier = Math.floor(elapsed / 20000);
    const u = unit();
    // 前 30s 安全窗口:不刷精英 / 不开火 / 体型小
    const safeWindow = elapsed < 30000;
    // 体型上限 cap 拉到 1.2
    const sizeBoost = safeWindow ? 0 : Math.min(1.2, tier * 0.1);
    const r = u * (0.7 + Math.random() * 0.3 + sizeBoost);
    const palette = ['#FF3D5A', '#FF9F1C', '#B14AED', '#2EC4B6', '#F72585'];
    // 安全窗口 0,正式期起步 5% 涨到 90%(原 8% 起步,1 分多太陡)
    const eliteChance = safeWindow ? 0 : Math.min(0.9, 0.05 + tier * 0.05);
    const isElite = Math.random() < eliteChance;
    // HP:基础 1 + tier*1.4,tier>=12 后再叠 +2/档(后期加压)
    let hp = Math.max(1, Math.floor(1 + tier * 1.4));
    if (tier >= 12) hp += (tier - 11) * 2;
    hp += (isElite ? 2 : 0);
    // 速度封顶 tier 14(原 10),后期继续加速
    const tierForSpeed = Math.min(14, tier);
    // 精英 tier>=7 三弹散射,tier>=11 五弹(都推后 2 档,缓 1 分多)
    const spread = isElite ? (tier >= 11 ? 5 : tier >= 7 ? 3 : 1) : 1;
    // 安全窗口完全不开火;普通怪 tier>=5 才开火(原 tier>=3,推后 40s)
    const canFire = !safeWindow && (isElite || tier >= 5);
    enemies.push({
      id: newId(),
      x: r + Math.random() * (width - r * 2),
      y: -r,
      r,
      vy: u * (5 + Math.random() * 3 + tierForSpeed * 1.3),
      vx: (Math.random() - 0.5) * u * 2,
      hp,
      maxHp: hp,
      xp: 1 + Math.floor(tier * 0.5) + (isElite ? 2 : 0),
      color: palette[Math.floor(Math.random() * palette.length)],
      elite: isElite,
      canFire,
      spread,
      fireTimer: -800 - Math.random() * 800,
      // 精英开火封底 500ms;普通封底 1500ms;基线放慢避免 1 分多突袭
      fireInterval: isElite
        ? Math.max(500, 2000 - tier * 80) + Math.random() * 400
        : Math.max(1500, 4000 - tier * 120) + Math.random() * 800
    });
  }

  function spawnBoss() {
    if (enemies.length >= ENEMY_CAP) return;
    const tier = Math.floor(elapsed / 20000);
    const u = unit();
    const r = u * 2.8;
    const hp = 25 + tier * 6;
    enemies.push({
      id: newId(),
      x: width / 2,
      y: -r,
      r,
      vy: u * 2,
      vx: (Math.random() - 0.5) * u * 1.2,
      hp, maxHp: hp,
      xp: 12 + tier,
      color: '#7B2CBF',
      elite: true,
      boss: true,
      canFire: true,
      spread: 5,
      fireTimer: -1000,
      fireInterval: Math.max(450, 1100 - tier * 40)
    });
    addFloatText(width / 2, height / 3, 'BOSS!', '#FF3D5A');
  }

  function spawnEnemyBullet(e) {
    const u = unit();
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    // 精英 / boss 弹速 18,普通 13(便于躲)
    const speed = u * (e.elite ? 18 : 13);
    const spread = e.spread || 1;
    const baseX = dx / dist;
    const baseY = dy / dist;
    for (let i = 0; i < spread; i++) {
      if (enemyBullets.length >= ENEMY_BULLET_CAP) break;
      const ang = spread === 1 ? 0 : (i - (spread - 1) / 2) * 0.22;
      const cs = Math.cos(ang), sn = Math.sin(ang);
      enemyBullets.push({
        id: newId(),
        x: e.x,
        y: e.y,
        vx: (baseX * cs - baseY * sn) * speed,
        vy: (baseX * sn + baseY * cs) * speed,
        r: u * 0.3
      });
    }
  }

  function spawnBullet() {
    if (bullets.length >= BULLET_CAP) return;
    const count = player.bulletCount;
    const spread = 14;
    const u = unit();
    const bulletR = u * 0.28;
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
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      spawnParticles(e.x, e.y, e.color, 6);
      if (e.boss) {
        // boss 扣 50% 最大血量,不秒杀
        const dmg = Math.ceil(e.maxHp * 0.5);
        e.hp -= dmg;
        addFloatText(e.x, e.y - e.r, '-' + dmg, '#FFE066');
        if (e.hp <= 0) {
          gainXp(e.xp);
          kills++;
          enemies.splice(i, 1);
        }
      } else {
        gainXp(e.xp);
        kills++;
        enemies.splice(i, 1);
      }
    }
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
    } else if (reward.id === 'shield') {
      player.shield = Math.min((player.shield || 0) + 1, 8);
      addFloatText(player.x, player.y - 30, '+1 护盾', '#118AB2');
    } else if (reward.id === 'flame') {
      burnTimer = 8000;
      addFloatText(player.x, player.y - 30, '🔥 烈焰风暴!', '#FF6B35');
    } else if (reward.id === 'freeze') {
      freezeTimer = 6000;
      // 立即给当前所有敌人挂上冰冻
      for (const e of enemies) {
        if (!e.frozen) {
          e.frozen = true;
          e._origVy = e.vy;
          e._origVx = e.vx;
          e.vy *= 0.2;
          e.vx *= 0.2;
        }
        e.freezeDur = 6000;
      }
      addFloatText(player.x, player.y - 30, '❄️ 极寒冰封!', '#5EC8FF');
    } else if (reward.id === 'star') {
      starTimer = 7000;
      player.invuln = Math.max(player.invuln, 7000);
      addFloatText(player.x, player.y - 30, '⭐ 无敌金星!', '#FFD700');
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
    // 起步 1000ms,衰减 /160 更缓,触底 120ms;约 2.5min 接近底
    spawnInterval = Math.max(120, 1000 - elapsed / 160);
    while (spawnTimer >= spawnInterval) {
      spawnTimer -= spawnInterval;
      spawnEnemy();
      // tier>=15 (5 分钟) 后双倍刷怪,50% 概率额外补一只
      if (Math.floor(elapsed / 20000) >= 15 && Math.random() < 0.5) {
        spawnEnemy();
      }
    }

    // Boss:120s 出第一个;tier>=15 后间隔从 75s 缩到 50s
    if (elapsed >= nextBossAt) {
      spawnBoss();
      const bossGap = Math.floor(elapsed / 20000) >= 15 ? 50000 : 75000;
      nextBossAt = elapsed + bossGap;
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
      if (e.canFire && e.y > 0) {
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
          // 火焰道具激活时,子弹附加灼烧
          if (burnTimer > 0 && !e.burning) {
            e.burning = true;
            e.burnDur = 3000;
            e.burnTick = 600;
          }
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
      const colliding = pdx * pdx + pdy * pdy < (e.r + player.r) * (e.r + player.r);
      if (colliding && starTimer > 0) {
        // 无敌星:撞杀普通怪,boss 扣血
        if (e.boss) {
          e.hp -= player.damage;
          spawnParticles(e.x, e.y, '#FFD700', 4);
          addFloatText(e.x, e.y - e.r, '-' + player.damage, '#FFD700');
          if (e.hp <= 0) {
            spawnParticles(e.x, e.y, e.color, 8);
            gainXp(e.xp);
            kills++;
            enemies.splice(i, 1);
          }
        } else {
          spawnParticles(e.x, e.y, '#FFD700', 8);
          gainXp(e.xp);
          kills++;
          if (Math.random() < 0.08) spawnBox(e.x, e.y);
          enemies.splice(i, 1);
        }
      } else if (colliding && player.invuln <= 0) {
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

    // ---- 灼烧 / 冰冻 / 无敌星 效果 ----
    if (burnTimer > 0) burnTimer = Math.max(0, burnTimer - dt);
    if (starTimer > 0) starTimer = Math.max(0, starTimer - dt);
    if (freezeTimer > 0) {
      freezeTimer = Math.max(0, freezeTimer - dt);
      // 冰冻期间新刷的怪也要减速
      for (const e of enemies) {
        if (!e.frozen) {
          e.frozen = true;
          e._origVy = e.vy;
          e._origVx = e.vx;
          e.vy *= 0.2;
          e.vx *= 0.2;
        }
        e.freezeDur = Math.max(e.freezeDur || 0, freezeTimer);
      }
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      // 灼烧 DoT
      if (e.burning) {
        e.burnDur -= dt;
        e.burnTick -= dt;
        if (e.burnTick <= 0) {
          e.burnTick = 600;
          e.hp -= 1;
          spawnParticles(e.x, e.y, '#FF6B35', 3);
          if (e.hp <= 0) {
            spawnParticles(e.x, e.y, e.color, 6);
            gainXp(e.xp);
            kills++;
            if (Math.random() < 0.08) spawnBox(e.x, e.y);
            enemies.splice(i, 1);
            continue;
          }
        }
        if (e.burnDur <= 0) e.burning = false;
      }
      // 冰冻恢复
      if (e.frozen) {
        e.freezeDur -= dt;
        if (e.freezeDur <= 0) {
          e.frozen = false;
          e.vy = e._origVy;
          e.vx = e._origVx;
        }
      }
    }

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
      if (canRevive) {
        canRevive = false;
        paused = true;
        onRevive && onRevive({
          kills, level, time: Math.floor(elapsed / 1000)
        });
      } else {
        gameOver = true;
        running = false;
        onGameOver && onGameOver({
          kills, level, time: Math.floor(elapsed / 1000)
        });
      }
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
        star: starTimer > 0,
        blink: player.invuln > 0 && Math.floor(player.invuln / 80) % 2 === 0,
      },
      enemies: enemies.map(e => ({
        ...e,
        burning: !!e.burning,
        frozen: !!e.frozen,
      })),
      bullets, enemyBullets, boxes, particles, floatTexts,
      flash, elapsed,
    };
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs;
    lastTs = ts;
    if (dt > 50) dt = 50;
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
      magnetRange: 0
    });
    Object.keys(skillLevels).forEach(k => delete skillLevels[k]);
    xp = 0; level = 1; xpNeed = 6; kills = 0; elapsed = 0;
    spawnTimer = 0; spawnInterval = 1000;
    nextBossAt = 120000;
    flash = 0;
    burnTimer = 0;
    freezeTimer = 0;
    starTimer = 0;
    canRevive = true;
    start();
  }

  function pause() { paused = true; }
  function resume() { paused = false; }

  function revive() {
    player.hp = player.maxHp;
    player.invuln = 3000; // 复活后无敌 3 秒
    // 清除周围敌人和敌弹,给玩家喘息空间
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e.boss) {
        spawnParticles(e.x, e.y, e.color, 4);
        enemies.splice(i, 1);
      }
    }
    enemyBullets.length = 0;
    flash = 300;
    paused = false;
    addFloatText(player.x, player.y - 30, '复活!', '#FFD700');
    pushStats();
  }

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
    start, stop, reset, pause, resume, revive, resize,
    setTarget, clearTarget, keyDown, keyUp,
    applySkill, applyBoxReward,
    getRenderState,
    get state() {
      return { hp: player.hp, maxHp: player.maxHp, shield: player.shield,
        xp, xpNeed, level, kills, time: Math.floor(elapsed / 1000) };
    }
  };
}
