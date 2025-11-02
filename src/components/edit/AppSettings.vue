<template>
  <div class="app-settings card">
    <h3 class="card-title">
      <font-awesome-icon icon="fa-solid fa-cog"/> 应用程序设置
    </h3>
    <div class="settings-list">
      <!-- 默认抽取模式 -->
      <div class="setting-item">
        <label class="setting-label">默认抽取模式：</label>
        <v-select
            v-model="currentSettings.defaultMode"
            :items="modeOptions"
            class="setting-input"
            density="comfortable"
            variant="solo-filled"
        />
      </div>

      <!-- 主题颜色 -->
      <div class="setting-item">
        <label class="setting-label">主题颜色：</label>
        <input
            type="color"
            v-model="currentSettings.themeColor"
            class="color-input"
        >
      </div>

      <!-- 公平模式参数设置 -->
      <div class="setting-item">
        <label class="setting-label">公平模式阈值（次）：</label>
        <input
            type="number"
            v-model.number="currentSettings.fairThreshold"
            min="1"
            max="20"
            class="input setting-input"
        >
        <span class="setting-hint">（用于调整公平机制的触发频率）</span>
      </div>

      <!-- 保存按钮 -->
      <div class="setting-actions">
        <button class="btn btn-primary" @click="saveSettings">
          <font-awesome-icon icon="fa-solid fa-save"/> 保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  appSettings: {
    type: Object,
    default: () => ({
      defaultMode: 'normal',
      themeColor: '#28a328',
      fairThreshold: 10
    })
  }
})
const emit = defineEmits(['update:app-settings'])

// 本地副本，避免直接修改props
const currentSettings = ref({ ...props.appSettings })

// 模式选项
const modeOptions = [
  { value: 'normal', title: '普通模式' },
  { value: 'group-fair', title: '小组公平模式' },
  { value: 'personal-fair', title: '个人公平模式' }
]

// 保存设置
const saveSettings = () => {
  emit('update:app-settings', { ...currentSettings.value })
  // 可添加提示 toast
}

// 监听主题色变化，实时更新
watch(
    () => currentSettings.value.themeColor,
    (newColor) => {
      document.documentElement.style.setProperty('--primary-color', newColor)
    }
)
</script>

<style scoped>
.settings-list {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--gray-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  width: 150px;
  flex-shrink: 0;
  font-weight: 500;
}

.setting-input {
  flex: 1;
}

.color-input {
  width: 50px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--gray);
  border-radius: var(--border-radius);
  cursor: pointer;
}

.setting-hint {
  color: var(--gray-dark);
  font-size: 12px;
}

.setting-actions {
  padding-top: var(--spacing-sm);
  display: flex;
  justify-content: flex-end;
}
</style>