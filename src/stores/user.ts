import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SysUserVO } from '@/api/types/userModel';
import { loginApi, getUserInfoApi, getUserPermissionsApi, refreshTokenApi } from '@/api/modules/authApi';

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const refreshToken = ref<string>('');
    const userInfo = ref<SysUserVO | null>(null);
    const permissions = ref<string[]>([]);

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
    }

    return {
      token,
      refreshToken,
      userInfo,
      permissions,
      login,
      setAuthSession,
      refreshUserToken,
      getUserInfo,
      loadPermissions,
      resetToken,
    };
  },
  {
    persist: {
      pick: ['token', 'refreshToken', 'userInfo', 'permissions'],
    },
  }
);
