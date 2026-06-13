# 算法与程序实现学习助手

高中信息技术必修1 第二章《算法与程序实现》学习 APP

## 快速开始

### 电脑端运行

```bash
# 启动后端（提供 API + 前端页面）
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

浏览器打开 http://localhost:8000

### 手机端访问

确保手机和电脑在同一 Wi-Fi 网络下，访问 `http://[电脑IP]:8000`

> 手机浏览器可以「添加到主屏幕」，像原生 App 一样使用

### 打包 APK

#### 方法一：GitHub Actions（推荐）

1. 推送到 GitHub:
   ```bash
   git add .
   git commit -m "初始化"
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 在 GitHub 仓库页面点击 **Actions** → 选择 **Build Android APK** → **Run workflow**
3. 构建完成后，在 Action 页面下载 `algorithm-learner-apk` 工件

#### 方法二：本地打包

需要安装 Android Studio，详见 `apk-build.md`

## 功能

- 📖 **章节学习** — 8个课时，包含知识点和习题
- 🤖 **双智能体** — 「引航」学习引导 + 「辅智」答疑辅导（基于 DeepSeek AI）
- 💬 **班级留言板** — 发布、点赞、回复
- 👤 **个人中心** — 学习统计、成就徽章、错题本
- 📱 **PWA 支持** — 可安装到手机桌面

## 技术栈

- **前端**: Vue 3 + Vite + Vue Router + Pinia
- **后端**: FastAPI + SQLAlchemy + SQLite
- **AI**: DeepSeek API（可回退到本地知识库）
- **打包**: Capacitor + Android
