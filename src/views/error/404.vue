<template>
  <div class="not-found-container">
    <el-card shadow="never" class="error-card">
      <el-result
        icon="warning"
        title="404 - 页面或组件未找到"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" icon="HomeFilled" @click="$router.push('/dashboard')">返回控制台</el-button>
          <el-button icon="Setting" @click="$router.push('/system/menu')">前往菜单管理核对</el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const errorMessage = computed(() => {
  return `当前访问路由 [ ${route.path} ] 未匹配到有效的前端 Vue 业务组件，请核对【菜单管理】中配置的路由路径 (path) 与组件路径 (component) 是否与前端源码文件对应。`;
});
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 60px 20px;
}
.error-card {
  max-width: 680px;
  width: 100%;
  text-align: center;
  border-radius: 12px;
  background-color: #fff;
}
</style>
