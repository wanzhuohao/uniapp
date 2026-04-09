'use strict';
exports.main = async (event, context) => {
    // 兼容两种参数来源
    const { id, pageNo, pageSize, keyword } = {
        ...event,
        ...(event.queryStringParameters || {})
    };
    const db = uniCloud.database();
    const collection = db.collection("order");

    // 情况1：有id参数时，精确查询单条记录
    if (id) {
        try {
            const res = await collection.doc(id).get();
            return {
                code: 0,
                data: res.data ? [res.data] : [],
                total: res.data ? 1 : 0
            };
        } catch (e) {
            return {
                code: -1,
                data: [],
                total: 0
            };
        }
    }

    // 情况2：无id参数时，列表按 time 倒序（最新的在最前）
    try {
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
        return { code: -1, data: [], total: 0, msg: e.message || String(e) };
    }
};
