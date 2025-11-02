<template xmlns="http://www.w3.org/1999/html">
  <div class="edit-container page-container">
    <!-- 标题栏 -->
    <div class="page-header card fade-in">
      <h1 class="page-title">
        <font-awesome-icon icon="fa-solid fa-pen-to-square"/> 编辑抽取与统计信息
      </h1>
      <div class="header-actions btn-group">
        <button class="btn btn-secondary scale-hover" @click="$emit('close')">
          <font-awesome-icon icon="fa-solid fa-xmark" /> 关闭
        </button>
      </div>
    </div>
    <InfoEditor />
  </div>
</template>

<script setup>
import InfoEditor from "./edit/InfoEditor.vue";

</script>

<style scoped>
/* ================================
   🎨 优化版样式设计（保留原变量体系）
   主题：现代卡片式后台风格
================================ */

/* ====== 新的绿色全局变量 ====== */
.edit-container.page-container,.modal {
    /* 主色调（紫色系） */
    --primary-color: #28a328; /* 深紫色（深色主题色） */
    --primary-light: #d0efe2; /* 浅绿色（辅助色） */
    --primary-dark: #16a34a; /* 暗绿色（ hover 状态） */
    --btn-shadow: 0 2px 4px rgb(40, 163, 40) !important;
    --v-input-control-height: 10px !important;
}

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
</style>
