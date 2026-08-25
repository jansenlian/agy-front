import router from './index';
import { useUserStore, getMenuTreeApi } from '@greatmap/agy-front';
import { registerDynamicRoutes } from './dynamicRoutes';

const whiteList = ['/login', '/404'];
let isDynamicRoutesAdded = false;

router.beforeEach(async (to, from, next) => {
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + 'AGY 工具集成系统';

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
          registerDynamicRoutes(router, menuTree);
        }

        isDynamicRoutesAdded = true;
        next({ ...to, replace: true });
        return;
      } catch (error) {
        console.error('加载动态路由异常', error);
        isDynamicRoutesAdded = true;
        next();
        return;
      }
    }

    next();
  } else {
    isDynamicRoutesAdded = false;
    if (whiteList.includes(to.path)) {
      next();
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }
  }
});
