import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import ElementPlus, { ElMessage } from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'virtual:svg-icons-register';

import App from './App.vue';
import router from './router';
import './router/permission';
import { setupPermissionDirective } from '@greatmap/agy-front';

const app = createApp(App);

// 挂载 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 挂载 Pinia 与持久化插件
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// 挂载路由
app.use(router);
app.use(ElementPlus);

// 挂载自定义按钮鉴权指令
setupPermissionDirective(app);

// 生产环境全局未捕获异常拦截
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 全局异常拦截:', err, info);
  if (import.meta.env.PROD) {
    ElMessage.error('系统繁忙，请稍后再试');
  }
};

window.onunhandledrejection = (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason);
};

app.mount('#app');
