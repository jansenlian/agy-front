<template>
  <div class="tags-view-container">
    <el-tag
      v-for="tag in visitedViews"
      :key="tag.path"
      :closable="tag.path !== '/dashboard'"
      :type="isActive(tag.path) ? 'primary' : 'info'"
      class="tag-item"
      @click="router.push(tag.path)"
      @close="closeTag(tag.path)"
    >
      {{ tag.title }}
    </el-tag>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface TagItem {
  title: string;
  path: string;
}

const route = useRoute();
const router = useRouter();

const visitedViews = ref<TagItem[]>([
  { title: '控制台', path: '/dashboard' }
]);

watch(
  () => route.path,
  () => {
    if (route.meta.title && !visitedViews.value.some(v => v.path === route.path)) {
      visitedViews.value.push({
        title: route.meta.title as string,
        path: route.path,
      });
    }
  },
  { immediate: true }
);

function isActive(path: string) {
  return route.path === path;
}

function closeTag(path: string) {
  visitedViews.value = visitedViews.value.filter(v => v.path !== path);
  if (route.path === path) {
    const last = visitedViews.value[visitedViews.value.length - 1];
    router.push(last ? last.path : '/dashboard');
  }
}
</script>

<style scoped>
.tags-view-container {
  height: 34px;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 8px;
}
.tag-item {
  cursor: pointer;
}
</style>
