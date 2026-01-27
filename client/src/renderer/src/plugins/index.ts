/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import i18n from "@/lang";
import router from "@/router";

// Types
import type { App } from "vue";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate); // 使用持久化插件

export function registerPlugins(app: App) {
  app
    .use(pinia) // 先注册 Pinia 状态管理
    .use(router) // 然后注册路由
    .use(i18n); // 国际化
  // Naive UI 通过自动导入插件按需引入，无需全局注册
}
