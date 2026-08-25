<template>
  <div class="log-manage-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="登录账号">
          <el-input v-model="queryForm.username" placeholder="请输入登录账号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="IP 地址">
          <el-input v-model="queryForm.ipAddress" placeholder="请输入 IP 地址" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="登录状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 130px;">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 日志表格 -->
      <el-table v-loading="loading" :data="tableData" border style="width: 100%;">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="username" label="登录账号" min-width="130" />
        <el-table-column prop="ipAddress" label="IP 地址" min-width="130" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.ipAddress || '127.0.0.1' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="登录地点" min-width="130" align="center">
          <template #default="{ row }">
            <span>{{ row.location || '本地局域网' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="浏览器 / 操作系统" min-width="200" align="center">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag type="primary" size="small">{{ row.browser || 'Chrome' }}</el-tag>
              <el-tag v-if="row.os" type="success" size="small">{{ row.os }}</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="登录状态" width="100" align="center">
          <template #default="{ row }">
            <DictTag :value="row.status" dict-code="sys_login_status" :dict-text="row.statusDictText" />
          </template>
        </el-table-column>
        <el-table-column prop="msg" label="返回消息" min-width="150" />
        <el-table-column prop="loginTime" label="登录时间" width="180" align="center" :formatter="formatDate" />
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-popconfirm title="确定要删除该条日志吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" icon="Delete">删除</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getLoginLogPageApi, deleteLoginLogApi } from '../../../api/modules/userApi';
import type { SysLoginLogVO } from '../../../api/types/userModel';
import DictTag from '../../../components/DictTag/index.vue';

const loading = ref(false);
const total = ref(0);
const tableData = ref<SysLoginLogVO[]>([]);

const queryForm = reactive({
  pageNo: 1,
  pageSize: 10,
  username: '',
  ipAddress: '',
  status: undefined as number | undefined,
});

function formatDate(row: any) {
  if (!row.loginTime) return '-';
  return String(row.loginTime).replace('T', ' ').split('.')[0];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getLoginLogPageApi(queryForm);
    tableData.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryForm.pageNo = 1;
  loadData();
}

function resetQuery() {
  queryForm.username = '';
  queryForm.ipAddress = '';
  queryForm.status = undefined;
  handleQuery();
}

async function handleDelete(id: string) {
  await deleteLoginLogApi(id);
  ElMessage.success('删除成功');
  loadData();
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.search-form {
  margin-bottom: 10px;
}
</style>
