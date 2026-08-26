import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';
import router from '../router';

// 创建 Axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '',
  timeout: 15000,
});

// 是否正在无感刷新 Token
let isRefreshing = false;
// 等待新 Token 换回后重放的请求队列
let retryRequestsQueue: Array<(token: string) => void> = [];

/**
 * 统一会话失效跳转登录处理 (避免强制 location.href 硬重载与路径割裂，保留 redirect 现场)
 */
function redirectToLogin(message?: string) {
  const userStore = useUserStore();
  userStore.resetToken();
  if (message) {
    ElMessage.warning(message);
  }
  const currentRoute = router.currentRoute.value;
  if (currentRoute && currentRoute.path !== '/login') {
    const redirect = currentRoute.fullPath && currentRoute.fullPath !== '/' ? currentRoute.fullPath : undefined;
    router.push({
      path: '/login',
      query: redirect ? { redirect } : undefined,
    }).catch(() => {
      // 容错降级
      window.location.href = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
    });
  }
}

// 请求拦截器：注入链路追踪 ID (X-Trace-Id)、32位 UUID Token 以及当前登录的用户 ID (X-User-Id)
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 自动生成前端请求全链路追踪 TraceId (32 位 UUID)
    if (!config.headers['X-Trace-Id']) {
      const traceId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      config.headers['X-Trace-Id'] = traceId;
    }

    const userStore = useUserStore();
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`;
    }
    if (userStore.userInfo) {
      if (userStore.userInfo.id) {
        config.headers['X-User-Id'] = String(userStore.userInfo.id);
      }
      if (userStore.userInfo.realName || userStore.userInfo.username) {
        config.headers['X-User-Name'] = encodeURIComponent(userStore.userInfo.realName || userStore.userInfo.username);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：自动解包 Result<T> 与 401 无感静默续期拦截
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果是二进制流 (EasyExcel 导出)，直接返回
    if (response.config.responseType === 'blob') {
      return response.data;
    }

    const res = response.data;
    if (res.code === 200 || res.code === 0) {
      return res.data; // 直接提纯解包 data
    } else {
      ElMessage.error(res.message || '系统业务异常');
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 身份过期拦截与无感刷新处理
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore();
      const requestUrl = originalRequest?.url || '';

      // 如果是登录本身失败或刷新接口失败，直接登出
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh') || !userStore.refreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      // 如果当前已有正在刷新的请求，将当前请求排队等待
      if (isRefreshing) {
        return new Promise((resolve) => {
          retryRequestsQueue.push((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }
            resolve(service(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // 调用 Refresh Token 静默换取新 Access Token
        const newToken = await userStore.refreshUserToken();

        // 重新设置当前请求的 Authorization 头并重放
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }

        // 唤醒重放队列中所有挂起的请求
        retryRequestsQueue.forEach((callback) => callback(newToken));
        retryRequestsQueue = [];

        return service(originalRequest);
      } catch (refreshErr) {
        // 7 天 Refresh Token 彻底失效，清空会话跳回登录页
        retryRequestsQueue = [];
        redirectToLogin('登录会话已完全失效，请重新登录');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    } else {
      ElMessage.error(error.message || '网络连接异常，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default service;
