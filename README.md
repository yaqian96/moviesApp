# Emby Media Client

基于 uni-app + Vue 3 构建的 Emby 媒体客户端，支持 H5、微信小程序、Android/iOS App 和 Windows 桌面应用。

## 技术栈

- **框架**: [uni-app](https://uniapp.dcloud.io/) (Vue 3)
- **UI 组件**: [wot-design-uni](https://wot-design-uni.netlify.app/)
- **状态管理**: Pinia
- **HTTP 请求**: Axios
- **样式**: Tailwind CSS + Sass
- **构建工具**: Vite 5
- **桌面应用**: Electron 42

## 环境要求

- Node.js >= 18
- npm >= 9

## 安装

```bash
npm install
```

## 开发

### H5 开发

```bash
npm run dev:h5
```

### 微信小程序开发

```bash
npm run dev:mp-weixin
```

### Electron 桌面应用开发

```bash
npm run electron:dev
```

### 其他平台

| 平台 | 命令 |
|------|------|
| 支付宝小程序 | `npm run dev:mp-alipay` |
| 百度小程序 | `npm run dev:mp-baidu` |
| QQ 小程序 | `npm run dev:mp-qq` |
| 抖音小程序 | `npm run dev:mp-toutiao` |
| 快手小程序 | `npm run dev:mp-kuaishou` |
| 飞书小程序 | `npm run dev:mp-lark` |
| 京东小程序 | `npm run dev:mp-jd` |
| 小红书小程序 | `npm run dev:mp-xhs` |
| 鸿蒙 | `npm run dev:mp-harmony` |

## 构建

### H5 生产构建

```bash
npm run build:h5
```

输出目录: `dist/build/h5/`

### 微信小程序构建

```bash
npm run build:mp-weixin
```

输出目录: `dist/build/mp-weixin/`

### Electron 桌面应用构建 (Windows)

```bash
npm run electron:build
```

输出目录: `dist-electron-new/`

### Android/iOS App 构建

使用 HBuilderX 云打包：
1. 下载 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 导入项目目录
3. 右键项目 → 发行 → 原生 App-云打包
4. 选择平台并打包

## 项目结构

```
├── electron/           # Electron 桌面应用配置
│   ├── main.js         # 主进程
│   └── preload.js      # 预加载脚本
├── scripts/            # 辅助脚本
├── src/
│   ├── api/            # API 接口封装
│   ├── composables/    # 组合式函数
│   ├── config/         # 配置文件
│   ├── pages/          # 页面组件
│   │   ├── home/       # 首页
│   │   ├── login/      # 登录页
│   │   ├── movies/     # 电影库
│   │   ├── tv/         # 电视剧库
│   │   ├── detail/     # 详情页
│   │   ├── play/       # 播放页
│   │   └── search/     # 搜索页
│   ├── stores/         # Pinia 状态管理
│   └── utils/          # 工具函数
── vite.config.js      # Vite 配置
└── package.json        # 项目配置
```

## 配置

### Emby API Key

在 `src/config/emby.js` 中配置：

```javascript
export const EMBY_CONFIG = {
  apiKey: 'your-api-key-here',
}
```

### 跨域处理

- **开发环境**: Vite 代理自动处理跨域
- **生产 H5**: 需配置 Nginx 反向代理
- **桌面应用/小程序**: 无跨域限制

## 相关文档

- [Electron 打包说明](./ELECTRON.md)

## 许可证

MIT
