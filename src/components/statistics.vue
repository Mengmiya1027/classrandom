<template>
  <div class="statistics-container page-container">
    <!-- 标题栏 -->
    <div class="page-header card fade-in">
      <h1 class="page-title">
        <font-awesome-icon icon="fa-solid fa-chart-pie"/> 统计信息
      </h1>

      <!-- 班级信息 -->
      <div v-if="store.currentClass" class="class-info">
        <h2 class="section-title">
          <font-awesome-icon icon="fa-solid fa-users-gear"/> {{ store.currentClass['class-name'] }} 统计结果
        </h2>
      </div>

      <div class="header-actions btn-group">
        <button class="btn btn-secondary scale-hover" @click="store.setShowStatistics(false)">
          <font-awesome-icon icon="fa-solid fa-xmark"/> 关闭
        </button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="page-content">


      <!-- 小组排名 -->
      <div class="statistics-card card fade-in">
        <h3 class="card-title">
          <font-awesome-icon icon="fa-solid fa-trophy"/> 小组总分排名
        </h3>

        <!-- 前三名小组（考虑并列） -->
        <div v-if="topGroups.length > 0" class="top-rankings">
          <template v-for="(rankGroup, index) in topGroups" :key="index">
            <div :class="['rank-section', getRankClass(rankGroup.rank)]">
              <div class="rank-badge">{{ rankGroup.rank }}{{ getRankSuffix(rankGroup.rank) }}</div>
              <div class="rank-items horizontal-list">
                <template v-for="group in rankGroup.groups" :key="group.groupId">
                  <div class="rank-item">
                    <span class="group-name">组{{ group.groupId }}</span>
                    <span class="group-score">总分: {{ group.totalScore }}</span>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- 所有小组列表 -->
        <div class="rank-list">
          <div v-for="item in rankedGroups" :key="item.groupId" class="rank-list-item list-text-item hover-highlight">
            <div class="rank-number">{{ item.rank }}</div>
            <div class="rank-identifier">组{{ item.groupId }}</div>
            <div class="rank-value">总分: {{ item.totalScore }}</div>
            <div class="rank-details">
              <span>学生得分: {{ item.studentScores }}</span>
              <span>其他加分: {{ item.otherScore }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="details-card">
        <!-- 学生分数排名 -->
        <div class="statistics-card card fade-in">
          <h3 class="card-title">
             <font-awesome-icon icon="fa-solid fa-user-tie"/> 学生总分排名
          </h3>

          <div class="rank-list">
            <div v-for="student in rankedStudents" :key="student.name + student.groupId" class="rank-list-item list-text-item hover-highlight">
              <div class="rank-number">{{ student.rank }}</div>
              <div class="rank-identifier">{{ student.name }} <span class="rank-group">组{{ student.groupId }}</span></div>
              <div class="rank-value">{{ student.score }}</div>
            </div>
          </div>
          <span class="empty-tip" v-if="rankedStudents.length === 0">（无）</span>
        </div>

        <!-- 学生抽取次数排名 -->
        <div class="statistics-card card fade-in">
          <h3 class="card-title">
             <font-awesome-icon icon="fa-solid fa-history"/> 学生被抽取次数排名
          </h3>

          <!-- 所有学生抽取次数列表（不使用top-group样式） -->
          <div class="rank-list">
            <div v-for="student in rankedDrawStudents" :key="student.name + student.groupId" class="rank-list-item list-text-item hover-highlight">
              <div class="rank-number">{{ student.rank }}</div>
              <div class="rank-identifier">{{ student.name }} <span class="rank-group">组{{ student.groupId }}</span></div>
              <div class="rank-value">被抽取: {{ student.drawCount }}次</div>
            </div>
          </div>
          <span class="empty-tip" v-if="rankedDrawStudents.length === 0">（无）</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '../stores/index.js'
import { computed } from 'vue'
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const store = useMainStore()

// 处理并列排名的通用函数
// 修改 handleRanking 函数的排名计算逻辑
const handleRanking = (items, valueKey) => {
  if (!items.length) return []

  // 按值降序排序（确保数值比较）
  const sorted = [...items].sort((a, b) => {
    return Number(b[valueKey]) - Number(a[valueKey])
  })

  const ranked = []
  let currentRank = 1 // 初始排名

  for (let i = 0; i < sorted.length; i++) {
    // 若当前项与前一项分数不同，排名递增1（而非按索引）
    if (i > 0 && Number(sorted[i][valueKey]) !== Number(sorted[i - 1][valueKey])) {
      currentRank = currentRank + 1 // 关键修改：并列后只占一个名额，下一名次+1
    }
    ranked.push({
      ...sorted[i],
      rank: currentRank
    })
  }

  return ranked
}

// 获取前三名分组（处理并列）
const getTopGroups = (rankedItems) => {
  if (!rankedItems.length) return []

  const topRanks = []
  const uniqueRanks = [...new Set(rankedItems.map(item => item.rank))].slice(0, 3)

  uniqueRanks.forEach(rank => {
    topRanks.push({
      rank,
      groups: rankedItems.filter(item => item.rank === rank)
    })
  })

  return topRanks
}

const getRankSuffix = (rank) => {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

// 计算所有小组的总分并排序（含排名）
const rankedGroups = computed(() => {
  if (!store.currentClass) return []

  const groups = store.currentClass.groups.map(group => {
    const studentScores = group.students.reduce((sum, student) => sum + student.score, 0)
    const totalScore = studentScores + group.other
    return {
      groupId: group['group-id'],
      totalScore,
      studentScores,
      otherScore: group.other
    }
  })

  return handleRanking(groups, 'totalScore')
})

// 获取前三名小组（处理并列）
const topGroups = computed(() => {
  return getTopGroups(rankedGroups.value)
})

// 计算所有学生的分数并排序（含排名）- 过滤掉分数为0的学生
const rankedStudents = computed(() => {
  if (!store.currentClass) return []

  const students = store.currentClass.groups.flatMap(group => {
    return group.students
        .filter(student => student.score > 0) // 过滤分数为0的学生
        .map(student => ({
          name: student.name,
          score: student.score,
          groupId: group['group-id']
        }))
  })

  return handleRanking(students, 'score')
})

// 计算学生被抽取次数 - 过滤掉抽取次数为0的学生
const rankedDrawStudents = computed(() => {
  if (!store.currentClass || !store.drawHistory.length) return []

  // 统计每个学生的被抽取次数
  const drawCounts = {}

  store.drawHistory.forEach(record => {
    const key = `${record.name}-${record.groupId}`
    drawCounts[key] = (drawCounts[key] || 0) + 1
  })

  // 转换为数组并添加学生信息，同时过滤掉次数为0的
  const studentsWithDraws = []
  store.currentClass.groups.forEach(group => {
    group.students.forEach(student => {
      const key = `${student.name}-${group['group-id']}`
      const count = drawCounts[key] || 0
      if (count > 0) { // 只保留抽取次数>0的学生
        studentsWithDraws.push({
          name: student.name,
          groupId: group['group-id'],
          drawCount: count
        })
      }
    })
  })

  return handleRanking(studentsWithDraws, 'drawCount')
})

// 获取排名对应的样式类
const getRankClass = (rank) => {
  switch(rank) {
    case 1: return 'first-place'
    case 2: return 'second-place'
    case 3: return 'third-place'
    default: return ''
  }
}
</script>

<style scoped>
/* 标题栏横向布局 */
.page-header {
  display: flex;          /* 启用Flex布局 */
  justify-content: space-between;  /* 标题居左，按钮居右 */
  align-items: center;    /* 垂直方向居中对齐 */
  padding: var(--spacing-xs) var(--spacing-md);  /* 增加内边距 */
  margin-bottom: var(--spacing-md);  /* 与下方内容分隔 */
}

/* 清除标题默认margin，避免影响布局 */
.page-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm); /* 图标与文字间距 */
}

/* 按钮组样式微调 */
.header-actions {
  display: flex;
  gap: var(--spacing-sm); /* 多个按钮时的间距（当前只有一个按钮，可留作扩展） */
}

.header-actions .btn {
  font-size: 16px;
}

.details-card {
  display: flex;
  gap: var(--spacing-lg); /* 两个模块之间的间距 */
  flex-wrap: wrap; /* 小屏幕自动换行 */
}

.details-card .statistics-card {
  flex: 1; /* 平均分配宽度 */
  max-height: 500px;
  overflow: auto;
  padding: var(--spacing-md);
}

.statistics-container {
  --primary-color: #FF7A00;
  --primary-light: #FFA042;
  --primary-dark: #E05A00;
  --btn-shadow: 0 2px 4px 0 rgba(255, 122, 0, 0.2);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100%;
  background-color: rgba( 255 , 255 , 255 , 0.5 );
  backdrop-filter: blur(20px);
  padding: var(--spacing-md);
  z-index: 3;
  overflow-y: auto;
  max-height: 100vh;
}

.page-content {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 93vw;
  margin-left: auto;
  margin-right: auto;
  padding: 0 var(--spacing-sm);
}

.statistics-card {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  background-color: var(--white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.statistics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 1.3em;
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--primary-light);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--gray-light);
}

.section-title {
  font-size: 1.5em;
  color: var(--primary-color);
  margin: 0;
  padding: var(--spacing-sm) 0;
}

/* 前三名排名样式 */
.top-rankings {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin: var(--spacing-xl) 0;
  flex-wrap: wrap;
}

.rank-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  min-width: 300px;
  justify-content: center;
}

.first-place {
  background-color: #fff8e1;
  border: 2px solid var(--warning);
}

.second-place {
  background-color: #e3f2fd;
  border: 2px solid var(--note);
}

.third-place {
  background-color: #ffebee;
  border: 2px solid var(--danger);
}

.rank-badge {
  font-weight: bold;
  font-size: 1.5em;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  flex-shrink: 0;
}

.first-place .rank-badge {
  background-color: var(--warning);
}

.second-place .rank-badge {
  background-color: var(--note);
}

.third-place .rank-badge {
  background-color: var(--danger);
}

/* 横向排列并列项 */
.horizontal-list {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

.rank-item {
  background-color: rgba(255, 255, 255, 0.8);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.group-name, .student-name {
  font-weight: bold;
  font-size: 20px;
  display: block;
  text-align: center;
}

.group-score, .student-draws {
  color: var(--gray-dark);
  font-size: 0.9em;
  text-align: center;
}

/* 排名列表样式 */
.rank-list {
  margin-top: var(--spacing-lg);
  border-radius: var(--border-radius);
  overflow: hidden;}

.rank-list-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs);
  padding-right: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-light);
  transition: background-color 0.2s ease;
}

.rank-list-item:last-child {
  border-bottom: none;
}

.rank-list-item:hover {
  background-color: var(--gray-light);
}

.empty-tip {
  display: flex;
  font-size: 18px;
  color: var(--gray-dark);
  justify-content: center;
}

.rank-number {
  width: 50px;
  text-align: center;
  font-weight: bold;
  color: var(--primary-color);
  flex-shrink: 0;
  justify-self: center;
}

.rank-identifier {
  flex: 2;
  padding: 0 var(--spacing-xs);
  font-weight: bold;
  font-size: 17px;
}

.rank-group {
  color: white;
  font-size: 0.9em;
  margin-left: var(--spacing-sm);
  background-color: var(--primary-light);
  padding: 0 6px;
  border-radius: 4px;
  font-weight: normal;
}

.rank-value {
  width: 120px;
  text-align: right;
  font-weight: bold;
  color: var(--primary-color);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  line-height: 100%;
}

.rank-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--gray-dark);
  font-size: 0.9em;
  flex: 0.5;
}

/* 动画效果 */
.fade-in {
  animation: fadeIn 0.3s ease-in-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .rank-details {
    display: none;
  }

  .rank-section {
    min-width: 100%;
    margin-bottom: var(--spacing-md);
  }

  .rank-identifier {
    flex: 1;
  }
}
</style>