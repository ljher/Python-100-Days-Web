@echo off
echo === Python-100-Days 互动学习平台 ===
echo.

REM 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到npm，请先安装npm
    pause
    exit /b 1
)

echo ✓ Node.js 版本:
node --version
echo ✓ npm 版本:
npm --version
echo.

REM 安装依赖
echo 安装项目依赖...
call npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装完成
echo.

REM 生成内容数据
echo 生成课程内容数据...
where python >nul 2>nul
if %errorlevel% equ 0 (
    python scripts/generate_content.py
    if %errorlevel% equ 0 (
        echo ✓ 内容数据生成完成
    ) else (
        echo 警告: 内容数据生成失败，将使用默认数据
    )
) else (
    echo 警告: 未找到Python，跳过内容生成
)
echo.

REM 启动开发服务器
echo 启动开发服务器...
echo 应用将在 http://localhost:5173 启动
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm run dev
pause