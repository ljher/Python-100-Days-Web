# Python-100-Days 互动学习平台

> **声明**：本项目参考 [jackfrued/Python-100-Days](https://github.com/jackfrued/Python-100-Days) 编写，课程内容版权归原作者所有。如有任何侵权问题，请联系删除。

---

基于 [Python-100-Days](https://github.com/jackfrued/Python-100-Days) 课程内容构建的在线互动学习平台，支持在线代码编辑、运行和学习进度保存。

## 项目简介

本项目是一个纯前端的 Python 学习平台，将 [jackfrued/Python-100-Days](https://github.com/jackfrued/Python-100-Days) 仓库中的 Markdown 教程内容转换为可交互的网页，用户可以直接在浏览器中阅读教程、编辑和运行代码示例。

### 核心理念

- **内容来源于原项目**：所有课程文字、代码示例、图片均来自 Python-100-Days 仓库
- **增强交互体验**：在原有静态 Markdown 基础上添加代码运行功能
- **零后端依赖**：纯前端方案，无需服务器，可部署到任何静态托管服务

## 功能特性

| 功能 | 说明 |
|------|------|
| 完整课程内容 | 99 个章节，覆盖 Python-100-Days 全部 10 个阶段 |
| 代码块交互 | Python 代码块支持编辑、运行、查看输出 |
| 全屏编辑 | 代码块支持全屏编辑模式 |
| 数学公式 | 支持 LaTeX 数学公式渲染（KaTeX） |
| 图片本地化 | 课程图片复制到本地，支持点击放大 |
| 学习进度 | 使用 localStorage 自动保存学习位置 |
| 章节导航 | 上一章/下一章导航 |
| 响应式设计 | 支持桌面和移动设备 |

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 19 | 用户界面构建 |
| 构建工具 | Vite 7 | 开发服务器和构建 |
| 路由 | React Router DOM | 页面路由管理 |
| Markdown 渲染 | react-markdown | Markdown 转 HTML |
| 代码高亮 | rehype-highlight | 代码语法高亮 |
| 数学公式 | remark-math + rehype-katex | LaTeX 公式渲染 |
| Python 执行 | Pyodide | 浏览器内 Python 解释器 |
| 代码编辑器 | CodeMirror 6 | 代码编辑组件 |
| 样式 | CSS | 无外部 UI 框架 |

## 参考项目

### 1. Python-100-Days（课程内容来源）

- **项目地址**：https://github.com/jackfrued/Python-100-Days
- **作者**：jackfrued（骆昊）
- **Star 数**：184k+
- **内容**：Python 100 天从新手到大师学习计划
- **使用方式**：
  - 克隆仓库到本地 `.python-100-days-source` 目录
  - 使用脚本提取 Markdown 内容和图片
  - 保留原始文字讲解、代码示例、图片

### 2. Pyodide（Python 执行引擎）

- **项目地址**：https://github.com/pyodide/pyodide
- **官网**：https://pyodide.org/
- **说明**：在浏览器中运行 Python 的 WebAssembly 发行版
- **使用方式**：
  - 通过 CDN 加载：`https://cdn.jsdelivr.net/pyodide/v0.25.1/full/`
  - 在浏览器中直接执行 Python 代码
  - 支持大部分 Python 标准库和科学计算包

### 3. KaTeX（数学公式渲染）

- **项目地址**：https://github.com/KaTeX/KaTeX
- **官网**：https://katex.org/
- **说明**：快速的数学公式渲染库
- **使用方式**：
  - 通过 remark-math 和 rehype-katex 插件集成
  - 支持行内公式 `$...$` 和块级公式 `$$...$$`

### 4. CodeMirror（代码编辑器）

- **项目地址**：https://github.com/codemirror/dev
- **官网**：https://codemirror.net/
- **说明**：现代化的代码编辑器
- **使用方式**：
  - 使用 CodeMirror 6 版本
  - 支持 Python 语法高亮
  - 支持暗色主题

## 项目结构

```
Python-100-Days-Web/
├── .python-100-days-source/    # Python-100-Days 仓库（本地，不提交）
├── public/
│   └── images/                 # 课程图片（本地化，不提交）
├── scripts/
│   ├── fetch_local_content.py  # 从本地仓库提取内容
│   └── fetch_content.py        # 从 GitHub API 提取内容
├── src/
│   ├── components/
│   │   ├── ChapterPage.jsx     # 章节页面
│   │   ├── HomePage.jsx        # 首页（含学习进度）
│   │   ├── Layout.jsx          # 布局组件
│   │   ├── MarkdownRenderer.jsx # Markdown 渲染（含代码交互）
│   │   └── NavigationTree.jsx  # 侧边导航树
│   ├── context/
│   │   └── PyodideContext.jsx  # Pyodide 共享上下文
│   ├── data/
│   │   └── courseData.js       # 课程数据（自动生成）
│   ├── utils/
│   │   └── progressStorage.js  # 学习进度存储工具
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

## 快速开始

### 环境要求

- Node.js 16+
- npm 8+
- Python 3.8+（用于内容生成脚本）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/ljher/Python-100-Days-Web.git
   cd Python-100-Days-Web
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **获取课程内容**
   
   方式一：从本地仓库提取（推荐）
   ```bash
   # 克隆 Python-100-Days 仓库
   git clone https://github.com/jackfrued/Python-100-Days.git .python-100-days-source
   
   # 运行内容提取脚本
   python scripts/fetch_local_content.py
   ```
   
   方式二：从 GitHub API 提取
   ```bash
   python scripts/fetch_content.py
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 `http://localhost:5173`

### 构建和部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建产物在 `dist/` 目录，可部署到：
- GitHub Pages
- Vercel
- Netlify
- 任何静态托管服务

## 内容生成脚本说明

### `scripts/fetch_local_content.py`

从本地克隆的 Python-100-Days 仓库提取内容。

**功能**：
- 读取本地 `.python-100-days-source` 目录中的 Markdown 文件
- 提取完整的文字讲解内容
- 复制图片到 `public/images/` 目录
- 转换图片路径为本地路径
- 生成 `src/data/courseData.js` 文件

**使用**：
```bash
python scripts/fetch_local_content.py
```

### `scripts/fetch_content.py`

从 GitHub API 提取内容（需要网络连接）。

**功能**：
- 通过 GitHub API 获取 Markdown 文件
- 转换图片路径为 GitHub raw URL
- 生成 `src/data/courseData.js` 文件

**使用**：
```bash
python scripts/fetch_content.py
```

## 学习进度保存

### 存储方式

使用浏览器 `localStorage` 保存学习进度。

### 保存内容

```javascript
{
  completedChapters: ["day01", "day02"],  // 已完成章节
  currentChapter: "day03",                // 当前学习位置
  lastVisitTime: "2026-07-28T15:30:00Z",  // 最后访问时间
  chapterProgress: {}                     // 各章节详细进度
}
```

### 触发条件

- **访问章节**：自动保存 `currentChapter`
- **标记完成**：用户可手动标记章节为已完成

### 下次打开

- 首页显示学习进度条
- 显示"继续学习"按钮，跳转到上次位置

## 代码块交互功能

### 功能说明

每个 Python 代码块都支持以下操作：

| 按钮 | 功能 |
|------|------|
| 编辑 | 切换编辑模式，修改代码 |
| 全屏 | 进入全屏编辑模式 |
| 运行 | 执行 Python 代码 |
| 复制 | 复制代码到剪贴板 |
| 重置 | 恢复原始代码 |

### 工作原理

1. 页面加载时，PyodideProvider 开始加载 Pyodide
2. 所有代码块共享同一个 Pyodide 实例
3. 用户点击"运行"按钮，代码发送到 Pyodide 执行
4. 执行结果（stdout）显示在代码块下方

### 全屏编辑模式

- 深色主题（类似 VS Code）
- 字体更大（16px）
- 编辑区域占满整个屏幕
- 输出区域在底部
- 点击"退出全屏"按钮返回

## 常见问题

### Q: Pyodide 加载失败怎么办？

A: 
1. 检查网络连接，确保可以访问 CDN
2. 如果在中国大陆，可能需要配置代理或使用镜像
3. 检查浏览器控制台是否有具体错误信息

### Q: 图片不显示怎么办？

A: 
1. 确保已运行 `python scripts/fetch_local_content.py`
2. 检查 `public/images/` 目录是否存在图片
3. 清除浏览器缓存后重试

### Q: 如何添加新的课程章节？

A: 
1. 将 Markdown 文件放入对应的 `.python-100-days-source` 子目录
2. 在 `scripts/fetch_local_content.py` 中添加章节配置
3. 运行 `python scripts/fetch_local_content.py` 重新生成数据

## 版权说明

本项目参考 [jackfrued/Python-100-Days](https://github.com/jackfrued/Python-100-Days) 编写，课程内容（文字、代码示例、图片等）版权归原作者所有。

本项目仅供个人学习使用，如有侵权请联系删除。

## 致谢

- [Python-100-Days](https://github.com/jackfrued/Python-100-Days) - 原始课程内容（作者：jackfrued，184k+ Star）
- [Pyodide](https://pyodide.org/) - 浏览器内 Python 执行引擎
- [KaTeX](https://katex.org/) - 数学公式渲染
- [CodeMirror](https://codemirror.net/) - 代码编辑器
- [React](https://react.dev/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
