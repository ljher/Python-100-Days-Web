#!/usr/bin/env python3
"""
从 Python-100-Days 仓库获取完整课程内容
生成 courseData.js 文件
"""

import os
import json
import re
import requests
from pathlib import Path

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
    }
}

# GitHub raw URL 基础路径
RAW_BASE = "https://raw.githubusercontent.com/jackfrued/Python-100-Days/master"

def fetch_file_content(path):
    """获取文件内容"""
    try:
        url = f"{RAW_BASE}/{path}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"获取文件失败 {path}: {e}")
        return None

def convert_image_paths(content, section_key):
    """将相对图片路径转换为绝对 GitHub URL"""
    # 匹配 Markdown 图片语法 ![alt](path) 或 <img src="path">
    # 将相对路径转换为 GitHub raw URL
    
    # 处理 ![alt](path) 格式
    def replace_md_image(match):
        alt = match.group(1)
        path = match.group(2)
        if not path.startswith(('http://', 'https://', 'data:')):
            # 相对路径，转换为 GitHub raw URL
            abs_path = f"{RAW_BASE}/{section_key}/{path}"
            return f"![{alt}]({abs_path})"
        return match.group(0)
    
    content = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', replace_md_image, content)
    
    # 处理 <img src="path"> 格式
    def replace_html_image(match):
        prefix = match.group(1)
        path = match.group(2)
        suffix = match.group(3)
        if not path.startswith(('http://', 'https://', 'data:')):
            abs_path = f"{RAW_BASE}/{section_key}/{path}"
            return f'{prefix}{abs_path}{suffix}'
        return match.group(0)
    
    content = re.sub(r'(<img\s+[^>]*src=["\'])([^"\']+)(["\'][^>]*>)', replace_html_image, content)
    
    return content

def extract_code_from_markdown(content):
    """从 Markdown 中提取代码示例"""
    code_blocks = re.findall(r'```python\n(.*?)```', content, re.DOTALL)
    if code_blocks:
        # 返回第一个代码块作为模板
        return code_blocks[0].strip()
    return None

def generate_hint_from_content(content, title):
    """根据内容生成提示"""
    # 提取练习部分
    exercise_match = re.search(r'##\s*练习.*?\n(.*?)(?=##|$)', content, re.DOTALL)
    if exercise_match:
        exercise_text = exercise_match.group(1).strip()
        return f"# {title}\n# {exercise_text}\n\n# 请在这里编写你的代码\n"
    return f"# {title}\n# 请根据课程内容编写代码\n\n# 请在这里编写你的代码\n"

def main():
    """主函数"""
    print("开始获取 Python-100-Days 课程内容...")
    
    course_data = []
    
    for section_key, section_info in COURSE_STRUCTURE.items():
        print(f"\n处理章节: {section_info['title']}")
        
        section = {
            'id': section_key.lower(),
            'title': section_info['title'],
            'children': []
        }
        
        for chapter_info in section_info['chapters']:
            file_path = f"{section_key}/{chapter_info['file']}"
            print(f"  获取: {chapter_info['file']}")
            
            content = fetch_file_content(file_path)
            if content:
                # 转换图片路径为绝对 URL
                content = convert_image_paths(content, section_key)
                
                # 提取代码模板（取最后一个 Python 代码块作为练习模板）
                code_blocks = re.findall(r'```python\n(.*?)```', content, re.DOTALL)
                code_template = code_blocks[-1].strip() if code_blocks else '# 请在这里编写你的代码\n'
                
                # 生成提示
                hint = generate_hint_from_content(content, chapter_info['title'])
                
                # 提取标题（使用第一个 # 标题）
                title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                display_title = title_match.group(1) if title_match else chapter_info['title']
                
                chapter = {
                    'id': chapter_info['id'],
                    'title': display_title,
                    'content': content,  # 完整的 Markdown 内容，不做删减
                    'codeTemplate': code_template,
                    'hint': hint,
                    'expectedOutput': '',  # 需要手动设置
                    'testCases': []
                }
                
                section['children'].append(chapter)
        
        if section['children']:
            course_data.append(section)
    
    # 生成 JavaScript 文件
    output_path = Path(__file__).parent.parent / 'src' / 'data' / 'courseData.js'
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('// 从 Python-100-Days 仓库自动生成的课程数据\n')
        f.write('// 生成时间: ' + __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '\n\n')
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
    
    print(f"\n完成！已生成 {len(course_data)} 个主要章节")
    print(f"输出文件: {output_path}")

if __name__ == '__main__':
    main()
