#!/usr/bin/env python3
"""
从本地 Python-100-Days 仓库获取完整课程内容
生成 courseData.js 文件
"""

import os
import json
import re
import shutil
from pathlib import Path

# 本地仓库路径
LOCAL_REPO = Path(__file__).parent.parent / '.python-100-days-source'
# 图片输出目录
IMAGES_OUTPUT = Path(__file__).parent.parent / 'public' / 'images'

# 课程结构映射
COURSE_STRUCTURE = {
    'Day01-20': {
        'title': 'Day01-20 Python语言基础',
        'chapters': [
            {'file': '01.初识Python.md', 'id': 'day01', 'title': 'Day01 - 初识Python'},
            {'file': '02.第一个Python程序.md', 'id': 'day02', 'title': 'Day02 - 第一个Python程序'},
            {'file': '03.Python语言中的变量.md', 'id': 'day03', 'title': 'Day03 - 变量和数据类型'},
            {'file': '04.Python语言中的运算符.md', 'id': 'day04', 'title': 'Day04 - 运算符'},
            {'file': '05.分支结构.md', 'id': 'day05', 'title': 'Day05 - 分支结构'},
            {'file': '06.循环结构.md', 'id': 'day06', 'title': 'Day06 - 循环结构'},
            {'file': '07.分支和循环结构实战.md', 'id': 'day07', 'title': 'Day07 - 分支和循环实战'},
            {'file': '08.常用数据结构之列表-1.md', 'id': 'day08', 'title': 'Day08 - 列表（一）'},
            {'file': '09.常用数据结构之列表-2.md', 'id': 'day09', 'title': 'Day09 - 列表（二）'},
            {'file': '10.常用数据结构之元组.md', 'id': 'day10', 'title': 'Day10 - 元组'},
            {'file': '11.常用数据结构之字符串.md', 'id': 'day11', 'title': 'Day11 - 字符串'},
            {'file': '12.常用数据结构之集合.md', 'id': 'day12', 'title': 'Day12 - 集合'},
            {'file': '13.常用数据结构之字典.md', 'id': 'day13', 'title': 'Day13 - 字典'},
            {'file': '14.函数和模块.md', 'id': 'day14', 'title': 'Day14 - 函数和模块'},
            {'file': '15.函数应用实战.md', 'id': 'day15', 'title': 'Day15 - 函数实战'},
            {'file': '16.函数使用进阶.md', 'id': 'day16', 'title': 'Day16 - 函数进阶'},
            {'file': '17.函数高级应用.md', 'id': 'day17', 'title': 'Day17 - 函数高级应用'},
            {'file': '18.面向对象编程入门.md', 'id': 'day18', 'title': 'Day18 - 面向对象入门'},
            {'file': '19.面向对象编程进阶.md', 'id': 'day19', 'title': 'Day19 - 面向对象进阶'},
            {'file': '20.面向对象编程应用.md', 'id': 'day20', 'title': 'Day20 - 面向对象应用'},
        ]
    },
    'Day21-30': {
        'title': 'Day21-30 Python语言进阶',
        'chapters': [
            {'file': '21.文件读写和异常处理.md', 'id': 'day21', 'title': 'Day21 - 文件和异常'},
            {'file': '22.对象的序列化和反序列化.md', 'id': 'day22', 'title': 'Day22 - 对象序列化'},
            {'file': '23.Python读写CSV文件.md', 'id': 'day23', 'title': 'Day23 - CSV文件'},
            {'file': '24.Python读写Excel文件-1.md', 'id': 'day24', 'title': 'Day24 - Excel文件（一）'},
            {'file': '25.Python读写Excel文件-2.md', 'id': 'day25', 'title': 'Day25 - Excel文件（二）'},
            {'file': '26.Python操作Word和PowerPoint文件.md', 'id': 'day26', 'title': 'Day26 - Word和PPT'},
            {'file': '27.Python操作PDF文件.md', 'id': 'day27', 'title': 'Day27 - PDF文件'},
            {'file': '28.Python处理图像.md', 'id': 'day28', 'title': 'Day28 - 图像处理'},
            {'file': '29.Python发送邮件和短信.md', 'id': 'day29', 'title': 'Day29 - 邮件和短信'},
            {'file': '30.正则表达式的应用.md', 'id': 'day30', 'title': 'Day30 - 正则表达式'},
        ]
    },
    'Day31-35': {
        'title': 'Day31-35 Web前端基础',
        'chapters': [
            {'file': '31.Python语言进阶.md', 'id': 'day31', 'title': 'Day31 - Python语言进阶'},
            {'file': '32-33.Web前端入门.md', 'id': 'day32', 'title': 'Day32-33 - Web前端入门'},
            {'file': '34-35.玩转Linux操作系统.md', 'id': 'day34', 'title': 'Day34-35 - Linux操作系统'},
        ]
    },
    'Day36-45': {
        'title': 'Day36-45 数据库基础',
        'chapters': [
            {'file': '36.关系型数据库和MySQL概述.md', 'id': 'day36', 'title': 'Day36 - MySQL概述'},
            {'file': '37.SQL详解之DDL.md', 'id': 'day37', 'title': 'Day37 - SQL之DDL'},
            {'file': '38.SQL详解之DML.md', 'id': 'day38', 'title': 'Day38 - SQL之DML'},
            {'file': '39.SQL详解之DQL.md', 'id': 'day39', 'title': 'Day39 - SQL之DQL'},
            {'file': '40.SQL详解之DCL.md', 'id': 'day40', 'title': 'Day40 - SQL之DCL'},
            {'file': '41.MySQL新特性.md', 'id': 'day41', 'title': 'Day41 - MySQL新特性'},
            {'file': '42.视图、函数和过程.md', 'id': 'day42', 'title': 'Day42 - 视图和函数'},
            {'file': '43.索引.md', 'id': 'day43', 'title': 'Day43 - 索引'},
            {'file': '44.Python接入MySQL数据库.md', 'id': 'day44', 'title': 'Day44 - Python操作MySQL'},
            {'file': '45.Hive实战.md', 'id': 'day45', 'title': 'Day45 - Hive实战'},
        ]
    },
    'Day46-60': {
        'title': 'Day46-60 Web后端开发',
        'chapters': [
            {'file': '46.Django快速上手.md', 'id': 'day46', 'title': 'Day46 - Django入门'},
            {'file': '47.深入模型.md', 'id': 'day47', 'title': 'Day47 - Django模型'},
            {'file': '48.静态资源和Ajax请求.md', 'id': 'day48', 'title': 'Day48 - 静态资源和Ajax'},
            {'file': '49.Cookie和Session.md', 'id': 'day49', 'title': 'Day49 - Cookie和Session'},
            {'file': '50.制作报表.md', 'id': 'day50', 'title': 'Day50 - 制作报表'},
            {'file': '51.日志和调试工具栏.md', 'id': 'day51', 'title': 'Day51 - 日志和调试'},
            {'file': '52.中间件的应用.md', 'id': 'day52', 'title': 'Day52 - 中间件'},
            {'file': '53.前后端分离开发入门.md', 'id': 'day53', 'title': 'Day53 - 前后端分离'},
            {'file': '54.RESTful架构和DRF入门.md', 'id': 'day54', 'title': 'Day54 - RESTful和DRF'},
            {'file': '55.RESTful架构和DRF进阶.md', 'id': 'day55', 'title': 'Day55 - DRF进阶'},
            {'file': '56.使用缓存.md', 'id': 'day56', 'title': 'Day56 - 使用缓存'},
            {'file': '57.接入三方平台.md', 'id': 'day57', 'title': 'Day57 - 接入三方平台'},
            {'file': '58.异步任务和定时任务.md', 'id': 'day58', 'title': 'Day58 - 异步和定时任务'},
            {'file': '59.单元测试.md', 'id': 'day59', 'title': 'Day59 - 单元测试'},
            {'file': '60.项目上线.md', 'id': 'day60', 'title': 'Day60 - 项目上线'},
        ]
    },
    'Day61-65': {
        'title': 'Day61-65 网络爬虫',
        'chapters': [
            {'file': '61.网络数据采集概述.md', 'id': 'day61', 'title': 'Day61 - 网络爬虫概述'},
            {'file': '62.用Python获取网络资源-1.md', 'id': 'day62', 'title': 'Day62 - 获取网络资源'},
            {'file': '62.用Python解析HTML页面-2.md', 'id': 'day62b', 'title': 'Day62 - 解析HTML'},
            {'file': '63.Python中的并发编程-1.md', 'id': 'day63', 'title': 'Day63 - 并发编程'},
            {'file': '64.使用Selenium抓取网页动态内容.md', 'id': 'day64', 'title': 'Day64 - Selenium'},
            {'file': '65.爬虫框架Scrapy简介.md', 'id': 'day65', 'title': 'Day65 - Scrapy框架'},
        ]
    },
    'Day66-80': {
        'title': 'Day66-80 数据分析基础',
        'chapters': [
            {'file': '66.数据分析概述.md', 'id': 'day66', 'title': 'Day66 - 数据分析概述'},
            {'file': '67.环境准备.md', 'id': 'day67', 'title': 'Day67 - 环境准备'},
            {'file': '68.NumPy的应用-1.md', 'id': 'day68', 'title': 'Day68 - NumPy（一）'},
            {'file': '69.NumPy的应用-2.md', 'id': 'day69', 'title': 'Day69 - NumPy（二）'},
            {'file': '70.NumPy的应用-3.md', 'id': 'day70', 'title': 'Day70 - NumPy（三）'},
            {'file': '71.NumPy的应用-4.md', 'id': 'day71', 'title': 'Day71 - NumPy（四）'},
            {'file': '72.深入浅出pandas-1.md', 'id': 'day72', 'title': 'Day72 - Pandas（一）'},
            {'file': '73.深入浅出pandas-2.md', 'id': 'day73', 'title': 'Day73 - Pandas（二）'},
            {'file': '74.深入浅出pandas-3.md', 'id': 'day74', 'title': 'Day74 - Pandas（三）'},
            {'file': '75.深入浅出pandas-4.md', 'id': 'day75', 'title': 'Day75 - Pandas（四）'},
            {'file': '76.深入浅出pandas-5.md', 'id': 'day76', 'title': 'Day76 - Pandas（五）'},
            {'file': '77.深入浅出pandas-6.md', 'id': 'day77', 'title': 'Day77 - Pandas（六）'},
            {'file': '78.数据可视化-1.md', 'id': 'day78', 'title': 'Day78 - 数据可视化（一）'},
            {'file': '79.数据可视化-2.md', 'id': 'day79', 'title': 'Day79 - 数据可视化（二）'},
            {'file': '80.数据可视化-3.md', 'id': 'day80', 'title': 'Day80 - 数据可视化（三）'},
        ]
    },
    'Day81-90': {
        'title': 'Day81-90 机器学习基础',
        'chapters': [
            {'file': '81.浅谈机器学习.md', 'id': 'day81', 'title': 'Day81 - 浅谈机器学习'},
            {'file': '82.k最近邻算法.md', 'id': 'day82', 'title': 'Day82 - KNN算法'},
            {'file': '83.决策树和随机森林.md', 'id': 'day83', 'title': 'Day83 - 决策树和随机森林'},
            {'file': '84.朴素贝叶斯算法.md', 'id': 'day84', 'title': 'Day84 - 朴素贝叶斯'},
            {'file': '85.回归模型.md', 'id': 'day85', 'title': 'Day85 - 回归模型'},
            {'file': '86.K-Means聚类算法.md', 'id': 'day86', 'title': 'Day86 - K-Means聚类'},
            {'file': '87.集成学习算法.md', 'id': 'day87', 'title': 'Day87 - 集成学习'},
            {'file': '88.神经网络模型.md', 'id': 'day88', 'title': 'Day88 - 神经网络'},
            {'file': '89.自然语言处理入门.md', 'id': 'day89', 'title': 'Day89 - NLP入门'},
            {'file': '90.机器学习实战.md', 'id': 'day90', 'title': 'Day90 - 机器学习实战'},
        ]
    },
    'Day91-100': {
        'title': 'Day91-100 项目实战与进阶',
        'chapters': [
            {'file': '91.团队项目开发的问题和解决方案.md', 'id': 'day91', 'title': 'Day91 - 团队项目开发'},
            {'file': '92.Docker容器技术详解.md', 'id': 'day92', 'title': 'Day92 - Docker容器技术'},
            {'file': '93.MySQL性能优化.md', 'id': 'day93', 'title': 'Day93 - MySQL性能优化'},
            {'file': '94.网络API接口设计.md', 'id': 'day94', 'title': 'Day94 - API接口设计'},
            {'file': '95.使用Django开发商业项目.md', 'id': 'day95', 'title': 'Day95 - Django商业项目'},
            {'file': '96.软件测试和自动化测试.md', 'id': 'day96', 'title': 'Day96 - 软件测试'},
            {'file': '97.电商网站技术要点剖析.md', 'id': 'day97', 'title': 'Day97 - 电商网站剖析'},
            {'file': '98.项目部署上线和性能调优.md', 'id': 'day98', 'title': 'Day98 - 项目部署与调优'},
            {'file': '99.面试中的公共问题.md', 'id': 'day99', 'title': 'Day99 - 面试公共问题'},
            {'file': '100.补充内容.md', 'id': 'day100', 'title': 'Day100 - 补充内容'},
        ]
    }
}

def read_local_file(file_path):
    """读取本地文件内容"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"读取文件失败 {file_path}: {e}")
        return None

def copy_image_to_public(section_key, image_path):
    """复制图片到 public/images 目录"""
    source = LOCAL_REPO / section_key / image_path
    if not source.exists():
        return None
    
    # 创建目标目录
    dest_dir = IMAGES_OUTPUT / section_key
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # 复制文件
    dest = dest_dir / Path(image_path).name
    if not dest.exists():
        shutil.copy2(source, dest)
    
    # 返回相对路径
    return f"/images/{section_key}/{Path(image_path).name}"

def convert_image_paths(content, section_key):
    """将相对图片路径转换为本地路径"""
    
    # 处理 ![alt](path) 格式
    def replace_md_image(match):
        alt = match.group(1)
        path = match.group(2)
        if not path.startswith(('http://', 'https://', 'data:')):
            # 尝试复制图片到本地
            local_path = copy_image_to_public(section_key, path)
            if local_path:
                return f"![{alt}]({local_path})"
            # 如果复制失败，保留原始路径
            return f"![{alt}]({path})"
        return match.group(0)
    
    content = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', replace_md_image, content)
    
    # 处理 <img src="path"> 格式
    def replace_html_image(match):
        prefix = match.group(1)
        path = match.group(2)
        suffix = match.group(3)
        if not path.startswith(('http://', 'https://', 'data:')):
            local_path = copy_image_to_public(section_key, path)
            if local_path:
                return f'{prefix}{local_path}{suffix}'
            return f'{prefix}{path}{suffix}'
        return match.group(0)
    
    content = re.sub(r'(<img\s+[^>]*src=["\'])([^"\']+)(["\'][^>]*>)', replace_html_image, content)
    
    return content

def extract_exercise_from_content(content):
    """从内容中提取练习题目"""
    exercises = []
    
    # 查找明确标记的练习部分
    exercise_match = re.search(r'##\s*练习\s*\n(.*?)(?=\n##|\Z)', content, re.DOTALL)
    if exercise_match:
        text = exercise_match.group(1).strip()
        # 清理文本
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)  # 移除代码块
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)  # 移除链接
        text = re.sub(r'[*_`]', '', text)  # 移除格式标记
        text = re.sub(r'<[^>]+>', '', text)  # 移除HTML标签
        text = re.sub(r'\$\$.*?\$\$', '', text, flags=re.DOTALL)  # 移除LaTeX公式
        text = re.sub(r'\$.*?\$', '', text)  # 移除行内LaTeX
        text = re.sub(r'^\s*>\s*', '', text, flags=re.MULTILINE)  # 移除引用标记
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)  # 压缩多余空行
        text = text.strip()
        if text and len(text) > 10:
            exercises.append(text[:500])
    
    # 查找例子部分（作为备选）
    if not exercises:
        example_match = re.search(r'####\s*例子\d+.*?\n(.*?)(?=####|###|##|\Z)', content, re.DOTALL)
        if example_match:
            text = example_match.group(1).strip()
            # 提取要求部分
            req_match = re.search(r'>\s*\*\*要求\*\*[:：](.*?)(?=\n```|\n>|\Z)', text, re.DOTALL)
            if req_match:
                req_text = req_match.group(1).strip()
                req_text = re.sub(r'\$.*?\$', '', req_text)  # 移除LaTeX
                req_text = re.sub(r'<[^>]+>', '', req_text)  # 移除HTML
                req_text = req_text.strip()
                if req_text and len(req_text) > 10:
                    exercises.append(req_text[:300])
    
    return exercises

def extract_runnable_code(content):
    """提取可运行的代码（不包含 input 函数）"""
    code_blocks = re.findall(r'```python\n(.*?)```', content, re.DOTALL)
    
    runnable_codes = []
    for code in code_blocks:
        # 跳过包含 input() 的代码
        if 'input(' in code:
            continue
        # 跳过太短的代码
        if len(code.strip().split('\n')) < 2:
            continue
        runnable_codes.append(code.strip())
    
    return runnable_codes

def generate_hint_from_content(content, title):
    """根据内容生成提示"""
    exercises = extract_exercise_from_content(content)
    
    if exercises:
        # 使用第一个练习作为提示
        hint = f"# {title}\n"
        hint += f"# 练习要求:\n"
        for line in exercises[0].split('\n')[:5]:
            hint += f"# {line.strip()}\n"
        hint += "\n# 请在这里编写你的代码\n"
        return hint
    
    return f"# {title}\n# 请根据课程内容编写代码\n\n# 请在这里编写你的代码\n"

def extract_last_python_code(content):
    """提取最后一个 Python 代码块作为练习模板"""
    # 首先尝试提取可运行的代码
    runnable_codes = extract_runnable_code(content)
    if runnable_codes:
        return runnable_codes[-1]
    
    # 如果没有可运行的代码，提取最后一个代码块
    code_blocks = re.findall(r'```python\n(.*?)```', content, re.DOTALL)
    if code_blocks:
        return code_blocks[-1].strip()
    
    return '# 请在这里编写你的代码\n'

def main():
    """主函数"""
    print("开始从本地仓库读取 Python-100-Days 课程内容...")
    print(f"本地仓库路径: {LOCAL_REPO}")
    
    if not LOCAL_REPO.exists():
        print(f"错误: 本地仓库不存在: {LOCAL_REPO}")
        print("请确保 .python-100-days-source 目录存在")
        return
    
    course_data = []
    total_chapters = 0
    
    for section_key, section_info in COURSE_STRUCTURE.items():
        print(f"\n处理章节: {section_info['title']}")
        
        section = {
            'id': section_key.lower().replace('-', ''),
            'title': section_info['title'],
            'children': []
        }
        
        for chapter_info in section_info['chapters']:
            file_path = LOCAL_REPO / section_key / chapter_info['file']
            
            if not file_path.exists():
                print(f"  跳过 (文件不存在): {chapter_info['file']}")
                continue
            
            print(f"  读取: {chapter_info['file']}")
            
            content = read_local_file(file_path)
            if content:
                # 转换图片路径
                content = convert_image_paths(content, section_key)
                
                # 提取代码模板（最后一个 Python 代码块）
                code_template = extract_last_python_code(content)
                
                # 生成提示
                hint = generate_hint_from_content(content, chapter_info['title'])
                
                # 使用统一的标题格式
                chapter = {
                    'id': chapter_info['id'],
                    'title': chapter_info['title'],
                    'content': content,  # 完整的 Markdown 内容
                    'codeTemplate': code_template,
                    'hint': hint,
                    'expectedOutput': '',
                    'testCases': []
                }
                
                section['children'].append(chapter)
                total_chapters += 1
        
        if section['children']:
            course_data.append(section)
    
    # 生成 JavaScript 文件
    output_path = Path(__file__).parent.parent / 'src' / 'data' / 'courseData.js'
    
    print(f"\n生成文件: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('// 从 Python-100-Days 仓库生成的课程数据\n')
        f.write('// 生成时间: ' + __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '\n')
        f.write(f'// 总章节数: {total_chapters}\n\n')
        f.write('export const courseData = ')
        json.dump(course_data, f, ensure_ascii=False, indent=2)
        f.write(';\n\n')
        
        # 写入辅助函数
        f.write('''export const getChapterById = (id) => {
  for (const section of courseData) {
    if (section.id === id) {
      return section;
    }
    if (section.children) {
      const chapter = section.children.find(child => child.id === id);
      if (chapter) {
        return chapter;
      }
    }
  }
  return null;
};

export const getAllChapters = () => {
  const chapters = [];
  courseData.forEach(section => {
    if (section.children) {
      chapters.push(...section.children);
    }
  });
  return chapters;
};
''')
    
    print(f"\n完成！")
    print(f"- 生成章节数: {total_chapters}")
    print(f"- 输出文件: {output_path}")

if __name__ == '__main__':
    main()
