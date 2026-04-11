<template>
  <div class="album-page">
    <!-- 顶部栏（移动端显示） -->
    <header class="mobile-header">
      <button class="back-btn" @click="onBack">← 返回</button>
      <span class="mobile-header-title">相册管理</span>
      <button class="mobile-toggle-btn" @click="showAlbumPanel = !showAlbumPanel">
        {{ showAlbumPanel ? '照片' : '相册' }}
      </button>
    </header>

    <!-- 桌面端返回栏 -->
    <div class="desktop-back-bar">
      <button class="back-btn" @click="onBack">← 返回列表</button>
    </div>

    <div class="album-body">
      <!-- 相册导航 -->
      <aside :class="['album-nav', { 'mobile-show': showAlbumPanel }]">
        <h2 class="album-nav-title">相册</h2>
        <div
          v-for="album in albums"
          :key="album._id"
          :class="['album-nav-item', { active: album._id === currentAlbumId }]"
          @click="selectAlbum(album._id)"
        >
          <div class="album-info">
            <span class="album-name">{{ album.name }}</span>
            <span class="album-count">{{ album.photoCount || 0 }} 张</span>
          </div>
          <span class="album-actions">
            <button class="album-action-btn" @click.stop="editAlbum(album)">编辑</button>
            <button class="album-action-btn album-action-del" @click.stop="deleteAlbum(album._id)">移除</button>
          </span>
        </div>
        <div v-if="albums.length === 0" class="album-empty-tip">暂无相册</div>
        <div class="album-nav-add" @click="openCreateModal">
          <button class="album-add-btn">+ 新建相册</button>
        </div>
      </aside>

      <!-- 照片墙 -->
      <main ref="photoWallRef" :class="['photo-wall', { 'mobile-show': !showAlbumPanel }]">
        <div v-if="currentAlbumId" class="photo-wall-header">
          <span class="photo-wall-title">{{ currentAlbumName || '未命名相册' }}</span>
          <span class="photo-wall-count">共 {{ photos.length }} 张</span>
        </div>

        <div v-if="loadingPhotos" class="loading-state">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else-if="!currentAlbumId" class="empty-state">
          <div class="empty-icon-text">请选择或新建一个相册</div>
        </div>
        <div v-else-if="photos.length === 0" class="empty-state">
          <div class="empty-icon-text">暂无照片</div>
          <div class="empty-tip">点击右下角按钮上传</div>
        </div>

        <div v-else class="photo-list">
          <div v-for="photo in photos" :key="photo._id" class="photo-item">
            <img :src="photo.fileUrl" @click="previewPhoto(photo)" loading="lazy" />
            <button class="photo-del-btn" @click.stop="deletePhoto(photo._id)">×</button>
          </div>
        </div>

        <button class="fab-upload" @click="chooseImage" :disabled="!currentAlbumId || uploading">
          <span v-if="uploading" class="fab-uploading">{{ uploadProgress }}</span>
          <span v-else>+</span>
        </button>
      </main>
    </div>

    <!-- 新增/重命名相册弹窗 -->
    <el-dialog
      :model-value="showCreate || showEdit"
      :title="showCreate ? '新建相册' : '重命名相册'"
      width="320px"
      :close-on-click-modal="true"
      @close="closeModal"
    >
      <el-input
        v-model="albumNameInput"
        placeholder="请输入相册名称"
        maxlength="20"
        @keyup.enter="showCreate ? doCreateAlbum() : doEditAlbum()"
      />
      <template #footer>
        <el-button @click="closeModal">取消</el-button>
        <el-button type="primary" @click="showCreate ? doCreateAlbum() : doEditAlbum()">
          {{ showCreate ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { toast } from '../../utils/common/toast.js'

interface Album {
  _id: string;
  name: string;
  createTime: number;
  photoCount?: number;
}
interface Photo {
  _id: string;
  albumId: string;
  fileName: string;
  fileUrl: string;
  createTime: number;
}

const albums = ref<Album[]>([])
const currentAlbumId = ref<string>('')
const photos = ref<Photo[]>([])
const showCreate = ref(false)
const showEdit = ref(false)
const albumNameInput = ref('')
const editAlbumId = ref('')
const loadingPhotos = ref(false)
const photoWallRef = ref<HTMLElement | null>(null)
const uploading = ref(false)
const uploadProgress = ref('')
const showAlbumPanel = ref(true)

const currentAlbumName = computed(() => {
  const album = albums.value.find(a => a._id === currentAlbumId.value)
  return album ? album.name : ''
})

const onBack = () => {
  uni.redirectTo({ url: '/pages/stele/list' })
}

const fetchAlbums = async () => {
  const res = await uniCloud.callFunction({ name: 'album-list' })
  if (res.result && res.result.code === 0) {
    albums.value = res.result.data
    if (albums.value.length > 0 && !currentAlbumId.value) {
      currentAlbumId.value = albums.value[0]._id
      fetchPhotos(currentAlbumId.value)
    }
    if (albums.value.length > 0 && !albums.value.find(a => a._id === currentAlbumId.value)) {
      currentAlbumId.value = albums.value[0]._id
      fetchPhotos(currentAlbumId.value)
    }
    if (albums.value.length === 0) {
      currentAlbumId.value = ''
      photos.value = []
    }
  }
}

const fetchPhotos = async (albumId: string) => {
  loadingPhotos.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'photo-list',
      data: { albumId }
    })
    if (albumId !== currentAlbumId.value) return
    if (res.result && res.result.code === 0) {
      const photoArr = res.result.data
      if (photoArr.length > 0) {
        const fileList = photoArr.map((item: any) => item.fileUrl)
        const tempRes = await uniCloud.getTempFileURL({ fileList })
        if (albumId !== currentAlbumId.value) return
        photos.value = photoArr.map((item: any, idx: number) => ({
          ...item,
          fileUrl: tempRes.fileList[idx].tempFileURL
        }))
      } else {
        photos.value = []
      }
    }
  } finally {
    if (albumId === currentAlbumId.value) loadingPhotos.value = false
  }
}

const selectAlbum = (albumId: string) => {
  currentAlbumId.value = albumId
  fetchPhotos(albumId)
  showAlbumPanel.value = false
}

const openCreateModal = () => {
  albumNameInput.value = ''
  showCreate.value = true
}

const doCreateAlbum = async () => {
  if (!albumNameInput.value.trim()) {
    toast.error('请输入相册名称')
    return
  }
  const res = await uniCloud.callFunction({
    name: 'album-create',
    data: { name: albumNameInput.value.trim() }
  })
  if (res.result && res.result.code === 0) {
    showCreate.value = false
    await fetchAlbums()
    const newAlbum = albums.value[albums.value.length - 1]
    if (newAlbum) selectAlbum(newAlbum._id)
  } else {
    toast.error(res.result.msg)
  }
}

const editAlbum = (album: Album) => {
  editAlbumId.value = album._id
  albumNameInput.value = album.name
  showEdit.value = true
}

const doEditAlbum = async () => {
  if (!albumNameInput.value.trim()) {
    toast.error('请输入相册名称')
    return
  }
  const res = await uniCloud.callFunction({
    name: 'album-update',
    data: { _id: editAlbumId.value, name: albumNameInput.value.trim() }
  })
  if (res.result && res.result.code === 0) {
    showEdit.value = false
    fetchAlbums()
  } else {
    toast.error(res.result.msg)
  }
}

const closeModal = () => {
  showCreate.value = false
  showEdit.value = false
  albumNameInput.value = ''
}

const deleteAlbum = async (_id: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要移除该相册及其所有图片吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await uniCloud.callFunction({ name: 'album-delete', data: { _id } })
          toast.success('已移除')
          fetchAlbums()
        } catch (e) {
          toast.error('移除失败')
        }
      }
    }
  })
}

const chooseImage = () => {
  uni.chooseImage({
    count: 9,
    success: async (res) => {
      const files = res.tempFilePaths
      const targetAlbumId = currentAlbumId.value
      uploading.value = true
      let done = 0
      let failed = 0
      uploadProgress.value = `0/${files.length}`

      // 单张上传函数（容错到单张）
      const uploadOne = async (tempFilePath: string) => {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`
        const uploadRes = await uniCloud.uploadFile({
          filePath: tempFilePath,
          cloudPath: `photos/${fileName}`
        })
        const fileUrl = uploadRes.fileID
        await uniCloud.callFunction({
          name: 'photo-insert',
          data: { albumId: targetAlbumId, fileName, fileUrl }
        })
      }

      // 串行上传避免并发占带宽，但单张失败不阻断后续
      for (const tempFilePath of files) {
        try {
          await uploadOne(tempFilePath)
          done++
        } catch (e) {
          failed++
        }
        uploadProgress.value = `${done + failed}/${files.length}`
      }

      if (failed === 0) {
        toast.success(`成功上传 ${done} 张`)
      } else if (done > 0) {
        toast.error(`成功 ${done} 张，失败 ${failed} 张`)
      } else {
        toast.error('上传失败')
      }

      if (done > 0 && currentAlbumId.value === targetAlbumId) {
        await fetchPhotos(targetAlbumId)
        nextTick(() => { photoWallRef.value?.scrollTo({ top: photoWallRef.value.scrollHeight, behavior: 'smooth' }); })
      }
      if (done > 0) fetchAlbums()
      uploading.value = false
    }
  })
}

const deletePhoto = async (_id: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要移除这张图片吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await uniCloud.callFunction({ name: 'photo-delete', data: { _id } })
          fetchPhotos(currentAlbumId.value)
          fetchAlbums()
        } catch (e) {
          toast.error('移除失败')
        }
      }
    }
  })
}

const previewPhoto = (photo: Photo) => {
  uni.previewImage({
    current: photo.fileUrl,
    urls: photos.value.map(p => p.fileUrl)
  })
}

onMounted(() => {
  fetchAlbums()
})
</script>

<style scoped>
.album-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #EDE8E2 0%, var(--color-bg-blue-light) 100%);
  display: flex;
  flex-direction: column;
}
.album-body { display: flex; flex: 1; }
.mobile-header {
  display: none; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid var(--color-border-light);
  position: sticky; top: 0; z-index: 10;
}
.mobile-header-title { font-size: 16px; font-weight: 600; color: var(--color-primary); }
.mobile-toggle-btn {
  background: linear-gradient(180deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  color: #fff; border: none; padding: 6px 14px; border-radius: 6px;
  font-size: 13px; cursor: pointer;
}
.desktop-back-bar { padding: 16px 32px 0; }
.back-btn {
  background: none; border: 1px solid var(--color-border); color: var(--color-primary);
  padding: 6px 16px; border-radius: 8px; font-size: 14px; cursor: pointer;
  transition: background 0.2s;
}
.back-btn:hover { background: var(--color-bg-blue); }
.album-nav {
  width: 240px; flex-shrink: 0; background: #fff; border-radius: 16px;
  margin: 16px 0 32px 32px; padding: 20px 0 24px 0;
  box-shadow: 0 4px 16px rgba(184, 134, 11, 0.1);
  border: 1px solid var(--color-border);
  display: flex; flex-direction: column; gap: 4px;
  height: fit-content; max-height: calc(100vh - 120px); overflow-y: auto;
}
.album-nav-title {
  margin: 0 24px 12px 24px; font-size: 16px; font-weight: 600;
  color: var(--color-primary); padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}
.album-nav-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 24px; border-radius: 8px; cursor: pointer;
  transition: background 0.2s; font-size: 14px;
}
.album-nav-item.active {
  background: linear-gradient(90deg, var(--color-bg-blue) 0%, var(--color-bg-blue-light) 100%);
  color: var(--color-primary); font-weight: bold;
  border-left: 3px solid var(--color-primary);
}
.album-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.album-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.album-count { font-size: 13px; color: var(--color-border); font-weight: normal; }
.album-nav-item:hover .album-actions { opacity: 1; }
.album-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; flex-shrink: 0; }
.album-action-btn {
  background: none; border: none; color: var(--color-primary); font-size: 14px;
  cursor: pointer; padding: 6px 10px; border-radius: 4px; transition: background 0.2s;
}
.album-action-del { color: var(--color-danger); }
.album-action-btn:hover { background: var(--color-bg-blue); }
.album-action-del:hover { background: #fff1f0; }
.album-empty-tip { text-align: center; color: var(--color-border); font-size: 14px; padding: 24px 0; }
.album-nav-add { margin: 12px 24px 0 24px; }
.album-add-btn {
  width: 100%; background: none; border: 1px dashed var(--color-success);
  color: var(--color-success); font-weight: 600; cursor: pointer; font-size: 14px;
  padding: 8px 0; border-radius: 8px; transition: background 0.2s, border-color 0.2s;
}
.album-add-btn:hover { background: #f6ffed; border-color: var(--color-success-hover); }
.photo-wall {
  flex: 1; margin: 16px 32px 32px 24px; background: #fff; border-radius: 16px;
  padding: 20px 24px 80px 24px;
  box-shadow: 0 4px 16px rgba(184, 134, 11, 0.1);
  border: 1px solid var(--color-border);
  position: relative; min-height: 400px; overflow-y: auto;
}
.photo-wall-header {
  margin-bottom: 20px; padding-bottom: 12px;
  border-bottom: 1px solid var(--color-bg-blue);
  display: flex; align-items: baseline; gap: 12px;
}
.photo-wall-title { font-size: 16px; font-weight: 600; color: var(--color-primary); }
.photo-wall-count { font-size: 13px; color: var(--color-border); }
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; margin-top: 80px; color: var(--color-primary-light); font-size: 14px;
}
.loading-spinner {
  width: 32px; height: 32px; border: 3px solid var(--color-border-light);
  border-top-color: var(--color-primary); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.photo-list {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;
}
.photo-item {
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(184, 134, 11, 0.08);
  background: white; position: relative;
  transition: transform 0.25s, box-shadow 0.25s;
  border: 1px solid var(--color-border-light); aspect-ratio: 1;
}
.photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; cursor: pointer; transition: transform 0.2s; }
.photo-item:hover { border-color: var(--color-border); box-shadow: 0 4px 16px rgba(184, 134, 11, 0.14); }
.photo-item:hover img { transform: scale(1.04); }
.photo-del-btn {
  position: absolute; top: 6px; right: 6px;
  background: rgba(255, 77, 79, 0.9); color: white; border: none;
  border-radius: 50%; width: 30px; height: 30px; font-size: 18px; line-height: 1;
  cursor: pointer; opacity: 0; transition: opacity 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.photo-item:hover .photo-del-btn { opacity: 1; }
.fab-upload {
  position: fixed; right: 32px; bottom: 32px; width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(180deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  color: #fff; font-size: 28px; font-weight: 300; border: none;
  box-shadow: 0 4px 20px rgba(184, 134, 11, 0.25);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 100; transition: background 0.2s, transform 0.2s;
}
.fab-upload:disabled { background: #d9d9d9; cursor: not-allowed; transform: none; }
.fab-upload:hover:enabled {
  background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-primary-hover) 100%);
  box-shadow: 0 6px 24px rgba(184, 134, 11, 0.3); transform: scale(1.08);
}
.fab-uploading { font-size: 13px; font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; margin-top: 80px; gap: 8px; }
.empty-icon-text { font-size: 16px; color: var(--color-primary-light); font-weight: 500; }
.empty-tip { color: var(--color-border); font-size: 14px; }

@media (max-width: 768px) {
  .desktop-back-bar { display: none; }
  .mobile-header { display: flex; }
  .album-body { flex-direction: column; }
  .album-nav { display: none; width: auto; margin: 0 12px; border-radius: 12px; max-height: none; }
  .album-nav.mobile-show { display: flex; }
  .photo-wall { display: none; margin: 0 12px 12px; border-radius: 12px; padding: 16px 12px 80px 12px; min-height: auto; }
  .photo-wall.mobile-show { display: block; }
  .photo-list { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
  .photo-del-btn { opacity: 1; }
  .album-actions { opacity: 1; }
  .fab-upload { right: 20px; bottom: 20px; width: 48px; height: 48px; font-size: 24px; }
}
</style>
