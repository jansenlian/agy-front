import request from '../../utils/request';
import type { SysMenuVO, SysMenuFormDTO } from '../types/userModel';

export function getAllMenuTreeApi() {
  return request.get<any, SysMenuVO[]>('/menus/tree');
}

export function addMenuApi(data: SysMenuFormDTO) {
  return request.post<any, void>('/menus', data);
}

export function updateMenuApi(data: SysMenuFormDTO) {
  return request.put<any, void>('/menus', data);
}

export function deleteMenuApi(id: string | number) {
  return request.delete<any, void>(`/menus/${id}`);
}
