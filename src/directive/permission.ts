import type { App, DirectiveBinding } from 'vue';
import { useUserStore } from '../stores/user';

/**
 * 判断当前登录用户是否拥有指定的任一权限
 */
export function hasPermission(permissionList: string[]): boolean {
  const userStore = useUserStore();
  const permissions = userStore.permissions || [];
  if (!permissionList || permissionList.length === 0) return true;
  return permissions.includes('*:*:*') || permissions.some((perm: string) => permissionList.includes(perm));
}

export function setupPermissionDirective(app: App) {
  app.directive('permission', {
    mounted(el: HTMLElement, binding: DirectiveBinding<string[]>) {
      const { value } = binding;

      if (value && value instanceof Array && value.length > 0) {
        if (!hasPermission(value)) {
          el.parentNode && el.parentNode.removeChild(el);
        }
      } else {
        throw new Error('v-permission 指令必须接收一个权限标识数组，例如 v-permission="[\'sys:user:add\']"');
      }
    },
  });
}
