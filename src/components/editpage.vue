<template>
  <div class="edit-container page-container">
    <!-- 标题栏 -->
    <div class="page-header card">
      <h1 class="page-title">
        <i class="fa-solid fa-pen-to-square"></i> 编辑抽取与统计信息
      </h1>
      <div class="header-actions btn-group">
        <button class="btn btn-secondary scale-hover" @click="showBatchSelect = true">
          <i class="fa-solid fa-list-check"></i> 批量编辑
        </button>
        <button class="btn btn-secondary scale-hover" @click="$emit('close')">
          <i class="fa-solid fa-xmark"></i> 关闭
        </button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="page-content">
      <!-- 数据表格 -->
      <div class="data-table">
        <!-- 组列表 -->
        <div v-for="group in store.currentClass.groups" :key="group['group-id']" class="group-wrapper card">
          <!-- 表头 -->
          <div class="table-header">
            <div class="table-col col-group-id">组ID</div>
            <div class="table-col col-student">学生信息</div>
            <div class="table-col col-score">分数</div>
            <div class="table-col col-prob">概率</div>
            <div class="table-col col-duration">持续时间</div>
          </div>

          <!-- 组标题行 -->
          <div class="group-header list-text-item">
            <div class="table-col col-group-id">
              <div class="group-id">
                组{{ group['group-id'] }}
              </div>
            </div>
            <div class="table-col col-student group-total" colspan="4">
              <span class="text-primary">小组总分：</span>
              <span class="badge">{{ calculateGroupTotal(group) }}</span>
            </div>
          </div>

          <!-- 学生列表 -->
          <div class="student-list">
            <div v-for="student in group.students" :key="student.name" class="table-row list-text-item hover-highlight">
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
                  <button class="btn btn-sm btn-secondary scale-hover" @click="updateStudentScore(student, -1)">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <input
                      type="number"
                      class="input form-input"
                      v-model.number="student.score"
                      @focus="inputFocus($event)"
                      @blur="inputBlur($event)"
                  >
                  <button class="btn btn-sm btn-secondary scale-hover" @click="updateStudentScore(student, 1)">
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
                    class="input form-input"
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
                    class="input form-input"
                    v-model.number="student.duration"
                    @focus="inputFocus($event)"
                    @blur="inputBlur($event)"
                >
              </div>
            </div>

            <!-- 小组其他加分 -->
            <div class="table-row list-text-item hover-highlight other-score-row">
              <div class="table-col col-group-id"></div>
              <div class="table-col col-student">
                <span class="text-gray">其他加分：</span>
              </div>

              <div class="table-col col-score">
                <div class="edit-control">
                  <button class="btn btn-sm btn-secondary scale-hover" @click="group.other--">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <input
                      type="number"
                      class="input form-input"
                      v-model.number="group.other"
                      @focus="inputFocus($event)"
                      @blur="inputBlur($event)"
                  >
                  <button class="btn btn-sm btn-secondary scale-hover" @click="group.other++">
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
        <div class="modal card">
          <div class="modal-header">
            <h3 class="modal-title card-title">批量编辑 - 选择项</h3>
            <div class="select-all">
              <input type="checkbox" id="select-all" v-model="selectAll">
              <label for="select-all">全选</label>
            </div>
          </div>

          <div class="modal-body">
            <div v-for="group in store.currentClass.groups" :key="group['group-id']" class="batch-group card">
              <div class="batch-group-header list-text-item">
                <input
                    type="checkbox"
                    :id="`group-${group['group-id']}`"
                    v-model="group.selected"
                    @change="handleGroupSelect(group)"
                >
                <label :for="`group-${group['group-id']}`">组 {{ group['group-id'] }}（总分：{{ calculateGroupTotal(group) }}）</label>
              </div>

              <div class="batch-students">
                <div v-for="student in group.students" :key="student.name" class="batch-student list-text-item">
                  <input
                      type="checkbox"
                      :id="`student-${student.name}`"
                      v-model="student.selected"
                  >
                  <label :for="`student-${student.name}`">{{ student.name }}（分数：{{ student.score }}）</label>
                </div>

                <!-- 其他加分项 -->
                <div class="batch-other list-text-item">
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

          <div class="modal-footer btn-group">
            <button class="btn btn-secondary scale-hover" @click="showBatchSelect = false">取消</button>
            <button class="btn btn-primary scale-hover" @click="showBatchSettings = true; showBatchSelect = false">
              设置
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 批量设置弹窗 -->
    <transition name="popup">
      <div class="modal-backdrop" v-if="showBatchSettings">
        <div class="modal card">
          <div class="modal-header">
            <h3 class="modal-title card-title">批量编辑 - 设置值</h3>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">分数：</label>
              <input
                  type="number"
                  class="input form-input"
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
                  class="input form-input"
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
                  class="input form-input"
                  v-model.number="batchSettings.duration"
                  placeholder="不修改留空"
                  @focus="inputFocus($event)"
                  @blur="inputBlur($event)"
              >
            </div>
          </div>

          <div class="modal-footer btn-group">
            <button class="btn btn-secondary scale-hover" @click="showBatchSettings = false">取消</button>
            <button class="btn btn-primary scale-hover" @click="applyBatchSettings">确认</button>
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
  store.currentClass.groups.forEach(group => {
    group.selected = false
    group.otherSelected = false
    group.students.forEach(student => {
      student.selected = false
    })
  })
  selectAll.value = false
}

// 处理全选逻辑
watch(selectAll, (newVal) => {
  store.currentClass.groups.forEach(group => {
    group.selected = newVal
    group.otherSelected = newVal
    group.students.forEach(student => {
      student.selected = newVal
    })
  })
})

// 处理组选择逻辑
const handleGroupSelect = (group) => {
  const isSelected = group.selected
  group.students.forEach(student => {
    student.selected = isSelected
  })
  group.otherSelected = isSelected

  // 更新全选状态
  updateSelectAllStatus()
}

// 更新全选状态
const updateSelectAllStatus = () => {
  let allSelected = true
  store.currentClass.groups.forEach(group => {
    if (!group.selected) {
      allSelected = false
      return
    }
    group.students.forEach(student => {
      if (!student.selected) {
        allSelected = false
        return
      }
    })
    if (!group.otherSelected) {
      allSelected = false
    }
  })
  selectAll.value = allSelected
}

// 应用批量设置
const applyBatchSettings = () => {
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
    if (group.otherSelected) {
      if (batchSettings.value.score !== null) {
        group.other = batchSettings.value.score
      }
    }
  })

  // 重置批量设置
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
/* ================================
   🎨 优化版样式设计（保留原变量体系）
   主题：现代卡片式后台风格
================================ */

/* ====== 页面整体 ====== */
.edit-container {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  z-index: 100;
  background-color: #f6f7fb;
  padding: var(--spacing-md);
}

/* ====== 顶部标题栏 ====== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-radius: 12px;
  padding: var(--spacing-xs) var(--spacing-lg);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  margin-bottom: var(--spacing-lg);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 25px;
  font-weight: 600;
  color: var(--primary-color);
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.header-actions .btn {
  font-size: 16px;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.header-actions .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}

/* ====== 数据表格 ====== */
.data-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ====== 小组卡片 ====== */
.group-wrapper {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.2s ease;
}

.group-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

/* ====== 表头 ====== */
.table-header {
  display: flex;
  background-color: #f1f3f8;
  font-weight: 600;
  font-size: 16px;
  color: #4b5563;
  padding: 10px 14px;
  border-bottom: 2px solid #e5e7eb;
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-sm);
}

.table-col {
  display: flex;
  align-items: center;
  font-size: 15px;
}

.col-group-id {
  width: 100px;
  flex-shrink: 0;
}

.col-student {
  flex: 2;
}

.col-score,
.col-prob,
.col-duration {
  flex: 1;
  justify-content: center;
}

/* ====== 小组标题行 ====== */
.group-header {
  display: flex;
  align-items: center;
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.group-id {
  background-color: var(--primary-color);
  color: white;
  padding: 4px 14px;
  border-radius: 8px;
  font-size: 18px;
  margin-right: 12px;
}

.group-total {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
}

/* ====== 学生行 ====== */
.table-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.15s ease;
}

.table-row:hover {
  background-color: #f9fafb;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-name {
  background-color: var(--primary-light);
  color: var(--primary-color);
  padding: 2px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.student-class {
  color: #9ca3af;
  font-size: 13px;
}

/* ====== 其他加分行 ====== */
.other-score-row {
  background-color: #f3f4f6;
  font-style: italic;
}

/* ====== 编辑控件 ====== */
.edit-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-control .btn {
  background-color: #f3f4f6;
  border-radius: 6px;
  padding: 4px 8px;
  transition: all 0.15s ease;
}

.edit-control .btn:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
  transform: scale(1.05);
}

.form-input {
  width: 70px;
  padding: 4px 6px;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 15px;
  transition: all 0.2s ease;
}

.form-input:hover {
  border-color: var(--primary-light);
}

.input-focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(147, 112, 219, 0.25);
}

/* ====== 弹窗样式 ====== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  backdrop-filter: blur(3px);
}

.modal {
  width: 90%;
  max-width: 800px;
  background-color: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease;
}

.modal-header {
  background-color: #f9fafb;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 18px;
  color: var(--primary-color);
  border-bottom: 1px solid #e5e7eb;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.btn {
  border-radius: 8px;
  padding: 6px 16px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: var(--primary-color);
  color: #fff;
}

.btn-primary:hover {
  background: #6d28d9;
  box-shadow: 0 0 10px rgba(124, 58, 237, 0.35);
}

/* ====== 批量编辑区域 ====== */
.batch-group {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: var(--spacing-md);
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.batch-group-header {
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.batch-students {
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.batch-student, .batch-other {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ====== 表单设置区域 ====== */
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
  font-weight: 500;
  color: #4b5563;
}

/* ====== 动画 ====== */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

.popup-enter-from {
  opacity: 0;
}

.popup-enter-active {
  transition: opacity 0.3s ease;
}

.popup-enter-to {
  opacity: 1;
}

/* ====== 响应式调整 ====== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .table-col {
    font-size: 14px;
  }

  .form-input {
    width: 50px;
  }
}
</style>
