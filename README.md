# AGY 大前端集成系统 (agy-front)

企业级全栈智能门户大前端，基于 Vue 3 + Vite + TypeScript + Element Plus 构建，与 AGY 后端微服务矩阵无缝协同。

---

## 🚀 技术栈

- **框架**: Vue 3.4+ (Composition API + `<script setup>`)
- **构建工具**: Vite 5.x + unplugin-auto-import + unplugin-vue-components
- **开发语言**: TypeScript 5.x
- **UI 组件库**: Element Plus + `@element-plus/icons-vue`
- **状态管理**: Pinia + 持久化插件
- **路由管理**: Vue Router 4.x (支持基于后端 RBAC 动态路由注入)
- **网络请求**: Axios (集成 RSA 密码加密、MDC TraceId 穿透、双 Token 静默刷新)
- **图标系统**: `vite-plugin-svg-icons` (本地 SVG 矢量图标高保真渲染)

---

## 📦 本地快速启动

### 1. 安装依赖

推荐使用 `pnpm` 包管理器：

```bash
pnpm install
```

### 2. 启动本地开发服务

```bash
pnpm dev
```

启动后访问本地地址：`http://localhost:5102`

### 3. 生产环境构建

```bash
pnpm build
```

---

## 🌟 核心功能特性

1. **统一安全登录与鉴权**: 登录时前端通过 RSA 公钥自动加密密码传输，全链路无明文。
2. **无感静默双 Token 机制**: Access Token (2h) + Refresh Token (7d)，401 自动排队静默重放，告别频繁掉线。
3. **AI 智能体交互助手**: 支持 LangChain4j / DeepSeek SSE 实时流式打字机渲染与多轮会话记忆。
4. **CAD / GIS 空间数据可视化**: 集成 DWG 矢量图纸转换、图斑统计与空间数据分析视图。
5. **系统管理与权限中心**: 包含用户管理、角色分配、动态菜单权限树、数据字典管理及全链路操作审计日志。
