'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { _id, name } = event;
  if (!_id || !name) return { code: 1, msg: '参数错误' };
  try {
    const exist = await db.collection('albums').where({ name, _id: db.command.neq(_id) }).get();
    if (exist.data.length > 0) return { code: 2, msg: '相册名已存在' };
    await db.collection('albums').doc(_id).update({ name });
    return { code: 0, msg: '修改成功' };
  } catch (e) {
    return { code: -1, msg: '修改失败', detail: e.message || String(e) };
  }
};
