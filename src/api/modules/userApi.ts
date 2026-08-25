import request from '../../utils/request';
import type {
  SysUserVO,
  PageResultVO,
  SysLoginLogVO,
  SysUserQueryDTO,
  SysUserFormDTO,
  UserPasswordChangeDTO,
  UserPasswordResetDTO,
  SysLoginLogQueryDTO,
} from '../types/userModel';

export function getUserPageApi(params?: SysUserQueryDTO) {
  return request.get<any, PageResultVO<SysUserVO>>('/users', { params });
}

export function createUserApi(data: SysUserFormDTO) {
  return request.post<any, void>('/users', data);
}

export function updateUserApi(data: SysUserFormDTO) {
  return request.put<any, void>('/users', data);
}

export function deleteUserApi(id: string | number) {
  return request.delete<any, void>(`/users/${id}`);
}

export function resetUserPasswordApi(id: string | number, password?: string) {
  const data: UserPasswordResetDTO = { password };
  return request.put<any, void>(`/users/${id}/password`, data);
}

export function getUserRoleIdsApi(userId: string | number) {
  return request.get<any, (string | number)[]>(`/users/${userId}/roles`);
}

export function saveUserRolesApi(userId: string | number, roleIds: (string | number)[]) {
  return request.post<any, void>(`/users/${userId}/roles`, roleIds);
}

export function updateUserPasswordApi(data: UserPasswordChangeDTO) {
  return request.put<any, void>('/users/change-password', data);
}

export function exportUserApi(params?: SysUserQueryDTO) {
  return request.get('/users/export', { params, responseType: 'blob' });
}

export function getLoginLogPageApi(params?: SysLoginLogQueryDTO) {
  return request.get<any, PageResultVO<SysLoginLogVO>>('/logs/login', { params });
}

export function deleteLoginLogApi(id: string | number) {
  return request.delete<any, void>(`/logs/login/${id}`);
}
