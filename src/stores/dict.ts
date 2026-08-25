import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getDictDataListApi } from '../api/modules/dictApi';
import type { SysDictDataVO } from '../api/types/dictModel';

/**
 * 全局通用字典缓存与请求合并 Store
 * 1. 内存级字典数据缓存：已加载的字典直接读内存，0 网络开销
 * 2. 并发请求合并防抖 (Promise Cache)：表格多行渲染同时触发同一字典时，自动合并为 1 次网络请求
 */
export const useDictStore = defineStore('dict', () => {
  const dictCache = ref<Record<string, SysDictDataVO[]>>({});
  const pendingRequests = new Map<string, Promise<SysDictDataVO[]>>();

  async function getDictData(dictType: string): Promise<SysDictDataVO[]> {
    if (!dictType) return [];

    // 1. 命中内存缓存直接返回
    if (dictCache.value[dictType] && dictCache.value[dictType].length > 0) {
      return dictCache.value[dictType];
    }

    // 2. 若当前有正在进行中的同一字典请求，直接复用同一个 Promise（请求合并）
    if (pendingRequests.has(dictType)) {
      return pendingRequests.get(dictType)!;
    }

    // 3. 发起唯一远程网络请求
    const requestPromise = (async () => {
      try {
        const res = await getDictDataListApi(dictType);
        const data = res || [];
        dictCache.value[dictType] = data;
        return data;
      } catch (e) {
        return [];
      } finally {
        pendingRequests.delete(dictType);
      }
    })();

    pendingRequests.set(dictType, requestPromise);
    return requestPromise;
  }

  function cleanDictCache(dictType?: string) {
    if (dictType) {
      delete dictCache.value[dictType];
    } else {
      dictCache.value = {};
    }
  }

  return {
    dictCache,
    getDictData,
    cleanDictCache,
  };
});
