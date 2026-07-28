# 部署指南

## 快速部署

### 方法一：GitHub Pages

1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到GitHub Pages**
   ```bash
   npm run deploy:github
   ```

3. **访问应用**
   部署完成后，访问 `https://<username>.github.io/<repository-name>`

### 方法二：Vercel

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署到Vercel**
   ```bash
   npm run deploy:vercel
   ```

3. **访问应用**
   部署完成后，Vercel会提供访问链接

### 方法三：一键部署

```bash
# 执行所有步骤
npm run deploy:all

# 或使用部署脚本
./deploy.sh all
```

## 详细步骤

### 1. 生成课程内容

```bash
npm run generate-content
```

### 2. 构建项目

```bash
npm run build
```

### 3. 部署到GitHub Pages

```bash
# 安装gh-pages
npm install -g gh-pages

# 部署
npm run deploy:github
```

### 4. 部署到Vercel

```bash
# 登录Vercel
vercel login

# 部署
npm run deploy:vercel
```

## 环境变量配置

### GitHub Pages

在GitHub仓库设置中：
1. 进入 Settings > Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 "gh-pages"
4. 文件夹选择 "/ (root)"

### Vercel

Vercel会自动检测项目类型，无需额外配置。

## 自定义域名

### GitHub Pages

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名，例如：`learning.example.com`
3. 在DNS设置中添加CNAME记录指向 `<username>.github.io`

### Vercel

1. 在Vercel项目设置中
2. 进入 "Domains"
3. 添加你的域名
4. 按照提示配置DNS记录

## 故障排除

### 构建失败

1. 检查Node.js版本
   ```bash
   node --version
   ```
   确保版本 >= 16.0.0

2. 清理缓存
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### 部署失败

1. 检查网络连接
2. 确认GitHub/Vercel账户权限
3. 检查仓库设置

### 页面空白

1. 检查浏览器控制台错误
2. 确认所有依赖已安装
3. 检查构建输出目录

## 性能优化

### 代码分割

使用React.lazy进行代码分割：

```javascript
const ChapterPage = React.lazy(() => import('./components/ChapterPage'));
```

### 缓存策略

1. **静态资源缓存**
   Vite默认为静态资源添加哈希值

2. **Pyodide缓存**
   Pyodide会在浏览器中缓存Python标准库

### 图片优化

1. 使用WebP格式
2. 实现图片懒加载
3. 压缩图片大小

## 监控和分析

### 性能监控

1. 使用Lighthouse进行性能测试
2. 监控页面加载时间
3. 分析用户行为

### 错误监控

1. 使用Sentry进行错误监控
2. 设置错误报警
3. 分析错误趋势

## 安全考虑

### HTTPS

确保使用HTTPS协议：
- GitHub Pages自动提供HTTPS
- Vercel自动提供HTTPS

### 内容安全策略

在 `index.html` 中添加CSP头部：

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'">
```

## 备份和恢复

### 备份

1. 使用Git进行版本控制
2. 定期备份数据库（如果有）
3. 备份配置文件

### 恢复

1. 从Git恢复代码
2. 重新生成内容数据
3. 重新部署应用

## 更新流程

### 代码更新

1. 拉取最新代码
   ```bash
   git pull origin main
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 重新构建
   ```bash
   npm run build
   ```

4. 重新部署
   ```bash
   npm run deploy:github
   # 或
   npm run deploy:vercel
   ```

### 内容更新

1. 生成新内容
   ```bash
   npm run generate-content
   ```

2. 重新构建和部署

## 多环境部署

### 开发环境

```bash
npm run dev
```

### 测试环境

```bash
# 构建测试版本
npm run build

# 本地预览
npm run preview
```

### 生产环境

```bash
# 构建生产版本
npm run build

# 部署到生产环境
npm run deploy:github
# 或
npm run deploy:vercel
```

## 自动化部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Vercel自动部署

Vercel会自动检测GitHub仓库变更并部署。

## 联系支持

遇到问题？

1. 查看GitHub Issues
2. 查看Vercel文档
3. 联系项目维护者

## 许可证

MIT License