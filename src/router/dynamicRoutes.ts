import type { Router, RouteRecordRaw } from 'vue-router';
import type { SysMenuVO } from '@/api/types/userModel';
import * as AgyUI from '@greatmap/agy-front';

// 本地业务页面
const viewModules = import.meta.glob('/src/views/**/*.vue');
const NotFoundComponent = () => import('@/views/error/404.vue');

// 统一映射 @greatmap/agy-ui 中的公共系统管理组件
const systemComponentMap: Record<string, any> = {
  'system/user/index': AgyUI.SysUserView,
  'system/user': AgyUI.SysUserView,
  'system/role/index': AgyUI.SysRoleView,
  'system/role': AgyUI.SysRoleView,
  'system/menu/index': AgyUI.SysMenuView,
  'system/menu': AgyUI.SysMenuView,
  'system/dict/index': AgyUI.SysDictView,
  'system/dict': AgyUI.SysDictView,
  'system/log/index': AgyUI.SysLoginLogView,
  'system/log/login': AgyUI.SysLoginLogView,
  'system/log/loginLog': AgyUI.SysLoginLogView,
  'system/log/oper/index': AgyUI.SysOperLogView,
  'system/log/oper': AgyUI.SysOperLogView,
  'system/log/operLog': AgyUI.SysOperLogView,
};

/**
 * 智能组件解析器：优先匹配公共组件库 @greatmap/agy-ui，其次查找本地业务 views
 */
function resolveComponent(componentPath?: string) {
  if (!componentPath || !componentPath.trim()) {
    return NotFoundComponent;
  }

  const clean = componentPath
    .trim()
    .replace(/^\/?src\/views\//, '')
    .replace(/^\//, '')
    .replace(/\.vue$/, '');

  // 1. 如果匹配到公共组件库中的系统管理页面，直接返回组件
  if (systemComponentMap[clean]) {
    return systemComponentMap[clean];
  }

  // 2. 查找本地业务页面
  const candidates = [
    `/src/views/${clean}.vue`,
    `/src/views/${clean}/index.vue`,
  ];

  for (const candidate of candidates) {
    if (viewModules[candidate]) {
      return viewModules[candidate];
    }
  }

  // 后缀模糊容错
  const matchedKey = Object.keys(viewModules).find(
    (k) => k.endsWith(`/${clean}.vue`) || k.endsWith(`/${clean}/index.vue`)
  );
  if (matchedKey) {
    return viewModules[matchedKey];
  }

  console.warn(`[动态路由提示] 未找到组件: ${clean}，已自动降级挂载 404 组件`);
  return NotFoundComponent;
}

/**
 * 递归解析菜单树并向 Layout 布局中动态注入真实路由
 */
export function registerDynamicRoutes(router: Router, menuTree: SysMenuVO[]) {
  const leafMenus: SysMenuVO[] = [];

  function extractLeafMenus(nodes: SysMenuVO[]) {
    nodes.forEach((node) => {
      if (node.menuType === 1 && node.path) {
        leafMenus.push(node);
      }
      if (node.children && node.children.length > 0) {
        extractLeafMenus(node.children);
      }
    });
  }

  extractLeafMenus(menuTree);

  leafMenus.forEach((menu) => {
    const rawPath = menu.path.trim();
    if (!rawPath) return;

    const routePath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const routeName = `DynamicRoute_${menu.id}`;

    if (router.hasRoute(routeName)) {
      return;
    }

    const dynamicRoute: RouteRecordRaw = {
      path: routePath,
      name: routeName,
      component: resolveComponent(menu.component),
      meta: {
        title: menu.menuName,
        icon: menu.icon,
      },
    };

    router.addRoute('Layout', dynamicRoute);
  });

  if (!router.hasRoute('NotFound')) {
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundComponent,
      meta: { title: '404 页面未找到' },
    });
  }
}
