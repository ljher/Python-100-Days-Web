# 测试 Tab 键功能

# 使用 Tab 键缩进以下代码
def calculate_bmi(height, weight):
    # 第一级缩进：按 Tab 键
    bmi = weight / (height / 100) ** 2
    
    if bmi < 18.5:
        # 第二级缩进：再按 Tab 键
        return "体重过轻"
    elif 18.5 <= bmi < 24:
        return "正常"
    elif 24 <= bmi < 28:
        return "超重"
    else:
        return "肥胖"

# 测试函数
height = 170
weight = 70
result = calculate_bmi(height, weight)
print(f"身高: {height}cm, 体重: {weight}kg")
print(f"BMI: {weight / (height / 100) ** 2:.1f}")
print(f"状态: {result}")