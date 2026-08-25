export interface SysDictTypeVO {
  id: string | number;
  dictName: string;
  dictType: string;
  status: number;
  remark?: string;
  createTime?: string;
}

export interface SysDictTypeQueryDTO {
  pageNo?: number;
  pageSize?: number;
  dictName?: string;
  dictType?: string;
  status?: number;
}

export interface SysDictTypeFormDTO {
  id?: string | number;
  dictName?: string;
  dictType?: string;
  status?: number;
  remark?: string;
}

export interface SysDictDataVO {
  id: string | number;
  dictType: string;
  parentId: string | number;
  dictLabel: string;
  dictValue: string;
  sortOrder: number;
  listClass?: string;
  cssClass?: string;
  status: number;
  remark?: string;
  children?: SysDictDataVO[];
}

export interface SysDictDataQueryDTO {
  pageNo?: number;
  pageSize?: number;
  dictType?: string;
  dictLabel?: string;
  status?: number;
}

export interface SysDictDataFormDTO {
  id?: string | number;
  dictType?: string;
  parentId?: string | number;
  dictLabel?: string;
  dictValue?: string;
  sortOrder?: number;
  listClass?: string;
  cssClass?: string;
  status?: number;
  remark?: string;
}
