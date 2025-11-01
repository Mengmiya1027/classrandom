import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import vuetify from 'vite-plugin-vuetify'
import { visualizer } from 'rollup-plugin-visualizer'


export default defineConfig({
    plugins: [
        vue(),
        viteSingleFile(), // 保留单文件打包插件
        vuetify({
            autoImport: true, // Vuetify 按需导入
            styles: 'expose' // 仅打包使用过的样式
        }),
        visualizer({ open: true }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173
    },
    build: {
        cssCodeSplit: false, // 单文件必需：CSS内联到HTML
        assetsInlineLimit: 100000000, // 大资源内联
        sourcemap: false, // 关闭sourcemap（减小体积）
        minify: 'terser', // 使用terser深度压缩
        terserOptions: {
            compress: {
                drop_console: true, // 移除console
                drop_debugger: true // 移除debugger
            }
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true, // 单文件必需：动态导入内联
            }
        }
    }
})