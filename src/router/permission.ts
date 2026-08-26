import type { Router } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getMenuTreeApi } from '@/api/modules/authApi';
import { registerDynamicRoutes } from './dynamicRoutes';

const whiteList = ['/login', '/404'];
let isDynamicRoutesAdded = false;

/**
 * 重置动态路由挂载标记(登出或切换账号时调用)
 */
export function resetDynamicRoutesFlag() {
  isDynamicRoutesAdded = false;
}

/**
 * 初始化全局路由鉴权与动态路由守卫
 */
export function setupPermissionGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const appTitle = import.meta.env.VITE_APP_TITLE || 'AGY 工具集成系统';
    document.title = to.meta.title ? `${to.meta.title} - ${appTitle}` : appTitle;

    const userStore = useUserStore();

    if (userStore.token) {
      if (to.path === '/login') {
        next({ path: '/' });
        return;
      }

      if (!userStore.userInfo) {
        try {
          await userStore.getUserInfo();
        } catch (err) {
          userStore.resetToken();
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
          return;
        }
      }

      if (!isDynamicRoutesAdded) {
        try {
          const [menuTree] = await Promise.all([
            getMenuTreeApi(),
            userStore.loadPermissions(),
          ]);

          if (menuTree && menuTree.length > 0) {
            userStore.setMenuTree(menuTree);
            registerDynamicRoutes(router, menuTree);
          }

          isDynamicRoutesAdded = true;
          next({ ...to, replace: true });
          return;
        } catch (error) {
          console.error('加载动态路由异常,重置凭证并重定向至登录页:', error);
          userStore.resetToken();
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
          return;
        }
      }

      next();
    } else {
      resetDynamicRoutesFlag();
      if (whiteList.includes(to.path)) {
        next();
      } else {
        next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
      }
    }
  });
}

