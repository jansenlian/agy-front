<template>
  <div class="app-container">
    <el-card shadow="never" class="tool-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">📐 AutoCAD (DWG/DXF) 空间数据解析与矢量提取</span>
            <el-tag type="success" effect="light" class="tag">agy-geo 驱动</el-tag>
          </div>
          <div class="header-right">
            <el-button v-if="geoJsonResult" type="primary" link @click="downloadGeoJson">
              📥 导出 GeoJSON
            </el-button>
          </div>
        </div>
      </template>

      <!-- 文件上传与解析配置 -->
      <div class="upload-section">
        <el-upload
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          accept=".dwg,.dxf"
          :disabled="loading"
          :on-change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将 AutoCAD <strong>.dwg</strong> 或 <strong>.dxf</strong> 文件拖到此处，或 <em>点击选取文件</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 AutoCAD 2000 ~ 2024 版本 DWG 图纸，自动触发 JTS 空间拓扑构面与文字注记挂接
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 解析控制与参数 -->
      <div v-if="selectedFile" class="options-bar">
        <el-form inline :model="parseOptions" class="opt-form">
          <el-form-item label="当前选定:">
            <el-tag type="info">{{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)</el-tag>
          </el-form-item>
          <el-form-item label="自动拓扑构面:">
            <el-switch v-model="parseOptions.polygonize" />
          </el-form-item>
          <el-form-item label="挂接地块注记:">
            <el-switch v-model="parseOptions.matchAttributes" />
          </el-form-item>
          <el-form-item label="过滤最小面积(㎡):">
            <el-input-number v-model="parseOptions.minAreaThreshold" :min="0" :step="0.1" :precision="2" size="small" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="doParseCad">
              🚀 开始空间矢量解析
            </el-button>
            <el-button :loading="loading" @click="doDetectLayers">
              🔍 仅探测图层
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 解析结果展示 -->
      <div v-if="layerStats.length > 0 || geoJsonResult" class="result-section">
        <el-divider content-position="left">📋 图纸图层与空间图斑解析成果</el-divider>

        <el-row :gutter="16" style="margin-bottom: 16px">
          <el-col :span="6">
            <el-statistic title="图层总数" :value="layerStats.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="提取图元总数" :value="totalEntityCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="构面矢量图斑数" :value="geoJsonFeatureCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="后端处理耗时" :value="costTime" suffix="ms" />
          </el-col>
        </el-row>

        <el-tabs v-model="activeTab" type="border-card">
          <!-- 图层统计 -->
          <el-tab-pane label="图层分布统计" name="layers">
            <el-table :data="layerStats" border stripe style="width: 100%">
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="layerName" label="图层名称" min-width="140" />
              <el-table-column prop="lineCount" label="线段数 (LINE)" width="130" align="center" />
              <el-table-column prop="polylineCount" label="多段线数 (LWPOLYLINE)" width="180" align="center" />
              <el-table-column prop="textCount" label="文字注记 (TEXT/MTEXT)" width="180" align="center" />
              <el-table-column prop="totalEntityCount" label="图元总数" width="130" align="center">
                <template #default="{ row }">
                  <el-tag type="primary">{{ row.totalEntityCount }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- GeoJSON 预览 -->
          <el-tab-pane v-if="geoJsonResult" label="GeoJSON 矢量预览" name="geojson">
            <div class="geojson-preview">
              <pre>{{ JSON.stringify(geoJsonResult, null, 2) }}</pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, type UploadFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getCadLayers, parseCadToGeoJson, type CadLayerStat } from '@/api/modules/cadApi';

const loading = ref(false);
const selectedFile = ref<File | null>(null);
const activeTab = ref('layers');
const layerStats = ref<CadLayerStat[]>([]);
const geoJsonResult = ref<any>(null);
const costTime = ref(0);

const parseOptions = ref({
  polygonize: true,
  matchAttributes: true,
  minAreaThreshold: 0.01,
});

const totalEntityCount = computed(() => {
  return layerStats.value.reduce((acc, cur) => acc + (cur.totalEntityCount || 0), 0);
});

const geoJsonFeatureCount = computed(() => {
  if (geoJsonResult.value && geoJsonResult.value.features) {
    return geoJsonResult.value.features.length;
  }
  return 0;
});

function handleFileChange(uploadFile: UploadFile) {
  if (!uploadFile.name.toLowerCase().endsWith('.dwg') && !uploadFile.name.toLowerCase().endsWith('.dxf')) {
    ElMessage.error('仅支持上传 .dwg 或 .dxf 格式的 CAD 图纸文件！');
    return;
  }
  if (uploadFile.raw) {
    selectedFile.value = uploadFile.raw;
    layerStats.value = [];
    geoJsonResult.value = null;
    ElMessage.success(`已选定文件: ${uploadFile.name}，请点击「开始空间矢量解析」`);
  }
}

async function doDetectLayers() {
  if (!selectedFile.value) return;
  loading.value = true;
  const startTime = Date.now();
  try {
    const res = await getCadLayers(selectedFile.value);
    layerStats.value = (res as any)?.data || (res as any) || [];
    costTime.value = Date.now() - startTime;
    activeTab.value = 'layers';
    ElMessage.success(`图层探测完成，共检测到 ${layerStats.value.length} 个图层`);
  } catch (err: any) {
    ElMessage.error(err.message || '图层探测失败，请检查图纸格式或后端服务');
  } finally {
    loading.value = false;
  }
}

async function doParseCad() {
  if (!selectedFile.value) return;
  loading.value = true;
  const startTime = Date.now();
  try {
    const res = await parseCadToGeoJson(selectedFile.value, parseOptions.value);
    const data = (res as any)?.data || (res as any);
    geoJsonResult.value = data;
    costTime.value = Date.now() - startTime;

    // 尝试同步刷新图层统计
    if (layerStats.value.length === 0) {
      try {
        const layerRes = await getCadLayers(selectedFile.value);
        layerStats.value = (layerRes as any)?.data || (layerRes as any) || [];
      } catch (e) {
        // ignore
      }
    }

    activeTab.value = 'geojson';
    ElMessage.success(`解析完成！成功生成 ${geoJsonFeatureCount.value} 个矢量要素`);
  } catch (err: any) {
    ElMessage.error(err.message || 'CAD 空间数据解析失败，请检查图纸完整性');
  } finally {
    loading.value = false;
  }
}

function downloadGeoJson() {
  if (!geoJsonResult.value) return;
  const blob = new Blob([JSON.stringify(geoJsonResult.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedFile.value?.name || 'cad'}_features.geojson`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success('GeoJSON 文件已开始下载！');
}
</script>

<style scoped>
.app-container {
  padding: 16px;
}
.tool-card {
  border-radius: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title {
  font-size: 16px;
  font-weight: bold;
}
.upload-section {
  max-width: 650px;
  margin: 16px auto;
}
.options-bar {
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: 6px;
  margin: 16px 0;
  border: 1px dashed #cbd5e1;
}
.opt-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.result-section {
  margin-top: 24px;
}
.geojson-preview {
  max-height: 450px;
  overflow-y: auto;
  background: #1e293b;
  color: #38bdf8;
  padding: 16px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
}
</style>
