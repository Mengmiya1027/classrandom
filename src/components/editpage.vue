<template>
  <div class="edit-container">
    <!-- 页面标题与操作区 -->
    <div class="edit-header">
      <h2>{{ isNew ? '新增班级' : '编辑班级' }}</h2>
      <div class="header-btns">
        <button @click="handleCancel" class="btn cancel-btn">取消</button>
        <button @click="handleSave" class="btn save-btn" :disabled="!isValid">保存</button>
      </div>
    </div>

    <!-- 编辑表单 -->
    <form class="edit-form">
      <!-- 班级名称 -->
      <div class="form-item">
        <label class="form-label">班级名称</label>
        <input
            type="text"
            v-model.trim="currentClass.className"
            placeholder="请输入班级名称（如：8班）"
            class="form-input"
        >
        <p v-if="!currentClass.className && isTouched" class="error-tip">班级名称不能为空</p>
      </div>

      <!-- 小组列表 -->
      <div class="form-item groups-container">
        <label class="form-label">小组管理</label>
        <div class="groups-list">
          <!-- 小组项 -->
          <div v-for="(group, groupIndex) in currentClass.groups" :key="group['group-id']" class="group-card">
            <div class="group-header">
              <input
                  type="text"
                  v-model.trim="group['group-name']"
                  placeholder="小组名称（如：第一组）"
                  class="group-name-input"
              >
              <button
                  type="button"
                  @click="removeGroup(groupIndex)"
                  class="remove-btn"
                  :disabled="currentClass.groups.length <= 1"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>

            <!-- 学生列表 -->
            <div class="students-list">
              <div
                  v-for="(student, stuIndex) in group.students"
                  :key="stuIndex"
                  class="student-item"
              >
                <input
                    type="text"
                    v-model.trim="student.name"
                    placeholder="学生姓名"
                    class="student-name-input"
                >
                <button
                    type="button"
                    @click="removeStudent(groupIndex, stuIndex)"
                    class="remove-btn"
                >
                  <i class="fa-solid fa-times"></i>
                </button>
              </div>

              <!-- 添加学生按钮 -->
              <button
                  type="button"
                  @click="addStudent(groupIndex)"
                  class="add-btn student-add-btn"
              >
                <i class="fa-solid fa-plus"></i> 添加学生
              </button>
            </div>
          </div>

          <!-- 添加小组按钮 -->
          <button
              type="button"
              @click="addGroup"
              class="add-btn group-add-btn"
          >
            <i class="fa-solid fa-plus"></i> 添加小组
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMainStore } from '../stores/index.js'

// 状态与路由
const store = useMainStore()
const route = useRoute()
const router = useRouter()

console.log('路由实例是否存在：', route)  // 若打印 undefined，说明路由未挂载

// 标识：是新增还是编辑（通过路由参数判断）
const classId = route.params.id
const isNew = !classId

// 表单触摸状态（用于错误提示）
const isTouched = ref(false)

// 当前编辑的班级数据（深拷贝避免直接修改原始数据）
const currentClass = reactive({
  className: '',
  groups: [
    {
      'group-id': 1,
      'group-name': '第一组',
      students: [{ name: '' }]
    }
  ]
})

// 加载已有班级数据（编辑模式）
onMounted(() => {
  if (!isNew) {
    const targetClass = store.classes.find(c => c.id === classId)
    if (targetClass) {
      // 深拷贝原始数据（避免双向绑定直接修改store）
      currentClass.className = targetClass.className
      currentClass.groups = JSON.parse(JSON.stringify(targetClass.groups))
    } else {
      // 若班级不存在，跳回列表页
      router.push('/classes')
    }
  }
})

// 表单验证：班级名称不为空
const isValid = computed(() => {
  return currentClass.className.trim() !== ''
})

// 监听表单修改，标记为已触摸
watch(currentClass, () => {
  isTouched.value = true
}, { deep: true })

// 新增小组
const addGroup = () => {
  const newGroupId = currentClass.groups.length > 0
      ? Math.max(...currentClass.groups.map(g => g['group-id'])) + 1
      : 1
  currentClass.groups.push({
    'group-id': newGroupId,
    'group-name': `第${newGroupId}组`,
    students: [{ name: '' }]
  })
}

// 删除小组
const removeGroup = (index) => {
  if (confirm('确定删除该小组吗？小组内学生也会被删除')) {
    currentClass.groups.splice(index, 1)
  }
}

// 新增学生
const addStudent = (groupIndex) => {
  currentClass.groups[groupIndex].students.push({ name: '' })
}

// 删除学生
const removeStudent = (groupIndex, stuIndex) => {
  const group = currentClass.groups[groupIndex]
  if (group.students.length <= 1) {
    alert('每个小组至少保留1名学生')
    return
  }
  group.students.splice(stuIndex, 1)
}

// 保存修改
const handleSave = () => {
  if (!isValid.value) return

  // 处理空学生姓名（过滤或提示）
  currentClass.groups.forEach(group => {
    group.students = group.students.filter(stu => stu.name.trim() !== '')
    // 确保每个小组至少1名学生
    if (group.students.length === 0) {
      group.students.push({ name: '学生' })
    }
  })

  if (isNew) {
    // 新增班级：生成唯一ID
    const newId = Date.now().toString()
    store.classes.push({
      id: newId,
      className: currentClass.className,
      groups: JSON.parse(JSON.stringify(currentClass.groups))
    })
  } else {
    // 编辑班级：更新原始数据
    const targetIndex = store.classes.findIndex(c => c.id === classId)
    store.classes[targetIndex] = {
      ...store.classes[targetIndex],
      className: currentClass.className,
      groups: JSON.parse(JSON.stringify(currentClass.groups))
    }
  }

  // 保存成功提示并返回列表页
  alert(isNew ? '班级创建成功' : '班级修改成功')
  router.push('/classes')
}

// 取消编辑
const handleCancel = () => {
  if (isTouched.value && !confirm('已修改内容未保存，确定离开吗？')) {
    return
  }
  router.back()
}
</script>

<style scoped>
.edit-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.header-btns {
  display: flex;
  gap: 15px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
}

.save-btn {
  background-color: var(--primary-color);
  color: white;
}

.save-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 300px;
}

.error-tip {
  color: #ff4d4f;
  font-size: 12px;
  margin: 0;
}

.groups-container {
  gap: 15px;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-card {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  background-color: #fafafa;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.group-name-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 10px;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-name-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  max-width: 300px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.remove-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px dashed #ccc;
  background: none;
  color: var(--primary-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  width: fit-content;
}

.student-add-btn {
  margin-top: 5px;
}

.group-add-btn {
  margin-top: 10px;
  padding: 8px 16px;
}

.add-btn:hover {
  background-color: rgba(59, 130, 246, 0.05);
}
</style>