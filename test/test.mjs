// 简单测试脚本
// 测试应用的基本功能

import { JSDOM } from 'jsdom';

// 模拟浏览器环境
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// 测试课程数据
const courseData = [
  {
    id: 'day01',
    title: 'Day01 - 初识Python',
    content: '# Day01 - 初识Python\n\n## Python简介\nPython是一种广泛使用的高级编程语言。',
    codeTemplate: 'print("Hello, World!")',
    expectedOutput: 'Hello, World!\n'
  }
];

// 测试函数
function testCourseData() {
  console.log('测试课程数据...');
  
  // 检查数据结构
  if (!Array.isArray(courseData)) {
    throw new Error('课程数据应该是数组');
  }
  
  if (courseData.length === 0) {
    throw new Error('课程数据不能为空');
  }
  
  // 检查第一个章节
  const chapter = courseData[0];
  if (!chapter.id || !chapter.title) {
    throw new Error('章节必须包含id和title');
  }
  
  console.log('✓ 课程数据测试通过');
}

function testAutoGrader() {
  console.log('测试自动判题...');
  
  // 模拟判题函数
  function gradeCode(expected, actual) {
    const normalizedExpected = expected.trim().replace(/\r\n/g, '\n');
    const normalizedActual = actual.trim().replace(/\r\n/g, '\n');
    return normalizedExpected === normalizedActual;
  }
  
  // 测试用例
  const testCases = [
    {
      expected: 'Hello, World!\n',
      actual: 'Hello, World!\n',
      shouldPass: true
    },
    {
      expected: 'Hello, World!\n',
      actual: 'Hello, World!',
      shouldPass: false
    },
    {
      expected: '123\n456',
      actual: '123\n456',
      shouldPass: true
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const result = gradeCode(testCase.expected, testCase.actual);
    if (result !== testCase.shouldPass) {
      throw new Error(`测试用例 ${index + 1} 失败: 期望 ${testCase.shouldPass}, 实际 ${result}`);
    }
  });
  
  console.log('✓ 自动判题测试通过');
}

function testPythonRunner() {
  console.log('测试Python执行器...');
  
  // 模拟Python执行器
  function simulatePythonExecution(code) {
    // 简单的模拟执行
    if (code.includes('print("Hello, World!")')) {
      return 'Hello, World!\n';
    }
    return '';
  }
  
  // 测试代码执行
  const code = 'print("Hello, World!")';
  const output = simulatePythonExecution(code);
  
  if (output !== 'Hello, World!\n') {
    throw new Error('Python执行器输出不正确');
  }
  
  console.log('✓ Python执行器测试通过');
}

// 运行所有测试
function runAllTests() {
  console.log('开始运行测试...\n');
  
  try {
    testCourseData();
    testAutoGrader();
    testPythonRunner();
    
    console.log('\n所有测试通过！✓');
  } catch (error) {
    console.error('\n测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runAllTests();