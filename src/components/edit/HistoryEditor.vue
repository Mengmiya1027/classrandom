<template>
  <div class="history-editor card">
    <h3 class="card-title">
      <font-awesome-icon icon="fa-solid fa-history"/> 抽取历史编辑
    </h3>
    <div class="history-list">
      <p v-if="historyData.length === 0" class="empty-hint">暂无抽取记录</p>
      <div v-else class="list-item" v-for="(item, index) in historyData" :key="index">
        <div class="history-info">
          <span class="history-group">组{{ item.groupId }}</span>
          <span class="history-name">{{ item.name }}</span>
          <span class="history-time">{{ formatTime(item.time) }}</span>
        </div>
        <div class="edit-actions">
          <button class="btn btn-secondary" @click="modifyHistory(index)">修改</button>
          <button class="btn btn-secondary" @click="deleteHistory(index)">删除</button>
        </div>
      </div>
    </div>

    <!-- 修改历史弹窗 -->
    <div v-if="showModifyModal" class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h4>修改历史记录</h4>
          <button @click="showModifyModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>学生姓名：</label>
            <input
                type="text"
                v-model="modifiedItem.name"
                class="input"
            >
          </div>
          <div class="form-group">
            <label>小组ID：</label>
            <input
                type="number"
                v-model="modifiedItem.groupId"
                class="input"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModifyModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmModify">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  historyData: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['update:history-data'])

const showModifyModal = ref(false)
const modifiedItem = ref({ name: '', groupId: 1, time: null })
const currentIndex = ref(-1)

// 格式化时间
const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

// 删除历史记录
const deleteHistory = (index) => {
  const newHistory = [...props.historyData]
  newHistory.splice(index, 1)
  emit('update:history-data', newHistory)
}

// 修改历史记录
const modifyHistory = (index) => {
  currentIndex.value = index
  modifiedItem.value = { ...props.historyData[index] }
  showModifyModal.value = true
}

// 确认修改
const confirmModify = () => {
  if (currentIndex.value === -1) return
  const newHistory = [...props.historyData]
  newHistory[currentIndex.value] = {
    ...modifiedItem.value,
    time: new Date().getTime() // 记录修改时间
  }
  emit('update:history-data', newHistory)
  showModifyModal.value = false
}
</script>

<style scoped>
.history-list {
  padding: var(--spacing-md);
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--gray-light);
}

.history-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.history-group {
  color: var(--primary-color);
  font-weight: bold;
}

.history-time {
  color: var(--gray-dark);
  font-size: 14px;
}

.edit-actions {
  display: flex;
  gap: var(--spacing-xs);
}

/* 弹窗样式复用原项目风格 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal {
  background-color: white;
  border-radius: var(--border-radius);
  width: 500px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--gray-light);
}

.modal-body {
  padding: var(--spacing-md);
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--gray-light);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
</style>