'use strict';
exports.main = async (event, context) => {
	// 兼容 uniCloud.callFunction 和 HTTP 方式
	let jsonObj = {};
	if (event.body) {
		try {
			jsonObj = JSON.parse(event.body);
		} catch (e) {
			return { code: -1, msg: 'body 不是合法 JSON' };
		}
	} else {
		jsonObj = event;
	}

	const { id, big, title, small, birth, date, user, info, remark } = jsonObj;
	const db = uniCloud.database();
	const collection = db.collection('order');
	const timeNum = Date.now();

	try {
		if (id === '' || id === undefined || id === null) {
			// 新增：只取已知字段，防止注入
			const res = await collection.add({
				big, title, small, birth, date, user, info, remark: remark || '',
				time: timeNum
			});
			return { code: 0, id: res.id, msg: '新增成功' };
		} else {
			await collection.where({ _id: id }).update({
				big, title, small, birth, date, user, info, remark: remark || '',
				updateTime: timeNum
			});
			return { code: 0, id, msg: '更新成功' };
		}
	} catch (e) {
		return { code: -1, msg: '保存失败', detail: e.message || String(e) };
	}
};
