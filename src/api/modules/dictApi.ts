import request from '../../utils/request';
import type {
  SysDictTypeVO,
  SysDictDataVO,
  SysDictTypeQueryDTO,
  SysDictTypeFormDTO,
  SysDictDataQueryDTO,
  SysDictDataFormDTO,
} from '../types/dictModel';
import type { PageResultVO } from '../types/userModel';

export function getDictTypePageApi(params?: SysDictTypeQueryDTO) {
  return request.get<any, PageResultVO<SysDictTypeVO>>('/dict/type/page', { params });
}

export function getDictTypeListApi() {
  return request.get<any, SysDictTypeVO[]>('/dict/type/list');
}

export function addDictTypeApi(data: SysDictTypeFormDTO) {
  return request.post<any, boolean>('/dict/type', data);
}

export function updateDictTypeApi(data: SysDictTypeFormDTO) {
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

export function getDictDataPageApi(params?: SysDictDataQueryDTO) {
  return request.get<any, PageResultVO<SysDictDataVO>>('/dict/data/page', { params });
}

export function addDictDataApi(data: SysDictDataFormDTO) {
  return request.post<any, boolean>('/dict/data', data);
}

export function updateDictDataApi(data: SysDictDataFormDTO) {
  return request.put<any, boolean>('/dict/data', data);
}

export function deleteDictDataApi(id: string | number) {
  return request.delete<any, boolean>(`/dict/data/${id}`);
}
