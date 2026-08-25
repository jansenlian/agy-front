export interface SysUserVO {
  id: string | number;
  username: string;
  realName: string;
  mobile?: string;
  status: number;
  statusDictText?: string;
  roleNames?: string[];
  createTime?: string;
  updateTime?: string;
}

export interface SysUserQueryDTO {
  pageNo?: number;
  pageSize?: number;
  username?: string;
  mobile?: string;
  status?: number;
}

export interface SysUserFormDTO {
  id?: string | number;
  username?: string;
  password?: string;
  realName?: string;
  mobile?: string;
  status?: number;
  roleIds?: (string | number)[];
}

export interface UserPasswordChangeDTO {
  oldPassword?: string;
  newPassword?: string;
}

export interface UserPasswordResetDTO {
  password?: string;
}

export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface LoginResponseVO {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: SysUserVO;
}

export interface PageQueryDTO {
  pageNo?: number;
  pageSize?: number;
}

export interface PageResultVO<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface SysMenuVO {
  id: string | number;
  parentId: string | number;
  menuName: string;
  path: string;
  component: string;
  permission?: string;
  icon?: string;
  sortOrder: number;
  menuType: number;
  status?: number;
  children?: SysMenuVO[];
}

export interface SysMenuFormDTO {
  id?: string | number;
  parentId?: string | number;
  menuName?: string;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  sortOrder?: number;
  menuType?: number;
  status?: number;
}

export interface SysLoginLogVO {
  id: string | number;
  username: string;
  ipAddress: string;
  location: string;
  browser: string;
  os: string;
  status: number;
  statusDictText?: string;
  msg: string;
  loginTime: string;
}

export interface SysLoginLogQueryDTO {
  pageNo?: number;
  pageSize?: number;
  username?: string;
  ipAddress?: string;
  status?: number;
}
