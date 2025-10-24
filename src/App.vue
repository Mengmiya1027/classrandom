<template>
  <div id="app">
    <!-- 主页面 -->
    <!-- 编辑页面（覆盖显示） -->
    <MainPage v-if="!store.showEdit" style="z-index: 1;"/>

    <!-- 统计页面（覆盖显示） -->
    <EditPage v-if="store.showEdit" @close="store.setShowEdit(false)" style="z-index: 2;"/>
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
}
</style>