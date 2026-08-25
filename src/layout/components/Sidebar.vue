<template>
  <div class="sidebar-container" :class="{ collapsed: appStore.sidebarCollapsed }">
    <div class="logo-container">
      <el-icon class="logo-icon"><Platform /></el-icon>
      <span v-if="!appStore.sidebarCollapsed" class="logo-title">AGY 工具集成系统</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="appStore.sidebarCollapsed"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <el-menu-item index="/dashboard">
        <el-icon><Odometer /></el-icon>
        <template #title>控制台</template>
      </el-menu-item>

      <!-- 阿克苏耕地监管智能体 -->
      <el-menu-item index="/aks-agent">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>阿克苏耕地监管智能体</template>
      </el-menu-item>

      <!-- 专属空间与工程工具 -->
      <el-sub-menu index="/tools">
        <template #title>
          <el-icon><Tools /></el-icon>
          <span>空间与工程工具</span>
        </template>
        <el-menu-item index="/dwg">
          <el-icon><Document /></el-icon>
          <template #title>DWG 图纸解析</template>
        </el-menu-item>
        <el-menu-item index="/crypto">
          <el-icon><Lock /></el-icon>
          <template #title>国密加解密工具</template>
        </el-menu-item>
      </el-sub-menu>

      <template v-for="item in menuList" :key="item.id">
        <!-- 含有子菜单的目录 (menuType === 0) -->
        <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path || String(item.id)">
          <template #title>
            <el-icon><component :is="getIcon(item.icon, 'Setting')" /></el-icon>
            <span>{{ item.menuName }}</span>
          </template>

          <template v-for="sub in item.children" :key="sub.id">
            <el-menu-item v-if="sub.menuType !== 2" :index="sub.path">
              <el-icon><component :is="getIcon(sub.icon, 'Document')" /></el-icon>
              <template #title>{{ sub.menuName }}</template>
            </el-menu-item>
          </template>
        </el-sub-menu>

        <!-- 顶级菜单 (无子菜单) -->
        <el-menu-item v-else-if="item.menuType !== 2" :index="item.path">
          <el-icon><component :is="getIcon(item.icon, 'Document')" /></el-icon>
          <template #title>{{ item.menuName }}</template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore, getMenuTreeApi, type SysMenuVO } from '@greatmap/agy-front';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { Platform, Odometer, Document, Tools, Lock, DataAnalysis } from '@element-plus/icons-vue';
import { registerDynamicRoutes } from '@/router/dynamicRoutes';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const activeMenu = computed(() => route.path);
const menuList = ref<SysMenuVO[]>([]);

function getIcon(iconName?: string, defaultName = 'Document') {
  if (!iconName) return (ElementPlusIconsVue as any)[defaultName] || Document;
  if (iconName.toLowerCase() === 'menu') return ElementPlusIconsVue.Grid;
  const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  return (ElementPlusIconsVue as any)[pascalName] || (ElementPlusIconsVue as any)[defaultName] || Document;
}

async function loadSidebarMenus() {
  try {
    const res = await getMenuTreeApi();
    if (res && res.length > 0) {
      menuList.value = res;
      registerDynamicRoutes(router, res);
    }
  } catch (e) {
    console.error('获取动态菜单树失败', e);
  }
}

onMounted(() => {
  loadSidebarMenus();
  window.addEventListener('refresh-sidebar-menu', loadSidebarMenus);
});

onUnmounted(() => {
  window.removeEventListener('refresh-sidebar-menu', loadSidebarMenus);
});
</script>

<style scoped>
.sidebar-container {
  width: 220px;
  height: 100%;
  background-color: #304156;
  transition: width 0.3s;
}
.sidebar-container.collapsed {
  width: 64px;
}
.logo-container {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  color: #fff;
  font-weight: bold;
}
.logo-icon {
  font-size: 24px;
  color: #409eff;
}
.logo-title {
  margin-left: 8px;
  font-size: 16px;
}
</style>
