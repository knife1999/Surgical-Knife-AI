# Surgical-Knife-AI（手术刀AI）操作文档

本仓库是一个基于 `Bolt UXP + Vue + TypeScript + Vite` 的 Adobe Photoshop UXP 插件项目，插件名为“手术刀AI”。

当前代码上下文（来自仓库配置）：
- 插件 ID：`com.bolt.uxp`
- 插件名称：`手术刀AI`
- 目标宿主：Photoshop（`minVersion: 24.2.0`）
- Manifest 版本：`6`
- 主面板：`com.bolt.uxp.main`
- Webview UI：已启用（`webviewUi: true`）

## 1. 项目结构

```text
.
├─ src/                     # UXP 主上下文代码（宿主 API、图像处理、文件存储）
│  ├─ api/photoshop.ts      # 核心能力：单图、批处理、分区、提示词库、Key 管理
│  ├─ api/uxp.ts            # UXP 通用能力（面板、主题、外链）
│  └─ webview-setup-host.ts # UXP <-> Webview 通信桥
├─ webview-ui/              # Webview 前端界面（多标签页）
│  └─ src/main-webview.vue  # 主界面入口
├─ public/                  # 插件静态资源（图标等）
├─ dist/                    # `npm run build` 产物（UDT 加载目录）
├─ ccx/                     # `npm run ccx` 打包产物
└─ zip/                     # `npm run zip` 压缩产物
```

## 2. 环境要求

- Node.js 18 及以上
- npm（或 yarn/pnpm）
- Adobe Photoshop（支持 UXP）
- Adobe UXP Developer Tool（UDT）

## 3. 安装依赖

在仓库根目录执行：

```bash
npm install
```

Webview 子项目依赖（首次必做）：

```bash
cd webview-ui
npm install
cd ..
```

## 4. 本地开发流程

### 4.1 构建一次基础产物

```bash
npm run build
```

会生成 `dist/manifest.json` 及插件资源。

### 4.2 在 UDT 中加载插件

1. 打开 Adobe UXP Developer Tool。
2. 点击 `Add Plugin`。
3. 选择本项目的 `dist/manifest.json`。
4. 在 UDT 里点击 `Load`/`Debug` 启动插件。

### 4.3 开发模式

```bash
npm run dev
```

说明：
- 根项目 `dev` 是 `vite build --watch`，会持续构建并触发热更新端口。
- 若修改了 `webview-ui` 代码，需在 `webview-ui` 目录重新执行 `npm run build` 生成到 `public/webview-ui`（默认是单独构建流程）。

## 5. 打包与发布

### 5.1 生成 CCX 包

```bash
npm run ccx
```

产物示例：
- `ccx/com.bolt.uxp_PS.zip`
- `ccx/com.bolt.uxp_PS/*`

### 5.2 生成 ZIP 分发包

```bash
npm run zip
```

会将 CCX 与 `public-zip/*` 设定资源打包到 `zip/`（若配置有对应文件）。

## 6. 插件功能操作说明

插件主界面标签（以当前实现为准）：

1. 单图处理  
对当前选区/文档执行一次 AI 生成并回贴；支持分辨率、批量数、超时、图层类型、抗截断模式等参数。

2. 批处理  
把单图任务加入队列后统一执行；可查看任务列表、批量运行、统计成功/失败。

3. 与AI对话  
支持文本与图片对话，支持模型拉取与切换；兼容 OpenAI/Gemini 风格接口（由 Base URL 自动匹配路径协议）。

4. 提示词查询  
支持搜索、收藏、使用/追加提示词；支持本地提示词与远程提示词库同步。

5. 提示词新增  
维护本地提示词条目（名称、内容、分类、标签、描述）。

6. 设置  
管理“生图 API Key”与“AI 对话 Key”，以及全局参数、主题、日志等。

## 7. 配置与存储说明

### 7.1 Manifest 与权限

在 `uxp.config.ts` 中定义：
- 网络白名单域名（如 `ai.ajiai.top`、`ai.comfly.chat`、`library.ai.pachouli.kiclover.com`）
- 本地文件权限（`localFileSystem: fullAccess`）
- Webview 通信权限（`enableMessageBridge` 等）

### 7.2 本地数据存储

提示词与 Key 等数据由 UXP 数据目录维护，核心文件名：
- `prompt-create/prompt-create.json`

内部主要字段：
- `apiKeys`：生图 Key 列表
- `aiChatApiKeys`：对话 Key 列表
- `items`：提示词条目（本地+远端同步结果）

### 7.3 远程提示词库

代码默认使用：
- `https://library.ai.pachouli.kiclover.com/public/list`

用于拉取远端提示词并合并到本地存储（可通过配置跳过远程同步）。

## 8. 常见问题

1. UDT 加载失败  
先执行 `npm run build`，确认 `dist/manifest.json` 存在后再加载。

2. 修改了 Webview 界面但插件没变化  
请在 `webview-ui` 目录重新执行 `npm run build`，确认 `public/webview-ui` 已更新。

3. 调用接口报错/额度异常  
先检查设置页 Key、Base URL、模型配置，再看页面底部日志。

4. 插件可见但功能不可用  
确认 Photoshop 版本满足最低要求（24.2.0+），且当前文档/选区状态有效。

## 9. 常用命令速查

```bash
# 根项目
npm run build      # 构建 dist
npm run dev        # watch 开发构建
npm run ccx        # 生成 ccx 包
npm run zip        # 生成 zip 包

# webview 子项目
cd webview-ui
npm run build      # 输出到 ../public/webview-ui
```

