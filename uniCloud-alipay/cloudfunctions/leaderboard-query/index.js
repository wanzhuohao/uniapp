'use strict';

exports.main = async (event, context) => {
  const limit = Math.min(100, Math.max(1, parseInt(event.limit, 10) || 50));

  const db = uniCloud.database();
  const collection = db.collection('leaderboard');

  try {
    const { data } = await collection
      .orderBy('score', 'desc')
      .limit(limit)
      .field({
        nickname: true,
        score: true,
        kills: true,
        level: true,
        time: true,
        createdAt: true
      })
      .get();

    return { code: 0, data };
  } catch (e) {
    return { code: -1, data: [], msg: e.message || String(e) };
  }
};
