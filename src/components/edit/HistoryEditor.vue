<template>
  <div class="history-editor-container page-container">
    <!-- 标题栏 -->
    <div class="page-header card fade-in">
      <h1 class="page-title">
        <font-awesome-icon icon="fa-solid fa-history"/> 编辑抽取历史
      </h1>
    </div>

    <!-- 历史记录编辑区 -->
    <div class="history-editor card fade-in">
      <h3 class="card-title">
        <font-awesome-icon icon="fa-solid fa-list"/> 抽取记录列表
      </h3>

      <!-- 表头 -->
      <div class="history-header">
        <div class="history-column column-index">序号</div>
        <div class="history-column column-group">组别</div>
        <div class="history-column column-name">姓名</div>
        <div class="history-column column-time">时间</div>
        <div class="history-column column-action">操作</div>
      </div>

      <!-- 历史记录列表 -->
      <div class="history-list">
        <div
            v-for="(item, index) in editableHistory"
            :key="index"
            class="history-item list-text-item hover-highlight"
        >
          <!-- 序号 -->
          <div class="history-column column-index">
            {{ index + 1 }}
          </div>

          <!-- 组别下拉框 -->
          <div class="history-column column-group">
            <v-select
                class="choose-group"
                v-model="item.groupId"
                :items="groupOptions"
                item-title="name"
                item-value="id"
                density="comfortable"
                variant="outlined"
                @change="handleGroupChange(index)"
                :list-props="{ bgColor: 'green' }"
                item-color="white"
            />
          </div>

          <!-- 姓名下拉框 -->
          <div class="history-column column-name">
            <v-select
                v-model="item.name"
                :items="filteredStudents(index)"
                density="comfortable"
                variant="outlined"
            />
          </div>

          <!-- 时间选择器 -->
          <div class="history-column column-time">
            <v-text-field
                :model-value="displayTimes[index]"
                label="选择时间"
                readonly
                density="comfortable"
                variant="outlined"
                return-object
            >
              <v-menu
                  v-model="showTimeMenus[index]"
                  :close-on-content-click="false"
                  activator="parent"
                  min-width="300px"
              >
                <v-time-picker
                    v-model="editableHistory[index].time"
                    use-seconds
                    format="24hr"
                    @update:modelValue="handleHistoryTimeUpdate(index, $event)"
                />
              </v-menu>
            </v-text-field>
          </div>

          <!-- 操作按钮 -->
          <div class="history-column column-action">
            <button
                class="btn btn-primary remove-htn"
                @click="removeHistoryItem(index)"
            >
              <font-awesome-icon icon="fa-solid fa-trash" class="remove-icon"/>
            </button>
          </div>
        </div>

        <p v-if="editableHistory.length === 0" class="empty-hint">暂无记录，请添加</p>
      </div>

      <!-- 添加新记录区域 -->
      <div class="add-history-section card">
        <h4 class="section-title">
          <font-awesome-icon icon="fa-solid fa-plus"/> 添加新记录
        </h4>

        <div class="new-history-form">
          <div class="form-group">
            <v-select
                class="choose-group"
                v-model="newHistory.groupId"
                :items="groupOptions"
                item-value="id"
                item-title="name"
                :list-props="{ bgColor: 'green' }"
                item-color="white"
                label="选择组别"
                density="comfortable"
                variant="outlined"
                @update:modelValue="handleNewGroupChange"
            />
          </div>

          <div class="form-group">
            <v-select
                v-model="newHistory.name"
                :items="newRecordStudents"
                label="选择学生"
                density="comfortable"
                variant="outlined"
                :disabled="!newHistory.groupId"
            />
          </div>

          <!-- 新记录时间选择器 -->
          <div class="form-group">
            <v-text-field
                :model-value="newDisplayTime"
                label="选择时间"
                readonly
                density="comfortable"
                variant="outlined"
            >
              <v-menu
                  v-model="showNewTimeMenu"
                  :close-on-content-click="false"
                  activator="parent"
                  min-width="300px"
              >
                <v-time-picker
                    v-model="newHistory.time"
                    use-seconds
                    format="24hr"
                    return-object
                    @update:modelValue="handleNewTimeUpdate($event)"
                />
              </v-menu>
            </v-text-field>
          </div>

          <div class="form-actions">
            <button
                class="btn btn-primary add-history-btn"
                @click="addHistoryItem"
                :disabled="!newHistory.groupId || !newHistory.name"
            >
              <font-awesome-icon icon="fa-solid fa-plus"/> 添加到历史
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMainStore } from '../../stores/index.js'
import { VSelect, VMenu, VTimePicker, VTextField, VBtn } from 'vuetify/components'

const store = useMainStore()

// 可编辑历史记录（time字段为Date对象）
const editableHistory = ref([])
// 时间选择器菜单显示状态
const showTimeMenus = ref([])
// 文本框显示的格式化时间
const displayTimes = ref([])

// 新记录表单数据
const newHistory = ref({
  groupId: null,
  name: '',
  time: new Date()
})
// 新记录时间显示
const newDisplayTime = ref('')
const showNewTimeMenu = ref(false)

// 组选项
const groupOptions = computed(() => {
  if (!store.currentClass) return [];
  return store.currentClass.groups.map(group => ({
    id: group['group-id'],
    name: `组${group['group-id'] || ''}`
  }));
});

// 新记录学生选项
const newRecordStudents = computed(() => {
  if (!store.currentClass || !newHistory.value.groupId) return []
  const group = store.currentClass.groups.find(g => g['group-id'] === newHistory.value.groupId)
  return group ? group.students.map(s => s.name) : []
})

const stringToDate = (timeStr) => {
  if (typeof timeStr !== 'string') return new Date();
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0);
  date.setMinutes(minutes || 0);
  date.setSeconds(seconds || 0);
  return date;
};

// 过滤当前组学生
const filteredStudents = (index) => {
  if (!store.currentClass || !editableHistory.value[index]) return []
  const groupId = editableHistory.value[index].groupId
  const group = store.currentClass.groups.find(g => g['group-id'] === groupId)
  return group ? group.students.map(s => s.name) : []
}

// 格式化时间（Date → HH:MM:SS）
const formatTime = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  return [
    date.getHours().toString().padStart(2, '0'),
    date.getMinutes().toString().padStart(2, '0'),
    date.getSeconds().toString().padStart(2, '0')
  ].join(':')
}

// 初始化数据
onMounted(() => {
  // 初始化历史记录
  if (store.drawHistory && store.drawHistory.length) {
    editableHistory.value = store.drawHistory.map(item => ({
      ...item,
      time: item.time instanceof Date
          ? item.time
          : typeof item.time === 'string'
              ? stringToDate(item.time)
              : new Date(item.time || Date.now())
    }));
    showTimeMenus.value = Array(editableHistory.value.length).fill(false);
    displayTimes.value = editableHistory.value.map(item => formatTime(item.time));
  }

  // 初始化新记录时间
  newHistory.value.time = new Date();
  newDisplayTime.value = formatTime(newHistory.value.time);
});

// 监听历史记录变化，实现实时保存
watch(
    () => editableHistory.value,
    (newVal) => {
      newVal.forEach((item, index) => {
        displayTimes.value[index] = formatTime(item.time)
      });
      saveHistory(); // 实时保存
    },
    { deep: true }
)

// 监听新记录时间变化
watch(
    () => newHistory.value.time,
    (newTime) => {
      newDisplayTime.value = formatTime(newTime)
    }
)

// 处理组变更 - 自动选择当前组第一个学生
const handleGroupChange = (index) => {
  const groupId = editableHistory.value[index].groupId;
  const group = store.currentClass.groups.find(g => g['group-id'] === groupId);
  // 设置为当前组第一个学生
  editableHistory.value[index].name = group?.students?.[0]?.name || '';
}

// 处理新记录组变更 - 自动选择当前组第一个学生
const handleNewGroupChange = () => {
  const group = store.currentClass.groups.find(g => g['group-id'] === newHistory.value.groupId);
  // 设置为当前组第一个学生
  newHistory.value.name = group?.students?.[0]?.name || '';
}

// 添加新记录
const addHistoryItem = () => {
  const newItem = {
    ...newHistory.value,
    time: new Date(newHistory.value.time)
  };

  editableHistory.value.push(newItem);
  showTimeMenus.value.push(false);
  displayTimes.value.push(formatTime(newItem.time));

  // 重置表单
  newHistory.value = {
    groupId: null,
    name: '',
    time: new Date()
  };
  showNewTimeMenu.value = false;
};

// 删除记录
const removeHistoryItem = (index) => {
  editableHistory.value.splice(index, 1)
  showTimeMenus.value.splice(index, 1)
  displayTimes.value.splice(index, 1)
}

const handleHistoryTimeUpdate = (index, val) => {
  if (!editableHistory.value[index]) {
    console.warn(`索引${index}的历史记录不存在`);
    return;
  }
  const date = val instanceof Date ? val : stringToDate(val);
  editableHistory.value[index].time = date;
  displayTimes.value[index] = formatTime(date);
};

// 处理新记录时间更新
const handleNewTimeUpdate = (val) => {
  if (!newHistory.value) {
    newHistory.value = { groupId: null, name: '', time: new Date() };
  }
  const date = val instanceof Date ? val : stringToDate(val);
  newHistory.value.time = date;
  newDisplayTime.value = formatTime(date);
};

// 保存历史记录（实时保存）
const saveHistory = () => {
  store.drawHistory = editableHistory.value.map(item => ({
    ...item,
    time: item.time.getTime()
  }));
  console.log('历史记录已自动保存');
};
</script>

<style scoped>
.history-editor-container {
  padding: var(--spacing-md);
  --primary-color: #28a328; /* 深紫色（深色主题色） */
  --primary-light: #d0efe2; /* 浅绿色（辅助色） */
  --primary-dark: #16a34a; /* 暗绿色（ hover 状态） */
  --btn-shadow: 0 2px 4px rgba(40, 163, 40, 0.3) !important;
  --v-input-control-height: 10px !important;
}

.history-editor {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
}

.page-header {
  width: fit-content;
  padding: 0 10px 0 8px;
  display: flex;
  gap: var(--spacing-sm);
  margin:0 auto var(--spacing-md) auto;
  justify-content: space-between;
}

.history-header {
  display: flex;
  font-weight: bold;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 2px solid var(--primary-color);
  margin-bottom: var(--spacing-sm);
}

.history-column {
  padding: var(--spacing-xs) var(--spacing-sm);
}

.column-index {
  width: 80px;
  text-align: center;
}

.column-group {
  flex: 1;
}

.column-name {
  flex: 1;
}

.column-time {
  flex: 1.5;
}

.column-action {
  width: 100px;
  text-align: center;
}

.history-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid #e5e7eb;
}

.add-history-section {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
}

.new-history-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: flex-end;
  margin-top: var(--spacing-sm);
}

.remove-htn {
  height: 40px;
}

.remove-icon {
  transform: scale(1.5);
}

.add-history-btn {
  font-size: 22px;
  font-weight: bold;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-actions {
  padding: var(--spacing-xs);
}

.empty-hint {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--gray-dark);
}

.choose-group {
  color: var(--primary-color);
}
</style>