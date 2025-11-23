<template>
  <div class="main-container">
    <!-- 标题 -->
    <h1 class="page-title">
      <font-awesome-icon icon="fa-solid fa-graduation-cap"/> 课堂随机点名Pro
    </h1>

    <!-- 左侧：抽取历史卡片 -->
    <div class="history-card card" ref="historyList">
      <h3 class="card-title">
        <font-awesome-icon icon="fa-solid fa-history"/> 抽取历史
      </h3>
      <div class="history-list">
        <p v-if="store.drawHistory.length === 0" class="empty-hint">暂无记录</p>
        <div v-else class="list-item" v-for="(item, index) in store.drawHistory" :key="index" @click="addScoreToHistoryItem(item.name)">
          <span class="history-group">组{{ item.groupId }}</span>
          <span class="history-name">{{ item.name }}</span>
          <span class="history-time">{{ formatTime(item.time) }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：班级信息卡片 -->
    <div class="class-info-card card">
      <!-- 未选择班级 -->
      <div v-if="!store.currentClass" class="class-selector fade-in">
        <p>请先选择班级</p>
        <div class="class-buttons">
          <button
              v-for="className in classNames"
              :key="className"
              class="btn btn-primary scale-hover"

              @click="store.selectClass(className)"
          >
            <font-awesome-icon icon="fa-solid fa-chevron-circle-right"/>
            {{ className }}
          </button>
        </div>
      </div>

      <!-- 已选择班级 -->
      <div v-else class="class-details fade-in">
        <div class="group-list" ref="classInfoCard">
          <div v-for="group in store.currentClass.groups" :key="group['group-id']" class="group-item scale-hover">
            <!-- 小组ID与总分 -->
            <div class="group-header">
              <span class="group-id">组{{ group['group-id'] }}</span>
              <span class="group-total">总分: [{{ getGroupTotal(group) }}]</span>
            </div>
            <!-- 学生列表 -->
            <div class="students-list">
              <div v-for="student in group.students" :key="student.name" class="student-item" :id="`student-${student.name}`">
                <span class="student-name">{{ student.name }}</span>
                <span class="student-score">{{ student.score }}</span>
              </div>
              <!-- 小组其他加分 -->
              <div class="group-other">
                其他加分：[{{ group.other }}]
              </div>
            </div>
          </div>
        </div>

        <!-- 统计/编辑按钮 -->
        <div class="action-buttons">
          <button class="btn btn-primary" @click="store.setShowStatistics(true)">
            <font-awesome-icon icon="fa-solid fa-chart-pie"/> 统计
          </button>
          <button class="btn btn-secondary" @click="store.setShowEdit(true)">
            <font-awesome-icon icon="fa-solid fa-pen-to-square"/> 编辑
          </button>
        </div>
      </div>
    </div>

    <!-- 中部：抽取操作区 -->
    <div class="draw-area">
      <!-- 抽取结果显示 -->
      <div class="result-box card">
        <span v-if="!currentDrawResult">等待抽取...</span>
        <span v-else :key="currentDrawResult" class="fade-in">{{ currentDrawResult }}</span>
      </div>

      <!-- 分数操作按钮 -->
      <div class="score-area">
        <div class="score-actions">
          <div class="btn-group">
            <button class="btn btn-secondary" @click="updateScore(1)" :disabled="!currentDrawResult">当前学生+1</button>
            <button class="btn btn-secondary" @click="updateScore(-1)" :disabled="!currentDrawResult">当前学生-1</button>
          </div>
          <!-- 第二排：2个按钮 -->
          <div class="btn-group">
            <button class="btn btn-secondary" @click="updateScore(3)" :disabled="!currentDrawResult">当前学生+3</button>
            <button class="btn btn-secondary" @click="addPrevScore(3)" :disabled="store.drawHistory.length < 2">上一学生+3</button>
          </div>
        </div>
      </div>

      <!-- 抽取控制区 -->
      <div class="draw-controls card">
        <button class="draw-btn btn btn-primary" @click="startDraw" :disabled="!store.currentClass">
          <font-awesome-icon icon="fa-solid fa-random"/> 开始抽取
        </button>
        <v-select
            v-model="drawMode"
            :items="drawModeOptions"
            class="mode-select"
            :disabled="!store.currentClass"
            density="comfortable"
            variant="solo-filled"
        />
      </div>

      <!-- 底部版权信息 -->
      <div class="footer">
        <p>Created with <font-awesome-icon icon="fa-brands fa-vuejs" style="color:forestgreen;"></font-awesome-icon> Vue , made by <a href="https://github.com/Mengmiya1027" target="_blank" style="color: skyblue">Mengmiya1027</a></p>
      </div>
    </div>
    <!-- 使用teleport将弹窗传送到body -->
    <teleport to="body">
      <div class="modal-layer">
        <transition name="fade">
          <div
              v-if="store.adjustmentPopup.show"
              class="modal-backdrop"
              @click="handleBackdropClick"
          ></div>
        </transition>
        <transition name="popup">
          <div class="modal popup-content" v-if="store.adjustmentPopup.show" @click.stop>
            <!-- 概率修改弹窗内容 -->
            <div v-if="store.adjustmentPopup.type === 'probability'">
              <div class="popup-header">
                <div class="tip card" style="width: 100%; display: flex; justify-content: center; align-items: center; margin: 0">
                  <span class="tip-title">{{ store.adjustmentPopup.title }}</span>
                </div>
              </div>
              <pre class="popup-message">{{ store.adjustmentPopup.message }}</pre>
            </div>

            <!-- 错误弹窗内容 -->
            <div v-if="store.adjustmentPopup.type === 'error'">
              <div class="popup-header error-header">
                <div class="error card" style="width: 100%; display: flex; justify-content: center; align-items: center; margin: 0">
                  <span class="error-title">{{ store.adjustmentPopup.title }}</span>
                </div>
              </div>
              <pre class="popup-message">{{ store.adjustmentPopup.message }}</pre>
              <div class="popup-footer">
                <button
                    class="btn btn-primary apply-btn"
                    @click="store.setAdjustmentPopup(false)"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { useMainStore } from '../stores/index.js'
import { computed, ref, watch, nextTick } from 'vue' // 导入watch和nextTick

const store = useMainStore()
const historyList = ref(null)
const classInfoCard = ref(null)
const classNames = computed(() => store.allClasses.map(cls => cls["class-name"]))
const currentDrawResult = ref(null) // 当前抽取结果（姓名）
const drawMode = ref('normal') // 默认普通模式

// 格式化时间（辅助函数）
const formatTime = (time) => {
  return new Date(time).toLocaleTimeString()
}

window.store = store

// 定义选择框选项
const drawModeOptions = [
  { value: 'normal', title: '普通模式' },
  { value: 'fair', title: '固定概率模式' },
  { value: 'group-fair', title: '新小组公平模式' },
  { value: 'old-group-fair', title: '旧小组公平模式' }
]
const scrollToStudent = (name) => {
  nextTick(() => {
    const studentEl = document.getElementById(`student-${name}`)
    if (studentEl && classInfoCard.value) {
      // 计算滚动位置（使目标元素居中）
      const cardRect = classInfoCard.value.getBoundingClientRect()
      const studentRect = studentEl.getBoundingClientRect()
      const scrollPosition = studentEl.offsetTop - (cardRect.height / 2) + (studentRect.height / 2)

      // 平滑滚动到目标位置
      classInfoCard.value.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    }
  })
}

// 监听弹窗显示状态，处理自动关闭
watch(
    () => store.adjustmentPopup.show,
    (newVal) => {
      if (newVal && store.adjustmentPopup.type === 'probability') {
        // 2秒后自动关闭概率调整弹窗
        const timer = setTimeout(() => {
          store.setAdjustmentPopup(false)
        }, 2000)

        // 清除定时器防止内存泄漏
        return () => clearTimeout(timer)
      }
    }
)

watch(
    () => store.drawHistory,
    () => {
      nextTick(() => {
        if (historyList.value) {
          // 改为平滑滚动到底部
          historyList.value.scrollTo({
            top: historyList.value.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    },
    { deep: true }
);

// 点击遮罩层关闭（仅错误类型弹窗允许）
const handleBackdropClick = () => {
  if (store.adjustmentPopup.type === 'error') {
    store.setAdjustmentPopup(false)
  }
}

// 为历史项对应的学生加分
const addScoreToHistoryItem = (name) => {
  store.currentClass.groups.forEach(group => {
    group.students.forEach(student => {
      if (student.name === name) {
        student.score += 1
        scrollToStudent(name) // 分数变动后滚动
      }
    })
  })
}


// 计算小组总分
const getGroupTotal = (group) => {
  const studentScores = group.students.reduce((sum, s) => sum + s.score, 0)
  return studentScores + group.other
}

// 模拟抽取
const startDraw = () => {
  if (!store.currentClass) return;
  // 调用store的抽取方法（传入当前模式）
  const selected = store.drawStudent(drawMode.value);
  if (selected) {
    currentDrawResult.value = selected.name; // 显示抽中姓名
  }
};

// 更新当前学生分数
const updateScore = (delta) => {
  if (!currentDrawResult.value) return
  const name = currentDrawResult.value
  store.currentClass.groups.forEach(group => {
    group.students.forEach(student => {
      if (student.name === name) {
        student.score += delta
        scrollToStudent(name) // 分数变动后滚动
      }
    })
  })
}

// 给上一个学生+3分
const addPrevScore = (delta) => {
  if (store.drawHistory.length < 2) return
  const prevName = store.drawHistory[store.drawHistory.length - 2].name
  store.currentClass.groups.forEach(group => {
    group.students.forEach(student => {
      if (student.name === prevName) {
        student.score += delta
        scrollToStudent(prevName) // 分数变动后滚动
      }
    })
  })
}
</script>

<style scoped>

.page-title {
  font-size: 2em;
  line-height: 0 !important;
  padding-top: 0.3em;
}
.main-container {
  padding: var(--spacing-md);
  position: relative;
  min-height: 100vh;
}

/* 左侧历史卡片 */
.history-card {
  position: absolute;
  left: var(--spacing-md);
  top: 80px;
  width: 20%;
  height: 85vh;
  overflow-y: auto;
}

.history-list .list-item {
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-xs);
  border-bottom: none;
}

.history-group {
  color: var(--primary-color);
  font-weight: bolder;
}

.history-time {
  color: var(--gray-dark);
  font-size: 15px;
  height: 100%;
  text-align: center;
  line-height: 100%;
}

/* 右侧班级信息卡片 */
.class-info-card {
  position: absolute;
  right: var(--spacing-md);
  height: 95vh;
  top: 15px;
  width: 25%;
  overflow-y: auto;
  padding-bottom: 9px;
}

.class-selector {
  text-align: center;
  padding: var(--spacing-lg) 0;
  font-size: 25px;
  font-weight: 700;
}

.class-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-top: var(--spacing-md);
}

.class-buttons .btn {
  font-size: 20px;
  font-weight: 700;
}

.class-details {
  display: flex;
  flex-direction: column; /* 垂直排列子元素 */
  height: 100%; /* 占满根容器高度 */
}

.group-list {
  flex: 1; /* 占据除按钮区域外的所有空间 */
  overflow-y: auto; /* 内容过多时可纵向滚动 */
  border-radius: var(--border-radius);
}

.group-item {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--gray-light);
  border-radius: var(--border-radius);
}

.group-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.group-id {
  background-color: var(--primary-color);
  color: white;
  width: 50px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.group-total {
  color: var(--primary-dark);
  font-weight: 500;
}

.students-list {
  padding-left: var(--spacing-sm);
}

.student-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
}

.student-name {
  background-color: var(--primary-light);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.student-score {
  color: var(--black);
}

.group-other {
  color: var(--gray-dark);
  font-size: 13px;
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px dashed var(--gray);
}

.action-buttons {
  display: inline-flex;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-top: var(--spacing-sm);
}

/* 中部抽取区 */
.draw-area {
  position: absolute;
  left: 25%;
  right: 30%;
  top: 50%;
  transform: translateY(-50%);
  text-align: center;
}

.result-box {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  font-size: 60px;
  font-weight: bold;
  color: var(--primary-color);
}

.score-area {
  display: flex;
  justify-content: center;
}

.score-actions {
  display: inline-flex;
  background-color: white;
  padding: 6px;
  border-radius: var(--border-radius);
  gap: 8px;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.btn-group{
  display: inline-flex;
  gap: 8px;
}

[class="action-buttons"]> [class="btn btn-secondary"]{
  box-shadow: rgba(0, 0, 0, 0.1) 0 0 5px;
  font-size: 20px;
  flex: 1;
  justify-content: center;
}

[class="action-buttons"]> [class="btn btn-primary"]{
  font-size: 20px;
  flex: 1;
  justify-content: center;
}

.draw-btn {
  display: inline-flex;
  justify-content: center;
  text-align: center;
  width: 200px;
  height: 50px;
  font-weight: 1000;
  font-size: 25px;
}

.mode-select {
  text-align: center;
  height: 100%;
}

.draw-controls {
  padding: 4px 4px !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.mode-select {
  min-width: 150px;
}

.footer {
  color: var(--gray-dark);
  font-size: 12px;
  margin-top: var(--spacing-lg);

}

.footer i {
  color: forestgreen;
  margin: 0 2px;
}

/* 图标样式（可选，确保图标不挤压内容） */
.adjustment-popup i {
  margin-top: 2px; /* 与文字顶部对齐 */
  font-size: 18px;
}

.modal-layer {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200; /* 作为整个模态层的基准层级 */
  pointer-events: none;
}

.modal-backdrop {
  position: fixed; /* 固定定位，相对于视口 */
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200; /* 确保遮罩层在内容之上 */
  will-change: transform;
  pointer-events: all;
}

.modal {
  width: 100%;
  max-width: 600px;
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 201;
  animation: fadeIn 0.3s ease;
  will-change: transform;
  pointer-events: all;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.popup-header .selected-name {
  font-size: 22px;
  font-weight: bold;
  color: var(--primary-color);
}

.error-header {
  border-color: #fecaca;
}

.tip-title{
  font-size: 40px;
  font-weight: 800;
  color: var(--warning);
}

.error-title {
  font-size: 35px;
  font-weight: 800;
  color: white;
}

.popup-message {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
  word-wrap: normal;
  font-family: inherit;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.apply-btn {
  flex: 1;
  width: 100%;
  justify-content: center;
  text-align: center;
  font-size: 20px;
  padding: 6px;
  font-weight: 700;
}

/* ====== 动画 ====== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.popup-enter-active {
  animation: fadeIn 0.3s ease;
}

.popup-leave-active {
  animation: fadeOut 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.97); }
}

/* 图标样式 */
.popup-header i {
  font-size: 24px;
}

.popup-header i.fa-random {
  color: var(--primary-color);
}

.popup-header i.fa-exclamation-circle {
  color: #dc2626;
}

</style>