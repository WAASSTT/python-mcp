import { isElectron } from "@/components/config/defFunction";
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  RouteRecordRaw,
} from "vue-router";

//路由的作用是根据不同的URL地址，返回不同的内容给用户
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Index",
    component: () => import("@/components/Index.vue"),
  },
];

const router = createRouter({
  // Electron 环境必须使用 Hash 模式，否则打包后会白屏
  // 原因：file:// 协议不支持 HTML5 History 模式
  history: !isElectron()
    ? createWebHistory() // 开发环境 Web 模式使用 History
    : createWebHashHistory(), // Electron 或生产环境使用 Hash
  routes,
});

export default router;
