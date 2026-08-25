export interface SysRoleVO {
  id: string | number;
  roleCode: string;
  roleName: string;
  status: number;
  remark?: string;
  createTime?: string;
}

export interface SysRoleQueryDTO {
  pageNo?: number;
  pageSize?: number;
  roleName?: string;
  roleCode?: string;
  status?: number;
}

export interface SysRoleFormDTO {
  id?: string | number;
  roleCode?: string;
  roleName?: string;
  status?: number;
  remark?: string;
}
