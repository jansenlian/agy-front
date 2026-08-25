export interface SysOperLogVO {
  id: string;
  title: string;
  businessType: number; // 0-其它 1-新增 2-修改 3-删除 4-授权 5-导出
  method: string;
  requestMethod: string;
  operName: string;
  operUrl: string;
  operIp: string;
  operLocation?: string;
  operParam?: string;
  jsonResult?: string;
  status: number; // 1-成功 0-失败
  errorMsg?: string;
  operTime: string;
}
