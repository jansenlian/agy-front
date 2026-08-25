<template>
  <div class="role-manage-container">
    <el-card shadow="never">
      <!-- 搜索与操作工具栏 -->
      <div class="toolbar" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
        <el-form :inline="true" :model="queryForm">
          <el-form-item label="角色名称">
            <el-input v-model="queryForm.roleName" placeholder="搜索角色名称" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="角色编码">
            <el-input v-model="queryForm.roleCode" placeholder="搜索角色编码" clearable @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadData">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div>
          <el-button v-permission="['sys:role:add']" type="primary" icon="Plus" @click="handleCreate">新增角色</el-button>
        </div>
      </div>

      <!-- 角色数据表格 -->
      <el-table v-loading="loading" :data="tableData" border style="width: 100%;">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="roleName" label="角色名称" min-width="150" />
        <el-table-column prop="roleCode" label="角色编码" min-width="150">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.roleCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center" :formatter="formatDate" />
        <el-table-column label="操作" min-width="180" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="hasPermission(['sys:role:authorize', 'sys:role:edit', 'sys:role:delete'])">
              <el-button v-permission="['sys:role:authorize']" link type="primary" icon="Key" @click="openAuthDrawer(row as any)">权限授权</el-button>
              <el-button v-permission="['sys:role:edit']" link type="primary" icon="Edit" @click="handleEdit(row as any)">编辑</el-button>
              <el-popconfirm title="确定要删除该角色吗？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button v-permission="['sys:role:delete']" link type="danger" icon="Delete">删除</el-button>
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

    <!-- 新增 / 编辑 角色弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑角色' : '新增角色'"
      width="540px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="formData.roleName"
            placeholder="例如：系统管理查看权限"
            @input="handleRoleNameInput"
          />
        </el-form-item>

        <el-form-item prop="roleCode">
          <template #label>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>角色编码</span>
              <el-tooltip
                content="角色在系统后端的唯一权限标识符。推荐格式：以 ROLE_ 开头的大写拼音首字母组合（例如 ROLE_XTGLCKQX 或 ROLE_BMGLY）。"
                placement="top"
              >
                <el-icon style="color: #909399; cursor: pointer;"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div style="display: flex; gap: 8px; width: 100%;">
            <el-input
              v-model="formData.roleCode"
              placeholder="例如：ROLE_XTGLCKQX"
              :disabled="!!formData.id"
              @input="handleRoleCodeInput"
            />
            <el-button
              v-if="!formData.id"
              type="primary"
              plain
              icon="MagicStick"
              title="根据角色名称一键生成精简首字母编码"
              @click="autoGenerateCode"
            >
              自动生成
            </el-button>
          </div>
          <div class="form-tip">
            💡 提示：系统权限标识符。输入角色名称时将自动推导精简首字母大写编码（如 ROLE_XTGLCKQX），亦可手动修改。
          </div>
        </el-form-item>

        <el-form-item label="状态">
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

    <!-- 角色 菜单与权限授权 抽屉 (左右双栏架构) -->
    <el-drawer
      v-model="authDrawerVisible"
      :title="`分配菜单与权限点【${currentRole?.roleName || ''} (${currentRole?.roleCode || ''})】`"
      size="820px"
    >
      <div v-loading="authLoading" class="auth-drawer-content">
        <!-- 顶部快捷操作工具栏 -->
        <div class="auth-toolbar">
          <div class="toolbar-tips">
            💡 提示：勾选左侧菜单即可访问页面；在右侧为菜单配置具体的操作按钮权限。
          </div>
          <div class="toolbar-actions">
            <el-button type="warning" plain icon="View" size="small" @click="selectReadOnlyMenus">
              一键仅选菜单 (只读权限)
            </el-button>
            <el-button type="primary" plain icon="Select" size="small" @click="selectAll">
              全选所有
            </el-button>
            <el-button type="info" plain icon="SemiSelect" size="small" @click="clearAll">
              全部清空
            </el-button>
          </div>
        </div>

        <!-- 左右双栏布局容器 -->
        <div class="auth-dual-column">
          <!-- 左栏：目录与菜单树 -->
          <div class="column-left">
            <div class="column-header">
              <span class="header-title">📌 1. 页面与菜单导航</span>
            </div>
            <div class="tree-wrapper">
              <el-tree
                ref="treeRef"
                :data="menuTreeOnly"
                node-key="id"
                show-checkbox
                check-strictly
                default-expand-all
                :props="{ label: 'menuName', children: 'children' }"
                :default-checked-keys="selectedMenuArray"
                @check-change="handleLeftTreeCheck"
                @node-click="handleMenuNodeClick"
              >
                <template #default="{ node, data }">
                  <div
                    class="custom-tree-node"
                    :class="{ 'is-active': activeMenuNode?.id === data.id }"
                  >
                    <span>{{ node.label }}</span>
                    <el-tag v-if="data.menuType === 0" size="small" type="info">目录</el-tag>
                    <el-tag v-else size="small" type="success">菜单</el-tag>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>

          <!-- 右栏：选中菜单对应的功能按钮/操作点 -->
          <div class="column-right">
            <div class="column-header">
              <span class="header-title">
                ⚡ 2. 详细按钮权限
                <template v-if="activeMenuNode">
                  【<span class="active-menu-name">{{ activeMenuNode.menuName }}</span>】
                </template>
              </span>
              <div v-if="currentMenuButtons.length > 0" class="btn-group-actions">
                <el-button link type="primary" size="small" @click="toggleCurrentMenuButtons(true)">全选</el-button>
                <el-button link type="info" size="small" @click="toggleCurrentMenuButtons(false)">取消</el-button>
              </div>
            </div>

            <div class="buttons-wrapper">
              <template v-if="activeMenuNode">
                <div v-if="currentMenuButtons.length > 0" class="buttons-grid">
                  <div
                    v-for="btn in currentMenuButtons"
                    :key="btn.id"
                    class="button-card"
                    :class="{ 'is-checked': selectedMenuIds.has(btn.id) }"
                    @click="toggleButtonCheck(btn.id)"
                  >
                    <el-checkbox
                      :model-value="selectedMenuIds.has(btn.id)"
                      @change="() => toggleButtonCheck(btn.id)"
                      @click.stop
                    />
                    <div class="button-info">
                      <div class="button-name">{{ btn.menuName }}</div>
                      <div class="button-perm">{{ btn.permission || '无标识符' }}</div>
                    </div>
                  </div>
                </div>
                <el-empty
                  v-else
                  description="该菜单下暂无可选的增删改操作按钮点"
                  :image-size="80"
                />
              </template>
              <el-empty
                v-else
                description="请先在左侧点击选中一个菜单页面"
                :image-size="80"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="authDrawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="authSubmitting" @click="submitAuth">保存授权配置</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElTree } from 'element-plus';
import { convertToPinyinUpper } from '../../../utils/pinyinUtils';
import { getRolePageApi, addRoleApi, updateRoleApi, deleteRoleApi, getRoleMenuIdsApi, saveRoleMenusApi } from '../../../api/modules/roleApi';
import { getAllMenuTreeApi } from '../../../api/modules/menuApi';
import type { SysRoleVO } from '../../../api/types/roleModel';
import { hasPermission } from '../../../directive/permission';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const total = ref(0);
const tableData = ref<SysRoleVO[]>([]);
const isManualCode = ref(false);

// 权限授权抽屉
const authDrawerVisible = ref(false);
const authLoading = ref(false);
const authSubmitting = ref(false);
const currentRole = ref<SysRoleVO | null>(null);

const rawMenuTree = ref<any[]>([]); // 原始完整后端菜单树（包含 0-目录 1-菜单 2-按钮）
const selectedMenuIds = ref<Set<string | number>>(new Set()); // 当前角色勾选的所有 ID 集合（目录+菜单+按钮）
const activeMenuNode = ref<any | null>(null); // 当前在左侧点击选中的菜单节点
const treeRef = ref<InstanceType<typeof ElTree>>();

// 过滤仅包含目录(0)和菜单(1)的左侧树数据
const menuTreeOnly = computed(() => {
  function filterTree(nodes: any[]): any[] {
    return nodes
      .filter(node => node.menuType === 0 || node.menuType === 1)
      .map(node => {
        const item = { ...node };
        if (node.children && node.children.length > 0) {
          const childMenus = filterTree(node.children);
          item.children = childMenus.length > 0 ? childMenus : undefined;
        } else {
          item.children = undefined;
        }
        return item;
      });
  }
  return filterTree(rawMenuTree.value);
});

// 计算选中的 ID 数组转为 Tree 的 CheckedKeys
const selectedMenuArray = computed(() => Array.from(selectedMenuIds.value));

// 提取当前点击选中菜单下的所有 2-按钮 节点
const currentMenuButtons = computed(() => {
  if (!activeMenuNode.value) return [];
  // 在原始树中找到当前节点
  function findNode(nodes: any[], id: string): any {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }
  const realNode = findNode(rawMenuTree.value, activeMenuNode.value.id);
  if (!realNode || !realNode.children) return [];
  return realNode.children.filter((child: any) => child.menuType === 2);
});

// 提取所有目录与菜单 ID
function getAllMenuType0And1Ids(nodes: any[]): string[] {
  let ids: string[] = [];
  for (const node of nodes) {
    if (node.menuType === 0 || node.menuType === 1) {
      ids.push(node.id);
    }
    if (node.children) {
      ids = ids.concat(getAllMenuType0And1Ids(node.children));
    }
  }
  return ids;
}

// 提取所有节点 ID (包含按钮)
function getAllNodeIds(nodes: any[]): string[] {
  let ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children) {
      ids = ids.concat(getAllNodeIds(node.children));
    }
  }
  return ids;
}

// 提取所有 2-按钮 ID
function getAllButtonIds(nodes: any[]): string[] {
  let ids: string[] = [];
  for (const node of nodes) {
    if (node.menuType === 2) {
      ids.push(node.id);
    }
    if (node.children) {
      ids = ids.concat(getAllButtonIds(node.children));
    }
  }
  return ids;
}

const queryForm = reactive({
  pageNo: 1,
  pageSize: 10,
  roleName: '',
  roleCode: '',
});

const formData = reactive<Partial<SysRoleVO>>({
  id: undefined,
  roleName: '',
  roleCode: '',
  status: 1,
});

const rules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
};

function formatDate(row: any) {
  if (!row.createTime) return '-';
  return String(row.createTime).replace('T', ' ').split('.')[0];
}

function generateRoleCodeFromName(name?: string): string {
  if (!name || !name.trim()) return '';
  const code = convertToPinyinUpper(name.trim());
  return code ? `ROLE_${code}` : '';
}

function handleRoleNameInput(val: string) {
  if (!formData.id && !isManualCode.value) {
    formData.roleCode = generateRoleCodeFromName(val);
  }
}

function handleRoleCodeInput(val: string) {
  isManualCode.value = true;
  if (val) {
    formData.roleCode = val.toUpperCase().replace(/[^A-Z0-9_]/g, '');
  }
}

function autoGenerateCode() {
  if (formData.roleName) {
    formData.roleCode = generateRoleCodeFromName(formData.roleName);
    isManualCode.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getRolePageApi(queryForm);
    tableData.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  queryForm.roleName = '';
  queryForm.roleCode = '';
  queryForm.pageNo = 1;
  loadData();
}

function handleCreate() {
  formData.id = undefined;
  formData.roleName = '';
  formData.roleCode = '';
  formData.status = 1;
  isManualCode.value = false;
  dialogVisible.value = true;
}

function handleEdit(row: SysRoleVO) {
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function submitForm() {
  submitting.value = true;
  try {
    if (formData.id) {
      await updateRoleApi(formData);
      ElMessage.success('修改角色成功');
    } else {
      await addRoleApi(formData);
      ElMessage.success('新增角色成功');
    }
    dialogVisible.value = false;
    loadData();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: string) {
  await deleteRoleApi(id);
  ElMessage.success('删除角色成功');
  loadData();
}

// ==================== 权限授权 (左右双栏架构) ====================

// 点击左侧树节点 (选中菜单切换右侧按钮)
function handleMenuNodeClick(data: any) {
  if (data.menuType === 1) {
    activeMenuNode.value = data;
  }
}

// 左侧树 Checkbox 状态变化同步
function handleLeftTreeCheck(data: any, isChecked: boolean) {
  if (isChecked) {
    selectedMenuIds.value.add(data.id);
  } else {
    selectedMenuIds.value.delete(data.id);
  }
}

// 切换当前选中菜单下单个按钮的选择状态
function toggleButtonCheck(btnId: string) {
  if (selectedMenuIds.value.has(btnId)) {
    selectedMenuIds.value.delete(btnId);
  } else {
    selectedMenuIds.value.add(btnId);
  }
}

// 当前选中菜单按钮全选 / 全不选
function toggleCurrentMenuButtons(checkAll: boolean) {
  for (const btn of currentMenuButtons.value) {
    if (checkAll) {
      selectedMenuIds.value.add(btn.id);
    } else {
      selectedMenuIds.value.delete(btn.id);
    }
  }
}

// 一键仅选菜单 (只读权限模式)
function selectReadOnlyMenus() {
  const menuIds = getAllMenuType0And1Ids(rawMenuTree.value);
  selectedMenuIds.value = new Set(menuIds);
  syncTreeCheckedKeys();
  ElMessage.success('已应用【只读模式】：仅勾选页面菜单，排除所有增删改按钮');
}

// 全选所有
function selectAll() {
  const allIds = getAllNodeIds(rawMenuTree.value);
  selectedMenuIds.value = new Set(allIds);
  syncTreeCheckedKeys();
  ElMessage.success('已全选所有菜单与按钮权限');
}

// 全部清空
function clearAll() {
  selectedMenuIds.value.clear();
  syncTreeCheckedKeys();
}

function syncTreeCheckedKeys() {
  nextTick(() => {
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(Array.from(selectedMenuIds.value));
    }
  });
}

// 打开授权抽屉
async function openAuthDrawer(row: SysRoleVO) {
  currentRole.value = row;
  authDrawerVisible.value = true;
  authLoading.value = true;
  activeMenuNode.value = null;
  selectedMenuIds.value.clear();

  try {
    const [allMenus, checkedMenuIds] = await Promise.all([
      getAllMenuTreeApi(),
      getRoleMenuIdsApi(row.id),
    ]);
    rawMenuTree.value = allMenus || [];
    selectedMenuIds.value = new Set(checkedMenuIds || []);

    // 默认激活第一个 1-菜单 节点
    function findFirstMenu(nodes: any[]): any {
      for (const node of nodes) {
        if (node.menuType === 1) return node;
        if (node.children) {
          const found = findFirstMenu(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    activeMenuNode.value = findFirstMenu(rawMenuTree.value);

    await nextTick();
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(checkedMenuIds || []);
    }
  } finally {
    authLoading.value = false;
  }
}

async function submitAuth() {
  if (!currentRole.value) return;
  authSubmitting.value = true;
  try {
    const allSelectedIds = Array.from(selectedMenuIds.value);
    await saveRoleMenusApi(currentRole.value.id, allSelectedIds);
    ElMessage.success('角色权限配置成功');
    authDrawerVisible.value = false;
  } finally {
    authSubmitting.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 授权抽屉 左右双栏架构样式 */
.auth-drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.auth-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 12px;
}

.toolbar-tips {
  font-size: 12px;
  color: #606266;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.auth-dual-column {
  display: flex;
  gap: 14px;
  flex: 1;
  min-height: 480px;
  overflow: hidden;
}

.column-left {
  width: 350px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.column-right {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.column-header {
  height: 40px;
  padding: 0 14px;
  background-color: #f2f3f5;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.active-menu-name {
  color: #409eff;
}

.tree-wrapper, .buttons-wrapper {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 8px;
  font-size: 13px;
}

.custom-tree-node.is-active {
  color: #409eff;
  font-weight: 600;
}

/* 按钮节点网格卡片样式 */
.buttons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.button-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-card:hover {
  border-color: #b3d8ff;
  background-color: #ecf5ff;
}

.button-card.is-checked {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.button-info {
  display: flex;
  flex-direction: column;
}

.button-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.button-perm {
  font-size: 11px;
  color: #909399;
  font-family: monospace;
}
</style>
