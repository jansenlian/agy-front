<template>
  <div class="dict-manage-container">
    <el-card shadow="never">
      <!-- 搜索栏与操作栏 -->
      <div class="toolbar" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <el-form :inline="true" :model="queryForm">
          <el-form-item label="字典名称">
            <el-input v-model="queryForm.dictName" placeholder="模糊搜索字典名称" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="字典类型">
            <el-input v-model="queryForm.dictType" placeholder="模糊搜索字典编码" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadData">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div>
          <el-button v-permission="['sys:dict:type:add']" type="primary" icon="Plus" @click="handleCreate">新增字典类型</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="tableData" border style="width: 100%;">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="dictName" label="字典名称" min-width="150" />
        <el-table-column prop="dictType" label="字典类型 (编码)" min-width="180">
          <template #default="{ row }">
            <el-tag type="info">{{ row.dictType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" align="center" :formatter="formatDate" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Setting" @click="openDictDataDrawer(row as any)">字典数据</el-button>
            <el-button v-permission="['sys:dict:type:edit']" link type="primary" icon="Edit" @click="handleEdit(row as any)">编辑</el-button>
            <el-popconfirm title="确定要删除该字典类型及其关联的所有字典项吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button v-permission="['sys:dict:type:delete']" link type="danger" icon="Delete">删除</el-button>
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

    <!-- 新增 / 编辑 字典类型弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑字典类型' : '新增字典类型'"
      width="500px"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="formData.dictName" placeholder="例如：用户性别" />
        </el-form-item>
        <el-form-item label="字典类型(编码)" prop="dictType">
          <el-input v-model="formData.dictType" placeholder="例如：sys_user_sex" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字典数据多级 Drawer -->
    <DictDataDrawer ref="drawerRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getDictTypePageApi, addDictTypeApi, updateDictTypeApi, deleteDictTypeApi } from '../../../api/modules/dictApi';
import type { SysDictTypeVO } from '../../../api/types/dictModel';
import DictDataDrawer from './dictDataDrawer.vue';

const loading = ref(false);
const submitting = ref(false);

const dialogVisible = ref(false);
const total = ref(0);
const tableData = ref<SysDictTypeVO[]>([]);
const drawerRef = ref();

const queryForm = reactive({
  pageNo: 1,
  pageSize: 10,
  dictName: '',
  dictType: '',
});

const formData = reactive<Partial<SysDictTypeVO>>({
  id: undefined,
  dictName: '',
  dictType: '',
  status: 1,
  remark: '',
});

const rules = {
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入字典类型编码', trigger: 'blur' }],
};

function formatDate(row: any) {
  if (!row.createTime) return '-';
  return String(row.createTime).replace('T', ' ').split('.')[0];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getDictTypePageApi(queryForm);
    tableData.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  queryForm.dictName = '';
  queryForm.dictType = '';
  queryForm.pageNo = 1;
  loadData();
}

function handleCreate() {
  formData.id = undefined;
  formData.dictName = '';
  formData.dictType = '';
  formData.status = 1;
  formData.remark = '';
  dialogVisible.value = true;
}

function handleEdit(row: SysDictTypeVO) {
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function submitForm() {
  submitting.value = true;
  try {
    if (formData.id) {
      await updateDictTypeApi(formData);
      ElMessage.success('修改字典类型成功');
    } else {
      await addDictTypeApi(formData);
      ElMessage.success('新增字典类型成功');
    }
    dialogVisible.value = false;
    loadData();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: string) {
  await deleteDictTypeApi(id);
  ElMessage.success('删除字典类型成功');
  loadData();
}

function openDictDataDrawer(row: SysDictTypeVO) {
  drawerRef.value?.openDrawer(row);
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
</style>
