<template>
  <div class="edit-container page-container">
    <!-- 标题栏 -->
    <div class="page-header">
      <h2 class="page-title">
        <i class="fa-solid fa-pen-to-square"></i> 编辑抽取与统计信息
      </h2>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="showBatchSelect = true">
          <i class="fa-solid fa-list-check"></i> 批量编辑
        </button>
        <button class="btn btn-secondary" @click="$emit('close')">
          <i class="fa-solid fa-xmark"></i> 关闭
        </button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="page-content">
      <!-- 数据表格 -->
      <div class="data-table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="table-col col-group-id">组ID</div>
          <div class="table-col col-student">学生信息</div>
          <div class="table-col col-score">分数</div>
          <div class="table-col col-prob">概率</div>
          <div class="table-col col-duration">持续时间</div>
        </div>

        <!-- 组列表 -->
        <div v-for="group in store.currentClass.groups" :key="group['group-id']" class="group-wrapper">
          <!-- 组标题行 -->
          <div class="group-header">
            <div class="table-col col-group-id">
              <div class="group-id">
                {{ group['group-id'] }}
              </div>
            </div>
            <div class="table-col col-student group-total" colspan="4">
              <span class="text-primary">小组总分：</span>
              <span class="badge">{{ calculateGroupTotal(group) }}</span>
            </div>
          </div>

          <!-- 学生列表 -->
          <div class="student-list">
            <div v-for="student in group.students" :key="student.name" class="table-row hover-highlight">
              <div class="table-col col-group-id"></div>
              <div class="table-col col-student">
                <div class="student-info">
                  <span class="student-name">{{ student.name }}</span>
                  <span class="student-class text-gray">{{ store.currentClass['class-name'] }}</span>
                </div>
              </div>

              <!-- 分数编辑 -->
              <div class="table-col col-score">
                <div class="edit-control">
                  <button class="btn btn-sm btn-secondary" @click="updateStudentScore(student, -1)">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <input
                      type="number"
                      class="form-input"
                      v-model.number="student.score"
                      @focus="inputFocus($event)"
                      @blur="inputBlur($event)"
                  >
                  <button class="btn btn-sm btn-secondary" @click="updateStudentScore(student, 1)">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>

              <!-- 概率编辑 -->
              <div class="table-col col-prob">
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    class="form-input"
                    v-model.number="student.probability"
                    @focus="inputFocus($event)"
                    @blur="inputBlur($event)"
                >
              </div>

              <!-- 持续时间编辑 -->
              <div class="table-col col-duration">
                <input
                    type="number"
                    min="0"
                    class="form-input"
                    v-model.number="student.duration"
                    @focus="inputFocus($event)"
                    @blur="inputBlur($event)"
                >
              </div>
            </div>

            <!-- 小组其他加分 -->
            <div class="table-row hover-highlight other-score-row">
              <div class="table-col col-group-id"></div>
              <div class="table-col col-student">
                <span class="text-gray">其他加分：</span>
              </div>

              <div class="table-col col-score">
                <div class="edit-control">
                  <button class="btn btn-sm btn-secondary" @click="group.other--">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <input
                      type="number"
                      class="form-input"
                      v-model.number="group.other"
                      @focus="inputFocus($event)"
                      @blur="inputBlur($event)"
                  >
                  <button class="btn btn-sm btn-secondary" @click="group.other++">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>

              <div class="table-col col-prob"></div>
              <div class="table-col col-duration"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量选择弹窗 -->
    <transition name="popup">
      <div class="modal-backdrop" v-if="showBatchSelect">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">批量编辑 - 选择项</h3>
            <div class="select-all">
              <input type="checkbox" id="select-all" v-model="selectAll">
              <label for="select-all">全选</label>
            </div>
          </div>

          <div class="modal-body">
            <div v-for="group in store.currentClass.groups" :key="group['group-id']" class="batch-group card">
              <div class="batch-group-header">
                <input
                    type="checkbox"
                    :id="`group-${group['group-id']}`"
                    v-model="group.selected"
                    @change="handleGroupSelect(group)"
                >
                <label :for="`group-${group['group-id']}`">组 {{ group['group-id'] }}（总分：{{ calculateGroupTotal(group) }}）</label>
              </div>

              <div class="batch-students">
                <div v-for="student in group.students" :key="student.name" class="batch-student">
                  <input
                      type="checkbox"
                      :id="`student-${student.name}`"
                      v-model="student.selected"
                  >
                  <label :for="`student-${student.name}`">{{ student.name }}（分数：{{ student.score }}）</label>
                </div>

                <!-- 其他加分项 -->
                <div class="batch-other">
                  <input
                      type="checkbox"
                      :id="`other-${group['group-id']}`"
                      v-model="group.otherSelected"
                  >
                  <label :for="`other-${group['group-id']}`">其他加分（当前：{{ group.other }}）</label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showBatchSelect = false">取消</button>
            <button class="btn btn-primary" @click="showBatchSettings = true; showBatchSelect = false">
              设置
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 批量设置弹窗 -->
    <transition name="popup">
      <div class="modal-backdrop" v-if="showBatchSettings">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">批量编辑 - 设置值</h3>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">分数：</label>
              <input
                  type="number"
                  class="form-input"
                  v-model.number="batchSettings.score"
                  placeholder="不修改留空"
                  @focus="inputFocus($event)"
                  @blur="inputBlur($event)"
              >
            </div>

            <div class="form-group">
              <label class="form-label">概率：</label>
              <input
                  type="number"
                  step="0.1"
                  min="0"
                  class="form-input"
                  v-model.number="batchSettings.probability"
                  placeholder="不修改留空"
                  @focus="inputFocus($event)"
                  @blur="inputBlur($event)"
              >
            </div>

            <div class="form-group">
              <label class="form-label">持续时间：</label>
              <input
                  type="number"
                  min="0"
                  class="form-input"
                  v-model.number="batchSettings.duration"
                  placeholder="不修改留空"
                  @focus="inputFocus($event)"
                  @blur="inputBlur($event)"
              >
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showBatchSettings = false">取消</button>
            <button class="btn btn-primary" @click="applyBatchSettings">确认</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { useMainStore } from '../stores/index.js'
import { ref, watch } from 'vue'

const store = useMainStore()
const emit = defineEmits(['close'])

// 计算小组总分
const calculateGroupTotal = (group) => {
  const studentScores = group.students.reduce((sum, student) => sum + (student.score || 0), 0)
  return studentScores + (group.other || 0)
}

// 批量编辑相关状态
const showBatchSelect = ref(false)
const showBatchSettings = ref(false)
const selectAll = ref(false)
const batchSettings = ref({
  score: null,
  probability: null,
  duration: null
})

// 初始化选中状态
const initSelectionState = () => {
  if (store.currentClass?.groups) {
    store.currentClass.groups.forEach(group => {
      group.selected = false
      group.otherSelected = false
      group.students.forEach(student => {
        student.selected = false
      })
    })
  }
}

// 监听全选状态
watch(selectAll, (newVal) => {
  if (store.currentClass?.groups) {
    store.currentClass.groups.forEach(group => {
      group.selected = newVal
      group.otherSelected = newVal
      group.students.forEach(student => {
        student.selected = newVal
      })
    })
  }
})

// 处理组选择
const handleGroupSelect = (group) => {
  const isSelected = group.selected
  group.students.forEach(student => {
    student.selected = isSelected
  })
  group.otherSelected = isSelected
}

// 应用批量设置
const applyBatchSettings = () => {
  if (!store.currentClass?.groups) return

  store.currentClass.groups.forEach(group => {
    // 处理学生
    group.students.forEach(student => {
      if (student.selected) {
        if (batchSettings.value.score !== null) {
          student.score = batchSettings.value.score
        }
        if (batchSettings.value.probability !== null) {
          student.probability = batchSettings.value.probability
        }
        if (batchSettings.value.duration !== null) {
          student.duration = batchSettings.value.duration
        }
      }
    })

    // 处理其他加分
    if (group.otherSelected && batchSettings.value.score !== null) {
      group.other = batchSettings.value.score
    }
  })

  // 重置批量编辑状态
  showBatchSettings.value = false
  batchSettings.value = {
    score: null,
    probability: null,
    duration: null
  }
  initSelectionState()
}

// 学生分数更新
const updateStudentScore = (student, delta) => {
  student.score = (student.score || 0) + delta
}

// 输入框焦点效果
const inputFocus = (e) => {
  e.target.classList.add('input-focus')
}

const inputBlur = (e) => {
  e.target.classList.remove('input-focus')
}

// 初始化
initSelectionState()
</script>

<style scoped>
/* 主容器样式 */
.edit-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 100;
}

/* 表格样式 */
.data-table {
  width: 100%;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.table-header {
  display: flex;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
}

.table-row {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.table-row:last-child {
  border-bottom: none;
}

.table-col {
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
}

.col-group-id {
  width: 100px;
  flex-shrink: 0;
}

.col-student {
  flex: 2;
}

.col-score, .col-prob, .col-duration {
  flex: 1;
  justify-content: center;
}

/* 组样式 */
.group-wrapper {
  border-bottom: 1px solid var(--border-color);
}

.group-wrapper:last-child {
  border-bottom: none;
}

.group-header {
  display: flex;
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 500;
}

.group-id {
  background-color: var(--primary-color);
  color: white;
  padding: 0 10px; /* 左右10px内边距 */
  height: 36px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  white-space: nowrap; /* 禁止换行 */
}

.group-total {
  display: flex;
  align-items: center;
}

/* 学生样式 */
.student-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.student-name {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.other-score-row {
  background-color: var(--gray-lightest);
}

/* 编辑控件样式 */
.edit-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.form-input {
  width: 60px;
  text-align: center;
  transition: all 0.2s ease;
}

.input-focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.2);
}

/* 弹窗样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  width: 90%;
  max-width: 800px;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.modal-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--header-bg);
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.modal-body {
  padding: var(--spacing-lg);
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  background-color: var(--gray-lightest);
}

/* 批量编辑样式 */
.batch-group {
  margin-bottom: var(--spacing-md);
  overflow: hidden;
}

.batch-group:last-child {
  margin-bottom: 0;
}

.batch-group-header {
  padding: var(--spacing-sm);
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-students {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.batch-student, .batch-other {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.form-group {
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  width: 100px;
  flex-shrink: 0;
}

/* 动画效果 */
.popup-enter-from {
  opacity: 0;
}

.popup-enter-active {
  transition: opacity 0.3s ease;
}

.popup-enter-to {
  opacity: 1;
}

.popup-leave-from {
  opacity: 1;
}

.popup-leave-active {
  transition: opacity 0.3s ease;
}

.popup-leave-to {
  opacity: 0;
}
</style>