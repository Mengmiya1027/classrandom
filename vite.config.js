import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile' // 引入插件
import vuetify from 'vite-plugin-vuetify'


export default defineConfig({
    plugins: [
        vue(),
        viteSingleFile(),
        vuetify({ autoImport: true }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173
    },
    // 配置打包选项（确保CSS内联）
    build: {
        cssCodeSplit: false, // 禁止CSS拆分，内联到HTML
        assetsInlineLimit: 100000000, // 大资源也内联（数值为字节，100MB足够）
        rollupOptions: {
            output: {
                inlineDynamicImports: true, // 动态导入也内联
                manualChunks: () => 'single.js' // 所有JS合并为一个文件
            }
        }
    }
})