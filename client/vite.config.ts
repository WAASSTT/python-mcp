import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, type PluginOption } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import VueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  envDir: resolve(__dirname),
  publicDir: resolve(__dirname, 'src/renderer/src/assets/public'),
  plugins: [
    vue(),
    VueDevTools(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      resolvers: []
    }),
    Components({
      resolvers: [
        NaiveUiResolver(),
        IconsResolver({
          prefix: 'icon',
          alias: {
            system: 'system-uicons'
          },
          customCollections: ['svg']
        })
      ]
    }),
    Icons({
      compiler: 'vue3', // 指定编译器
      autoInstall: true, // 自动安装
      customCollections: {
        svg: FileSystemIconLoader('src/renderer/src/assets/svg')
      }
    }),
    mkcert({
      savePath: './certs', // 指定保存证书的位置
      force: true // 强制重新生成证书，即使没有设置Vite的https属性
    }),
    visualizer({
      emitFile: false, // 是否将可视化结果输出到文件
      filename: 'stats.html', // 生成的文件名
      open: true, // 是否自动打开浏览器
      gzipSize: true, // 是否显示gzip大小
      brotliSize: true // 是否显示brotli大小
    }) as PluginOption,
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/global.scss" as *;`
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve('src/renderer/src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 26888,
    open: false, //自动打开浏览器
    https: {
      cert: './certs/cert.pem',
      key: './certs/dev.pem'
    }
  },

  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    supported: {
      'object-rest-spread': true
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist/website'), // 构建输出目录
    emptyOutDir: true, // 允许清空输出目录
    assetsDir: 'assets', // 指定生成静态资源的存放路径
    target: 'es2020', // 设置编译目标为 es2020 以支持更现代的语法
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false, // 禁用压缩大小报告以加快构建速度
    minify: 'esbuild', // 使用 esbuild 进行代码压缩
    cssCodeSplit: true, // 启用 CSS 代码拆分
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js', //代码块文件名
        entryFileNames: 'assets/js/[name]-[hash].js', //入口文件名
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]', // 资源文件名
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString()
          }
          return undefined
        }
      }
    }
  }
})
