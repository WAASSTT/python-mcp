import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

//路由的作用是根据不同的URL地址，返回不同的内容给用户
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/components/Index.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(), // 开发环境 Web 模式使用 History
  routes,
});

export default router;
