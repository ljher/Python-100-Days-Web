# Tab 键支持功能更新

## 更新概述

在代码编辑器中添加了 Tab 键支持，允许用户使用 Tab 键进行代码缩进。

## 版本信息

- **版本号**：1.0.2
- **提交信息**：v1.0.2: Add Tab key support for code editing
- **更新时间**：2026年7月29日

## 功能特性

### 1. Tab 键输入
- 按下 Tab 键插入制表符
- 光标自动移动到制表符之后
- 代码自动更新

### 2. Shift+Tab 减少缩进
- 按下 Shift+Tab 减少当前行的缩进
- 支持移除制表符（`\t`）
- 支持移除4个空格

### 3. 智能缩进
- 自动检测行首的缩进字符
- 保持代码格式一致性

## 使用方法

### 增加缩进
1. 将光标放在需要缩进的位置
2. 按下 Tab 键
3. 代码自动增加一级缩进

### 减少缩进
1. 将光标放在需要减少缩进的行
2. 按下 Shift+Tab 组合键
3. 代码自动减少一级缩进

## 技术实现

### 事件处理
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    
    if (e.shiftKey) {
      // Shift+Tab: 减少缩进
      // 检测行首的制表符或空格
      // 移除缩进字符
    } else {
      // Tab: 增加缩进
      // 插入制表符
    }
  }
};
```

### 光标位置管理
- 使用 `selectionStart` 和 `selectionEnd` 获取光标位置
- 使用 `setTimeout` 更新光标位置
- 确保光标位置正确

## 修改的文件

### `src/components/MarkdownRenderer.jsx`
1. **添加 `handleKeyDown` 函数**
   - 处理 Tab 键事件
   - 支持 Tab 和 Shift+Tab
   - 管理光标位置

2. **更新 textarea 元素**
   - 普通编辑模式：添加 `onKeyDown={handleKeyDown}`
   - 全屏编辑模式：添加 `onKeyDown={handleKeyDown}`

### 新增文件
- `TAB_SUPPORT.md` - 功能说明文档
- `test_tab.py` - 测试文件

## 测试步骤

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **进入编辑模式**
   - 找到一个 Python 代码块
   - 点击"编辑"按钮

3. **测试 Tab 键**
   - 在代码行首按下 Tab 键
   - 观察代码增加缩进
   - 检查光标位置

4. **测试 Shift+Tab**
   - 在有缩进的行按下 Shift+Tab
   - 观察代码减少缩进
   - 检查光标位置

## 使用场景

### 1. 代码缩进
```python
def function():
    if condition:
        # 这里可以使用 Tab 键缩进
        code_here()
```

### 2. 嵌套结构
```python
for i in range(10):
    if i % 2 == 0:
        # 二级缩进
        print(i)
```

### 3. 函数定义
```python
def calculate_bmi(height, weight):
    # 函数体缩进
    bmi = weight / (height / 100) ** 2
    return bmi
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Tab | 增加缩进 |
| Shift+Tab | 减少缩进 |
| Enter | 换行（保持缩进级别）* |

*注：Enter 键的自动缩进功能可能需要额外实现

## 兼容性

### 浏览器支持
- 所有现代浏览器都支持
- 移动端浏览器也支持

### 键盘布局
- 支持不同键盘布局
- 支持不同操作系统

## 注意事项

1. **制表符宽度**：默认4个字符宽度
2. **混合缩进**：避免混合使用制表符和空格
3. **代码风格**：遵循项目的代码风格指南
4. **撤销操作**：可以使用 Ctrl+Z 撤销缩进操作

## 已知限制

1. **多光标编辑**：不支持多光标同时编辑
2. **块选择**：不支持块选择编辑
3. **自动缩进**：Enter 键的自动缩进可能需要额外配置

## 后续改进

### 1. 自动缩进
- 按下 Enter 键时自动保持缩进级别
- 根据上下文智能缩进

### 2. 代码格式化
- 自动格式化选中的代码
- 支持 PEP 8 格式化

### 3. 智能缩进
- 根据语法自动调整缩进
- 支持括号匹配缩进

## 总结

Tab 键支持功能已成功实现并推送到 GitHub。该功能：

1. **易于使用**：标准的 Tab/Shift+Tab 操作
2. **智能处理**：自动检测和移除缩进字符
3. **兼容性好**：支持所有现代浏览器
4. **性能良好**：实时响应键盘事件

该功能增强了代码编辑体验，特别适合 Python 等对缩进敏感的语言。

## 推送状态

- ✅ 本地提交成功
- ✅ 推送到 GitHub 成功
- ✅ 版本号更新到 1.0.2
- ✅ GitHub Pages 将自动重新部署

## 访问地址

- **GitHub 仓库**：https://github.com/ljher/Python-100-Days-Web
- **在线访问**：https://ljher.github.io/Python-100-Days-Web/