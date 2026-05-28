// 飞机大战 - 被动技能池
// 每项技能有等级上限；满级后不再进入抽选池

export const SKILLS = [
  {
    id: 'multishot',
    name: '多重弹道',
    desc: '+1 颗并射子弹',
    color: '#FFD166',
    max: 6,
    apply(p) {
      p.bulletCount = Math.min((p.bulletCount || 1) + 1, 7);
    }
  },
  {
    id: 'firerate',
    name: '极速射击',
    desc: '攻速 +18%',
    color: '#06D6A0',
    max: 12,
    apply(p) {
      p.fireInterval = Math.max(40, p.fireInterval * 0.82);
    }
  },
  {
    id: 'damage',
    name: '炽烈弹头',
    desc: '攻击力 +30%',
    color: '#EF476F',
    max: 15,
    apply(p) {
      p.damage = +(p.damage * 1.3).toFixed(2);
    }
  },
  {
    id: 'shield',
    name: '能量护盾',
    desc: '+1 层护盾',
    color: '#118AB2',
    max: 8,
    apply(p) {
      p.shield = Math.min((p.shield || 0) + 1, 8);
    }
  },
  {
    id: 'speed',
    name: '推进强化',
    desc: '移动速度 +15%',
    color: '#9D4EDD',
    max: 10,
    apply(p) {
      p.speed = +(p.speed * 1.15).toFixed(2);
    }
  },
  {
    id: 'xpgain',
    name: '智慧芯片',
    desc: '经验获取 +25%',
    color: '#F4A261',
    max: 10,
    apply(p) {
      p.xpRate = +((p.xpRate || 1) * 1.25).toFixed(2);
    }
  },
  {
    id: 'maxhp',
    name: '装甲扩容',
    desc: '最大 HP +1 并回满',
    color: '#E76F51',
    max: 10,
    apply(p) {
      p.maxHp = (p.maxHp || 3) + 1;
      p.hp = p.maxHp;
    }
  },
  {
    id: 'pierce',
    name: '穿甲弹',
    desc: '子弹可多穿 1 个敌人',
    color: '#8DECB4',
    max: 6,
    apply(p) {
      p.pierce = (p.pierce || 0) + 1;
    }
  },
  // 兜底：所有 skill 满级后仍可选的小幅强化（max 极高保证不会满）
  {
    id: 'omni',
    name: '全面强化',
    desc: '攻击 +8% / 攻速 +5% / 移速 +5%',
    color: '#FFD700',
    max: 99,
    apply(p) {
      p.damage = +(p.damage * 1.08).toFixed(3);
      p.fireInterval = Math.max(30, p.fireInterval * 0.95);
      p.speed = +(p.speed * 1.05).toFixed(2);
    }
  }
];

// 从未满级的技能里随机抽 n 个
export function pickSkills(levels, n = 3) {
  const pool = SKILLS.filter(s => (levels[s.id] || 0) < s.max);
  const chosen = [];
  const copy = pool.slice();
  while (chosen.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    chosen.push(copy.splice(i, 1)[0]);
  }
  return chosen;
}

// 宝箱效果池
export const BOX_REWARDS = [
  { id: 'bomb', name: '全屏爆破', desc: '清屏所有敌人' },
  { id: 'levelup', name: '即刻升级', desc: '立即三选一升级' },
  { id: 'heal', name: '能量回收', desc: '回复 1 点生命' }
];

export function pickBoxReward() {
  return BOX_REWARDS[Math.floor(Math.random() * BOX_REWARDS.length)];
}
