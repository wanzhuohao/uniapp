'use strict';
exports.main = async (event, context) => {
  const id = event.id || (event.queryStringParameters && event.queryStringParameters.id);
  if (!id) return { code: 1, msg: '缺少id参数' };
  const db = uniCloud.database();
  try {
    await db.collection('order').where({ _id: id }).remove();
    return { code: 0, msg: '删除成功' };
  } catch (e) {
    return { code: -1, msg: '删除失败', detail: e.message || String(e) };
  }
};
