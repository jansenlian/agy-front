<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>🛠️ 工具服务状态</template>
          <div class="card-value">运行正常 (Port 5102)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>☕ 后端微服务</template>
          <div class="card-value">Spring Boot (Port 9202)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>📦 空间引擎</template>
          <div class="card-value">agy-geo (JTS / LibreDWG)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>📐 前端应用架构</template>
          <div class="card-value">Vue 3.5 + Vite 6</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷功能入口 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="feature-card" @click="router.push('/dwg')">
          <div class="feature-content">
            <div class="feature-icon">📐</div>
            <div class="feature-detail">
              <div class="feature-title">AutoCAD DWG/DXF 空间数据解析</div>
              <div class="feature-desc">上传 DWG/DXF 图纸，自动触发 JTS 空间拓扑构面、文字注记属性挂接与 GeoJSON 导出。</div>
              <el-button type="primary" size="small" style="margin-top: 10px">立即前往体验 ➔</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="feature-card" @click="router.push('/crypto')">
          <div class="feature-content">
            <div class="feature-icon">🔐</div>
            <div class="feature-detail">
              <div class="feature-title">国密与通用加解密工具</div>
              <div class="feature-desc">支持 SM2/SM3/SM4 国密标准与 RSA/AES/MD5 常用加解密、签名与验签调试。</div>
              <el-button type="success" size="small" style="margin-top: 10px">立即前往体验 ➔</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="info-card">
      <template #header>
        <span>🛠️ 欢迎进入 AGY 工具集成系统</span>
      </template>
      <p>当前系统为实用开发与工程工具前端，内置<strong>DWG 图纸解析、国密与通用加解密、AI 智能体对话以及系统管理（用户/角色/菜单/字典/日志）全套能力</strong>。您可以在左侧菜单访问工具功能与系统管理模块。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-value {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}
.feature-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #409eff;
}
.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.feature-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.feature-icon {
  font-size: 36px;
}
.feature-title {
  font-size: 16px;
  font-weight: bold;
  color: #1e293b;
}
.feature-desc {
  font-size: 13px;
  color: #64748b;
  margin-top: 6px;
  line-height: 1.5;
}
.info-card {
  margin-top: 10px;
}
</style>
