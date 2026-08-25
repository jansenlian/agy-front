import request from '../../utils/request';
import type { SysOperLogVO, SysOperLogQueryDTO } from '../types/logModel';
import type { PageResultVO } from '../types/userModel';

export function getOperLogPageApi(params?: SysOperLogQueryDTO) {
  return request.get<any, PageResultVO<SysOperLogVO>>('/logs/oper', { params });
}

export function deleteOperLogApi(id: string | number) {
  return request.delete<any, void>(`/logs/oper/${id}`);
}
