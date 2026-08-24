export interface SysUserVO {
  id: string;
  username: string;
  realName: string;
  mobile?: string;
  status: number;
  statusDictText?: string;
  roleNames?: string[];
  createTime?: string;
}

export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface LoginResponseVO {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: SysUserVO;
}

export interface SysMenuVO {
  id: string;
  parentId: string | number;
  menuName: string;
  path: string;
  component: string;
  permission?: string;
  icon?: string;
  sortOrder: number;
  menuType: number;
  children?: SysMenuVO[];
}
