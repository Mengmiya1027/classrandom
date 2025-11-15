<template>
  <div class="edit-container page-container">
    <!-- 标题栏 -->
    <div class="page-header card fade-in">
      <h1 class="page-title">
        <font-awesome-icon icon="fa-solid fa-pen-to-square"/> 编辑抽取与统计信息
      </h1>
      <!-- 选项卡导航 -->
      <div class="tabs-nav">
        <button
            class="tab-btn"
            :class="{ 'active': activeTab === 'info' }"
            @click="activeTab = 'info'"
        >
          <font-awesome-icon icon="fa-solid fa-users"/> 学生/小组信息
        </button>
        <button
            class="tab-btn"
            :class="{ 'active': activeTab === 'history' }"
            @click="activeTab = 'history'"
        >
          <font-awesome-icon icon="fa-solid fa-history"/> 抽取历史
        </button>
      </div>
      <div class="header-actions btn-group">
        <button class="btn btn-secondary scale-hover" @click="$emit('close')">
          <font-awesome-icon icon="fa-solid fa-xmark" /> 关闭
        </button>
      </div>
    </div>

    <!-- 选项卡内容 -->
    <div class="tab-content">
      <InfoEditor v-if="activeTab === 'info'" />
      <HistoryEditor v-if="activeTab === 'history'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InfoEditor from "./edit/InfoEditor.vue";
import HistoryEditor from "./edit/HistoryEditor.vue";

// 活跃选项卡
const activeTab = ref('info')
</script>

<style scoped>
/* 原有样式保持不变 */
.edit-container.page-container,.modal {
  --primary-color: #28a328;
  --primary-light: #d0efe2;
  --primary-dark: #16a34a;
  --btn-shadow: 0 2px 4px rgb(40, 163, 40) !important;
  --v-input-control-height: 10px !important;
}

.edit-container {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  z-index: 100;
  background-color: #f6f7fb;
  padding: var(--spacing-md);
}

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

/* 选项卡样式 */
.tabs-nav {
  gap: var(--spacing-md);
  display: flex;
  overflow: hidden;
}

.tab-btn {
  background-color: #f1f3f8;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  font-size: 18px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  border-radius: var(--border-radius);
  justify-content: center;
  gap: 8px;
}

.tab-btn:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.tab-btn.active {
  background-color: var(--primary-color);
  color: white;
}

.tab-content {
  min-height: calc(100vh - 200px);
}
</style>