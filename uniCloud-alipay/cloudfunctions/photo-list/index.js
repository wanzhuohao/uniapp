'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { albumId, pageNo, pageSize } = event;
  if (!albumId) return { code: 1, msg: '参数错误' };
  try {
    const page = Math.max(1, parseInt(pageNo, 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
    let query = db.collection('photos').where({ albumId }).orderBy('createTime', 'asc');
    const { total } = await query.count();
    const { data } = await query.skip((page - 1) * size).limit(size).get();
    return { code: 0, data, total };
  } catch (e) {
    return { code: -1, msg: '查询失败', detail: e.message || String(e) };
  }
};
