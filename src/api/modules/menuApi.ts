import request from '../../utils/request';
import type { SysMenuVO } from '../types/userModel';

export function getAllMenuTreeApi() {
  return request.get<any, SysMenuVO[]>('/menus/tree');
}

export function addMenuApi(data: any) {
  return request.post<any, void>('/menus', data);
}

export function updateMenuApi(data: any) {
  return request.put<any, void>('/menus', data);
}

export function deleteMenuApi(id: string | number) {
  return request.delete<any, void>(`/menus/${id}`);
}
