<template>
  <div class="main-container">
    <!-- 标题 -->
    <h1 class="page-title">
      <i class="fa-solid fa-graduation-cap"></i> 课堂随机点名Pro
    </h1>

    <!-- 左侧：抽取历史卡片 -->
    <div class="history-card card" ref="historyList">
      <h3 class="card-title">
        <i class="fa-solid fa-history"></i> 抽取历史
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
            <i class="fa-solid fa-chevron-circle-right"></i>
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
            <i class="fa-solid fa-chart-pie"></i> 统计
          </button>
          <button class="btn btn-secondary" @click="store.setShowEdit(true)">
            <i class="fa-solid fa-pen-to-square"></i> 编辑
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

      <!-- 抽取控制区 -->
      <div class="draw-controls card">
        <button class="draw-btn btn btn-primary" @click="startDraw" :disabled="!store.currentClass">
          <i class="fa-solid fa-random"></i> 开始抽取
        </button>
        <select class="input mode-select" v-model="drawMode">
          <option value="normal">普通模式</option>
          <option value="group-fair">小组公平模式</option>
          <option value="personal-fair">个人公平模式</option>
        </select>
      </div>

      <!-- 底部版权信息 -->
      <div class="footer">
        <p>Created with <i class="fa-brands fa-vuejs" style="color:forestgreen;"></i> Vue , made by <a href="https://github.com/Mengmiya1027" target="_blank" style="color: skyblue">Mengmiya1027</a></p>
      </div>
    </div>
    <transition name="popup">
      <div
          v-if="store.adjustmentPopup.show"
          class="adjustment-popup"
      >
        <i class="fa-solid" :class="store.adjustmentPopup.type === 'group' ? 'fa-users' : 'fa-user'"></i>
        <pre class="popup-message">{{ store.adjustmentPopup.message }}</pre>
      </div>
    </transition>
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

const handleAnimationEnd = () => {
  if (store.adjustmentPopup.isFadingOut) {
    store.adjustmentPopup.isFadingOut = false;  // 重置动画状态
    // 可选：如果需要完全移除DOM，可在这里设置show: false（但v-if已包含此逻辑）
  }
};

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

// 模拟抽取（后续替换为真实逻辑）
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
  font-family: 'SourceHanSansSC', sans-serif;
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
  width: 250px;
  height: 60px;
  font-weight: 1000;
  font-size: 25px;
}

.mode-select {
  text-align: center;
  height: 60px;
  font-weight: 500;
  font-size: 20px;
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

.adjustment-popup {
  position: fixed;
  left: 47.5%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--primary-color);
  color: white;
  padding: 16px; /* 固定内边距，避免过窄 */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 100;
   /* 核心修复：允许内容自适应宽度，同时限制最大宽度不超过视口 */
  width: auto; /* 宽度随内容自适应 */
  max-width: 700px; /* 最大宽度为视口的90%，避免超出屏幕 */
  max-height: 80vh; /* 最大高度为视口的80%，避免内容过长溢出 */
   /* 内容溢出时显示滚动条 */
  overflow-y: auto;
}

.popup-message {

  margin: 0;
  white-space: pre-wrap; /* 保留换行符 */
  word-wrap: normal;
  font-family: 'DingTalk JinBuTi', 'DingTalk Sans', sans-serif;
  font-size: 25px;
  line-height: 1.5; /* 增加行高，提升可读性 */
}

/* 图标样式（可选，确保图标不挤压内容） */
.adjustment-popup i {
  margin-top: 2px; /* 与文字顶部对齐 */
  font-size: 18px;
}

.popup-enter-from {
  opacity: 0;
}
.popup-enter-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}
.popup-enter-to {
  opacity: 1;
}

/* 消失动画（离开时触发） */
.popup-leave-from {
  opacity: 1;
}
.popup-leave-active {
  transition: opacity 0.3s ease-in, transform 0.3s ease-in;
}
.popup-leave-to {
  opacity: 0;
}

</style>