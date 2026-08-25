import request from '../../utils/request';
import type { SysUserVO, PageResultVO, SysLoginLogVO } from '../types/userModel';

export function getUserPageApi(params: any) {
  return request.get<any, PageResultVO<SysUserVO>>('/users', { params });
}

export function createUserApi(data: any) {
  return request.post<any, void>('/users', data);
}

export function updateUserApi(data: any) {
  return request.put<any, void>('/users', data);
}

export function deleteUserApi(id: string | number) {
  return request.delete<any, void>(`/users/${id}`);
}

export function resetUserPasswordApi(id: string | number, password?: string) {
  return request.put<any, void>(`/users/${id}/password`, { password });
}

export function getUserRoleIdsApi(userId: string | number) {
  return request.get<any, string[]>(`/users/${userId}/roles`);
}

export function saveUserRolesApi(userId: string | number, roleIds: (string | number)[]) {
  return request.post<any, void>(`/users/${userId}/roles`, roleIds);
}

export function updateUserPasswordApi(data: { oldPassword?: string; newPassword?: string }) {
  return request.put<any, void>('/users/change-password', data);
}

export function exportUserApi(params?: any) {
  return request.get('/users/export', { params, responseType: 'blob' });
}

export function getLoginLogPageApi(params: any) {
  return request.get<any, PageResultVO<SysLoginLogVO>>('/logs/login', { params });
}

export function deleteLoginLogApi(id: string | number) {
  return request.delete<any, void>(`/logs/login/${id}`);
}
