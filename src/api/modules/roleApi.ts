import request from '../../utils/request';
import type { SysRoleVO, SysRoleQueryDTO, SysRoleFormDTO } from '../types/roleModel';
import type { PageResultVO } from '../types/userModel';

export function getRolePageApi(params?: SysRoleQueryDTO) {
  return request.get<any, PageResultVO<SysRoleVO>>('/roles/page', { params });
}

export function getRoleListApi() {
  return request.get<any, SysRoleVO[]>('/roles/list');
}

export function addRoleApi(data: SysRoleFormDTO) {
  return request.post<any, boolean>('/roles', data);
}

export function updateRoleApi(data: SysRoleFormDTO) {
  return request.put<any, boolean>('/roles', data);
}

export function deleteRoleApi(id: string | number) {
  return request.delete<any, boolean>(`/roles/${id}`);
}

export function getRoleMenuIdsApi(roleId: string | number) {
  return request.get<any, (string | number)[]>(`/roles/${roleId}/menu-ids`);
}

export function saveRoleMenusApi(roleId: string | number, menuIds: (string | number)[]) {
  return request.post<any, boolean>(`/roles/${roleId}/authorize`, menuIds);
}
