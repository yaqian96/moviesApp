# Emby 媒体库 - Windows 为主、浏览器先验

当前阶段以 **Windows 桌面（Electron）** 为交付目标，开发与排错 **优先用系统浏览器（Chrome / Edge）** 打开 H5 开发服，确认登录、列表、播放（声画字幕）后再开 Electron。

## 开发

### 安装依赖

```bash
npm install
```

### ① 浏览器验证（推荐日常开发）

```bash
npm run dev:h5
```

在终端输出的本地地址打开（与 `vite.config.js` 中 `server.port` 一致，默认 **http://localhost:8080**）。

- 开发环境下会启用 **Vite 代理**：页面请求 `/api/...` 会转发到远端 Emby（见 `vite.config.js` 的 `VITE_EMBY_DEV_PROXY_TARGET`），减轻浏览器 CORS 对 API 与取流的影响。
- 若你的 Emby 不在默认目标上，可在项目根目录新建 `.env.development`（勿提交密钥）：

  ```bash
  VITE_EMBY_DEV_PROXY_TARGET=https://你的-emby-主机
  ```

登录页填写的 **服务器地址** 仍应与该 Emby 一致（协议 + 主机 + 若有子路径 `/emby`），以便 `PlaybackInfo`、取流 URL 与代理目标匹配。

### ② Electron 开发模式（与浏览器共用同一套 H5）

先保持 **①** 的 `dev:h5` 在运行，再执行：

```bash
npm run electron:dev
```

默认加载 `http://localhost:8080`。若你改了 Vite 端口，可设置环境变量 **`VITE_DEV_PORT`** 或 **`UNI_DEV_PORT`** 与之一致。

## 打包

### 打包 Windows 桌面应用

```bash
npm run electron:build
```

打包完成后，安装包会在 `release` 目录下。

## 配置说明

- **应用名称**: Emby媒体库
- **应用ID**: com.emby.mediaclient
- **安装包输出目录**: release
- **支持平台**: Windows x64

## 文件结构

```
├── electron/
│   ├── main.js          # Electron 主进程
│   └── preload.js       # 预加载脚本
├── src/                 # 源代码
├── dist/                # 构建输出
└── release/             # 打包输出（自动生成）
```
