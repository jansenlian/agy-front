import { ElLoading, ElMessage } from 'element-plus';

/**
 * 搭配后端 EasyExcel 的二进制 Blob 文件流下载工具
 */
export function downloadBlobFile(data: Blob, defaultFilename: string) {
  const loading = ElLoading.service({ text: '正在导出数据，请稍候...', background: 'rgba(0, 0, 0, 0.7)' });
  try {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error('文件导出失败');
  } finally {
    loading.close();
  }
}
