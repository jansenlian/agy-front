import request from '@/utils/request';

export function updateUserPasswordApi(data: { oldPassword: string; newPassword: string }) {
  return request.put<any, boolean>('/users/update-password', data);
}
