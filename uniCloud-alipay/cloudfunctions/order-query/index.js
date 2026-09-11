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
    // callFunction、HTTP body、query 和 header 使用同一套鉴权。
    const request = {
        ...event,
        ...body,
        ...(event.queryStringParameters || {})
    };
    const authError = authenticateAdmin(request);
    if (authError) return authError;
    const { id, pageNo, pageSize, keyword } = request;

    try {
        const db = uniCloud.database();
        const collection = db.collection("order");

        // 情况1：有id参数时，精确查询单条记录
        if (id) {
            const res = await collection.doc(id).get();
            return {
                code: 0,
                data: res.data ? [res.data] : [],
                total: res.data ? 1 : 0
            };
        }

        // 情况2：无id参数时，列表按 time 倒序（最新的在最前）
        let query = collection;
        if (keyword) {
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const keywordRegex = new RegExp(escaped);
            query = query.where({
                $or: [
                    { user: keywordRegex },
                    { 'info.father.name': keywordRegex },
                    { 'info.mother.name': keywordRegex }
                ]
            });
        }
        const { total } = await query.count();
        let listQuery = query;
        listQuery = listQuery.orderBy('time', 'desc');
        const page = Math.max(1, parseInt(pageNo, 10) || 1);
        const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
        listQuery = listQuery.skip((page - 1) * size).limit(size);
        const { data } = await listQuery.get();
        return { code: 0, data, total };
    } catch (e) {
        return { code: -1, data: [], total: 0, msg: '查询失败' };
    }
};
