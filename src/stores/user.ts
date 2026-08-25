import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SysUserVO, SysMenuVO } from '../api/types/userModel';
import { loginApi, getUserInfoApi, getUserPermissionsApi, refreshTokenApi } from '../api/modules/authApi';
import { resetDynamicRoutesFlag } from '../router/permission';

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const refreshToken = ref<string>('');
    const userInfo = ref<SysUserVO | null>(null);
    // 权限标识与菜单树保持内存态 (避免 localStorage 持久化陈旧快照，每次启动/刷新由路由守卫拉取最新 RBAC)
    const permissions = ref<string[]>([]);
    const menuTree = ref<SysMenuVO[]>([]);

    async function login(loginForm: { username: string; password: string }) {
      const res = await loginApi(loginForm);
      token.value = res.token || res.accessToken || '';
      refreshToken.value = res.refreshToken || '';
      userInfo.value = res.user;
      await loadPermissions();
    }

    function setAuthSession(accessToken: string, refreshTok: string, user: SysUserVO) {
      token.value = accessToken;
      refreshToken.value = refreshTok;
      userInfo.value = user;
      loadPermissions();
    }

    function setMenuTree(menus: SysMenuVO[]) {
      menuTree.value = menus || [];
    }

    async function refreshUserToken(): Promise<string> {
      if (!refreshToken.value) {
        throw new Error('No refresh token available');
      }
      const res = await refreshTokenApi(refreshToken.value);
      token.value = res.token || res.accessToken || '';
      if (res.refreshToken) {
        refreshToken.value = res.refreshToken;
      }
      await loadPermissions();
      return token.value;
    }

    async function getUserInfo() {
      const res = await getUserInfoApi();
      userInfo.value = res;
      await loadPermissions();
      return res;
    }

    async function loadPermissions() {
      try {
        const perms = await getUserPermissionsApi();
        permissions.value = perms || [];
      } catch (e) {
        permissions.value = [];
      }
    }

    function resetToken() {
      token.value = '';
      refreshToken.value = '';
      userInfo.value = null;
      permissions.value = [];
      menuTree.value = [];
      resetDynamicRoutesFlag();
    }

    return {
      token,
      refreshToken,
      userInfo,
      permissions,
      menuTree,
      login,
      setAuthSession,
      setMenuTree,
      refreshUserToken,
      getUserInfo,
      loadPermissions,
      resetToken,
    };
  },
  {
    persist: {
      // 仅持久化身份凭据与基本信息；权限与菜单树存内存，防止权限变更后客户端快照陈旧
      pick: ['token', 'refreshToken', 'userInfo'],
    },
  }
);
