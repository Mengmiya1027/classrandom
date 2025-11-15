<template>
  <!-- 主要内容区 -->
  <div class="page-content">
    <div class="header-actions card">
      <h1 class="page-title">
        <font-awesome-icon icon="fa-solid fa-pen-to-square"/> 编辑学生/小组信息
      </h1>
      <button class="btn btn-secondary scale-hover" @click="showBatchSelect = true">
        <font-awesome-icon icon="fa-solid fa-list-check" /> 批量编辑
      </button>
      <button class="btn btn-secondary scale-hover" @click="handleRefresh" :disabled="isLoading">
        <font-awesome-icon icon="fa-solid fa-refresh" :spin="isLoading" />刷新
      </button>
    </div>

    <v-skeleton-loader
        v-for="group in store.currentClass.groups"
        v-if="isLoading"
        type="table"
        class="mx-auto fade-in loader"
        width="100%"
        height="400"
    ></v-skeleton-loader>

    <!-- 数据表格 -->
    <div class="data-table" v-else>
      <!-- 组列表 -->
      <div v-for="group in store.currentClass.groups" :key="group['group-id']" class="group-wrapper card fade-in">
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
                <button class="btn btn-sm btn-secondary scale-hover minus-btn" @click="updateStudentScore(student, -1)">
                  <font-awesome-icon icon="fa-solid fa-minus" />
                </button>
                <input
                    type="number"
                    class="input form-input"
                    v-model.number="student.score"
                    @focus="inputFocus($event)"
                    @blur="handleInputBlur(student, 'score', 0, $event)"
                >

                <button class="btn btn-sm btn-secondary scale-hover add-btn" @click="updateStudentScore(student, 1)">
                  <font-awesome-icon icon="fa-solid fa-plus" />
                </button>
              </div>
            </div>

            <!-- 概率编辑 -->
            <div class="table-col col-prob">
              <div class="edit-control">
                <button class="btn btn-sm btn-secondary scale-hover minus-btn" @click="updateStudentProbability(student, -0.1)">
                  <font-awesome-icon icon="fa-solid fa-minus" />
                </button>
                <input
                    type="number"
                    step="10"
                    min="0"
                    max="100"
                    class="input form-input"
                    :value="(student.probability * 100).toFixed(0)"
                    @input="handleProbabilityInput(student, $event)"
                    @focus="inputFocus($event)"
                    @blur="handleInputBlur(student, 'probability', 1, $event)"
                >
                <span class="percent-sign">%</span>
                <button class="btn btn-sm btn-secondary scale-hover add-btn" @click="updateStudentProbability(student, 0.1)">
                  <font-awesome-icon icon="fa-solid fa-plus" />
                </button>
              </div>
            </div>

            <!-- 持续时间编辑 -->
            <div class="table-col col-duration">
              <div class="edit-control">
                <button class="btn btn-sm btn-secondary scale-hover minus-btn" @click="updateStudentDuration(student, -1)">
                  <font-awesome-icon icon="fa-solid fa-minus" />
                </button>
                <input
                    type="number"
                    min="-1"
                    class="input form-input"
                    v-model.number="student.duration"
                    @focus="inputFocus($event)"
                    @blur="handleInputBlur(student, 'duration', 0, $event)"
                >
                <button class="btn btn-sm btn-secondary scale-hover add-btn" @click="updateStudentDuration(student, 1)">
                  <font-awesome-icon icon="fa-solid fa-plus" />
                </button>
              </div>
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
                <button class="btn btn-sm btn-secondary scale-hover minus-btn" @click="group.other--">
                  <font-awesome-icon icon="fa-solid fa-minus" />
                </button>
                <input
                    type="number"
                    class="input form-input"
                    v-model.number="group.other"
                    @focus="inputFocus($event)"
                    @blur="handleInputBlur(group, 'other', 0, $event)"
                >
                <button class="btn btn-sm btn-secondary scale-hover add-btn" @click="group.other++">
                  <font-awesome-icon icon="fa-solid fa-plus" />
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
  <teleport to="body">
    <!-- 批量选择弹窗 -->
    <transition name="fade">
      <div class="modal-backdrop" v-if="showBatchSelect" @click="showBatchSelect = false">
        <transition name="popup">
          <div class="modal card" v-if="showBatchSelect" @click.stop>
            <div class="modal-header">
              <h3 class="modal-title card-title">批量编辑 - 选择项</h3>
              <div class="select-all">
                <v-checkbox
                    v-model="selectAll"
                    label="全选"
                    color="primary"
                    hide-details
                    @change="handleSelectAllClick"
                />
              </div>
            </div>

            <div class="modal-body">
              <div v-for="group in store.currentClass.groups" :key="group['group-id']" class="batch-group card">
                <div class="batch-group-header list-text-item">
                  <v-checkbox
                      v-model="group.selected"
                      @change="handleGroupClick(group)"
                      color="primary"
                      hide-details
                  />
                  <label :for="`group-${group['group-id']}`"><text>组 {{ group['group-id'] }}（总分：{{ calculateGroupTotal(group) }}）</text></label>
                </div>

                <div class="batch-students">
                  <div v-for="student in group.students" :key="student.name" class="batch-student list-text-item">
                    <v-checkbox
                        v-model="student.selected"
                        color="primary"
                        hide-details
                        @change="updateGroupAndSelectAllStatus(group)"
                    />
                    <label :for="`student-${student.name}`">{{ student.name }}（分数：{{ student.score }}）</label>
                  </div>

                  <!-- 其他加分项 -->
                  <div class="batch-other list-text-item">
                    <v-checkbox
                        v-model="group.otherSelected"
                        color="primary"
                        hide-details
                        @change="updateGroupAndSelectAllStatus(group)"
                    />
                    <label :for="`other-${group['group-id']}`">其他加分（当前：{{ group.other }}）</label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer btn-group">
              <button class="btn btn-secondary scale-hover quit-btn" @click="showBatchSelect = false">取消</button>
              <button class="btn btn-primary scale-hover apply-btn" @click="showBatchSettings = true; showBatchSelect = false" :disabled="!hasSelectedItems">
                设置
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 批量设置弹窗 -->
    <transition name="fade">
      <div class="modal-backdrop" v-if="showBatchSettings" @click="showBatchSettings = false">
        <transition name="popup">
          <div class="modal card" v-if="showBatchSettings" @click.stop>
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
                    @input="handleBatchDefaultInput('score', $event)"
                    @focus="inputFocus($event)"
                    @blur="inputBlur($event)"
                >
              </div>

              <div class="form-group">
                <label class="form-label">概率：</label>
                <input
                    type="number"
                    step="10"
                    min="0"
                    class="input form-input"
                    :value="batchSettings.probability !== null ? (batchSettings.probability * 100).toFixed(0) : ''"
                    @input="handleBatchProbabilityInput($event)"
                    placeholder="不修改留空"
                    @focus="inputFocus($event)"
                    @blur="inputBlur($event)"
                ><span class="percent-sign">%</span>
              </div>

              <div class="form-group">
                <label class="form-label">持续时间：</label>
                <input
                    type="number"
                    min="-1"
                    class="input form-input"
                    v-model.number="batchSettings.duration"
                    placeholder="不修改留空"
                    @focus="inputFocus($event)"
                    @blur="inputBlur($event)"
                    @input="handleBatchDefaultInput('duration', $event)"
                >
              </div>
            </div>

            <div class="modal-footer btn-group">
              <button class="btn btn-secondary scale-hover quit-btn" @click="showBatchSettings = false">取消</button>
              <button class="btn btn-primary scale-hover apply-btn" @click="applyBatchSettings">确认</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="js">
import { useMainStore } from '../../stores'
import { ref, computed, watch } from 'vue'
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const store = useMainStore()
defineEmits(['close']);
const isLoading = ref(false)

// 刷新处理
const handleRefresh = async () => {
  // 显示加载状态
  isLoading.value = true

  try {
    // 把pinia中的实时数据存储到currentData
    const currentData = JSON.parse(JSON.stringify(store.currentClass))

    // 清空缓存（假设store中有清空缓存的方法，如果没有可以根据实际情况实现）
    if (store.clearCache) {
      store.clearCache()
    }
    store.currentClass = JSON.parse(JSON.stringify(currentData))
  } catch (e) {
    console.error('刷新数据失败:', e)
  } finally {
    // 隐藏加载状态
    setTimeout(() => {
      isLoading.value = false
    }, 2000) // 延迟隐藏，让用户看到加载动画
  }
}

// 计算小组总分
const calculateGroupTotal = (group) => {
  const studentScores = group.students.reduce((sum, student) => sum + (student.score || 0), 0)
  return studentScores + (group.other || 0)
}

const handleInputBlur = (target, prop, defaultValue, event) => {
  inputBlur(event);
  const inputElement = event.target;
  const value = target[prop];

  // 处理分数和持续时间空值
  if (prop === 'score' || prop === 'duration') {
    if (value === '' || value === null || value === undefined || isNaN(value)) {
      target[prop] = defaultValue;
    }
  }
  // 处理概率空值（用户完成输入后）
  else if (prop === 'probability') {
    // 输入框为空时，恢复默认值100%
    if (inputElement.value.trim() === '' || value === null || value === undefined || isNaN(value)) {
      target[prop] = 1; // 100%对应小数1
      inputElement.value = '100'; // 同步更新输入框显示
    }
  }
};


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
  selectAll.value = false  // 初始全选状态为未选中
}

watch(showBatchSelect, (newVal) => {
  if (newVal) {  // 当弹窗从关闭变为打开时
    initSelectionState()  // 清除所有选择状态
  }
})


const hasSelectedItems = computed(() => {
  // 遍历所有组检查是否有选中项
  return store.currentClass.groups.some(group => {
    // 组本身被选中
    if (group.selected) return true
    // 其他加分项被选中
    if (group.otherSelected) return true
    // 组内有学生被选中
    if (group.students.some(student => student.selected)) return true
    // 以上都没有
    return false
  })
})

// 标志：是否是用户主动点击全选按钮（用于区分被动更新）
const isUserSelectAll = ref(false)

// 处理全选按钮点击（仅用户主动点击时触发）
const handleSelectAllClick = () => {
  isUserSelectAll.value = true
  const isSelected = selectAll.value

  // 只有用户主动点击时才更新所有选项
  store.currentClass.groups.forEach(group => {
    group.selected = isSelected
    group.otherSelected = isSelected
    group.students.forEach(student => {
      student.selected = isSelected
    })
  })

  isUserSelectAll.value = false
}

// 处理组按钮点击
const handleGroupClick = (group) => {
  const isSelected = group.selected

  // 组点击只影响本组成员
  group.students.forEach(student => {
    student.selected = isSelected
  })
  group.otherSelected = isSelected

  // 更新全选状态（被动更新，只改状态不影响其他）
  updateSelectAllStatus()
}

// 当学生或其他加分项变化时，更新所在组和全选状态
const updateGroupAndSelectAllStatus = (group) => {
  // 被动更新组状态：组内所有学生和其他加分都选中时，组才选中
  const allStudentsSelected = group.students.every(student => student.selected)
  group.selected = allStudentsSelected && group.otherSelected

  // 被动更新全选状态：所有组都选中时，全选才选中
  updateSelectAllStatus()
}

// 被动更新全选状态（只更新状态，不操作其他选项）
const updateSelectAllStatus = () => {
  // 避免在用户主动操作全选时触发
  if (isUserSelectAll.value) return

  // 检查所有组是否都处于选中状态
  const allGroupsSelected = store.currentClass.groups.every(group => group.selected)
  selectAll.value = allGroupsSelected
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

// 学生概率更新（每次增减10%）
const updateStudentProbability = (student, delta) => {
  const newProbability = (student.probability || 0) + delta
  // 修改：只需保证概率不为负
  student.probability = Math.max(0, newProbability)
}

// 处理概率输入框变化
const handleProbabilityInput = (student, event) => {
  const inputValue = event.target.value.trim();
  // 只处理非空数字，空值留到失焦时处理
  if (inputValue !== '') {
    const value = Number(inputValue);
    const clamped = Math.max(0, value);
    student.probability = clamped / 100;
  }
  // 空值不做实时处理，保持输入框为空状态
};

// 处理批量概率输入（转换为小数存储）
const handleBatchProbabilityInput = (event) => {
  const inputValue = event.target.value.trim();
  if (inputValue === '') {
    batchSettings.value.probability = null;
    return;
  }
  // 非空数字转换（输入框限制为数字）
  const clamped = Math.max(0, Number(inputValue));
  batchSettings.value.probability = clamped / 100;
};

const handleBatchDefaultInput = (field, event) => {
  const inputValue = event.target.value.trim();
  if (inputValue === '') {
    batchSettings.value[field] = null;
    return;
  }
  batchSettings.value[field] = clamped;
};


// 学生持续时间更新（每次增减1）
const updateStudentDuration = (student, delta) => {
  const newDuration = (student.duration || 0) + delta
  // 确保持续时间不为负
  student.duration = Math.max(-1, newDuration)
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

/* ====== 新的绿色全局变量 ====== */
.page-content,.modal {
  --primary-color: #28a328; /* 深紫色（深色主题色） */
  --primary-light: #d0efe2; /* 浅绿色（辅助色） */
  --primary-dark: #16a34a; /* 暗绿色（ hover 状态） */
  --btn-shadow: 0 2px 4px rgb(40, 163, 40) !important;
  --v-input-control-height: 10px !important;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  padding: 0 0 0 10px;
  font-weight: 600;
  color: var(--primary-color);
  gap: 8px;
}

.header-actions {
  width: fit-content;
  padding: var(--spacing-sm);
  display: flex;
  gap: var(--spacing-sm);
  margin:0 auto var(--spacing-md) auto;
  justify-content: space-between;
}

.header-actions .btn {
  font-size: 16px;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.header-actions .btn:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}

.header-actions .btn:active {
  transform: scale(0.95);
}

/* 骨架屏容器样式 */
.v-skeleton-loader {
  margin-top: 1rem;
  border-radius: 14px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
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
  font-size: 18px;
}

.loader {
  overflow: hidden;
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
  font-weight: bold;
  font-size: 18px;
}

.student-class {
  color: #9ca3af;
  font-size: 15px;
}

/* ====== 其他加分行 ====== */
.other-score-row {
  background-color: #f3f4f6;
}

.other-score-row .table-col {
  font-size: 18px;
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
  height: 25px;
}

.edit-control .add-btn {
  background-color: var(--note);
  color: white;
  padding: 0 4px;
}

.edit-control .minus-btn {
  background-color: var(--warning);
  color: white;
  padding: 0 4px;
}

.edit-control .minus-btn:hover {
  background-color: var(--warning-light);
}

.edit-control .add-btn:hover {
  background-color: var(--note-light);
}

.form-input {
  width: 90%;
  padding: 4px 6px;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 15px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.form-input:hover {
  border-color: var(--primary-light);
}

.input-focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(147, 112, 219, 0.25);
}

.form-group .form-input {
  font-size: 20px;
}

/* ====== 弹窗样式 ====== */
.modal-backdrop {
  position: fixed; /* 固定定位，相对于视口 */
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200; /* 确保遮罩层在内容之上 */
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
  position: relative; /* 相对定位，确保在遮罩层之上 */
  z-index: 201; /* 弹窗层级高于遮罩层 */
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

.modal-footer .btn-primary {
  box-shadow: none;
}

.modal-footer .btn-primary:hover {
  background-color: var(--primary-dark);
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
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.batch-students {
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
}

.batch-student, .batch-other {
  padding: 0;
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
  font-size: 20px;
}

.list-text-item,
.batch-group-header label text {
  font-size: 20px;
  font-weight: bold;
}

.percent-sign {
  margin: 0 5px;
  color: #4b5563;
  font-weight: bolder;
  font-size: 20px;
}

.edit-control > .percent-sign{
  margin: 0 3px;
  font-weight: bold ;
}

.col-prob .edit-control {
  justify-content: center;
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

/* 调整批量编辑弹窗中的复选框大小 */

.v-checkbox {
  transform-origin: center; /* 关键：设置缩放原点为中心 */
  margin: 0 !important;
  transform: scale(1.1); /* 调整尺寸为80% */
}

.quit-btn,.apply-btn {
  flex: 1;
  width: 100%;
  justify-content: center;
  text-align: center;
  font-size: 18px;
}

.apply-btn:disabled {
  background-color: var(--primary-light);
  cursor: not-allowed;
}

.apply-btn:disabled:hover,.apply-btn:disabled:active {
  background-color: var(--primary-light);
  transform: none;
  box-shadow: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.97); }
}

/* 为modal添加单独的缩放效果 */
.modal {
  animation: fadeIn 0.3s ease;
}
</style>