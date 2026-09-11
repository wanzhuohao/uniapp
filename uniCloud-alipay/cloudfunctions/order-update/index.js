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

function validateOrderPayload(payload) {
	if (payload.id !== undefined && payload.id !== null && payload.id !== '') {
		if (typeof payload.id !== 'string' || payload.id.length > 128) return 'id 必须是长度不超过 128 的字符串';
	}
	for (const [field, maxLength] of [['big', 20000], ['title', 200], ['small', 20000], ['birth', 20000], ['date', 20000]]) {
		if (typeof payload[field] !== 'string') return `${field} 必须是字符串`;
		if (payload[field].length > maxLength) return `${field} 长度不能超过 ${maxLength}`;
	}
	if (typeof payload.user !== 'string' || !payload.user.trim()) return 'user 不能为空';
	if (payload.user.length > 100) return 'user 长度不能超过 100';
	if (payload.remark !== undefined && typeof payload.remark !== 'string') return 'remark 必须是字符串';
	if (typeof payload.remark === 'string' && payload.remark.length > 2000) return 'remark 长度不能超过 2000';
	if (!payload.info || typeof payload.info !== 'object' || Array.isArray(payload.info)) return 'info 必须是对象';
	const infoPrototype = Object.getPrototypeOf(payload.info);
	if (infoPrototype !== Object.prototype && infoPrototype !== null) return 'info 必须是普通对象';
	let infoText;
	try {
		infoText = JSON.stringify(payload.info);
	} catch (e) {
		return 'info 不是可序列化对象';
	}
	if (Buffer.byteLength(infoText, 'utf8') > 100 * 1024) return 'info 大小不能超过 100KB';
	return '';
}

exports.main = async (event, context) => {
	// 兼容 uniCloud.callFunction 和 HTTP 方式
	let jsonObj = {};
	if (Object.prototype.hasOwnProperty.call(event, 'body')) {
		try {
			jsonObj = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
		} catch (e) {
			return { code: 400, msg: 'body 不是合法 JSON' };
		}
		if (!isPlainObject(jsonObj)) {
			return { code: 400, msg: 'body 必须是 JSON 对象' };
		}
	} else {
		jsonObj = event;
	}
	const authError = authenticateAdmin({
		...event,
		...jsonObj,
		...(event.queryStringParameters || {})
	});
	if (authError) return authError;
	const validationError = validateOrderPayload(jsonObj);
	if (validationError) return { code: 400, msg: `订单参数校验失败：${validationError}` };

	const { id, big, title, small, birth, date, user, info, remark } = jsonObj;
	const timeNum = Date.now();

	try {
		const db = uniCloud.database();
		const collection = db.collection('order');
		if (id === '' || id === undefined || id === null) {
			// 新增：只取已知字段，防止注入
			const res = await collection.add({
				big, title, small, birth, date, user, info, remark: remark || '',
				time: timeNum
			});
			return { code: 0, id: res.id, msg: '新增成功' };
		} else {
			const res = await collection.where({ _id: id }).update({
				big, title, small, birth, date, user, info, remark: remark || '',
				updateTime: timeNum
			});
			if (!res || Number(res.updated) === 0) {
				return { code: 404, id, msg: '更新失败：订单不存在或已被删除' };
			}
			return { code: 0, id, msg: '更新成功' };
		}
	} catch (e) {
		return { code: -1, msg: '保存失败' };
	}
};
