<template>
  <div class="icon-select-container">
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom-start"
      :width="460"
      trigger="click"
      popper-class="icon-select-popper"
    >
      <template #reference>
        <el-input
          :model-value="modelValue"
          :placeholder="placeholder || '点击直接挑选图标'"
          readonly
          clearable
          style="cursor: pointer;"
          @clear="handleClear"
        >
          <template #prefix>
            <el-icon v-if="currentIconComponent" class="selected-prefix-icon">
              <component :is="currentIconComponent" />
            </el-icon>
            <el-icon v-else class="selected-prefix-icon"><Pointer /></el-icon>
          </template>
          <template #suffix>
            <el-button link type="primary" size="small">选择</el-button>
          </template>
        </el-input>
      </template>

      <!-- 搜索与图标网格面板 -->
      <div class="icon-picker-panel">
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="支持中文或英文搜索 (如: 用户 / 设置 / 权限 / 锁 / 文件 / 数据...)"
            prefix-icon="Search"
            clearable
            size="default"
          />
        </div>

        <el-scrollbar max-height="270px" class="icon-list-scrollbar">
          <div v-if="filteredIcons.length > 0" class="icon-grid">
            <div
              v-for="iconName in filteredIcons"
              :key="iconName"
              class="icon-grid-item"
              :class="{ active: modelValue === iconName }"
              :title="getIconTitle(iconName)"
              @click="selectIcon(iconName)"
            >
              <el-icon class="icon-preview">
                <component :is="(ElementPlusIconsVue as any)[iconName]" />
              </el-icon>
              <span class="icon-name">{{ getChineseName(iconName) || iconName }}</span>
            </div>
          </div>
          <el-empty v-else description="未找到匹配的图标" :image-size="60" />
        </el-scrollbar>

        <div class="panel-footer">
          <span class="count-tip">点击图标直接选用 (共 {{ filteredIcons.length }} 个)</span>
          <el-button v-if="modelValue" link type="danger" size="small" @click="handleClear">清空已选</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { Pointer } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const popoverVisible = ref(false);
const searchKeyword = ref('');

// 常用图标的中文名称与搜索同义词映射表
const chineseAliasMap: Record<string, string[]> = {
  User: ['用户', '人员', '成员', '账号', '个人中心'],
  UserFilled: ['用户', '人员头像'],
  Setting: ['设置', '系统设置', '配置', '齿轮'],
  Tools: ['工具', '运维', '管理'],
  Key: ['权限', '钥匙', '密钥', '口令', '授权'],
  Lock: ['安全', '锁定', '密码', '加密'],
  Unlock: ['解锁', '开放'],
  Grid: ['菜单', '网格', '功能列表', '应用中心'],
  Menu: ['菜单', '列表导航'],
  Document: ['文档', '文件', '报表', '合同'],
  DocumentCopy: ['复制文档', '副本'],
  Files: ['多文件', '档案库'],
  Folder: ['文件夹', '目录', '分类'],
  FolderOpened: ['展开目录', '打开文件夹'],
  Tickets: ['日志', '票据', '工单', '发票'],
  Notebook: ['字典', '账本', '笔记本', '手册'],
  Reading: ['手册', '阅读', '字典规范'],
  Odometer: ['控制台', '仪表盘', '总览', '首页'],
  House: ['首页', '主页', '房子'],
  HomeFilled: ['首页', '门户'],
  DataAnalysis: ['数据分析', '统计', '大屏', 'BI'],
  TrendCharts: ['趋势图', '走势图', '折线图'],
  PieChart: ['饼图', '占比分析'],
  Histogram: ['柱状图', '条形图'],
  DataLine: ['折线数据', '统计分析'],
  DataBoard: ['数据看板', '仪表盘'],
  Monitor: ['监控', '大屏', '电脑屏幕'],
  Platform: ['基座', '业务基座', '云平台'],
  Cpu: ['主机', '服务器', '性能', '硬件'],
  Connection: ['连接', '接口', '网络通信'],
  Search: ['搜索', '查找', '查询'],
  Plus: ['新增', '添加', '创建'],
  Edit: ['编辑', '修改', '铅笔'],
  Delete: ['删除', '垃圾桶', '移除'],
  Download: ['导出', '下载'],
  Upload: ['导入', '上传'],
  Refresh: ['刷新', '重置', '更新'],
  Bell: ['通知', '提醒', '铃铛', '消息'],
  ChatDotRound: ['消息', '聊天', '评论', '互动'],
  Message: ['邮件', '站内信', '消息通知'],
  Location: ['定位', '坐标', '地图'],
  MapLocation: ['地图', '测绘', 'GIS定位'],
  Money: ['财务', '金钱', '资产', '资金'],
  Goods: ['商品', '物料', '物资'],
  ShoppingCart: ['采购', '购物车', '订单'],
  Calendar: ['日历', '日程', '考勤'],
  Clock: ['时间', '时钟', '工时', '倒计时'],
  Warning: ['警告', '告警', '异常提醒'],
  SuccessFilled: ['成功', '审核通过'],
  CircleClose: ['关闭', '拒绝', '取消'],
  Star: ['收藏', '重点', '标星'],
  Share: ['分享', '流转', '分发'],
  Rank: ['排序', '上下拖拽'],
  Sort: ['排序', '展开折叠'],
};

// 提取所有可用的 Element Plus 官方图标名称
const allIconNames = Object.keys(ElementPlusIconsVue);

function getChineseName(iconName: string): string {
  const aliases = chineseAliasMap[iconName];
  return aliases && aliases.length > 0 ? aliases[0] : '';
}

function getIconTitle(iconName: string): string {
  const cn = getChineseName(iconName);
  return cn ? `${cn} (${iconName})` : iconName;
}

const filteredIcons = computed(() => {
  if (!searchKeyword.value.trim()) {
    return allIconNames;
  }
  const kw = searchKeyword.value.trim().toLowerCase();
  return allIconNames.filter((name) => {
    // 匹配英文名称
    if (name.toLowerCase().includes(kw)) return true;
    // 匹配中文别名/同义词
    const aliases = chineseAliasMap[name] || [];
    return aliases.some((alias) => alias.toLowerCase().includes(kw));
  });
});

const currentIconComponent = computed(() => {
  if (!props.modelValue) return null;
  const name = props.modelValue.trim();
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
  return (ElementPlusIconsVue as any)[name] || (ElementPlusIconsVue as any)[pascalName] || null;
});

function selectIcon(iconName: string) {
  emit('update:modelValue', iconName);
  popoverVisible.value = false;
  searchKeyword.value = '';
}

function handleClear() {
  emit('update:modelValue', '');
  popoverVisible.value = false;
  searchKeyword.value = '';
}
</script>

<style scoped>
.icon-select-container {
  width: 100%;
}
.selected-prefix-icon {
  font-size: 16px;
  color: #409eff;
}
.icon-picker-panel {
  padding: 4px;
}
.search-box {
  margin-bottom: 12px;
}
.icon-list-scrollbar {
  margin-right: -4px;
  padding-right: 4px;
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.icon-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fafafa;
}
.icon-grid-item:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
  color: #409eff;
  transform: translateY(-2px);
}
.icon-grid-item.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}
.icon-preview {
  font-size: 22px;
  margin-bottom: 4px;
}
.icon-name {
  font-size: 11px;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
.panel-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #f0f2f5;
  padding-top: 8px;
}
</style>
