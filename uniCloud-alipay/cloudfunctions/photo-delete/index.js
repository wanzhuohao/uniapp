'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { _id } = event;
  if (!_id) return { code: 1, msg: '参数错误' };
  try {
    // 先查出文件 URL
    const photoRes = await db.collection('photos').doc(_id).get();
    const photo = Array.isArray(photoRes.data) ? photoRes.data[0] : photoRes.data;
    // 删除云存储文件
    if (photo && photo.fileUrl && photo.fileUrl.startsWith('cloud://')) {
      await uniCloud.deleteFile({ fileList: [photo.fileUrl] });
    }
    // 删除数据库记录
    await db.collection('photos').doc(_id).remove();
    return { code: 0, msg: '删除成功' };
  } catch (e) {
    return { code: -1, msg: '删除失败', detail: e.message || String(e) };
  }
};
