'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  try {
    const res = await db.collection('albums').orderBy('createTime', 'asc').get();
    const albums = res.data;
    if (!albums.length) return { code: 0, data: [] };
    const countRes = await db.collection('photos').aggregate()
      .group({ _id: '$albumId', count: { $sum: 1 } })
      .end();
    const countMap = {};
    (countRes.data || []).forEach(item => { countMap[item._id] = item.count; });
    const data = albums.map(album => ({
      ...album,
      photoCount: countMap[album._id] || 0
    }));
    return { code: 0, data };
  } catch (e) {
    return { code: -1, msg: '查询失败', detail: e.message || String(e) };
  }
};
