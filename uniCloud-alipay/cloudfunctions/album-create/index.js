'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { name } = event;
  if (!name) return { code: 1, msg: '相册名不能为空' };
  try {
    const exist = await db.collection('albums').where({ name }).get();
    if (exist.data.length > 0) return { code: 2, msg: '相册名已存在' };
    const res = await db.collection('albums').add({ name, createTime: Date.now() });
    return { code: 0, id: res.id };
  } catch (e) {
    return { code: -1, msg: '创建失败', detail: e.message || String(e) };
  }
};
