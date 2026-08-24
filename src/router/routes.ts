import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue';

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '用户登录', hidden: true },
  },
  {
    path: '/',
    name: 'Layout',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '控制台', icon: 'Odometer' },
      },
      {
        path: 'dwg',
        name: 'DwgParser',
        component: () => import('@/views/dwg/index.vue'),
        meta: { title: 'DWG 图纸解析', icon: 'Document' },
      },
      {
        path: 'agent',
        name: 'AgentChat',
        component: () => import('@/views/agent/index.vue'),
        meta: { title: '智能问答助手', icon: 'ChatDotRound' },
      },
      {
        path: 'crypto',
        name: 'CryptoTool',
        component: () => import('@/views/crypto/index.vue'),
        meta: { title: '加解密工具', icon: 'Lock' },
      },
    ],
  },
];
