import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref<boolean>(false);
  const cachedViews = ref<string[]>([]);

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function addCachedView(viewName: string) {
    if (!cachedViews.value.includes(viewName)) {
      cachedViews.value.push(viewName);
    }
  }

  return {
    sidebarCollapsed,
    cachedViews,
    toggleSidebar,
    addCachedView,
  };
});
