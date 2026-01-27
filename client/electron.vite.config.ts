import vue from "@vitejs/plugin-vue";
import { defineConfig } from "electron-vite";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        "@": resolve("src/renderer/src"),
      },
    },
    root: resolve(__dirname, "src/renderer"),
    envDir: resolve(__dirname),
    publicDir: resolve(__dirname, "src/renderer/src/assets/public"),
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue", "vue-router"],
        resolvers: [],
      }),
      Components({
        resolvers: [
          NaiveUiResolver(),
          IconsResolver({
            prefix: "icon",
            alias: {
              system: "system-uicons",
            },
            customCollections: ["svg"],
          }),
        ],
      }),
      Icons({
        compiler: "vue3", // 指定编译器
        autoInstall: true, // 自动安装
        customCollections: {
          svg: FileSystemIconLoader("src/renderer/src/assets/svg"),
        },
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/global.scss" as *;`,
        },
      },
    },
    server: {
      port: 3212,
    },
    esbuild: {
      drop:
        process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
      supported: {
        "object-rest-spread": true,
      },
    },
    build: {
      outDir: resolve(__dirname, "out/renderer"), // 构建输出目录
      emptyOutDir: true, // 允许清空输出目录
      assetsDir: "assets", // 指定生成静态资源的存放路径
      target: "es2020", // 设置编译目标为 es2020 以支持更现代的语法
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false, // 禁用压缩大小报告以加快构建速度
      minify: "esbuild", // 使用 esbuild 进行代码压缩
      cssCodeSplit: true, // 启用 CSS 代码拆分
      rollupOptions: {
        external: ["virtual:pwa-register/vue"],
        output: {
          chunkFileNames: "assets/js/[name]-[hash].js", //代码块文件名
          entryFileNames: "assets/js/[name]-[hash].js", //入口文件名
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]", // 资源文件名
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
            return undefined;
          },
        },
      },
    },
  },
});
