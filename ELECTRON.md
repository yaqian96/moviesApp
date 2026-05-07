# Emby 媒体库 - Windows 桌面应用

使用 Electron 打包的 Windows 桌面应用。

## 开发

### 安装依赖

```bash
npm install
```

### 运行开发环境

```bash
npm run dev:h5
```

### 运行 Electron 开发模式

```bash
npm run electron:dev
```

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
