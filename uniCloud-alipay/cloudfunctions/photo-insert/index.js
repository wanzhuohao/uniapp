'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { albumId, fileName, fileUrl } = event;
  if (!albumId || !fileName || !fileUrl) return { code: 1, msg: '参数错误' };
  try {
    const res = await db.collection('photos').add({ albumId, fileName, fileUrl, createTime: Date.now() });
    return { code: 0, id: res.id };
  } catch (e) {
    return { code: -1, msg: '上传失败', detail: e.message || String(e) };
  }
};
