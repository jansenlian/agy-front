import type { RouteRecordRaw } from 'vue-router';

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
    component: () => import('@/layout/MainLayout.vue'),
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
        meta: { title: '人事运维智能体', icon: 'ChatDotRound', hidden: true },
      },
      {
        path: 'aks-agent',
        name: 'AksAgentChat',
        component: () => import('@/views/aks-agent/index.vue'),
        meta: { title: '阿克苏智慧耕地智能体', icon: 'DataAnalysis' },
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
