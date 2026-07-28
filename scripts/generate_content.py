#!/usr/bin/env python3
"""
生成Python-100-Days课程内容JSON数据
从GitHub仓库解析Markdown文件，生成结构化的JSON数据
"""

import os
import json
import re
from pathlib import Path
import requests
from typing import Dict, List, Any

class ContentGenerator:
    def __init__(self):
        self.base_url = "https://api.github.com/repos/jackfrued/Python-100-Days"
        self.raw_url = "https://raw.githubusercontent.com/jackfrued/Python-100-Days/master"
        self.course_structure = []
        
    def fetch_repo_structure(self) -> Dict:
        """获取仓库目录结构"""
        try:
            response = requests.get(f"{self.base_url}/git/trees/master?recursive=1")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"获取仓库结构失败: {e}")
            return {}
    
    def parse_markdown_content(self, content: str) -> Dict:
        """解析Markdown内容，提取标题和代码块"""
        lines = content.split('\n')
        result = {
            'title': '',
            'content': '',
            'code_template': '',
            'expected_output': ''
        }
        
        # 提取标题
        for line in lines:
            if line.startswith('# '):
                result['title'] = line[2:].strip()
                break
        
        # 提取代码块
        code_blocks = re.findall(r'```python(.*?)```', content, re.DOTALL)
        if code_blocks:
            result['code_template'] = code_blocks[0].strip()
        
        # 提取预期输出（假设在"输出"或"结果"部分）
        output_match = re.search(r'(?:输出|结果|Output)[:\s]*(.*?)(?:\n\n|\n#|\Z)', content, re.DOTALL | re.IGNORECASE)
        if output_match:
            result['expected_output'] = output_match.group(1).strip()
        
        result['content'] = content
        return result
    
    def fetch_file_content(self, path: str) -> str:
        """获取文件内容"""
        try:
            url = f"{self.raw_url}/{path}"
            response = requests.get(url)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"获取文件内容失败 {path}: {e}")
            return ""
    
    def generate_course_structure(self):
        """生成课程结构"""
        # 获取仓库结构
        tree_data = self.fetch_repo_structure()
        if 'tree' not in tree_data:
            print("无法获取仓库结构")
            return
        
        # 提取Markdown文件
        md_files = []
        for item in tree_data['tree']:
            if item['path'].endswith('.md') and not item['path'].startswith('.'):
                md_files.append(item['path'])
        
        # 按目录分组
        directories = {}
        for md_file in md_files:
            dir_path = os.path.dirname(md_file)
            if dir_path not in directories:
                directories[dir_path] = []
            directories[dir_path].append(md_file)
        
        # 生成课程结构
        self.course_structure = []
        
        # 处理主要目录
        for dir_path in sorted(directories.keys()):
            if not dir_path:  # 根目录
                continue
                
            # 检查是否是Day目录
            day_match = re.search(r'Day(\d+)-(\d+)', dir_path)
            if day_match:
                start_day = int(day_match.group(1))
                end_day = int(day_match.group(2))
                
                section = {
                    'id': f'day{start_day:02d}-{end_day:02d}',
                    'title': f'Day{start_day:02d}-{end_day:02d} {self.get_section_title(dir_path)}',
                    'children': []
                }
                
                # 处理目录中的文件
                for md_file in directories[dir_path]:
                    # 提取Day信息
                    file_day_match = re.search(r'Day(\d+)', md_file)
                    if file_day_match:
                        day_num = int(file_day_match.group(1))
                        chapter_id = f'day{day_num:02d}'
                        
                        # 获取文件内容
                        content = self.fetch_file_content(md_file)
                        if content:
                            parsed = self.parse_markdown_content(content)
                            
                            chapter = {
                                'id': chapter_id,
                                'title': parsed['title'] or f'Day{day_num:02d}',
                                'content': parsed['content'],
                                'codeTemplate': parsed['code_template'],
                                'expectedOutput': parsed['expected_output'],
                                'testCases': self.generate_test_cases(parsed)
                            }
                            
                            section['children'].append(chapter)
                
                # 只有有内容的章节才添加
                if section['children']:
                    self.course_structure.append(section)
        
        print(f"生成了 {len(self.course_structure)} 个主要章节")
    
    def get_section_title(self, dir_path: str) -> str:
        """获取章节标题"""
        # 这里可以根据目录名生成更友好的标题
        title_map = {
            'Day01-15Python语言基础': 'Python语言基础',
            'Day16-35Python语言进阶': 'Python语言进阶',
            'Day36-55Web前端基础': 'Web前端基础',
            'Day56-65Web后端基础': 'Web后端基础',
            'Day66-75机器学习基础': '机器学习基础',
            'Day76-85数据分析': '数据分析',
            'Day86-95机器学习进阶': '机器学习进阶',
            'Day96-100项目实战': '项目实战'
        }
        
        for key, value in title_map.items():
            if key in dir_path:
                return value
        
        return 'Python学习'
    
    def generate_test_cases(self, parsed: Dict) -> List[Dict]:
        """生成测试用例"""
        test_cases = []
        
        if parsed['expected_output']:
            test_cases.append({
                'input': '',
                'expected': parsed['expected_output']
            })
        
        return test_cases
    
    def save_to_json(self, output_path: str):
        """保存为JSON文件"""
        output_data = {
            'courseData': self.course_structure,
            'metadata': {
                'source': 'https://github.com/jackfrued/Python-100-Days',
                'generatedAt': '2026-07-23',
                'totalSections': len(self.course_structure),
                'totalChapters': sum(len(section['children']) for section in self.course_structure)
            }
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"内容已保存到: {output_path}")
        print(f"总章节数: {output_data['metadata']['totalChapters']}")

def main():
    generator = ContentGenerator()
    
    print("开始生成Python-100-Days课程内容...")
    generator.generate_course_structure()
    
    # 保存到项目数据目录
    output_path = Path(__file__).parent.parent / 'src' / 'data' / 'generated_course_data.json'
    generator.save_to_json(str(output_path))
    
    print("生成完成！")

if __name__ == "__main__":
    main()