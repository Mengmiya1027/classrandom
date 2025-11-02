<template>
  <div class="class-info-editor card">
    <h3 class="card-title">
      <font-awesome-icon icon="fa-solid fa-users-gear"/> 班级信息设置
    </h3>
    <div class="class-info-form">
      <!-- 班级名称 -->
      <div class="form-group">
        <label>班级名称：</label>
        <input
            type="text"
            v-model="className"
            class="input"
            @change="updateClassInfo"
        >
      </div>

      <!-- 小组管理 -->
      <div class="form-section">
        <h4>小组管理</h4>
        <button class="btn btn-secondary" @click="addNewGroup">
          <font-awesome-icon icon="fa-solid fa-plus"/> 新增小组
        </button>

        <div v-for="(group, gIdx) in classGroups" :key="group['group-id']" class="group-section">
          <div class="group-header">
            <div class="form-group">
              <label>组ID：</label>
              <input
                  type="number"
                  v-model="group['group-id']"
                  class="input"
                  @change="updateClassInfo"
              >
              <button class="btn btn-secondary" @click="deleteGroup(gIdx)">
                <font-awesome-icon icon="fa-solid fa-minus"/> 删除小组
              </button>
            </div>
          </div>

          <!-- 学生管理 -->
          <div class="students-section">
            <h5>学生列表</h5>
            <div v-for="(student, sIdx) in group.students" :key="sIdx" class="student-item">
              <input
                  type="text"
                  v-model="student.name"
                  class="input"
                  placeholder="学生姓名"
                  @change="updateClassInfo"
              >
              <button class="btn btn-secondary" @click="deleteStudent(group, sIdx)">
                <font-awesome-icon icon="fa-solid fa-minus"/>
              </button>
            </div>
            <button class="btn btn-secondary" @click="addStudent(group)">
              <font-awesome-icon icon="fa-solid fa-plus"/> 添加学生
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, toRefs } from 'vue'

const props = defineProps({
  classData: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['update:class-data'])

// 解构班级数据
const { groups } = toRefs(props.classData)
const className = ref(props.classData['class-name'] || '')
const classGroups = ref([...groups.value]) // 本地副本，避免直接修改props

// 新增小组
const addNewGroup = () => {
  const newGroupId = classGroups.value.length > 0
      ? Math.max(...classGroups.value.map(g => g['group-id'])) + 1
      : 1
  classGroups.value.push({
    'group-id': newGroupId,
    other: 0,
    students: []
  })
  updateClassInfo()
}

// 删除小组
const deleteGroup = (index) => {
  classGroups.value.splice(index, 1)
  updateClassInfo()
}

// 添加学生
const addStudent = (group) => {
  group.students.push({
    name: '',
    score: 0,
    probability: 1,
    duration: 0
  })
  updateClassInfo()
}

// 删除学生
const deleteStudent = (group, index) => {
  group.students.splice(index, 1)
  updateClassInfo()
}

// 更新班级信息到父组件
const updateClassInfo = () => {
  emit('update:class-data', {
    ...props.classData,
    'class-name': className.value,
    groups: classGroups.value
  })
}
</script>

<style scoped>
.class-info-form {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.form-group label {
  width: 80px;
  flex-shrink: 0;
}

.form-group .input {
  flex: 1;
}

.form-section {
  padding: var(--spacing-md);
  background-color: var(--gray-light);
  border-radius: var(--border-radius);
}

.group-section {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: white;
  border-radius: var(--border-radius);
}

.students-section {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-top: 1px solid var(--gray-light);
}

.student-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.student-item .input {
  flex: 1;
}
</style>