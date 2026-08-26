<template>
  <el-watermark :content="watermarkContent">
    <div class="layout-container">
      <Sidebar />
      <div class="main-container" :class="{ 'is-collapsed': appStore.sidebarCollapsed }">
        <Header />
        <TagsView />
        <AppMain />
      </div>
    </div>
  </el-watermark>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import TagsView from './components/TagsView.vue';
import AppMain from './components/AppMain.vue';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

const appStore = useAppStore();
const userStore = useUserStore();

// 动态计算水印内容：提取当前登录用户实名/账号与系统名称、实时日期
const watermarkContent = computed(() => {
  const user = userStore.userInfo;
  const realName = user?.realName || user?.username || '未登录用户';
  const subInfo = user?.username ? `(${user.username})` : '';
  const appTitle = import.meta.env.VITE_APP_TITLE || 'AGY 工具集成系统';
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  return [
    `${realName} ${subInfo}`.trim(),
    `${appTitle} · ${dateStr}`
  ];
});
</script>

<style scoped>
.layout-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f5f7fa;
  transition: margin-left 0.3s;
}
</style>
