import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import './assets/css/index.css'
import { createRouter, createWebHistory } from 'vue-router'
import EditPage from './components/editpage.vue'
import MainPage from './components/mainpage.vue'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css' // 确保这行存在
import {createVuetify} from "vuetify/framework";
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
    components, // 注册所有组件（包括 v-checkbox）
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#28a328', // 与你的绿色主题匹配
                },
            },
            options: {
                checkbox: {
                    size: '5px', /* 调整尺寸为10像素 */
                },
            },
        },
    },
})

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
app.use(vuetify)

// 4. 挂载应用
app.mount('#app')