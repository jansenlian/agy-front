import request from '../../utils/request';
import type { SysDictTypeVO, SysDictDataVO } from '../types/dictModel';
import type { PageResultVO } from '../types/userModel';

export function getDictTypePageApi(params: any) {
  return request.get<any, PageResultVO<SysDictTypeVO>>('/dict/type/page', { params });
}

export function getDictTypeListApi() {
  return request.get<any, SysDictTypeVO[]>('/dict/type/list');
}

export function addDictTypeApi(data: any) {
  return request.post<any, boolean>('/dict/type', data);
}

export function updateDictTypeApi(data: any) {
  return request.put<any, boolean>('/dict/type', data);
}

export function deleteDictTypeApi(id: string | number) {
  return request.delete<any, boolean>(`/dict/type/${id}`);
}

export function getDictDataListApi(dictType: string) {
  return request.get<any, SysDictDataVO[]>(`/dict/data/list/${dictType}`);
}

export function getDictDataTreeApi(dictType: string) {
  return request.get<any, SysDictDataVO[]>(`/dict/data/tree/${dictType}`);
}

export function addDictDataApi(data: any) {
  return request.post<any, boolean>('/dict/data', data);
}

export function updateDictDataApi(data: any) {
  return request.put<any, boolean>('/dict/data', data);
}

export function deleteDictDataApi(id: string | number) {
  return request.delete<any, boolean>(`/dict/data/${id}`);
}
