// 排行榜 API

const NICKNAME_KEY = 'plane_leaderboard_nickname';

export function getNickname() {
  return uni.getStorageSync(NICKNAME_KEY) || '';
}

export function saveNickname(name) {
  uni.setStorageSync(NICKNAME_KEY, name);
}

export async function submitScore({ nickname, kills, level, time }) {
  const res = await uniCloud.callFunction({
    name: 'leaderboard-submit',
    data: { nickname, kills, level, time }
  });
  if (res.result.code !== 0) {
    throw new Error(res.result.msg || '提交失败');
  }
  return res.result.data;
}

export async function getLeaderboard(limit = 50) {
  const res = await uniCloud.callFunction({
    name: 'leaderboard-query',
    data: { limit }
  });
  if (res.result.code !== 0) {
    throw new Error(res.result.msg || '查询失败');
  }
  return res.result.data || [];
}
