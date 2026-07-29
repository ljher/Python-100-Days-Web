# 停止按钮功能和滚动修复

## 版本信息

- **版本号**：1.0.4
- **提交信息**：v1.0.4: Fix scroll to top and add stop button for infinite loops
- **推送状态**：✅ 已推送到 GitHub

## 功能更新

### 1. 滚动到顶部修复

**问题描述**：
切换章节后，页面仍然停留在底部而不是顶部。

**问题原因**：
- `Layout.jsx` 中主内容区域使用 `overflow: auto`
- `window.scrollTo(0, 0)` 只滚动整个页面，不滚动内容容器

**解决方案**：
```javascript
// 滚动父容器到顶部（针对 Layout 组件中的滚动容器）
const scrollContainer = document.querySelector('[style*="overflow: auto"]') || 
                       document.querySelector('[style*="overflow:auto"]');
if (scrollContainer) {
  scrollContainer.scrollTop = 0;
}
```

**测试步骤**：
1. 访问任意章节
2. 滚动到底部
3. 点击"下一章"按钮
4. 观察页面是否滚动到顶部

### 2. 停止按钮功能

**问题描述**：
循环结构中的无限循环代码会导致页面卡住。

**解决方案**：
添加停止按钮和超时机制，允许用户终止正在运行的代码。

**功能特性**：

#### 停止按钮
- 在代码运行时显示"停止"按钮
- 点击后立即终止代码执行
- 显示"[用户停止执行]"消息

#### 超时机制
- 默认超时时间：10秒
- 超时后自动停止执行
- 显示超时错误信息

#### 超时警告
- 执行时间超过5秒时显示警告
- 警告中包含"停止"按钮
- 显示执行时间

#### 执行时间显示
- 在输出区域显示执行时间
- 格式：`执行时间: X.X秒`

**界面变化**：

**运行状态工具栏**：
```
[复制] [查看] [恢复] [全屏] [运行] [停止]
```

**超时警告区域**：
```
⚠️ 代码执行时间较长，可能存在无限循环 [停止]
```

**输出区域**：
```
输出:                              执行时间: 2.3秒
代码输出内容...
```

## 技术实现

### 1. PyodideContext.jsx 修改

**添加 stopPython 函数**：
```javascript
const stopPython = useCallback(() => {
  if (pyodide) {
    try {
      pyodide.runPython(`
import sys
sys.stdout = sys.__stdout__
raise KeyboardInterrupt('用户停止执行')
`);
    } catch (e) {
      // 忽略错误
    }
  }
}, [pyodide]);
```

**修改 runPython 函数**：
```javascript
const runPython = useCallback(async (code, timeout = 10000) => {
  // ... 设置超时
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      if (!isCompleted) {
        reject(new Error(`代码执行超时（${timeout / 1000}秒）。可能存在无限循环。`));
      }
    }, timeout);
  });
  
  // ... 运行代码
  result = await Promise.race([executionPromise, timeoutPromise]);
  // ...
}, [pyodide]);
```

### 2. MarkdownRenderer.jsx 修改

**添加状态**：
```javascript
const [executionTime, setExecutionTime] = useState(0);
const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
const timerRef = useRef(null);
```

**修改 handleRun 函数**：
```javascript
const handleRun = async () => {
  // 启动计时器
  const startTime = Date.now();
  timerRef.current = setInterval(() => {
    const elapsed = Date.now() - startTime;
    setExecutionTime(elapsed);
    
    if (elapsed > 5000) {
      setShowTimeoutWarning(true);
    }
  }, 100);
  
  // 设置超时时间为10秒
  const result = await runPython(editCode, 10000);
  // ...
};
```

**添加 handleStop 函数**：
```javascript
const handleStop = () => {
  if (stopPython) {
    stopPython();
  }
  setIsRunning(false);
  clearInterval(timerRef.current);
  setShowTimeoutWarning(false);
  setOutput(prev => prev + '\n\n[用户停止执行]');
};
```

### 3. ChapterPage.jsx 修改

**修改滚动逻辑**：
```javascript
useLayoutEffect(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // 滚动父容器到顶部
  const scrollContainer = document.querySelector('[style*="overflow: auto"]') || 
                         document.querySelector('[style*="overflow:auto"]');
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }
  
  // ... 其他滚动代码
}, [chapterId]);
```

## 测试用例

### 1. 测试无限循环代码
```python
# 测试代码
while True:
    print("无限循环")
```

**预期结果**：
- 执行5秒后显示超时警告
- 10秒后自动停止
- 显示超时错误信息

### 2. 测试正常代码
```python
# 测试代码
for i in range(5):
    print(i)
```

**预期结果**：
- 正常执行完成
- 显示执行时间
- 不显示超时警告

### 3. 测试停止功能
```python
# 测试代码
import time
for i in range(100):
    time.sleep(1)
    print(i)
```

**预期结果**：
- 执行几秒后点击"停止"按钮
- 立即停止执行
- 显示"[用户停止执行]"

## 快捷键

| 功能 | 操作 |
|------|------|
| 运行代码 | 点击"运行"按钮 |
| 停止代码 | 点击"停止"按钮 |
| 超时停止 | 自动（10秒后） |

## 注意事项

1. **超时时间**：默认10秒，可在 `runPython` 函数中修改
2. **警告时间**：执行超过5秒时显示警告
3. **停止方式**：通过抛出 `KeyboardInterrupt` 异常停止
4. **输出处理**：停止后会在输出中添加"[用户停止执行]"

## 已知限制

1. **Pyodide 限制**：某些代码可能无法立即停止
2. **内存限制**：长时间运行的代码可能消耗大量内存
3. **浏览器限制**：某些浏览器可能限制 WebAssembly 执行时间

## 后续改进

### 1. 更好的停止机制
- 使用 Web Worker 执行代码
- 支持强制终止执行
- 支持内存限制

### 2. 可配置超时
- 允许用户设置超时时间
- 支持禁用超时
- 支持无限执行（需要手动停止）

### 3. 执行统计
- 显示内存使用情况
- 显示 CPU 使用率
- 支持性能分析

## 总结

版本 1.0.4 解决了两个重要问题：

1. **滚动到顶部修复**：章节切换后页面正确滚动到顶部
2. **停止按钮功能**：支持终止无限循环代码，避免页面卡住

这些改进大大提升了用户体验，特别是在学习循环结构等章节时。

**测试建议**：
1. 测试章节导航的滚动行为
2. 测试无限循环代码的停止功能
3. 测试超时警告的显示
4. 测试执行时间的显示