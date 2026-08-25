export interface SysDictTypeVO {
  id: string;
  dictName: string;
  dictType: string;
  status: number;
  remark?: string;
  createTime?: string;
}

export interface SysDictDataVO {
  id: string;
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
