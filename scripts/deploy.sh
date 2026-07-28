#!/bin/bash

# Python-100-Days 互动学习平台部署脚本
# 支持部署到GitHub Pages或Vercel

set -e

echo "=== Python-100-Days 互动学习平台部署脚本 ==="
echo ""

# 检查Node.js和npm
check_dependencies() {
    echo "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        echo "错误: 未找到Node.js，请先安装Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "错误: 未找到npm，请先安装npm"
        exit 1
    fi
    
    echo "依赖检查完成"
}

# 安装项目依赖
install_dependencies() {
    echo "安装项目依赖..."
    npm install
    echo "依赖安装完成"
}

# 构建项目
build_project() {
    echo "构建项目..."
    npm run build
    echo "构建完成"
}

# 部署到GitHub Pages
deploy_github_pages() {
    echo "部署到GitHub Pages..."
    
    # 检查是否在git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "错误: 当前目录不是git仓库"
        exit 1
    fi
    
    # 创建gh-pages分支
    git checkout -B gh-pages
    
    # 添加构建文件
    git add -f dist
    
    # 提交更改
    git commit -m "Deploy to GitHub Pages"
    
    # 推送到远程仓库
    git push origin gh-pages --force
    
    # 切换回main分支
    git checkout main
    
    echo "部署到GitHub Pages完成"
    echo "请访问: https://<username>.github.io/<repository-name>"
}

# 部署到Vercel
deploy_vercel() {
    echo "部署到Vercel..."
    
    # 检查是否安装了Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "安装Vercel CLI..."
        npm install -g vercel
    fi
    
    # 部署到Vercel
    vercel --prod
    
    echo "部署到Vercel完成"
}

# 生成内容数据
generate_content() {
    echo "生成课程内容数据..."
    
    # 检查Python
    if ! command -v python &> /dev/null; then
        echo "警告: 未找到Python，跳过内容生成"
        return
    fi
    
    # 运行内容生成脚本
    python scripts/generate_content.py
    
    echo "内容数据生成完成"
}

# 显示帮助信息
show_help() {
    echo "使用方法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  github    部署到GitHub Pages"
    echo "  vercel    部署到Vercel"
    echo "  generate  生成课程内容数据"
    echo "  build     仅构建项目"
    echo "  all       执行所有步骤"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh github    # 部署到GitHub Pages"
    echo "  ./deploy.sh vercel    # 部署到Vercel"
    echo "  ./deploy.sh all       # 执行所有步骤"
}

# 主函数
main() {
    # 检查依赖
    check_dependencies
    
    # 解析命令行参数
    case "${1:-help}" in
        github)
            install_dependencies
            build_project
            deploy_github_pages
            ;;
        vercel)
            install_dependencies
            build_project
            deploy_vercel
            ;;
        generate)
            generate_content
            ;;
        build)
            install_dependencies
            build_project
            ;;
        all)
            install_dependencies
            generate_content
            build_project
            echo "构建完成！请手动选择部署方式："
            echo "1. 运行 ./deploy.sh github 部署到GitHub Pages"
            echo "2. 运行 ./deploy.sh vercel 部署到Vercel"
            ;;
        help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"