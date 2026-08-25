<template>
  <el-cascader
    v-if="isTree"
    v-model="modelValue"
    :options="treeData"
    :props="{ label: 'dictLabel', value: 'dictValue', children: 'children', checkStrictly: true }"
    :placeholder="placeholder"
    clearable
    style="width: 100%;"
  />
  <el-select
    v-else
    v-model="modelValue"
    :placeholder="placeholder"
    clearable
    style="width: 100%;"
  >
    <el-option
      v-for="item in listData"
      :key="item.id"
      :label="item.dictLabel"
      :value="item.dictValue"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getDictDataListApi, getDictDataTreeApi } from '../../api/modules/dictApi';
import type { SysDictDataVO } from '../../api/types/dictModel';

const props = withDefaults(defineProps<{
  dictCode: string;
  isTree?: boolean;
  placeholder?: string;
}>(), {
  isTree: false,
  placeholder: '请选择',
});

const modelValue = defineModel<any>();

const listData = ref<SysDictDataVO[]>([]);
const treeData = ref<SysDictDataVO[]>([]);

async function loadData() {
  if (!props.dictCode) return;
  if (props.isTree) {
    const res = await getDictDataTreeApi(props.dictCode);
    treeData.value = res || [];
  } else {
    const res = await getDictDataListApi(props.dictCode);
    listData.value = res || [];
  }
}

onMounted(() => {
  loadData();
});

watch(() => props.dictCode, () => {
  loadData();
});
</script>
