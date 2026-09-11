'use strict';
const crypto = require('crypto');

function authenticateAdmin(request) {
  const expected = process.env.ORDER_ADMIN_TOKEN;
  if (!expected) {
    return { code: 503, msg: '订单管理员口令未配置，请在云函数环境变量中设置 ORDER_ADMIN_TOKEN' };
  }
  const headers = request.headers || {};
  const headerEntry = Object.entries(headers).find(([key]) => key.toLowerCase() === 'x-order-admin-token');
  const hasExplicitToken = Object.prototype.hasOwnProperty.call(request, 'adminToken');
  const provided = hasExplicitToken ? request.adminToken : (headerEntry && headerEntry[1]);
  if (typeof provided !== 'string') {
    return { code: 401, msg: '管理员口令无效，请重新输入' };
  }
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return { code: 401, msg: '管理员口令无效，请重新输入' };
  }
  return null;
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

exports.main = async (event, context) => {
  let body = {};
  if (Object.prototype.hasOwnProperty.call(event, 'body')) {
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      return { code: 400, msg: 'body 不是合法 JSON' };
    }
    if (!isPlainObject(body)) {
      return { code: 400, msg: 'body 必须是 JSON 对象' };
    }
  }
  const request = { ...event, ...body, ...(event.queryStringParameters || {}) };
  const authError = authenticateAdmin(request);
  if (authError) return authError;
  const id = request.id;
  if (typeof id !== 'string' || !id || id.length > 128) {
    return { code: 400, msg: 'id 必须是长度不超过 128 的非空字符串' };
  }
  try {
    const db = uniCloud.database();
    const res = await db.collection('order').where({ _id: id }).remove();
    if (!res || Number(res.deleted) === 0) {
      return { code: 404, msg: '删除失败：订单不存在或已被删除' };
    }
    return { code: 0, msg: '删除成功' };
  } catch (e) {
    return { code: -1, msg: '删除失败' };
  }
};
