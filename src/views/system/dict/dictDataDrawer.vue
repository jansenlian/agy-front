<template>
  <el-drawer
    v-model="visible"
    :title="`字典数据项【${dictTypeObj?.dictName || ''} (${dictTypeObj?.dictType || ''})】`"
    size="70%"
    destroy-on-close
  >
    <div class="drawer-content">
      <div class="toolbar" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <div>
          <el-button v-permission="['sys:dict:data:add']" type="primary" icon="Plus" @click="handleCreate(0)">新增根节点项</el-button>
          <el-button icon="Refresh" @click="loadTreeData">刷新</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="treeData"
        row-key="id"
        border
        default-expand-all
        style="width: 100%;"
      >
        <el-table-column prop="dictLabel" label="字典标签" min-width="160" />
        <el-table-column prop="dictValue" label="字典键值" width="120" />
        <el-table-column prop="sortOrder" label="排序号" width="80" align="center" />
        <el-table-column prop="listClass" label="样式属性" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.listClass as any">{{ row.listClass || '默认' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="hasPermission(['sys:dict:data:add', 'sys:dict:data:edit', 'sys:dict:data:delete'])">
              <el-button v-permission="['sys:dict:data:add']" link type="primary" @click="handleCreate(row.id)">新增子项</el-button>
              <el-button v-permission="['sys:dict:data:edit']" link type="primary" @click="handleEdit(row as any)">编辑</el-button>
              <el-popconfirm title="确定要删除该字典项及其子项吗？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button v-permission="['sys:dict:data:delete']" link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
            <el-tag v-else type="info" size="small" effect="plain">只读无操作权限</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增 / 编辑 字典数据表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑字典项' : '新增字典项'"
      width="500px"
      append-to-body
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="父级节点">
          <el-cascader
            v-model="formData.parentId"
            :options="treeOptions"
            :props="{ label: 'dictLabel', value: 'id', children: 'children', checkStrictly: true, emitPath: false }"
            placeholder="不选默认为根节点"
            clearable
            style="width: 100%;"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input v-model="formData.dictLabel" placeholder="例如：广东省 / 成功"></el-input>
        </el-form-item>
        <el-form-item label="字典键值" prop="dictValue">
          <el-input v-model="formData.dictValue" placeholder="例如：440000 / 1"></el-input>
        </el-form-item>
        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="回显样式">
          <el-select v-model="formData.listClass" placeholder="选择标签颜色" style="width: 100%;">
            <el-option label="success (绿色)" value="success"></el-option>
            <el-option label="danger (红色)" value="danger"></el-option>
            <el-option label="warning (黄色)" value="warning"></el-option>
            <el-option label="primary (蓝色)" value="primary"></el-option>
            <el-option label="info (灰色)" value="info"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getDictDataTreeApi, addDictDataApi, updateDictDataApi, deleteDictDataApi } from '../../../api/modules/dictApi';
import type { SysDictTypeVO, SysDictDataVO } from '../../../api/types/dictModel';
import { hasPermission } from '../../../directive/permission';

const visible = ref(false);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dictTypeObj = ref<SysDictTypeVO | null>(null);
const treeData = ref<SysDictDataVO[]>([]);

const treeOptions = computed(() => {
  return [{ id: '0', dictLabel: '根节点 (顶级)', children: treeData.value }];
});

const formData = reactive<Partial<SysDictDataVO>>({
  id: undefined,
  dictType: '',
  parentId: 0,
  dictLabel: '',
  dictValue: '',
  sortOrder: 1,
  listClass: 'primary',
  status: 1,
  remark: '',
});

const rules = {
  dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典键值', trigger: 'blur' }],
};

function openDrawer(row: SysDictTypeVO) {
  dictTypeObj.value = row;
  visible.value = true;
  loadTreeData();
}

async function loadTreeData() {
  if (!dictTypeObj.value) return;
  loading.value = true;
  try {
    const res = await getDictDataTreeApi(dictTypeObj.value.dictType);
    treeData.value = res || [];
  } finally {
    loading.value = false;
  }
}

function handleCreate(parentId: string | number = 0) {
  formData.id = undefined;
  formData.dictType = dictTypeObj.value?.dictType;
  formData.parentId = parentId || 0;
  formData.dictLabel = '';
  formData.dictValue = '';
  formData.sortOrder = 1;
  formData.listClass = 'primary';
  formData.status = 1;
  formData.remark = '';
  dialogVisible.value = true;
}

function handleEdit(row: SysDictDataVO) {
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function submitForm() {
  submitting.value = true;
  try {
    if (formData.id) {
      await updateDictDataApi(formData);
      ElMessage.success('修改字典项成功');
    } else {
      await addDictDataApi(formData);
      ElMessage.success('新增字典项成功');
    }
    dialogVisible.value = false;
    loadTreeData();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: string) {
  await deleteDictDataApi(id);
  ElMessage.success('删除成功');
  loadTreeData();
}

defineExpose({ openDrawer });
</script>

<style scoped>
</style>
