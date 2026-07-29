# 测试 input() 函数
print("测试 input() 函数")
name = input("请输入您的姓名：")
print(f"您好，{name}！")

# 测试 BMI 计算
height = float(input('身高(cm)：'))
weight = float(input('体重(kg)：'))
bmi = weight / (height / 100) ** 2
print(f'{bmi = :.1f}')
if 18.5 <= bmi < 24:
    print('你的身材很棒！')