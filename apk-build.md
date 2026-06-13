# APK 打包指南

> 将「算法与程序实现学习助手」打包为 Android APK 安装包

---

## 前提条件

1. **Node.js**（已安装 ✅ v26.3.0）
2. **Android Studio**（需要安装，包含 Android SDK）
   - 下载地址：https://developer.android.com/studio
   - 安装时勾选「Android SDK」、「Android SDK Platform」、「Android Virtual Device」

---

## 打包步骤

### 1. 构建前端

```bash
cd frontend
npm run build
```

### 2. 初始化 Capacitor Android 项目

项目根目录已配置好 Capacitor，执行：

```bash
cd ..
npx cap add android
```

这会创建 `android/` 目录，包含完整的 Android 原生项目。

### 3. 同步前端构建到 Android 项目

```bash
npx cap sync
```

### 4. 用 Android Studio 打开并打包

```bash
npx cap open android
```

Android Studio 会自动打开项目，然后：

1. 等待 Gradle 同步完成
2. 点击菜单栏 **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. 生成位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 5. 生成签名 APK（发布用）

在 Android Studio 中：

1. **Build → Generate Signed Bundle / APK**
2. 选择 **APK**
3. 创建新的 Key Store 或使用现有
4. 填写信息后点击 Next
5. 选择 **release** 构建变体
6. 点击 **Finish**

生成的 APK 在 `android/app/build/outputs/apk/release/app-release.apk`

---

## 快速打包命令（构建 + 同步）

```bash
npm run cap-build
npx cap open android
```

---

## 常见问题

### Q: npx cap add android 失败？
确保已安装 Android Studio 并配置了 `ANDROID_HOME` 环境变量：
```
ANDROID_HOME=C:\Users\<用户名>\AppData\Local\Android\Sdk
```
将 `%ANDROID_HOME%\platform-tools` 和 `%ANDROID_HOME%\tools` 添加到系统 PATH。

### Q: Gradle 同步失败？
- 确保网络通畅（Gradle 需要下载依赖）
- 建议使用 Android Studio 内置的 Gradle（不要用系统安装的）

### Q: APK 安装到手机后无法连接后端？
- 确保手机和服务器在同一个网络
- 修改 `frontend/src/services/api.js` 中的 baseURL 为服务器实际 IP

---

## 无需 Android Studio 的替代方案

### 方案 A：在线构建（GitHub Actions）
项目配置好 GitHub Actions 工作流后，提交代码即可自动构建 APK。

### 方案 B：Expo 打包（如果兼容 React Native）
当前项目是 Vue 3，不适用。

### 方案 C：PWA（渐进式 Web 应用）
直接在浏览器中安装到桌面，无需打包：
1. 部署前端到 HTTPS 服务器
2. 浏览器会提示「安装应用」
3. 功能略有受限（无法使用原生 API）
