'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { _id } = event;
  if (!_id) return { code: 1, msg: '参数错误' };
  try {
    // 先查出照片的云存储 URL，清理文件
    const photosRes = await db.collection('photos').where({ albumId: _id }).get();
    const fileList = (photosRes.data || [])
      .map(p => p.fileUrl)
      .filter(url => url && url.startsWith('cloud://'));
    if (fileList.length) {
      await uniCloud.deleteFile({ fileList });
    }
    // 先删照片记录，再删相册（更安全：即使相册删除失败，照片已清理）
    await db.collection('photos').where({ albumId: _id }).remove();
    await db.collection('albums').doc(_id).remove();
    return { code: 0, msg: '删除成功' };
  } catch (e) {
    return { code: -1, msg: '删除失败', detail: e.message || String(e) };
  }
};
