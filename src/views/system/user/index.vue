<template>
  <div class="user-manage-container">
    <el-card shadow="never">
      <!-- 搜索与操作栏 -->
      <div class="toolbar" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <div style="display: flex; gap: 10px;">
          <el-button v-permission="['sys:user:add']" type="primary" icon="Plus" @click="handleCreate">新增用户</el-button>
          <el-button v-permission="['sys:user:export']" type="success" icon="Download" @click="handleExport">导出 Excel</el-button>
        </div>
        <div>
          <el-button icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </div>

      <!-- 用户列表表格 -->
      <el-table v-loading="loading" :data="tableData" border style="width: 100%;">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="username" label="账号" min-width="130" />
        <el-table-column prop="realName" label="真实姓名" min-width="130" />
        <el-table-column prop="mobile" label="手机号 (已脱敏)" min-width="140" />
        <el-table-column label="所属角色" min-width="190">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag
                v-for="roleName in (row.roleNames || [])"
                :key="roleName"
                type="warning"
                size="small"
              >
                {{ roleName }}
              </el-tag>
              <span v-if="!row.roleNames || row.roleNames.length === 0" style="color: #909399; font-size: 12px;">
                未分配角色
              </span>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <DictTag :value="row.status" :dict-text="row.statusDictText" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="170" align="center" :formatter="formatDate" />
        <el-table-column label="操作" min-width="200" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="hasPermission(['sys:user:edit', 'sys:user:delete'])">
              <el-button v-permission="['sys:user:edit']" link type="warning" icon="UserFilled" @click="openRoleDialog(row as any)">分配角色</el-button>
              <el-button v-permission="['sys:user:edit']" link type="primary" icon="Edit" @click="handleEdit(row as any)">编辑</el-button>
              <el-button v-permission="['sys:user:edit']" link type="info" icon="Key" @click="handleResetPassword(row.id, row.username)">重置密码</el-button>
              <el-popconfirm title="确定要删除该用户吗？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button v-permission="['sys:user:delete']" link type="danger" icon="Delete">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
            <el-tag v-else type="info" size="small" effect="plain">只读无操作权限</el-tag>
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

    <!-- 新增 / 编辑 用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="formData.username" placeholder="请输入登录账号" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item v-if="!formData.id" label="登录密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入初始密码" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="例如：张三" />
        </el-form-item>
        <el-form-item label="手机号码">
          <el-input v-model="formData.mobile" placeholder="例如：13800138000" />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色 弹窗 -->
    <el-dialog
      v-model="roleDialogVisible"
      :title="`为用户【${currentUser?.realName || currentUser?.username}】分配系统角色`"
      width="520px"
    >
      <div v-loading="roleLoading" style="padding: 10px 0;">
        <div style="font-size: 13px; color: #606266; margin-bottom: 12px;">
          请勾选需要赋予该用户的系统角色：
        </div>
        <el-checkbox-group v-model="selectedRoleIds">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <el-checkbox
              v-for="role in allRoles"
              :key="role.id"
              :value="role.id"
              border
              style="width: 100%; margin-right: 0;"
            >
              <span style="font-weight: 500;">{{ role.roleName }}</span>
              <span style="color: #909399; font-size: 12px; margin-left: 8px;">({{ role.roleCode }})</span>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitting" @click="submitUserRoles">保存分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getUserPageApi,
  createUserApi,
  updateUserApi,
  resetUserPasswordApi,
  deleteUserApi,
  exportUserApi,
  getUserRoleIdsApi,
  saveUserRolesApi
} from '../../../api/modules/userApi';
import { getRolePageApi } from '../../../api/modules/roleApi';
import { SysUserVO } from '../../../api/types/userModel';
import type { SysRoleVO } from '../../../api/types/roleModel';
import DictTag from '../../../components/DictTag/index.vue';
import { downloadBlobFile } from '../../../utils/download';
import { hasPermission } from '../../../directive/permission';
import { encryptPassword } from '../../../utils/rsa';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const total = ref(0);
const tableData = ref<SysUserVO[]>([]);

// 分配角色
const roleDialogVisible = ref(false);
const roleLoading = ref(false);
const roleSubmitting = ref(false);
const currentUser = ref<SysUserVO | null>(null);
const allRoles = ref<SysRoleVO[]>([]);
const selectedRoleIds = ref<(string | number)[]>([]);

const queryForm = reactive({
  pageNo: 1,
  pageSize: 10,
});

const formData = reactive<Partial<SysUserVO> & { password?: string }>({
  id: undefined,
  username: '',
  password: '',
  realName: '',
  mobile: '',
  status: 1,
});

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
};

function formatDate(row: any) {
  if (!row.createTime) return '-';
  return String(row.createTime).replace('T', ' ').split('.')[0];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getUserPageApi(queryForm);
    tableData.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleCreate() {
  formData.id = undefined;
  formData.username = '';
  formData.password = '123456';
  formData.realName = '';
  formData.mobile = '';
  formData.status = 1;
  dialogVisible.value = true;
}

function handleEdit(row: SysUserVO) {
  Object.assign(formData, row);
  formData.password = '';
  dialogVisible.value = true;
}

async function submitForm() {
  submitting.value = true;
  try {
    if (formData.id) {
      await updateUserApi(formData);
      ElMessage.success('修改用户成功');
    } else {
      const encryptedPassword = await encryptPassword(formData.password || '123456');
      await createUserApi({ ...formData, password: encryptedPassword });
      ElMessage.success('新增用户成功');
    }
    dialogVisible.value = false;
    loadData();
  } finally {
    submitting.value = false;
  }
}

// 打开角色分配弹窗
async function openRoleDialog(row: SysUserVO) {
  currentUser.value = row;
  roleDialogVisible.value = true;
  roleLoading.value = true;
  selectedRoleIds.value = [];

  try {
    const [rolesRes, userRoleIds] = await Promise.all([
      getRolePageApi({ pageNo: 1, pageSize: 100 }),
      getUserRoleIdsApi(row.id),
    ]);
    allRoles.value = rolesRes.records || [];
    selectedRoleIds.value = userRoleIds || [];
  } finally {
    roleLoading.value = false;
  }
}

// 保存给用户分配的角色
async function submitUserRoles() {
  if (!currentUser.value) return;
  roleSubmitting.value = true;
  try {
    await saveUserRolesApi(currentUser.value.id, selectedRoleIds.value);
    ElMessage.success('用户角色分配成功');
    roleDialogVisible.value = false;
    loadData();
  } finally {
    roleSubmitting.value = false;
  }
}

function handleResetPassword(id: string, username: string) {
  ElMessageBox.prompt(`请输入用户【${username}】的新密码（留空默认为 123456）：`, '管理员重置用户密码', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    inputPlaceholder: '123456',
  }).then(async ({ value }) => {
    const pwd = (value || '').trim() || '123456';
    const encryptedPwd = await encryptPassword(pwd);
    await resetUserPasswordApi(id, encryptedPwd);
    ElMessage.success(`用户【${username}】的密码已成功重置为：${pwd}`);
  }).catch(() => {});
}

async function handleDelete(id: string) {
  await deleteUserApi(id);
  ElMessage.success('删除用户成功');
  loadData();
}

async function handleExport() {
  const data = await exportUserApi();
  downloadBlobFile(data as unknown as Blob, '系统用户数据表.xlsx');
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
</style>
