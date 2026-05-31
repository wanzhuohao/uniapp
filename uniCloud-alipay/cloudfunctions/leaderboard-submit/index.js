'use strict';

exports.main = async (event, context) => {
  const { nickname, kills, level, time } = event;

  if (!nickname || typeof nickname !== 'string') {
    return { code: -1, msg: '请输入昵称' };
  }
  const name = nickname.trim();
  if (name.length < 2 || name.length > 12) {
    return { code: -1, msg: '昵称长度需 2-12 个字符' };
  }

  const k = Math.max(0, parseInt(kills, 10) || 0);
  const lv = Math.max(1, parseInt(level, 10) || 1);
  const t = Math.max(0, parseInt(time, 10) || 0);

  // 服务端算分
  const score = k * 10 + lv * 100 + t * 2;

  const db = uniCloud.database();
  try {
    await db.collection('leaderboard').add({
      nickname: name,
      score,
      kills: k,
      level: lv,
      time: t,
      createdAt: Date.now()
    });

    const { total } = await db.collection('leaderboard')
      .where({ score: db.command.gt(score) })
      .count();

    return { code: 0, data: { rank: total + 1, score } };
  } catch (e) {
    return { code: -1, msg: '提交失败' };
  }
};
