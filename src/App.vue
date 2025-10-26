<template>
  <div id="app">
    <!-- 主页面：始终显示，激活时缩放 -->
    <MainPage
        class="main-page"
        :class="{ scaled: store.showEdit }"
        style="z-index: 1;"
    />

    <!-- 用transition组件包裹EditPage，强制触发动画 -->
    <transition name="slide-up">
      <EditPage
          v-if="store.showEdit"
          @close="store.setShowEdit(false)"
          class="edit-page"
          style="z-index: 2;"
      >
      </EditPage>
    </transition>
  </div>
</template>

<script setup>
import MainPage from './components/mainpage.vue'
import EditPage from './components/editpage.vue'
import StatisticsPage from './components/statistics.vue'
import { useMainStore } from './stores/index.js'

const store = useMainStore()
</script>

<style>
#app {
  position: relative; /* 确保子组件绝对定位位置于根组件内 */
  width: 100%;
  min-height: 100vh;
  perspective: 800px;
  transform-style: preserve-3d;
  overflow: hidden;
}
/* 主页面样式 */
.main-page {
  width: 100%;
  height: 100vh;
  display: flex;
  transition: transform 0.5s ; /* 缩放动画 */
}
.main-page.scaled {
  transform: scale(0.8); /* 激活时缩小到0.5倍 */
  backdrop-filter: blur(50px);
}

/* 编辑页基础样式 */
.edit-page {
  position: relative; /* 让投影元素相对自身定位 */
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0,0,0,0.2);
  padding: 20px;
  /* 始终居中定位（通过动画控制Y轴偏移） */
  left: 50%;
  top: 50%;
  transform: translate(0, 0);
}

/* 过渡动画：进入/离开状态 */
/* 初始状态（进入前）：在屏幕下方 */
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(0, 110%) rotateX(-40deg); /* 完全在屏幕下方 */
  /* 3D效果：上面近下面远 */
}

/* 动画过程 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.5s ease; /* 滑行动画 */
}

/* 进入后状态：已居中（复用edit-page的默认transform） */
.slide-up-enter-to {
  transform: translate(0, 0);
}

</style>