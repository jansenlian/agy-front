import request from '@/utils/request';
import type { LoginRequestDTO, LoginResponseVO, SysUserVO, SysMenuVO } from '../types/userModel';

export function loginApi(data: LoginRequestDTO) {
  return request.post<any, LoginResponseVO>('/auth/login', data);
}

export function getUserInfoApi() {
  return request.get<any, SysUserVO>('/auth/me');
}

export function getMenuTreeApi() {
  return request.get<any, SysMenuVO[]>('/auth/menu-tree');
}

export function getUserPermissionsApi() {
  return request.get<any, string[]>('/auth/permissions');
}

export function getPublicKeyApi() {
  return request.get<any, string>('/auth/public-key');
}

export function refreshTokenApi(refreshToken: string) {
  return request.post<any, LoginResponseVO>('/auth/refresh', { refreshToken });
}
