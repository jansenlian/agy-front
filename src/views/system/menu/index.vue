<template>
  <div class="menu-manage-container">
    <el-card shadow="never">
      <!-- 操作栏 -->
      <div class="toolbar" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <div>
          <el-button v-permission="['sys:menu:add']" type="primary" icon="Plus" @click="handleCreate(0)">新增根菜单</el-button>
          <el-button icon="Sort" @click="toggleExpandAll">{{ isExpandAll ? '折叠按钮层级' : '全部展开' }}</el-button>
          <el-button icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </div>

      <!-- 树形数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        border
        :expand-row-keys="expandedRowKeys"
        style="width: 100%;"
      >
        <el-table-column prop="menuName" label="菜单/按钮名称" min-width="180" />
        <el-table-column prop="menuType" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.menuType === 0 ? 'primary' : row.menuType === 1 ? 'success' : 'info'">
              {{ row.menuType === 0 ? '目录' : row.menuType === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="getIcon(row.icon)"><component :is="getIcon(row.icon)" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="160" />
        <el-table-column prop="component" label="组件路径" min-width="180" />
        <el-table-column prop="permission" label="权限标识" min-width="180">
          <template #default="{ row }">
            <el-tag v-if="row.permission" type="warning">{{ row.permission }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序号" width="80" align="center" />
        <el-table-column label="操作" min-width="180" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="hasPermission(['sys:menu:add', 'sys:menu:edit', 'sys:menu:delete'])">
              <el-button v-permission="['sys:menu:add']" link type="primary" icon="Plus" @click="handleCreate(row.id)">新增子项</el-button>
              <el-button v-permission="['sys:menu:edit']" link type="primary" icon="Edit" @click="handleEdit(row as any)">编辑</el-button>
              <el-popconfirm title="确定要删除该菜单及其子项吗？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button v-permission="['sys:menu:delete']" link type="danger" icon="Delete">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
            <el-tag v-else type="info" size="small" effect="plain">只读无操作权限</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑 菜单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑菜单/按钮' : '新增菜单/按钮'"
      width="600px"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
        <el-form-item label="父级节点">
          <el-cascader
            v-model="formData.parentId"
            :options="treeOptions"
            :props="{ label: 'menuName', value: 'id', children: 'children', checkStrictly: true, emitPath: false }"
            placeholder="不选默认为根节点"
            clearable
            style="width: 100%;"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="节点类型" prop="menuType">
          <el-radio-group v-model="formData.menuType">
            <el-radio :value="0">目录</el-radio>
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="节点名称" prop="menuName">
          <el-input v-model="formData.menuName" placeholder="例如：用户管理 / 新增用户" />
        </el-form-item>
        <el-form-item v-if="formData.menuType !== 2" label="图标">
          <IconSelect v-model="formData.icon" placeholder="点击直接挑选图标" />
        </el-form-item>
        <el-form-item v-if="formData.menuType !== 2" label="路由路径">
          <el-input v-model="formData.path" placeholder="例如：/system/user" />
        </el-form-item>
        <el-form-item v-if="formData.menuType === 1" label="组件路径">
          <el-input v-model="formData.component" placeholder="例如：system/user/index" />
        </el-form-item>
        <el-form-item v-if="formData.menuType === 2" label="权限标识">
          <el-input v-model="formData.permission" placeholder="例如：sys:user:add" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { getAllMenuTreeApi, addMenuApi, updateMenuApi, deleteMenuApi } from '../../../api/modules/menuApi';
import type { SysMenuVO } from '../../../api/types/userModel';
import { hasPermission } from '../../../directive/permission';
import IconSelect from '../../../components/IconSelect/index.vue';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const tableData = ref<SysMenuVO[]>([]);
const expandedRowKeys = ref<string[]>([]);
const isExpandAll = ref(false);

const treeOptions = computed(() => {
  return [{ id: '0', menuName: '顶级目录 (根节点)', children: tableData.value }];
});

function getIcon(iconName?: string) {
  if (!iconName) return null;
  if (iconName.toLowerCase() === 'menu') return ElementPlusIconsVue.Grid;
  const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  return (ElementPlusIconsVue as any)[pascalName] || (ElementPlusIconsVue as any)[iconName] || null;
}

const formData = reactive<Partial<SysMenuVO>>({
  id: undefined,
  parentId: 0,
  menuName: '',
  menuType: 1,
  icon: '',
  path: '',
  component: '',
  permission: '',
  sortOrder: 1,
});

const rules = {
  menuName: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
};

async function loadData() {
  loading.value = true;
  try {
    const res = await getAllMenuTreeApi();
    tableData.value = res || [];
    // 默认只展开第一级目录（系统管理），第二级菜单（用户管理等）下的第三级按钮保持折叠
    expandedRowKeys.value = (tableData.value || [])
      .filter(item => item.menuType === 0)
      .map(item => String(item.id));
    isExpandAll.value = false;
  } finally {
    loading.value = false;
  }
}

function toggleExpandAll() {
  isExpandAll.value = !isExpandAll.value;
  if (isExpandAll.value) {
    // 全量展开所有具有子节点的菜单与目录
    const allKeys: string[] = [];
    const collectKeys = (list: SysMenuVO[]) => {
      list.forEach(node => {
        if (node.children && node.children.length > 0) {
          allKeys.push(String(node.id));
          collectKeys(node.children);
        }
      });
    };
    collectKeys(tableData.value);
    expandedRowKeys.value = allKeys;
  } else {
    // 折叠回默认只展开第一层目录
    expandedRowKeys.value = (tableData.value || [])
      .filter(item => item.menuType === 0)
      .map(item => String(item.id));
  }
}

function handleCreate(parentId: string | number = 0) {
  formData.id = undefined;
  formData.parentId = parentId || 0;
  formData.menuName = '';
  formData.menuType = 1;
  formData.icon = '';
  formData.path = '';
  formData.component = '';
  formData.permission = '';
  formData.sortOrder = 1;
  dialogVisible.value = true;
}

function handleEdit(row: SysMenuVO) {
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function submitForm() {
  submitting.value = true;
  try {
    if (formData.id) {
      await updateMenuApi(formData);
      ElMessage.success('修改节点成功');
    } else {
      await addMenuApi(formData);
      ElMessage.success('新增节点成功');
    }
    dialogVisible.value = false;
    loadData();
    window.dispatchEvent(new Event('refresh-sidebar-menu'));
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: string) {
  await deleteMenuApi(id);
  ElMessage.success('删除成功');
  loadData();
  window.dispatchEvent(new Event('refresh-sidebar-menu'));
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
</style>
