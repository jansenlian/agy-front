<template>
  <div class="oper-log-container">
    <el-card shadow="never">
      <!-- 搜索与工具栏 -->
      <div class="toolbar" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <el-form :inline="true" :model="queryForm">
          <el-form-item label="系统模块">
            <el-input v-model="queryForm.title" placeholder="如：用户管理 / 字典" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="queryForm.operName" placeholder="搜索操作人员" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="业务类型">
            <el-select v-model="queryForm.businessType" placeholder="全部类型" clearable style="width: 130px;">
              <el-option label="其它" :value="0" />
              <el-option label="新增" :value="1" />
              <el-option label="修改" :value="2" />
              <el-option label="删除" :value="3" />
              <el-option label="授权" :value="4" />
              <el-option label="导出" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 120px;">
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadData">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 日志列表表格 -->
      <el-table v-loading="loading" :data="tableData" border style="width: 100%;">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="title" label="系统模块" min-width="140" />
        <el-table-column prop="businessType" label="业务类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getBusinessTypeTagType(row.businessType)">
              {{ getBusinessTypeName(row.businessType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operName" label="操作人员" min-width="120" />
        <el-table-column prop="operIp" label="主机 IP" min-width="130" align="center" />
        <el-table-column prop="requestMethod" label="请求方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.requestMethod === 'GET' ? 'info' : row.requestMethod === 'POST' ? 'success' : row.requestMethod === 'PUT' ? 'warning' : 'danger'">
              {{ row.requestMethod }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operTime" label="操作时间" width="180" align="center" :formatter="formatDate" />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="handleOpenDetail(row as any)">详情</el-button>
            <el-popconfirm title="确定删除该条日志？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button v-permission="['sys:log:oper:delete']" link type="danger" icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <el-pagination
        v-model:current-page="queryForm.pageNo"
        v-model:page-size="queryForm.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 15px; justify-content: flex-end;"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <!-- 操作日志详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="操作日志详细信息"
      size="550px"
    >
      <el-descriptions v-if="detailData" :column="1" border>
        <el-descriptions-item label="模块标题">{{ detailData.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ getBusinessTypeName(detailData.businessType) }}</el-descriptions-item>
        <el-descriptions-item label="操作人员">{{ detailData.operName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求 URL">{{ detailData.operUrl || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ detailData.requestMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Java 方法">{{ detailData.method || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP / 地址">{{ detailData.operIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDate(detailData) }}</el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
            {{ detailData.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数">
          <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px; max-height: 150px; overflow: auto;">{{ formatJson(detailData.operParam) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果 / 错误消息">
          <pre style="background: #f5f7fa; padding: 10px; border-radius: 4px; max-height: 150px; overflow: auto;">{{ formatJson(detailData.errorMsg || detailData.jsonResult) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getOperLogPageApi, deleteOperLogApi } from '../../../../api/modules/operLogApi';
import type { SysOperLogVO } from '../../../../api/types/logModel';

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger';

const loading = ref(false);
const total = ref(0);
const tableData = ref<SysOperLogVO[]>([]);
const drawerVisible = ref(false);
const detailData = ref<SysOperLogVO | null>(null);

const queryForm = reactive({
  pageNo: 1,
  pageSize: 10,
  title: '',
  operName: '',
  businessType: undefined as number | undefined,
  status: undefined as number | undefined,
});

function getBusinessTypeName(type?: number) {
  switch (type) {
    case 1: return '新增';
    case 2: return '修改';
    case 3: return '删除';
    case 4: return '授权';
    case 5: return '导出';
    default: return '其它';
  }
}

function getBusinessTypeTagType(type?: number): TagType {
  switch (type) {
    case 1: return 'primary';
    case 2: return 'warning';
    case 3: return 'danger';
    case 4: return 'success';
    case 5: return 'info';
    default: return 'info';
  }
}

function formatDate(row: any) {
  if (!row.operTime) return '-';
  return String(row.operTime).replace('T', ' ').split('.')[0];
}

function formatJson(val?: string) {
  if (!val) return '暂无数据';
  try {
    const obj = JSON.parse(val);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return val;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getOperLogPageApi(queryForm);
    tableData.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  queryForm.title = '';
  queryForm.operName = '';
  queryForm.businessType = undefined;
  queryForm.status = undefined;
  queryForm.pageNo = 1;
  loadData();
}

function handleOpenDetail(row: SysOperLogVO) {
  detailData.value = row;
  drawerVisible.value = true;
}

async function handleDelete(id: string) {
  await deleteOperLogApi(id);
  ElMessage.success('删除单条日志成功');
  loadData();
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
</style>
