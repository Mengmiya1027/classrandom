import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import './assets/css/index.css'
import { createRouter, createWebHistory } from 'vue-router'
import EditPage from './components/editpage.vue'
import MainPage from './components/mainpage.vue'

// 1. 创建 Pinia 和路由实例
const pinia = createPinia()
const routes = [
    {
        path: '/', // 根路径
        component: MainPage // 指向主页面组件
    },
    {
        path: '/classes/edit/:id?',
        component: EditPage
    },
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 2. 只创建一个 App 实例
const app = createApp(App)

// 3. 在同一个实例上挂载所有插件（路由、Pinia）
app.use(pinia)
app.use(router)

// 4. 挂载应用
app.mount('#app')