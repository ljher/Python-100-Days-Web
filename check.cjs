#!/usr/bin/env node

/**
 * 项目检查脚本
 * 检查项目结构和依赖是否完整
 */

const fs = require('fs');
const path = require('path');

// 检查文件是否存在
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${description}`);
    return true;
  } else {
    console.log(`✗ ${description} - 文件不存在: ${filePath}`);
    return false;
  }
}

// 检查目录是否存在
function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`✓ ${description}`);
    return true;
  } else {
    console.log(`✗ ${description} - 目录不存在: ${dirPath}`);
    return false;
  }
}

// 检查package.json中的依赖
function checkDependencies() {
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('✗ package.json 文件不存在');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    'codemirror',
    '@codemirror/lang-python',
    'react-markdown',
    'remark-gfm',
    'rehype-highlight',
    'rehype-raw',
    'pyodide'
  ];

  let allPresent = true;
  console.log('\n检查项目依赖:');
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✓ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ✗ ${dep}: 未找到`);
      allPresent = false;
    }
  });

  return allPresent;
}

// 检查组件文件
function checkComponents() {
  const components = [
    'src/components/AutoGrader.jsx',
    'src/components/ChapterPage.jsx',
    'src/components/CodeEditor.jsx',
    'src/components/HomePage.jsx',
    'src/components/Layout.jsx',
    'src/components/MarkdownRenderer.jsx',
    'src/components/NavigationTree.jsx',
    'src/components/PythonRunner.jsx'
  ];

  console.log('\n检查组件文件:');
  let allPresent = true;

  components.forEach(component => {
    if (!checkFile(component, component)) {
      allPresent = false;
    }
  });

  return allPresent;
}

// 检查数据文件
function checkDataFiles() {
  const dataFiles = [
    'src/data/courseData.js'
  ];

  console.log('\n检查数据文件:');
  let allPresent = true;

  dataFiles.forEach(dataFile => {
    if (!checkFile(dataFile, dataFile)) {
      allPresent = false;
    }
  });

  return allPresent;
}

// 检查脚本文件
function checkScripts() {
  const scripts = [
    'scripts/generate_content.py',
    'scripts/deploy.sh',
    'start.sh',
    'start.bat'
  ];

  console.log('\n检查脚本文件:');
  let allPresent = true;

  scripts.forEach(script => {
    if (!checkFile(script, script)) {
      allPresent = false;
    }
  });

  return allPresent;
}

// 检查文档文件
function checkDocumentation() {
  const docs = [
    'README.md',
    'DEPLOY.md',
    'SUMMARY.md'
  ];

  console.log('\n检查文档文件:');
  let allPresent = true;

  docs.forEach(doc => {
    if (!checkFile(doc, doc)) {
      allPresent = false;
    }
  });

  return allPresent;
}

// 检查配置文件
function checkConfigFiles() {
  const configFiles = [
    'package.json',
    'vite.config.js',
    'index.html'
  ];

  console.log('\n检查配置文件:');
  let allPresent = true;

  configFiles.forEach(configFile => {
    if (!checkFile(configFile, configFile)) {
      allPresent = false;
    }
  });

  return allPresent;
}

// 主检查函数
function runChecks() {
  console.log('=== Python-100-Days 互动学习平台项目检查 ===\n');
  
  let allChecksPassed = true;
  
  // 检查基本结构
  console.log('检查项目结构:');
  if (!checkDirectory('src', '源代码目录')) allChecksPassed = false;
  if (!checkDirectory('src/components', '组件目录')) allChecksPassed = false;
  if (!checkDirectory('src/data', '数据目录')) allChecksPassed = false;
  if (!checkDirectory('public', '静态资源目录')) allChecksPassed = false;
  if (!checkDirectory('scripts', '脚本目录')) allChecksPassed = false;
  
  // 检查配置文件
  if (!checkConfigFiles()) allChecksPassed = false;
  
  // 检查依赖
  if (!checkDependencies()) allChecksPassed = false;
  
  // 检查组件
  if (!checkComponents()) allChecksPassed = false;
  
  // 检查数据文件
  if (!checkDataFiles()) allChecksPassed = false;
  
  // 检查脚本
  if (!checkScripts()) allChecksPassed = false;
  
  // 检查文档
  if (!checkDocumentation()) allChecksPassed = false;
  
  // 总结
  console.log('\n=== 检查结果 ===');
  if (allChecksPassed) {
    console.log('✓ 所有检查通过！项目结构完整。');
    console.log('\n下一步:');
    console.log('1. 运行 npm install 安装依赖');
    console.log('2. 运行 npm run dev 启动开发服务器');
    console.log('3. 访问 http://localhost:5173 查看应用');
  } else {
    console.log('✗ 部分检查失败，请修复上述问题。');
  }
  
  return allChecksPassed;
}

// 运行检查
const success = runChecks();
process.exit(success ? 0 : 1);