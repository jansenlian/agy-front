<template>
  <el-tag :type="tagType">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useDictStore } from '../../stores/dict';
import type { SysDictDataVO } from '../../api/types/dictModel';

const props = defineProps<{
  value?: number | string;
  dictCode?: string;
  dictText?: string;
}>();

const dictStore = useDictStore();
const dictList = ref<SysDictDataVO[]>([]);

const activeItem = computed(() => {
  if (props.value === undefined || props.value === null || props.value === '') return null;
  const list = (props.dictCode && dictStore.dictCache[props.dictCode]) || dictList.value;
  return list.find((item) => String(item.dictValue) === String(props.value));
});

const label = computed(() => {
  if (props.dictText) return props.dictText;
  if (activeItem.value) return activeItem.value.dictLabel;

  // 内置系统快捷兜底
  if (props.dictCode === 'sys_login_status') {
    if (props.value === 1 || props.value === '1') return '成功';
    if (props.value === 0 || props.value === '0') return '失败';
  }
  if (props.value === 1 || props.value === '1') return '正常';
  if (props.value === 0 || props.value === '0') return '禁用';
  return String(props.value ?? '');
});

const tagType = computed(() => {
  if (activeItem.value?.listClass) {
    return activeItem.value.listClass as any;
  }
  if (props.value === 1 || props.value === '1') return 'success';
  if (props.value === 0 || props.value === '0') return 'danger';
  return 'info';
});

async function loadDictData() {
  if (props.dictCode && !props.dictText) {
    const data = await dictStore.getDictData(props.dictCode);
    dictList.value = data;
  }
}

onMounted(() => {
  loadDictData();
});

watch(
  () => props.dictCode,
  () => {
    loadDictData();
  }
);
</script>
